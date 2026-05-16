"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { apiFetch } from "@/lib/api";
import { DataTable, type ColumnDef } from "@/components/admin/data-table";
import { TableToolbar } from "@/components/admin/table-toolbar";

// ── Types ─────────────────────────────────────────────────────────────────────

interface CalEvent {
  id: number;
  title: string;
  description: string | null;
  location: string | null;
  startsAt: string;
  endsAt: string | null;
  isPublished: boolean;
}

interface Form {
  title: string;
  description: string;
  location: string;
  startsAt: string;
  endsAt: string;
  isPublished: boolean;
}

const blank: Form = { title: "", description: "", location: "", startsAt: "", endsAt: "", isPublished: false };

function toDatetimeLocal(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toISOString().slice(0, 16);
}

// ── Cell components (module scope — required by S6478) ────────────────────────

function TitleCell({ title }: Readonly<{ title: string }>) {
  return <strong>{title}</strong>;
}

function LocationCell({ location }: Readonly<{ location: string | null }>) {
  return <>{location ?? "—"}</>;
}

function StartDateCell({ startsAt }: Readonly<{ startsAt: string }>) {
  return <span className="mono">{new Date(startsAt).toLocaleDateString("nl-BE")}</span>;
}

function PublishBadge({ isPublished }: Readonly<{ isPublished: boolean }>) {
  return isPublished ? (
    <span className="badge badge--green">Gepubliceerd</span>
  ) : (
    <span className="badge badge--yellow">Concept</span>
  );
}

function EditButton({ onClick }: Readonly<{ onClick: () => void }>) {
  return (
    <button type="button" className="btn-sm btn-sm--ghost" onClick={onClick}>
      Bewerken
    </button>
  );
}

// ── Column factory ────────────────────────────────────────────────────────────

function makeColumns(onEdit: (ev: CalEvent) => void): ColumnDef<CalEvent>[] {
  return [
    {
      key: "title",
      header: "Titel",
      sortable: true,
      sortValue: (ev) => ev.title,
      cell: (ev) => <TitleCell title={ev.title} />,
    },
    {
      key: "location",
      header: "Locatie",
      cell: (ev) => <LocationCell location={ev.location} />,
    },
    {
      key: "startsAt",
      header: "Startdatum",
      sortable: true,
      sortValue: (ev) => ev.startsAt,
      cell: (ev) => <StartDateCell startsAt={ev.startsAt} />,
    },
    {
      key: "status",
      header: "Status",
      cell: (ev) => <PublishBadge isPublished={ev.isPublished} />,
    },
    {
      key: "actions",
      header: "Acties",
      cell: (ev) => <EditButton onClick={() => onEdit(ev)} />,
    },
  ];
}

// ── useDialog ─────────────────────────────────────────────────────────────────

function useDialog(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open) { el.showModal(); } else { el.close(); }
  }, [open]);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.addEventListener("close", onClose);
    return () => el.removeEventListener("close", onClose);
  }, [onClose]);
  return ref;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminEventsPage() {
  const [events, setEvents]   = useState<CalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen]       = useState(false);
  const [editing, setEditing] = useState<CalEvent | null>(null);
  const [form, setForm]       = useState<Form>(blank);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");

  const [search, setSearch]         = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");

  const close = () => setOpen(false);
  const dialogRef = useDialog(open, close);

  async function load() {
    try {
      setEvents(await apiFetch<CalEvent[]>("/content/events"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditing(null);
    setForm(blank);
    setError("");
    setOpen(true);
  }

  function openEdit(ev: CalEvent) {
    setEditing(ev);
    setForm({
      title: ev.title,
      description: ev.description ?? "",
      location: ev.location ?? "",
      startsAt: toDatetimeLocal(ev.startsAt),
      endsAt: toDatetimeLocal(ev.endsAt),
      isPublished: ev.isPublished,
    });
    setError("");
    setOpen(true);
  }

  async function handleSave(e: React.SyntheticEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        title: form.title,
        description: form.description || null,
        location: form.location || null,
        startsAt: form.startsAt,
        endsAt: form.endsAt || null,
        isPublished: form.isPublished,
      };
      if (editing) {
        await apiFetch(`/content/events/${editing.id}`, { method: "PATCH", body: JSON.stringify(payload) });
      } else {
        await apiFetch("/content/events", { method: "POST", body: JSON.stringify(payload) });
      }
      close();
      setLoading(true);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Opslaan mislukt.");
    } finally {
      setSaving(false);
    }
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return events.filter((ev) => {
      if (filterStatus === "PUBLISHED" && !ev.isPublished) return false;
      if (filterStatus === "DRAFT" && ev.isPublished) return false;
      if (q && !ev.title.toLowerCase().includes(q) && !(ev.location ?? "").toLowerCase().includes(q)) return false;
      return true;
    });
  }, [events, search, filterStatus]);

  const columns = makeColumns(openEdit);

  return (
    <>
      <div className="admin-page-header">
        <h1>Events</h1>
        <p>Beheer evenementen voor de website</p>
      </div>

      <DataTable
        toolbar={
          <TableToolbar
            search={search}
            onSearch={setSearch}
            searchPlaceholder="Zoek op titel of locatie…"
            filters={[
              {
                key: "status",
                label: "Status",
                value: filterStatus,
                defaultValue: "ALL",
                options: [
                  { value: "ALL",       label: "Alle events"  },
                  { value: "PUBLISHED", label: "Gepubliceerd" },
                  { value: "DRAFT",     label: "Concept"      },
                ],
                onChange: setFilterStatus,
              },
            ]}
            onAdd={openCreate}
            addLabel="Nieuw event"
            resultCount={filtered.length}
            totalCount={events.length}
          />
        }
        title={`Events (${loading ? "…" : events.length})`}
        data={filtered}
        columns={columns}
        loading={loading}
        emptyText="Nog geen events aangemaakt."
      />

      <dialog ref={dialogRef} className="admin-drawer">
        <div className="admin-drawer__header">
          <h2>{editing ? "Event bewerken" : "Nieuw event"}</h2>
          <button className="admin-drawer__close" onClick={close} type="button">✕</button>
        </div>

        <form className="admin-form" onSubmit={handleSave}>
          {error && <p className="form-error">{error}</p>}

          <div className="form-field">
            <label htmlFor="e-title">Titel *</label>
            <input id="e-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required disabled={saving} />
          </div>

          <div className="form-field">
            <label htmlFor="e-loc">Locatie (optioneel)</label>
            <input id="e-loc" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} disabled={saving} />
          </div>

          <div className="form-field">
            <label htmlFor="e-desc">Omschrijving (optioneel)</label>
            <textarea id="e-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} disabled={saving} />
          </div>

          <div className="form-field">
            <label htmlFor="e-start">Startdatum &amp; tijd *</label>
            <input id="e-start" type="datetime-local" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} required disabled={saving} />
          </div>

          <div className="form-field">
            <label htmlFor="e-end">Einddatum &amp; tijd (optioneel)</label>
            <input id="e-end" type="datetime-local" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} disabled={saving} />
          </div>

          <label className="form-checkbox">
            <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} disabled={saving} />
            {" "}Gepubliceerd
          </label>

          <div className="admin-drawer__actions">
            <button type="submit" className="btn-sm btn-sm--primary" disabled={saving || !form.title || !form.startsAt}>
              {saving ? "Opslaan…" : "Opslaan"}
            </button>
            <button type="button" className="btn-sm btn-sm--ghost" onClick={close} disabled={saving}>
              Annuleren
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
