"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { apiFetch } from "@/lib/api";
import { DataTable, type ColumnDef } from "@/components/admin/data-table";
import { TableToolbar } from "@/components/admin/table-toolbar";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Sponsor {
  id: number;
  name: string;
  logoUrl: string | null;
  websiteUrl: string | null;
  tier: "MAIN" | "GOLD" | "STANDARD";
  isActive: boolean;
  sortOrder: number;
}

interface Form {
  name: string;
  logoUrl: string;
  websiteUrl: string;
  tier: "MAIN" | "GOLD" | "STANDARD";
  isActive: boolean;
  sortOrder: string;
}

const blank: Form = { name: "", logoUrl: "", websiteUrl: "", tier: "STANDARD", isActive: true, sortOrder: "0" };

const TIER_LABELS: Record<string, string> = { MAIN: "Hoofdsponsor", GOLD: "Goud", STANDARD: "Standaard" };
const TIER_BADGE:  Record<string, string> = { MAIN: "pink",         GOLD: "yellow",  STANDARD: "gray"  };

// ── Cell components (module scope — required by S6478) ────────────────────────

function NameCell({ name }: Readonly<{ name: string }>) {
  return <strong>{name}</strong>;
}

function TierBadge({ tier }: Readonly<{ tier: string }>) {
  return (
    <span className={`badge badge--${TIER_BADGE[tier] ?? "gray"}`}>
      {TIER_LABELS[tier] ?? tier}
    </span>
  );
}

function WebsiteCell({ url }: Readonly<{ url: string | null }>) {
  if (!url) return <>—</>;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent-strong)" }}>
      {url.replace(/^https?:\/\//, "")}
    </a>
  );
}

function SortOrderCell({ order }: Readonly<{ order: number }>) {
  return <span className="mono">{order}</span>;
}

function ActiveBadge({ isActive }: Readonly<{ isActive: boolean }>) {
  return isActive ? (
    <span className="badge badge--green">Actief</span>
  ) : (
    <span className="badge badge--gray">Inactief</span>
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

function makeColumns(onEdit: (s: Sponsor) => void): ColumnDef<Sponsor>[] {
  return [
    {
      key: "name",
      header: "Naam",
      sortable: true,
      sortValue: (s) => s.name,
      cell: (s) => <NameCell name={s.name} />,
    },
    {
      key: "tier",
      header: "Niveau",
      sortable: true,
      sortValue: (s) => s.tier,
      cell: (s) => <TierBadge tier={s.tier} />,
    },
    {
      key: "websiteUrl",
      header: "Website",
      cell: (s) => <WebsiteCell url={s.websiteUrl} />,
    },
    {
      key: "sortOrder",
      header: "Volgorde",
      sortable: true,
      sortValue: (s) => s.sortOrder,
      cell: (s) => <SortOrderCell order={s.sortOrder} />,
    },
    {
      key: "status",
      header: "Status",
      cell: (s) => <ActiveBadge isActive={s.isActive} />,
    },
    {
      key: "actions",
      header: "Acties",
      cell: (s) => <EditButton onClick={() => onEdit(s)} />,
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

export default function AdminSponsorsPage() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading]   = useState(true);
  const [open, setOpen]         = useState(false);
  const [editing, setEditing]   = useState<Sponsor | null>(null);
  const [form, setForm]         = useState<Form>(blank);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");

  const [search, setSearch]       = useState("");
  const [filterTier, setFilterTier]     = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");

  const close = () => setOpen(false);
  const dialogRef = useDialog(open, close);

  async function load() {
    try {
      setSponsors(await apiFetch<Sponsor[]>("/content/sponsors"));
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

  function openEdit(s: Sponsor) {
    setEditing(s);
    setForm({
      name: s.name,
      logoUrl: s.logoUrl ?? "",
      websiteUrl: s.websiteUrl ?? "",
      tier: s.tier,
      isActive: s.isActive,
      sortOrder: String(s.sortOrder),
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
        name: form.name,
        logoUrl: form.logoUrl || null,
        websiteUrl: form.websiteUrl || null,
        tier: form.tier,
        isActive: form.isActive,
        sortOrder: Number.parseInt(form.sortOrder, 10) || 0,
      };
      if (editing) {
        await apiFetch(`/content/sponsors/${editing.id}`, { method: "PATCH", body: JSON.stringify(payload) });
      } else {
        await apiFetch("/content/sponsors", { method: "POST", body: JSON.stringify(payload) });
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
    return sponsors.filter((s) => {
      if (filterTier !== "ALL" && s.tier !== filterTier) return false;
      if (filterStatus === "ACTIVE" && !s.isActive) return false;
      if (filterStatus === "INACTIVE" && s.isActive) return false;
      if (q && !s.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [sponsors, search, filterTier, filterStatus]);

  const columns = makeColumns(openEdit);

  return (
    <>
      <div className="admin-page-header">
        <h1>Sponsors</h1>
        <p>Beheer sponsoren en partners</p>
      </div>

      <DataTable
        toolbar={
          <TableToolbar
            search={search}
            onSearch={setSearch}
            searchPlaceholder="Zoek op naam…"
            filters={[
              {
                key: "tier",
                label: "Niveau",
                value: filterTier,
                defaultValue: "ALL",
                options: [
                  { value: "ALL",      label: "Alle niveaus"  },
                  { value: "MAIN",     label: "Hoofdsponsor"  },
                  { value: "GOLD",     label: "Goud"          },
                  { value: "STANDARD", label: "Standaard"     },
                ],
                onChange: setFilterTier,
              },
              {
                key: "status",
                label: "Status",
                value: filterStatus,
                defaultValue: "ALL",
                options: [
                  { value: "ALL",      label: "Alle statussen" },
                  { value: "ACTIVE",   label: "Actief"         },
                  { value: "INACTIVE", label: "Inactief"       },
                ],
                onChange: setFilterStatus,
              },
            ]}
            onAdd={openCreate}
            addLabel="Nieuwe sponsor"
            resultCount={filtered.length}
            totalCount={sponsors.length}
          />
        }
        title={`Sponsors (${loading ? "…" : sponsors.length})`}
        data={filtered}
        columns={columns}
        loading={loading}
        emptyText="Nog geen sponsors aangemaakt."
      />

      <dialog ref={dialogRef} className="admin-drawer">
        <div className="admin-drawer__header">
          <h2>{editing ? "Sponsor bewerken" : "Nieuwe sponsor"}</h2>
          <button className="admin-drawer__close" onClick={close} type="button">✕</button>
        </div>

        <form className="admin-form" onSubmit={handleSave}>
          {error && <p className="form-error">{error}</p>}

          <div className="form-field">
            <label htmlFor="s-name">Naam *</label>
            <input id="s-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required disabled={saving} />
          </div>

          <div className="form-field">
            <label htmlFor="s-tier">Niveau</label>
            <select id="s-tier" value={form.tier} onChange={(e) => setForm({ ...form, tier: e.target.value as Form["tier"] })} disabled={saving}>
              <option value="MAIN">Hoofdsponsor</option>
              <option value="GOLD">Goud</option>
              <option value="STANDARD">Standaard</option>
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="s-logo">Logo URL (optioneel)</label>
            <input id="s-logo" value={form.logoUrl} placeholder="https://..." onChange={(e) => setForm({ ...form, logoUrl: e.target.value })} disabled={saving} />
          </div>

          <div className="form-field">
            <label htmlFor="s-web">Website URL (optioneel)</label>
            <input id="s-web" value={form.websiteUrl} placeholder="https://..." onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })} disabled={saving} />
          </div>

          <div className="form-field">
            <label htmlFor="s-order">Volgorde</label>
            <input id="s-order" type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} disabled={saving} />
          </div>

          <label className="form-checkbox">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} disabled={saving} />
            {" "}Actief
          </label>

          <div className="admin-drawer__actions">
            <button type="submit" className="btn-sm btn-sm--primary" disabled={saving || !form.name}>
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
