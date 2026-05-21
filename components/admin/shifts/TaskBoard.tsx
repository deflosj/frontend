import { CalEvent } from "@/components/admin/events/event-drawer";
import { SHIFTS } from "@/constants/shifts";
import { Task } from "@/types/shifts";
import { getEventDays, taskMatchesDay, fmtDayTab } from "@/utils/DateHelpers";
import { useState } from "react";
import { ShiftColumn } from "./ShiftColumn";

interface TaskBoardProps {
  tasks: Task[];
  eventId: number;
  event: CalEvent;
  onTasksUpdated: (tasks: Task[]) => void;
}

export function TaskBoard({ tasks, eventId, event, onTasksUpdated }: Readonly<TaskBoardProps>) {
  const days = getEventDays(event.startsAt, event.endsAt);
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const selectedDay = days[selectedDayIdx] ?? days[0];

  const tasksList = Array.isArray(tasks) ? tasks : [];
  const total = tasksList.length;
  const assigned = tasksList.reduce((acc, t) => acc + (t.assignees?.length ?? 0), 0);
  const done = tasksList.filter((t) => t.status === "DONE").length;

  return (
    <div>
      {/* Summary strip */}
      {total > 0 && (
        <div style={{
          display: "flex",
          gap: "1.5rem",
          padding: "0.75rem 1.4rem",
          borderBottom: "1px solid var(--border)",
          background: "var(--bg-alt)",
          fontSize: "0.78rem",
          color: "var(--ink-2)",
        }}>
          <span><strong style={{ color: "var(--text)" }}>{total}</strong> taken</span>
          <span><strong style={{ color: "var(--text)" }}>{assigned}</strong> toegewezen</span>
          <span><strong style={{ color: "var(--text)" }}>{done}</strong> afgerond</span>
        </div>
      )}

      {/* Day tabs — only shown for multi-day events */}
      {days.length > 1 && (
        <div style={{
          display: "flex",
          gap: "0.5rem",
          padding: "0.75rem 1.4rem",
          borderBottom: "1px solid var(--border)",
          overflowX: "auto",
          flexWrap: "wrap",
        }}>
          {days.map((day, i) => {
            const dayTasks = tasksList.filter((t) => taskMatchesDay(t, day));
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
                {dayTasks.length > 0 && (
                  <span style={{
                    background: isActive ? "rgba(255,255,255,0.25)" : "var(--border)",
                    color: isActive ? "var(--bg)" : "var(--ink-2)",
                    borderRadius: "999px",
                    padding: "0 0.35rem",
                    fontSize: "0.65rem",
                    fontWeight: 700,
                  }}>
                    {dayTasks.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Three-column board */}
      <div style={{
        padding: "1.25rem 1.4rem",
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        gap: "1.5rem",
        alignItems: "start",
      }}>
        {SHIFTS.map((shift) => (
          <ShiftColumn
            key={shift}
            shift={shift}
            tasks={tasksList}
            eventId={eventId}
            selectedDay={selectedDay}
            onTasksUpdated={onTasksUpdated}
          />
        ))}
      </div>
    </div>
  );
}