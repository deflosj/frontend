"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import type { CalEvent } from "@/components/admin/events/event-drawer";
import { ShiftGroup } from "@/types/shifts";
import { ShiftBoard } from "@/components/admin/shifts/ShiftBoard";
import { TimelineView } from "@/components/admin/shifts/TimeLineView";
import { AccessPanel } from "@/components/admin/shifts/AccessPanel";
import { Button } from "@/components/ui/button";

type TabId = "shifts" | "tijdlijn";

const TABS: { id: TabId; label: string }[] = [
  { id: "shifts",    label: "Shifts" },
  { id: "tijdlijn", label: "Tijdlijn" },
];

export default function EventHelpersPage({
  params,
}: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = use(params);
  const eventId = Number.parseInt(id, 10);

  const [event, setEvent] = useState<CalEvent | null>(null);
  const [eventLoading, setEventLoading] = useState(true);
  const [eventError, setEventError] = useState("");
  const [groups, setGroups] = useState<ShiftGroup[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [tab, setTab] = useState<TabId>("shifts");

  const load = useCallback(async () => {
    try {
      const [ev, gs] = await Promise.all([
        apiFetch<CalEvent>(`content/events/${eventId}`),
        apiFetch<ShiftGroup[]>(`events/${eventId}/shifts`),
      ]);
      setEvent(ev);
      setGroups(gs);
    } catch (err) {
      setEventError(err instanceof Error ? err.message : "Laden mislukt.");
    } finally {
      setEventLoading(false);
      setGroupsLoading(false);
    }
  }, [eventId]);

  useEffect(() => { load(); }, [load]);

  if (eventLoading) return <p className="admin-empty">Laden…</p>;
  if (eventError || !event) {
    return <p className="admin-empty" style={{ color: "var(--accent)" }}>{eventError || "Event niet gevonden."}</p>;
  }

  // Use event start date as base for slot time inputs
  const baseDate = event.startsAt;

  return (
    <>
      <div style={{ marginBottom: "1.5rem" }}>
        <Link href="/admin/events" style={{ fontSize: "0.8rem", color: "var(--ink-2)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.3rem", marginBottom: "0.75rem" }}>
          ← Alle events
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 500, letterSpacing: "-0.03em", color: "var(--text)" }}>
            {event.title}
          </h1>
          <span className="badge badge--pink">Shifts</span>
        </div>
        {(event.location || event.startsAt) && (
          <p style={{ margin: "0.35rem 0 0", fontSize: "0.875rem", color: "var(--ink-2)" }}>
            {event.location && `${event.location} · `}
            {new Date(event.startsAt).toLocaleDateString("nl-BE", { day: "numeric", month: "long", year: "numeric" })}
            {event.endsAt && ` – ${new Date(event.endsAt).toLocaleDateString("nl-BE", { day: "numeric", month: "long", year: "numeric" })}`}
          </p>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "1.5rem", alignItems: "start" }}>
        <div className="admin-table-wrapper" style={{ overflow: "visible" }}>
          <div style={{ display: "flex", borderBottom: "1px solid var(--border)", padding: "0 1.4rem" }}>
            {TABS.map((t) => (
              <Button
                key={t.id}
                onClick={() => setTab(t.id)}
                variant={tab === t.id ? "OutlineBottom" : "ghost"}
              >
                {t.label}
              </Button>
            ))}
            {groupsLoading && (
              <span style={{ marginLeft: "auto", padding: "0.85rem 0", fontSize: "0.72rem", color: "var(--ink-2)" }}>Laden…</span>
            )}
          </div>

          {tab === "shifts" && (
            <ShiftBoard groups={groups} eventId={eventId} baseDate={baseDate} onGroupsUpdated={setGroups} />
          )}
          {tab === "tijdlijn" && (
            <TimelineView groups={groups} event={event} />
          )}
        </div>

        <div style={{ display: "grid", gap: "1.5rem" }}>
          <AccessPanel eventId={eventId} />
        </div>
      </div>
    </>
  );
}
