"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { usePageSize } from "@/hooks/use-page-size";
import { apiFetch } from "@/lib/api";
import { DataTable, type ColumnDef } from "@/components/admin/data-table";
import { TableToolbar } from "@/components/admin/table-toolbar";
import { useDrawer } from "@/components/admin/drawer-provider";
import type { CalEvent } from "@/components/admin/events/event-drawer";
import { HelperDrawer, type Helper } from "@/components/admin/helpers/helper-drawer";

// ── Cell components ───────────────────────────────────────────────────────────

function NameCell({ helper }: Readonly<{ helper: Helper }>) {
  return (
    <div>
      <strong>{helper.name}</strong>
      {helper.note && <div style={{ fontSize: "0.75rem", color: "var(--ink-2)" }}>{helper.note}</div>}
    </div>
  );
}

function ContactCell({ helper }: Readonly<{ helper: Helper }>) {
  if (!helper.email && !helper.phone) return <>—</>;
  return (
    <div style={{ display: "grid", gap: "0.1rem", fontSize: "0.8rem" }}>
      {helper.email && <a href={`mailto:${helper.email}`} style={{ color: "var(--accent-strong)" }}>{helper.email}</a>}
      {helper.phone && <a href={`tel:${helper.phone}`} style={{ color: "var(--ink-2)" }}>{helper.phone}</a>}
    </div>
  );
}

function EventsCell({ events }: Readonly<{ events: Helper["events"] }>) {
  if (events.length === 0) return <span className="badge badge--gray">Geen event</span>;
  return (
    <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap" }}>
      {events.map((ev) => (
        <span key={ev.id} className="badge badge--pink">
          {ev.title} {new Date(ev.startsAt).getFullYear()}
        </span>
      ))}
    </div>
  );
}

function EditButton({ onClick }: Readonly<{ onClick: () => void }>) {
  return (
    <button type="button" className="btn-sm btn-sm--ghost" onClick={onClick}>
      Bewerken
    </button>
  );
}

function makeColumns(onEdit: (h: Helper) => void): ColumnDef<Helper>[] {
  return [
    {
      key: "name",
      header: "Naam",
      sortable: true,
      sortValue: (h) => h.name.toLowerCase(),
      cell: (h) => <NameCell helper={h} />,
    },
    {
      key: "events",
      header: "Geholpen bij",
      sortable: true,
      sortValue: (h) => h.events.length,
      cell: (h) => <EventsCell events={h.events} />,
    },
    {
      key: "contact",
      header: "Contact",
      cell: (h) => <ContactCell helper={h} />,
    },
    {
      key: "actions",
      header: "Acties",
      cell: (h) => <EditButton onClick={() => onEdit(h)} />,
    },
  ];
}

// ── Page ──────────────────────────────────────────────────────────────────────

function HelpersPageInner() {
  const searchParams = useSearchParams();
  const { openDrawer } = useDrawer();
  const [helpers, setHelpers] = useState<Helper[]>([]);
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [search, setSearch] = useState("");
  const [filterEvent, setFilterEvent] = useState(() => searchParams.get("event") ?? "ALL");
  const [pageSize, savePageSize] = usePageSize("helpers");

  const load = useCallback(async () => {
    try {
      const [hs, evs] = await Promise.all([
        apiFetch<Helper[]>("helpers"),
        apiFetch<CalEvent[]>("content/events/all"),
      ]);
      setHelpers(hs);
      setEvents(evs);
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : "Laden mislukt.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function handleSaved() {
    setLoading(true);
    load();
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return helpers.filter((h) => {
      if (filterEvent !== "ALL" && !h.events.some((ev) => String(ev.id) === filterEvent)) return false;
      if (q && !h.name.toLowerCase().includes(q) && !(h.email ?? "").toLowerCase().includes(q)) return false;
      return true;
    });
  }, [helpers, search, filterEvent]);

  const eventOptions = useMemo(
    () => [...events]
      .sort((a, b) => b.startsAt.localeCompare(a.startsAt))
      .map((ev) => ({ value: String(ev.id), label: `${ev.title} ${new Date(ev.startsAt).getFullYear()}` })),
    [events]
  );

  const defaultEventId = filterEvent === "ALL" ? null : Number(filterEvent);

  const columns = makeColumns((h) =>
    openDrawer(<HelperDrawer editing={h} events={events} onSaved={handleSaved} />)
  );

  return (
    <>
      <div className="admin-page-header">
        <h1>Helpers</h1>
        <p>Wie heeft bij welk event geholpen</p>
        {fetchError && (
          <div style={{ marginTop: "1rem", padding: "0.65rem 1rem", borderRadius: "10px", background: "var(--err-bg)", color: "var(--err-fg)", fontSize: "0.875rem", fontWeight: 500 }}>
            Kon helpers niet laden: <strong>{fetchError}</strong>
          </div>
        )}
      </div>

      <DataTable
        toolbar={
          <TableToolbar
            search={search}
            onSearch={setSearch}
            searchPlaceholder="Zoek op naam of e-mail…"
            filters={[
              {
                key: "event",
                label: "Event",
                value: filterEvent,
                defaultValue: "ALL",
                options: [{ value: "ALL", label: "Alle events" }, ...eventOptions],
                onChange: setFilterEvent,
              },
            ]}
            onAdd={() =>
              openDrawer(
                <HelperDrawer editing={null} events={events} defaultEventId={defaultEventId} onSaved={handleSaved} />
              )
            }
            addLabel="Helper toevoegen"
            resultCount={filtered.length}
            totalCount={helpers.length}
          />
        }
        title={`Helpers (${loading ? "…" : helpers.length})`}
        data={filtered}
        columns={columns}
        loading={loading}
        defaultPageSize={pageSize}
        onPageSizeChange={savePageSize}
        emptyText="Nog geen helpers toegevoegd."
      />
    </>
  );
}

export default function AdminHelpersPage() {
  return (
    <Suspense fallback={<p className="admin-empty">Laden…</p>}>
      <HelpersPageInner />
    </Suspense>
  );
}
