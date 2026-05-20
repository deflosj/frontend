"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { DataTable, type ColumnDef } from "@/components/admin/data-table";
import { TableToolbar } from "@/components/admin/table-toolbar";
import { useDrawer } from "@/components/admin/drawer-provider";
import { EventDrawer, type CalEvent } from "@/components/admin/events/event-drawer";
import { Button } from "@/components/ui/button";
import { SHIFT_LABELS } from "@/constants/shifts";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ShiftBreakdown {
  total: number;
  assigned: number;
}

interface ShiftStats {
  total: number;
  assigned: number;
  byShift?: {
    SETUP: ShiftBreakdown;
    DURING: ShiftBreakdown;
    BREAKDOWN: ShiftBreakdown;
  };
}

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
function shiftPipClass(total: number, assigned: number): string {
  if (total === 0) return "badge--gray";
  if (assigned === total) return "badge--green";
  if (assigned > 0) return "badge--yellow";
  return "badge--red";
}

function ShiftPip({ label, total, assigned }: Readonly<{ label: string; total: number; assigned: number }>) {
  const cls = shiftPipClass(total, assigned);
  return (
    <span className={`badge ${cls}`} style={{ fontSize: "0.65rem", padding: "0.15rem 0.4rem" }}>
      {label} {assigned}/{total}
    </span>
  );
}

function ShiftsCell({ stats, loading }: Readonly<{ stats: ShiftStats | undefined; loading: boolean }>) {
  if (loading) return <span className="badge badge--gray">…</span>;
  if (!stats) return <span className="badge badge--gray">—</span>;
  if (stats.total === 0) return <span className="badge badge--gray">Geen taken</span>;

  if (stats.byShift) {
    return (
      <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap" }}>
        {(["SETUP", "DURING", "BREAKDOWN"] as const).map((s) => (
          <ShiftPip
            key={s}
            label={SHIFT_LABELS[s]}
            total={stats.byShift![s].total}
            assigned={stats.byShift![s].assigned}
          />
        ))}
      </div>
    );
  }

  if (stats.assigned === stats.total)
    return <span className="badge badge--green">{stats.assigned}/{stats.total} ingevuld</span>;
  if (stats.assigned > 0)
    return <span className="badge badge--yellow">{stats.assigned}/{stats.total} ingevuld</span>;
  return <span className="badge badge--red">0/{stats.total} ingevuld</span>;
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
      <Link href={`/admin/events/${ev.id}/helpers`} className="btn-sm btn-sm--ghost">
        Helpers
      </Link>
    </div>
  );
}

// ── Column factory ────────────────────────────────────────────────────────────

function makeColumns(
  onEdit: (ev: CalEvent) => void,
  statsMap: Map<number, ShiftStats>,
  statsLoading: boolean
): ColumnDef<CalEvent>[] {
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
      key: "shifts",
      header: "Shifts",
      cell: (ev) => <ShiftsCell stats={statsMap.get(ev.id)} loading={statsLoading} />,
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
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [statsMap, setStatsMap] = useState<Map<number, ShiftStats>>(new Map());
  const statsMapRef = useRef<Map<number, ShiftStats>>(new Map());
  const [statsLoading, setStatsLoading] = useState(false);

  const fetchShiftStats = useCallback(async (evs: CalEvent[]) => {
    const toFetch = evs.filter((ev) => !statsMapRef.current.has(ev.id));
    if (toFetch.length === 0) return;
    setStatsLoading(true);
    try {
      const results = await Promise.all(
        toFetch.map((ev) =>
          apiFetch<ShiftStats>(`events/${ev.id}/portal/stats`).then((s) => [ev.id, s] as const)
        )
      );
      const merged = new Map<number, ShiftStats>([...statsMapRef.current, ...results]);
      statsMapRef.current = merged;
      setStatsMap(merged);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchEvents = useCallback(async () => {
    try {
      const evs = await apiFetch<CalEvent[]>("content/events/all");
      setEvents(evs);
      fetchShiftStats(evs);
    } finally {
      setLoading(false);
    }
  }, [fetchShiftStats]);

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

  const columns = makeColumns(
    (ev) => openDrawer(<EventDrawer editing={ev} onSaved={handleSaved} />),
    statsMap,
    statsLoading
  );

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
