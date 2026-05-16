"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import { DataTable, type ColumnDef } from "@/components/admin/data-table";
import { TableToolbar } from "@/components/admin/table-toolbar";
import { useDrawer } from "@/components/admin/drawer-provider";
import { EventDrawer, type CalEvent } from "@/components/events/event-drawer";

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

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AdminEventsPage() {
  const { openDrawer } = useDrawer();
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");

  async function load() {
    try {
      setEvents(await apiFetch<CalEvent[]>("/content/events"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function handleSaved() {
    setLoading(true);
    load();
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

  const columns = makeColumns((ev) => openDrawer(<EventDrawer editing={ev} onSaved={handleSaved} />));

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
            onAdd={() => openDrawer(<EventDrawer editing={null} onSaved={handleSaved} />)}
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
    </>
  );
}
