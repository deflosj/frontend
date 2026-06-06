"use client";

import { useState } from "react";
import { CalEvent } from "@/components/admin/events/event-drawer";
import { ShiftGroup, ShiftSlot } from "@/types/shifts";
import { fmtTime, getEventDays, fmtDayTab, isoToDateInput } from "@/utils/DateHelpers";

const LABEL_W = 108;

type SlotWithGroup = ShiftSlot & { group: ShiftGroup };
type DayKind = "before" | "event" | "after";

// ─── helpers ──────────────────────────────────────────────────────────────────

function dateToStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function slotMatchesDay(startAt: string, day: Date): boolean {
  return isoToDateInput(startAt) === dateToStr(day);
}

/** Merge the event's own days with every day that has a slot (build-up/breakdown). */
function getAllDays(event: CalEvent, groups: ShiftGroup[]): Date[] {
  const strs = new Set(getEventDays(event.startsAt, event.endsAt).map(dateToStr));
  for (const g of groups) {
    for (const s of g.slots) strs.add(isoToDateInput(s.startAt));
  }
  return [...strs].sort((a, b) => a.localeCompare(b)).map((str) => {
    const [y, mo, d] = str.split("-").map(Number);
    return new Date(y, mo - 1, d);
  });
}

function getDayKind(day: Date, event: CalEvent): DayKind {
  const dayStr = dateToStr(day);
  const start = isoToDateInput(event.startsAt);
  const end = isoToDateInput(event.endsAt ?? event.startsAt);
  if (dayStr < start) return "before";
  if (dayStr > end) return "after";
  return "event";
}

function capacityLabel(slot: ShiftSlot): string {
  const n = slot.registrations.length;
  return slot.isUnlimited ? `${n} / ∞` : `${n} / ${slot.maxPersons ?? "?"}`;
}

function slotStatusMeta(slot: ShiftSlot): { text: string; color: string } {
  if (slot.isClosed) return { text: "Gesloten", color: "#94a3b8" };
  if (slot.isLocked) return { text: "Vergrendeld", color: "#94a3b8" };
  if (!slot.isUnlimited && slot.maxPersons !== null) {
    const n = slot.registrations.length;
    if (n >= slot.maxPersons) return { text: "Vol", color: "#10b981" };
    if (n >= slot.maxPersons * 0.8) return { text: "Bijna vol", color: "#f59e0b" };
  }
  return { text: "Open", color: "#22c55e" };
}

function barColor(slot: ShiftSlot, groupColor: string): string {
  if (slot.isClosed || slot.isLocked) return "#94a3b8";
  if (!slot.isUnlimited && slot.maxPersons !== null) {
    const n = slot.registrations.length;
    if (n >= slot.maxPersons) return "#10b981";
    if (n >= slot.maxPersons * 0.8) return "#f59e0b";
    if (n < slot.maxPersons * 0.5) return "#ef4444";
  }
  return groupColor;
}

// ─── component ────────────────────────────────────────────────────────────────

interface TimelineViewProps {
  groups: ShiftGroup[];
  event: CalEvent;
}

export function TimelineView({ groups, event }: Readonly<TimelineViewProps>) {
  const days = getAllDays(event, groups);
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const [activeSlot, setActiveSlot] = useState<SlotWithGroup | null>(null);

  const selectedDay = days[selectedDayIdx] ?? days[0];

  const allTimedSlots: SlotWithGroup[] = groups.flatMap((g) =>
    g.slots
      .filter((s) => slotMatchesDay(s.startAt, selectedDay))
      .map((s) => ({ ...s, group: g }))
  );

  // Time range: expand to cover all slot start/end times on this day
  let rangeStart: number;
  let rangeEnd: number;
  if (allTimedSlots.length > 0) {
    const starts = allTimedSlots.map((s) => new Date(s.startAt).getTime());
    const ends = allTimedSlots.map((s) => new Date(s.endAt).getTime());
    const lo = new Date(Math.min(...starts));
    lo.setMinutes(0, 0, 0);
    const hi = new Date(Math.max(...ends));
    hi.setMinutes(0, 0, 0);
    hi.setHours(hi.getHours() + 1);
    rangeStart = lo.getTime();
    rangeEnd = hi.getTime();
  } else {
    const lo = new Date(selectedDay); lo.setHours(8, 0, 0, 0);
    const hi = new Date(selectedDay); hi.setHours(22, 0, 0, 0);
    rangeStart = lo.getTime();
    rangeEnd = hi.getTime();
  }

  function pct(ms: number): number {
    return Math.max(0, Math.min(100, ((ms - rangeStart) / (rangeEnd - rangeStart)) * 100));
  }

  const hourMarks: number[] = [];
  {
    const s = new Date(rangeStart); s.setMinutes(0, 0, 0);
    let t = s.getTime();
    while (t <= rangeEnd) { hourMarks.push(t); t += 3_600_000; }
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

  const dayKind = getDayKind(selectedDay, event);

  return (
    <div style={{ padding: "1.25rem 1.4rem" }}>

      {/* Day tabs */}
      {days.length > 1 && (
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
          {days.map((day, i) => {
            const slotCount = groups.flatMap((g) => g.slots).filter((s) => slotMatchesDay(s.startAt, day)).length;
            const isActive = i === selectedDayIdx;
            const kind = getDayKind(day, event);
            return (
              <button
                key={dateToStr(day)}
                type="button"
                onClick={() => { setSelectedDayIdx(i); setActiveSlot(null); }}
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
                {kind !== "event" && (
                  <span style={{ fontSize: "0.6rem", opacity: 0.7, fontWeight: 400 }}>
                    {kind === "before" ? "opbouw" : "afbouw"}
                  </span>
                )}
                {slotCount > 0 && (
                  <span style={{
                    background: isActive ? "rgba(255,255,255,0.25)" : "var(--border)",
                    color: isActive ? "var(--bg)" : "var(--ink-2)",
                    borderRadius: "999px",
                    padding: "0 0.35rem",
                    fontSize: "0.65rem",
                    fontWeight: 700,
                  }}>
                    {slotCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Single-day banner for build-up/breakdown */}
      {days.length === 1 && dayKind !== "event" && (
        <p style={{ margin: "0 0 1rem", fontSize: "0.75rem", color: "var(--ink-2)", fontStyle: "italic" }}>
          {dayKind === "before" ? "⚙️ Opbouwdag (voor het event)" : "🧹 Afbouwdag (na het event)"}
        </p>
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
              <div key={group.id} style={{ display: "flex", borderBottom: "1px solid var(--border)", minHeight: "56px" }}>

                {/* Row label */}
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
                  <span style={{
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color,
                    textAlign: "right",
                    wordBreak: "break-word",
                    overflowWrap: "break-word",
                  }}>
                    {group.name}
                  </span>
                </div>

                {/* Timeline lane */}
                <div style={{ flex: 1, position: "relative", padding: "0.4rem 0.5rem" }}>
                  {/* Hour grid lines */}
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
                        const isActive = activeSlot?.id === slot.id;
                        const bc = barColor(slot, color);
                        const regCount = slot.registrations.length;
                        const slotTimeLabel = slot.title ?? `${fmtTime(slot.startAt)}–${fmtTime(slot.endAt)}`;
                        const capacityHint = slot.maxPersons ? `${regCount}/${slot.maxPersons}` : `${regCount}`;

                        return (
                          <button
                            key={slot.id}
                            type="button"
                            onClick={() => setActiveSlot(isActive ? null : { ...slot, group })}
                            title={`${slotTimeLabel}  ·  ${capacityHint} ingeschreven`}
                            style={{
                              position: "absolute",
                              left: `${left}%`,
                              width: `${width}%`,
                              top: "1px",
                              bottom: "1px",
                              background: bc,
                              borderRadius: "6px",
                              border: isActive ? `2px solid rgba(255,255,255,0.8)` : "none",
                              display: "flex",
                              alignItems: "center",
                              paddingLeft: "8px",
                              paddingRight: "8px",
                              overflow: "hidden",
                              boxShadow: isActive
                                ? `0 0 0 2px ${bc}`
                                : "0 1px 4px rgba(0,0,0,0.15)",
                              opacity: slot.isClosed || slot.isLocked ? 0.6 : 1,
                              cursor: "pointer",
                              fontFamily: "inherit",
                            }}
                          >
                            <span style={{
                              fontSize: "0.7rem",
                              color: "#fff",
                              fontWeight: 600,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}>
                              {slot.title || `${fmtTime(slot.startAt)}–${fmtTime(slot.endAt)}`}
                              {width > 10 && (
                                <span style={{ fontWeight: 400, opacity: 0.85, marginLeft: "0.3rem" }}>
                                  {regCount}{slot.maxPersons ? `/${slot.maxPersons}` : ""}p
                                </span>
                              )}
                            </span>
                          </button>
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

      {/* Clicked-slot detail panel */}
      {activeSlot && (
        <div style={{
          marginTop: "1rem",
          background: "var(--bg-alt)",
          border: "1px solid var(--border)",
          borderLeft: `4px solid ${activeSlot.group.color}`,
          borderRadius: "10px",
          padding: "0.875rem 1rem",
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", marginBottom: "0.5rem" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: "0.82rem", fontWeight: 700, color: "var(--text)" }}>
                {activeSlot.title ? `${activeSlot.title} · ` : ""}
                {fmtTime(activeSlot.startAt)} – {fmtTime(activeSlot.endAt)}
              </p>
              <p style={{ margin: "0.1rem 0 0", fontSize: "0.72rem", color: activeSlot.group.color, fontWeight: 600 }}>
                {activeSlot.group.icon && <span style={{ marginRight: "0.25rem" }}>{activeSlot.group.icon}</span>}
                {activeSlot.group.name}
              </p>
            </div>
            <div style={{ display: "flex", gap: "0.4rem", alignItems: "center", flexWrap: "wrap", flexShrink: 0 }}>
              {(() => {
                const { text, color } = slotStatusMeta(activeSlot);
                return (
                  <span style={{
                    fontSize: "0.68rem",
                    fontWeight: 600,
                    color,
                    background: `${color}18`,
                    padding: "0.15rem 0.5rem",
                    borderRadius: "999px",
                  }}>
                    {text}
                  </span>
                );
              })()}
              <span style={{ fontSize: "0.72rem", color: "var(--ink-2)", fontFamily: "monospace", whiteSpace: "nowrap" }}>
                {capacityLabel(activeSlot)}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setActiveSlot(null)}
              aria-label="Sluiten"
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-2)", padding: "0.1rem", lineHeight: 1, fontSize: "1rem", flexShrink: 0 }}
            >
              ✕
            </button>
          </div>

          {activeSlot.location && (
            <p style={{ margin: "0 0 0.35rem", fontSize: "0.72rem", color: "var(--ink-2)" }}>📍 {activeSlot.location}</p>
          )}
          {activeSlot.description && (
            <p style={{ margin: "0 0 0.35rem", fontSize: "0.72rem", color: "var(--ink-2)" }}>{activeSlot.description}</p>
          )}
          {activeSlot.notes && (
            <p style={{ margin: "0 0 0.35rem", fontSize: "0.72rem", color: "var(--ink-2)", fontStyle: "italic" }}>📝 {activeSlot.notes}</p>
          )}

          {activeSlot.registrations.length === 0 ? (
            <p style={{ margin: 0, fontSize: "0.72rem", color: "var(--ink-2)", fontStyle: "italic" }}>Nog niemand ingeschreven</p>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem", marginTop: "0.25rem" }}>
              {activeSlot.registrations.map((r) => (
                <span
                  key={r.id}
                  style={{
                    fontSize: "0.7rem",
                    background: "var(--bg)",
                    border: "1px solid var(--border)",
                    borderRadius: "999px",
                    padding: "0.15rem 0.6rem",
                    color: "var(--text)",
                  }}
                >
                  👤 {r.name}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div style={{ marginTop: "1rem", display: "flex", gap: "1rem", flexWrap: "wrap", fontSize: "0.68rem", color: "var(--ink-2)" }}>
        {[
          { color: "#ef4444", label: "Onderbemand (<50%)" },
          { color: "#f59e0b", label: "Bijna vol (≥80%)" },
          { color: "#10b981", label: "Volledig gevuld" },
          { color: "#94a3b8", label: "Gesloten / vergrendeld" },
        ].map(({ color, label }) => (
          <span key={color} style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: color, display: "inline-block", flexShrink: 0 }} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
