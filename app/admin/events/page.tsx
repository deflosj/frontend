"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePageSize } from "@/hooks/use-page-size";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { DataTable, type ColumnDef } from "@/components/admin/data-table";
import { TableToolbar } from "@/components/admin/table-toolbar";
import { useDrawer } from "@/components/admin/drawer-provider";
import { EventDrawer, type CalEvent } from "@/components/admin/events/event-drawer";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/admin/ui";

// ── Cell components ───────────────────────────────────────────────────────────

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
function ActionsCell({ ev, onEdit }: Readonly<{ ev: CalEvent; onEdit: () => void }>) {
  return (
    <div className="row-actions">
      <Button 
        variant="outline"
        onClick={onEdit}
      >
        Bewerken
      </Button>
      <Link href={`/admin/helpers?event=${ev.id}`} className="btn-sm btn-sm--ghost">
        Helpers
      </Link>
    </div>
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
      cell: (ev) => <ActionsCell ev={ev} onEdit={() => onEdit(ev)} />,
    },
  ];
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminEventsPage() {
  const { openDrawer } = useDrawer();
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [pageSize, savePageSize] = usePageSize("events");

  const fetchEvents = useCallback(async () => {
    try {
      const evs = await apiFetch<CalEvent[]>("content/events/all");
      setEvents(evs);
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : "Laden mislukt.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  function handleSaved() {
    setLoading(true);
    fetchEvents();
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
        {fetchError && (
          <Notice tone="err" className="mt-4">
            Kon events niet laden: <strong>{fetchError}</strong>
          </Notice>
        )}
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
        defaultPageSize={pageSize}
        onPageSizeChange={savePageSize}
        emptyText="Nog geen events aangemaakt."
      />
    </>
  );
}
