"use client";

import { useState } from "react";
import { CalEvent } from "@/components/admin/events/event-drawer";
import { ShiftGroup } from "@/types/shifts";
import { fmtTime, getEventDays, fmtDayTab } from "@/utils/DateHelpers";

interface TimelineViewProps {
  groups: ShiftGroup[];
  event: CalEvent;
}

const LABEL_W = 100;

function slotMatchesDay(startAt: string, day: Date): boolean {
  const d = new Date(startAt);
  return (
    d.getFullYear() === day.getFullYear() &&
    d.getMonth() === day.getMonth() &&
    d.getDate() === day.getDate()
  );
}

export function TimelineView({ groups, event }: Readonly<TimelineViewProps>) {
  const days = getEventDays(event.startsAt, event.endsAt);
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const selectedDay = days[selectedDayIdx] ?? days[0];

  // Collect all slots that have a time and match selected day
  const allTimedSlots = groups.flatMap((g) =>
    g.slots
      .filter((s) => slotMatchesDay(s.startAt, selectedDay))
      .map((s) => ({ ...s, group: g }))
  );

  // Compute visible time range
  let rangeStart: number;
  let rangeEnd: number;
  if (allTimedSlots.length > 0) {
    const starts = allTimedSlots.map((s) => new Date(s.startAt).getTime());
    const ends = allTimedSlots.map((s) => new Date(s.endAt).getTime());
    const minTime = Math.min(...starts);
    const maxTime = Math.max(...ends);
    const s = new Date(minTime);
    s.setMinutes(0, 0, 0);
    const e = new Date(maxTime);
    e.setMinutes(0, 0, 0);
    e.setHours(e.getHours() + 1);
    rangeStart = s.getTime();
    rangeEnd = e.getTime();
  } else {
    const s = new Date(selectedDay);
    s.setHours(8, 0, 0, 0);
    const e = new Date(selectedDay);
    e.setHours(22, 0, 0, 0);
    rangeStart = s.getTime();
    rangeEnd = e.getTime();
  }

  function pct(ms: number): number {
    return Math.max(0, Math.min(100, ((ms - rangeStart) / (rangeEnd - rangeStart)) * 100));
  }

  const hourMarks: number[] = [];
  {
    const s = new Date(rangeStart);
    s.setMinutes(0, 0, 0);
    let t = s.getTime();
    while (t <= rangeEnd) {
      hourMarks.push(t);
      t += 3600000;
    }
  }

  if (groups.length === 0) {
    return (
      <div style={{ padding: "3rem 1.4rem", textAlign: "center" }}>
        <p style={{ color: "var(--ink-2)", fontSize: "0.875rem", margin: 0 }}>
          Nog geen shiftgroepen aangemaakt. Voeg groepen toe via het <strong>Shifts</strong> tabblad.
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: "1.25rem 1.4rem" }}>
      {/* Day tabs */}
      {days.length > 1 && (
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
          {days.map((day, i) => {
            const count = groups.flatMap((g) => g.slots).filter((s) => slotMatchesDay(s.startAt, day)).length;
            const isActive = i === selectedDayIdx;
            return (
              <button
                key={day.toISOString()}
                type="button"
                onClick={() => setSelectedDayIdx(i)}
                style={{
                  padding: "0.35rem 0.85rem",
                  borderRadius: "999px",
                  border: `1.5px solid ${isActive ? "var(--text)" : "var(--border)"}`,
                  background: isActive ? "var(--text)" : "transparent",
                  color: isActive ? "var(--bg)" : "var(--text)",
                  fontSize: "0.78rem",
                  fontWeight: isActive ? 600 : 400,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  whiteSpace: "nowrap",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                }}
              >
                {fmtDayTab(day)}
                {count > 0 && (
                  <span style={{ background: isActive ? "rgba(255,255,255,0.25)" : "var(--border)", color: isActive ? "var(--bg)" : "var(--ink-2)", borderRadius: "999px", padding: "0 0.35rem", fontSize: "0.65rem", fontWeight: 700 }}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Gantt chart */}
      <div style={{ overflowX: "auto" }}>
        <div style={{ minWidth: "520px" }}>
          {/* Ruler */}
          <div style={{ display: "flex", borderBottom: "2px solid var(--border)" }}>
            <div style={{ width: `${LABEL_W}px`, flexShrink: 0 }} />
            <div style={{ flex: 1, position: "relative", height: "30px" }}>
              {hourMarks.map((h) => (
                <div
                  key={h}
                  style={{
                    position: "absolute",
                    left: `${pct(h)}%`,
                    top: "6px",
                    transform: "translateX(-50%)",
                    fontSize: "0.7rem",
                    fontWeight: 600,
                    color: "var(--ink-2)",
                    fontFamily: "monospace",
                    whiteSpace: "nowrap",
                    pointerEvents: "none",
                  }}
                >
                  {new Date(h).toLocaleTimeString("nl-BE", { hour: "2-digit", minute: "2-digit" })}
                </div>
              ))}
            </div>
          </div>

          {/* Group rows */}
          {groups.map((group) => {
            const groupSlots = allTimedSlots.filter((s) => s.group.id === group.id);
            const color = group.color;

            return (
              <div
                key={group.id}
                style={{ display: "flex", borderBottom: "1px solid var(--border)", minHeight: "56px" }}
              >
                {/* Label */}
                <div style={{
                  width: `${LABEL_W}px`,
                  flexShrink: 0,
                  borderRight: `3px solid ${color}`,
                  padding: "0 0.6rem 0 0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  gap: "0.25rem",
                }}>
                  {group.icon && <span style={{ fontSize: "0.9rem" }}>{group.icon}</span>}
                  <span style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color, textAlign: "right" }}>
                    {group.name}
                  </span>
                </div>

                {/* Timeline area */}
                <div style={{ flex: 1, position: "relative", padding: "0.4rem 0.5rem" }}>
                  {hourMarks.map((h) => (
                    <div
                      key={h}
                      style={{
                        position: "absolute",
                        left: `calc(0.5rem + ${pct(h)}% * (100% - 1rem) / 100)`,
                        top: 0,
                        bottom: 0,
                        width: "1px",
                        background: "var(--border)",
                        pointerEvents: "none",
                      }}
                    />
                  ))}

                  {groupSlots.length === 0 ? (
                    <div style={{
                      height: "34px",
                      border: `1.5px dashed ${color}40`,
                      borderRadius: "8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}>
                      <span style={{ fontSize: "0.65rem", color: "var(--ink-2)" }}>Geen slots op deze dag</span>
                    </div>
                  ) : (
                    <div style={{ position: "relative", height: "34px" }}>
                      {groupSlots.map((slot) => {
                        const startMs = new Date(slot.startAt).getTime();
                        const endMs = new Date(slot.endAt).getTime();
                        const left = pct(startMs);
                        const width = Math.max(pct(endMs) - left, 1.5);
                        const regCount = slot.registrations.length;
                        const isUnderstaffed = !slot.isUnlimited && slot.maxPersons !== null && regCount < slot.maxPersons * 0.5;
                        let barColor = color;
                        if (slot.isClosed || slot.isLocked) barColor = "#94a3b8";
                        else if (isUnderstaffed) barColor = "#ef4444";
                        else if (slot.maxPersons !== null && regCount >= slot.maxPersons) barColor = "#10b981";
                        else if (slot.maxPersons !== null && regCount >= slot.maxPersons * 0.5) barColor = "#f59e0b"; // warning color for half full slots


                        const capacityStr = slot.maxPersons ? `/${slot.maxPersons}` : "";
                        const capacityLabel = `${regCount}${capacityStr} ingeschreven`;
                        const slotLabel = slot.title ?? `${fmtTime(slot.startAt)} – ${fmtTime(slot.endAt)}`;
                        let statusLabel = "";
                        if (slot.isClosed) statusLabel = "Gesloten";
                        else if (slot.isLocked) statusLabel = "Vergrendeld";

                        return (
                          <div
                            key={slot.id}
                            title={[slotLabel, capacityLabel, statusLabel].filter(Boolean).join("  ·  ")}
                            style={{
                              position: "absolute",
                              left: `${left}%`,
                              width: `${width}%`,
                              top: "1px",
                              bottom: "1px",
                              background: barColor,
                              borderRadius: "6px",
                              display: "flex",
                              alignItems: "center",
                              paddingLeft: "8px",
                              paddingRight: "8px",
                              overflow: "hidden",
                              boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
                              opacity: slot.isClosed || slot.isLocked ? 0.6 : 1,
                            }}
                          >
                            <span style={{ fontSize: "0.7rem", color: "#fff", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {slot.title || `${fmtTime(slot.startAt)}–${fmtTime(slot.endAt)}`}
                              {width > 10 && (
                                <span style={{ fontWeight: 400, opacity: 0.85, marginLeft: "0.3rem" }}>
                                  {regCount}{slot.maxPersons ? `/${slot.maxPersons}` : ""}p
                                </span>
                              )}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div style={{ marginTop: "1rem", display: "flex", gap: "1rem", flexWrap: "wrap", fontSize: "0.68rem", color: "var(--ink-2)" }}>
        <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
          <span style={{ width: 12, height: 12, borderRadius: 3, background: "#ef4444", display: "inline-block" }} /> Onderbemand (&lt;50%)
        </span>
        <span>
          <span style={{ width: 12, height: 12, borderRadius: 3, background: "#f59e0b", display: "inline-block" }} /> Halve capaciteit bereikt (&gt;=50%)
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
          <span style={{ width: 12, height: 12, borderRadius: 3, background: "#10b981", display: "inline-block" }} /> Volledig gevuld
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
          <span style={{ width: 12, height: 12, borderRadius: 3, background: "#94a3b8", display: "inline-block" }} /> Gesloten / vergrendeld
        </span>
      </div>
    </div>
  );
}
