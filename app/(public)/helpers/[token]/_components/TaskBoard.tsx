"use client";

import { useState } from "react";
import { fmtTime, getEventDays, taskMatchesDay } from "@/utils/DateHelpers";
import { SHIFTS, SHIFT_LABELS } from "@/constants/shifts";
import type { Task } from "@/types/shifts";

interface TaskBoardEvent {
  startsAt: string;
  endsAt: string | null;
}

// ── Task card ─────────────────────────────────────────────────────────────────

interface TaskItemProps {
  task: Task;
  onClaim: () => void;
}

function TaskItem({ task, onClaim }: Readonly<TaskItemProps>) {
  const assigneeCount = task.assignees?.length ?? 0;
  const isFull = task.maxHelpers !== null && assigneeCount >= task.maxHelpers;

  function spotsLabel(): string {
    if (task.maxHelpers === null) {
      return assigneeCount === 0 ? "Open" : `${assigneeCount} helper${assigneeCount > 1 ? "s" : ""}`;
    }
    const left = task.maxHelpers - assigneeCount;
    if (left <= 0) return "Vol";
    return `${left} plek${left === 1 ? "" : "ken"} vrij`;
  }

  return (
    <div className={`p-4 px-5 border rounded-[0.875rem] ${isFull ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30" : "border-rule bg-surface"}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="m-0 font-semibold text-[0.975rem] text-ink">
            {task.title}
          </p>
          {task.description && (
            <p className="mt-0.5 m-0 text-[0.82rem] text-ink-2">
              {task.description}
            </p>
          )}
          {(task.startAt || task.endAt) && (
            <p className="mt-1 m-0 text-[0.78rem] text-ink-2 font-mono">
              {fmtTime(task.startAt)}{task.startAt && task.endAt ? " – " : ""}{fmtTime(task.endAt)}
            </p>
          )}

          {task.assignees?.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {task.assignees.map((a) => (
                <span
                  key={a.id}
                  className="py-0.5 px-2 bg-green-100 text-green-700 rounded-full text-[0.75rem] font-medium dark:bg-green-900/50 dark:text-green-300"
                >
                  ✓ {a.name}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="shrink-0 flex flex-col items-end gap-1.5">
          {task.maxHelpers !== null && (
            <span className={`text-[0.72rem] font-semibold py-0.5 px-2 rounded-full ${isFull ? "bg-green-200 text-green-700 dark:bg-green-900 dark:text-green-300" : "bg-muted text-ink-2"}`}>
              {assigneeCount}/{task.maxHelpers}
            </span>
          )}

          {!isFull ? (
            <button
              type="button"
              onClick={onClaim}
              className="py-2 px-4 rounded-lg border-0 bg-ink text-paper text-[0.82rem] font-medium cursor-pointer font-[inherit] whitespace-nowrap"
            >
              Taak overnemen
            </button>
          ) : (
            <span className="py-1.5 px-3 rounded-lg bg-green-200 text-green-700 text-[0.78rem] font-semibold dark:bg-green-900 dark:text-green-300">
              Vol
            </span>
          )}

          <span className="text-[0.72rem] text-ink-2">{spotsLabel()}</span>
        </div>
      </div>
    </div>
  );
}

// ── Task board ─────────────────────────────────────────────────────────────────

interface TaskBoardProps {
  tasks: Task[];
  event: TaskBoardEvent;
  onClaim: (task: Task) => void;
}

export function TaskBoard({ tasks, event, onClaim }: Readonly<TaskBoardProps>) {
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);

  const days = getEventDays(event.startsAt, event.endsAt);
  const selectedDay = days[selectedDayIdx] ?? days[0];

  return (
    <>
      {days.length > 1 && (
        <div className="flex gap-2 mb-6 flex-wrap">
          {days.map((day, i) => {
            const isActive = i === selectedDayIdx;
            const label = day.toLocaleDateString("nl-BE", { weekday: "short", day: "numeric", month: "short" });
            return (
              <button
                key={day.toISOString()}
                type="button"
                onClick={() => setSelectedDayIdx(i)}
                className={`px-4 py-1.5 rounded-full border-2 text-[0.82rem] cursor-pointer font-[inherit] transition-colors ${
                  isActive
                    ? "border-ink bg-ink text-paper font-semibold"
                    : "border-rule bg-transparent text-ink-2"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}

      <div className="grid gap-8">
        {SHIFTS.map((shift) => {
          const shiftTasks = tasks.filter((t) => t.shift === shift && taskMatchesDay(t, selectedDay));
          if (shiftTasks.length === 0) return null;
          const filled = shiftTasks.reduce((acc, t) => acc + (t.assignees?.length ?? 0), 0);
          const capacity = shiftTasks.reduce<number | null>((acc, t) => {
            if (acc === null || t.maxHelpers === null) return null;
            return acc + t.maxHelpers;
          }, 0);
          const capacityLabel = capacity === null
            ? `${filled} helper${filled !== 1 ? "s" : ""}`
            : `${filled}/${capacity} ingevuld`;

          return (
            <div key={shift}>
              <h2 className="mb-4 text-base font-bold tracking-[0.06em] uppercase text-ink">
                {SHIFT_LABELS[shift]}
                <span className="ml-2.5 text-[0.72rem] font-normal text-ink-2 normal-case tracking-normal">
                  ({capacityLabel})
                </span>
              </h2>
              <div className="grid gap-3">
                {shiftTasks.map((task) => (
                  <TaskItem key={task.id} task={task} onClaim={() => onClaim(task)} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
