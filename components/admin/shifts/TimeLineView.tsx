import { useState } from "react";
import { CalEvent } from "@/components/admin/events/event-drawer";
import { SHIFTS, SHIFT_COLORS, SHIFT_LABELS, STATUS_META } from "@/constants/shifts";
import { Task } from "@/types/shifts";
import { fmtTime, getEventDays, taskMatchesDay, fmtDayTab } from "@/utils/DateHelpers";

interface TimelineViewProps {
  tasks: Task[];
  event: CalEvent;
}

const LABEL_W = 88;

export function TimelineView({ tasks, event }: Readonly<TimelineViewProps>) {
  const tasksList = Array.isArray(tasks) ? tasks : [];
  const days = getEventDays(event.startsAt, event.endsAt);
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const selectedDay = days[selectedDayIdx] ?? days[0];

  const timedTasks = tasksList.filter(
    (t): t is Task & { startAt: string } => t.startAt !== null && taskMatchesDay(t, selectedDay)
  );
  const untimedTasks = tasksList.filter((t) => t.startAt === null);

  // Compute visible time range from tasks, or fall back to a sensible default
  let rangeStart: number;
  let rangeEnd: number;
  if (timedTasks.length > 0) {
    const starts = timedTasks.map((t) => new Date(t.startAt).getTime());
    const ends = timedTasks.map((t) =>
      t.endAt ? new Date(t.endAt).getTime() : new Date(t.startAt).getTime() + 3600000
    );
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

  if (tasksList.length === 0) {
    return (
      <div style={{ padding: "3rem 1.4rem", textAlign: "center" }}>
        <p style={{ color: "var(--muted)", fontSize: "0.875rem", margin: 0 }}>
          Nog geen taken aangemaakt. Voeg taken toe via het <strong>Takenbeheer</strong> tabblad.
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: "1.25rem 1.4rem" }}>
      {/* Day tabs — only for multi-day events */}
      {days.length > 1 && (
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
          {days.map((day, i) => {
            const count = tasksList.filter((t) => t.startAt !== null && taskMatchesDay(t, day)).length;
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
                  <span style={{
                    background: isActive ? "rgba(255,255,255,0.25)" : "var(--border)",
                    color: isActive ? "var(--bg)" : "var(--muted)",
                    borderRadius: "999px",
                    padding: "0 0.35rem",
                    fontSize: "0.65rem",
                    fontWeight: 700,
                  }}>
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
          <div style={{
            display: "flex",
            borderBottom: "2px solid var(--border)",
            marginBottom: "0",
          }}>
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
                    color: "var(--muted)",
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

          {/* Shift rows */}
          {SHIFTS.map((shift) => {
            const shiftTasks = timedTasks.filter((t) => t.shift === shift);
            const { bar, bg, border } = SHIFT_COLORS[shift];

            return (
              <div
                key={shift}
                style={{
                  display: "flex",
                  borderBottom: "1px solid var(--border)",
                  minHeight: "62px",
                }}
              >
                {/* Label */}
                <div style={{
                  width: `${LABEL_W}px`,
                  flexShrink: 0,
                  borderRight: `3px solid ${bar}`,
                  padding: "0 0.75rem 0 0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                }}>
                  <span style={{
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.07em",
                    color: bar,
                  }}>
                    {SHIFT_LABELS[shift]}
                  </span>
                </div>

                {/* Timeline area */}
                <div style={{ flex: 1, position: "relative", padding: "0.5rem 0.5rem" }}>
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

                  {shiftTasks.length === 0 ? (
                    <div style={{
                      height: "38px",
                      border: `1.5px dashed ${border}`,
                      borderRadius: "8px",
                      background: bg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}>
                      <span style={{ fontSize: "0.68rem", color: "var(--muted)" }}>
                        Geen ingeplande taken
                      </span>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      {shiftTasks.map((task) => {
                        const startMs = new Date(task.startAt).getTime();
                        const endMs = task.endAt
                          ? new Date(task.endAt).getTime()
                          : startMs + 3600000;
                        const left = pct(startMs);
                        const width = Math.max(pct(endMs) - left, 1.5);
                        const assigneeCount = task.assignees?.length ?? 0;
                        const names = task.assignees?.map((a) => a.name).join(", ");
                        return (
                          <div key={task.id} style={{ position: "relative", height: "38px" }}>
                            <div
                              title={[
                                task.title,
                                `${fmtTime(task.startAt)} – ${fmtTime(task.endAt)}`,
                                names ? `Helpers: ${names}` : "",
                              ].filter(Boolean).join("  ·  ")}
                              style={{
                                position: "absolute",
                                left: `${left}%`,
                                width: `${width}%`,
                                top: "1px",
                                bottom: "1px",
                                background: bar,
                                borderRadius: "6px",
                                display: "flex",
                                alignItems: "center",
                                paddingLeft: "8px",
                                paddingRight: "8px",
                                overflow: "hidden",
                                boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
                              }}
                            >
                              <span style={{
                                fontSize: "0.72rem",
                                color: "#fff",
                                fontWeight: 600,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}>
                                {task.title}
                                {width > 10 && (
                                  <span style={{ fontWeight: 400, opacity: 0.85, marginLeft: "0.35rem" }}>
                                    {fmtTime(task.startAt)}–{fmtTime(task.endAt)}
                                  </span>
                                )}
                                {assigneeCount > 0 && width > 15 && (
                                  <span style={{ opacity: 0.75, marginLeft: "0.35rem", fontWeight: 400 }}>
                                    · {assigneeCount}p
                                  </span>
                                )}
                              </span>
                            </div>
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

      {/* Untimed tasks */}
      {untimedTasks.length > 0 && (
        <div style={{ marginTop: "1.5rem", paddingTop: "1.25rem", borderTop: "1px solid var(--border)" }}>
          <p style={{
            margin: "0 0 0.75rem",
            fontSize: "0.68rem",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "var(--muted)",
          }}>
            Taken zonder tijdstip ({untimedTasks.length})
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {untimedTasks.map((task) => {
              const { bar, bg, border } = SHIFT_COLORS[task.shift];
              const assigneeCount = task.assignees?.length ?? 0;
              return (
                <div
                  key={task.id}
                  style={{
                    padding: "0.4rem 0.85rem",
                    border: `1px solid ${border}`,
                    borderRadius: "8px",
                    background: bg,
                    borderLeft: `3px solid ${bar}`,
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <span style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", color: bar }}>
                    {SHIFT_LABELS[task.shift]}
                  </span>
                  <span style={{ fontSize: "0.8rem", color: "var(--text)", fontWeight: 500 }}>
                    {task.title}
                  </span>
                  <span className={`badge ${STATUS_META[task.status].badge}`} style={{ fontSize: "0.55rem" }}>
                    {STATUS_META[task.status].label}
                  </span>
                  {assigneeCount > 0 && (
                    <span style={{ fontSize: "0.68rem", color: "var(--muted)" }}>
                      {assigneeCount}p
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
