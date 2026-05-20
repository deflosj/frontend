// ── Shift column ──────────────────────────────────────────────────────────────

import { apiFetch } from "@/lib/api";
import { Shift, Task } from "@/types/shifts";
import { taskMatchesDay, isoToTimeInput } from "@/utils/DateHelpers";
import { useState } from "react";
import { TaskForm } from "./TaskForm";
import { SHIFT_COLORS, SHIFT_LABELS } from "@/constants/shifts";
import { TaskCard } from "./TaskCard";

interface ShiftColumnProps {
  shift: Shift;
  tasks: Task[];
  eventId: number;
  selectedDay: Date;
  onTasksUpdated: (tasks: Task[]) => void;
}

export function ShiftColumn({ shift, tasks, eventId, selectedDay, onTasksUpdated }: Readonly<ShiftColumnProps>) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const { bar, bg, border } = SHIFT_COLORS[shift];
  const shiftTasks = tasks.filter((t) => t.shift === shift && taskMatchesDay(t, selectedDay));
  const filled = shiftTasks.reduce((acc, t) => acc + (t.assignees?.length ?? 0), 0);
  const capacity = shiftTasks.reduce<number | null>((acc, t) => {
    if (acc === null || t.maxHelpers === null) return null;
    return acc + t.maxHelpers;
  }, 0);

  async function deleteTask(id: number) {
    if (!confirm("Taak verwijderen?")) return;
    try {
      await apiFetch(`events/${eventId}/portal/tasks/${id}`, { method: "DELETE" });
      const updated = await apiFetch<Task[]>(`events/${eventId}/portal/tasks`);
      onTasksUpdated(updated);
    } catch { /* ignore */ }
  }

  function countBadge(): string {
    if (shiftTasks.length === 0) return "badge--gray";
    if (capacity !== null && filled >= capacity) return "badge--green";
    if (filled > 0) return "badge--yellow";
    return "badge--red";
  }

  function countLabel(): string {
    if (capacity === null) return `${filled} / ∞`;
    return `${filled} / ${capacity}`;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", paddingBottom: "0.5rem", borderBottom: `2px solid ${bar}` }}>
        <span style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text)" }}>
          {SHIFT_LABELS[shift]}
        </span>
        <span className={`badge ${countBadge()}`} style={{ fontSize: "0.58rem" }}>
          {countLabel()}
        </span>
      </div>

      {shiftTasks.length === 0 && !adding && (
        <div style={{
          padding: "1.5rem 1rem",
          border: `1.5px dashed ${border}`,
          borderRadius: "10px",
          background: bg,
          textAlign: "center",
        }}>
          <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--muted)" }}>Nog geen taken</p>
        </div>
      )}

      {shiftTasks.map((task) =>
        editingId === task.id ? (
          <TaskForm
            key={task.id}
            eventId={eventId}
            selectedDay={selectedDay}
            taskId={task.id}
            hideShift
            initial={{
              title: task.title,
              description: task.description ?? "",
              shift,
              startTime: isoToTimeInput(task.startAt),
              endTime: isoToTimeInput(task.endAt),
              maxHelpers: task.maxHelpers,
              status: task.status,
            }}
            onSaved={(updated) => { onTasksUpdated(updated); setEditingId(null); }}
            onCancel={() => setEditingId(null)}
            onDelete={() => deleteTask(task.id)}
          />
        ) : (
          <TaskCard
            key={task.id}
            task={task}
            eventId={eventId}
            onEdit={() => setEditingId(task.id)}
            onDelete={() => deleteTask(task.id)}
            onTasksUpdated={onTasksUpdated}
          />
        )
      )}

      {adding && (
        <TaskForm
          eventId={eventId}
          selectedDay={selectedDay}
          hideShift
          initial={{ shift }}
          onSaved={(updated) => { onTasksUpdated(updated); setAdding(false); }}
          onCancel={() => setAdding(false)}
        />
      )}

      {!adding && (
        <button
          type="button"
          onClick={() => setAdding(true)}
          style={{
            padding: "0.5rem",
            border: `1.5px dashed ${border}`,
            borderRadius: "8px",
            background: "transparent",
            color: bar,
            fontSize: "0.78rem",
            fontWeight: 500,
            cursor: "pointer",
            fontFamily: "inherit",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.3rem",
            transition: "background 120ms",
          }}
        >
          + Taak toevoegen
        </button>
      )}
    </div>
  );
}
