import { IconX } from "@/components/icons";
import { SHIFT_COLORS, STATUS_META } from "@/constants/shifts";
import { apiFetch } from "@/lib/api";
import { Task } from "@/types/shifts";
import { fmtTime } from "@/utils/DateHelpers";
import { useState } from "react";

interface TaskCardProps {
  task: Task;
  eventId: number;
  onEdit: () => void;
  onDelete: () => void;
  onTasksUpdated: (tasks: Task[]) => void;
}

export function TaskCard({ task, eventId, onEdit, onTasksUpdated }: Readonly<TaskCardProps>) {
  const { bar } = SHIFT_COLORS[task.shift];
  const { label: statusLabel, badge: statusBadge } = STATUS_META[task.status];
  const hasTime = task.startAt || task.endAt;
  const assigneeCount = task.assignees?.length ?? 0;
  const isFull = task.maxHelpers !== null && assigneeCount >= task.maxHelpers;
  const [hovered, setHovered] = useState(false);

  async function removeAssignee(assigneeId: number) {
    try {
      const updated = await apiFetch<Task[]>(`events/${eventId}/portal/tasks/${task.id}/assignees/${assigneeId}`, { method: "DELETE" });
      onTasksUpdated(updated);
    } catch { /* ignore */ }
  }

  function capacityLabel(): string {
    if (task.maxHelpers === null) return `${assigneeCount} / ∞`;
    return `${assigneeCount} / ${task.maxHelpers}`;
  }

  function capacityBadge(): string {
    if (isFull) return "badge--green";
    if (assigneeCount > 0) return "badge--yellow";
    return "badge--red";
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onEdit}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onEdit()}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "var(--bg)",
        borderRadius: "10px",
        padding: "0.75rem 1rem",
        borderTop: `1px solid ${hovered ? bar : "var(--border)"}`,
        borderRight: `1px solid ${hovered ? bar : "var(--border)"}`,
        borderBottom: `1px solid ${hovered ? bar : "var(--border)"}`,
        borderLeft: `3px solid ${bar}`,
        cursor: "pointer",
        transition: "border-color 120ms, box-shadow 120ms",
        boxShadow: hovered ? "0 2px 8px rgba(0,0,0,0.07)" : "none",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.5rem" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontWeight: 600, fontSize: "0.875rem", color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {task.title}
          </p>
          {task.description && (
            <p style={{ margin: "0.15rem 0 0", fontSize: "0.75rem", color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {task.description}
            </p>
          )}
          {hasTime && (
            <p style={{ margin: "0.25rem 0 0", fontSize: "0.72rem", color: "var(--muted)", fontFamily: "monospace" }}>
              {fmtTime(task.startAt)}{task.startAt && task.endAt ? " – " : ""}{fmtTime(task.endAt)}
            </p>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.25rem", flexShrink: 0 }}>
          <span className={`badge ${statusBadge}`} style={{ fontSize: "0.58rem" }}>{statusLabel}</span>
          <span className={`badge ${capacityBadge()}`} style={{ fontSize: "0.58rem" }}>{capacityLabel()}</span>
        </div>
      </div>

      {task.assignees?.length > 0 && (
        <div style={{ marginTop: "0.5rem", display: "flex", flexDirection: "column", gap: "0.2rem" }}>
          {task.assignees.map((a) => (
            <div key={a.id} style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.72rem", color: "var(--text-2)" }}>
              <span>👤</span>
              <span style={{ flex: 1 }}>{a.name}{a.email ? ` · ${a.email}` : ""}</span>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeAssignee(a.id); }}
                style={{ background: "none", border: "none", cursor: "pointer", padding: "0.1rem", color: "var(--muted)", lineHeight: 1 }}
                title="Verwijder helper"
              >
                <IconX />
              </button>
            </div>
          ))}
        </div>
      )}

      {task.assignees?.length === 0 && (
        <p style={{ margin: "0.4rem 0 0", fontSize: "0.72rem", color: "var(--muted)", fontStyle: "italic" }}>Geen helpers</p>
      )}

      <p style={{ margin: "0.5rem 0 0", fontSize: "0.65rem", color: "var(--muted)", opacity: 0.6 }}>
        Klik om te bewerken
      </p>
    </div>
  );
}
