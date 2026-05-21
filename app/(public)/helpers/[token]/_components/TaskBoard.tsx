"use client";

import { useState } from "react";
import { fmtTime } from "@/utils/DateHelpers";
import { SLOT_STATUS_META } from "@/constants/shifts";
import type { ShiftGroup, ShiftSlot, SlotStatus } from "@/types/shifts";

function getSlotStatus(slot: ShiftSlot): SlotStatus {
  if (slot.isClosed || slot.isLocked) return "CLOSED";
  const count = slot.registrations.length;
  if (!slot.isUnlimited && slot.maxPersons !== null) {
    if (count >= slot.maxPersons) return "FULL";
    if (count >= slot.maxPersons * 0.8) return "ALMOST_FULL";
  }
  return "OPEN";
}

function spotsLabel(slot: ShiftSlot): string {
  const count = slot.registrations.length;
  if (slot.isClosed) return "Gesloten";
  if (slot.isLocked) return "Vergrendeld";
  if (slot.isUnlimited || slot.maxPersons === null) {
    return count === 0 ? "Open" : `${count} ingeschreven`;
  }
  const left = slot.maxPersons - count;
  if (left <= 0) return "Vol";
  return `${left} plek${left === 1 ? "" : "ken"} vrij`;
}

// ── Slot item ─────────────────────────────────────────────────────────────────

interface SlotItemProps {
  slot: ShiftSlot;
  group: ShiftGroup;
  onRegister: () => void;
}

function SlotItem({ slot, group, onRegister }: Readonly<SlotItemProps>) {
  const status = getSlotStatus(slot);
  const { label: statusLabel, badge } = SLOT_STATUS_META[status];
  const isOpen = status === "OPEN" || status === "ALMOST_FULL";
  const regCount = slot.registrations.length;

  return (
    <div
      className={`p-4 px-5 border rounded-[0.875rem] ${status === "FULL" ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30" : "border-rule bg-surface"}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="m-0 font-semibold text-[0.975rem] text-ink font-mono">
            {fmtTime(slot.startAt)} – {fmtTime(slot.endAt)}
            {slot.title && <span className="font-sans font-normal ml-2 text-ink-2">· {slot.title}</span>}
          </p>
          {slot.description && (
            <p className="mt-0.5 m-0 text-[0.82rem] text-ink-2">{slot.description}</p>
          )}
          {slot.location && (
            <p className="mt-0.5 m-0 text-[0.78rem] text-ink-2">📍 {slot.location}</p>
          )}
          {slot.notes && (
            <p className="mt-1 m-0 text-[0.78rem] text-ink-2 italic">{slot.notes}</p>
          )}
          {regCount > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {slot.registrations.map((r) => (
                <span
                  key={r.id}
                  className="py-0.5 px-2 bg-green-100 text-green-700 rounded-full text-[0.75rem] font-medium dark:bg-green-900/50 dark:text-green-300"
                >
                  ✓ {r.name}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="shrink-0 flex flex-col items-end gap-1.5">
          <span className={`badge ${badge}`} style={{ fontSize: "0.65rem" }}>{statusLabel}</span>
          {!slot.isUnlimited && slot.maxPersons !== null && (
            <span className="text-[0.72rem] font-semibold py-0.5 px-2 rounded-full bg-muted text-ink-2">
              {regCount}/{slot.maxPersons}
            </span>
          )}

          {isOpen ? (
            <button
              type="button"
              onClick={onRegister}
              className="py-2 px-4 rounded-lg border-0 text-paper text-[0.82rem] font-medium cursor-pointer font-[inherit] whitespace-nowrap"
              style={{ background: group.color }}
            >
              Inschrijven
            </button>
          ) : (
            <span className="py-1.5 px-3 rounded-lg bg-muted/50 text-ink-2 text-[0.78rem] font-semibold">
              {spotsLabel(slot)}
            </span>
          )}

          <span className="text-[0.72rem] text-ink-2">{spotsLabel(slot)}</span>
        </div>
      </div>
    </div>
  );
}

// ── Group card ────────────────────────────────────────────────────────────────

interface GroupCardProps {
  group: ShiftGroup;
  onRegister: (slot: ShiftSlot) => void;
}

function GroupCard({ group, onRegister }: Readonly<GroupCardProps>) {
  const [selectedSlotIdx, setSelectedSlotIdx] = useState(0);
  const slots = group.slots;
  const activeSlot = slots[selectedSlotIdx] ?? slots[0] ?? null;

  if (slots.length === 0) return null;

  const totalRegistrations = slots.reduce((acc, s) => acc + s.registrations.length, 0);
  const totalCapacity = slots.reduce<number | null>((acc, s) => {
    if (acc === null || s.isUnlimited || s.maxPersons === null) return null;
    return acc + s.maxPersons;
  }, 0);
  const capacityStr = totalCapacity === null ? `${totalRegistrations} ingeschreven` : `${totalRegistrations}/${totalCapacity} ingevuld`;

  return (
    <div className="rounded-[1rem] border border-rule overflow-hidden" style={{ borderTop: `3px solid ${group.color}` }}>
      {/* Header */}
      <div className="px-5 pt-4 pb-3 flex items-center gap-2.5">
        {group.icon && <span className="text-[1.2rem]">{group.icon}</span>}
        <div className="flex-1 min-w-0">
          <h2 className="m-0 text-base font-bold text-ink">{group.name}</h2>
          {group.description && (
            <p className="m-0 text-[0.78rem] text-ink-2">{group.description}</p>
          )}
        </div>
        <span className="text-[0.72rem] text-ink-2">{capacityStr}</span>
      </div>

      {/* Slot tabs (only shown if multiple slots) */}
      {slots.length > 1 && (
        <div className="flex border-t border-b border-rule overflow-x-auto">
          {slots.map((slot, i) => {
            const status = getSlotStatus(slot);
            const { badge } = SLOT_STATUS_META[status];
            const isActive = i === selectedSlotIdx;
            return (
              <button
                key={slot.id}
                type="button"
                onClick={() => setSelectedSlotIdx(i)}
                className="px-3 py-2 border-none cursor-pointer font-[inherit] text-[0.75rem] whitespace-nowrap flex items-center gap-1.5"
                style={{
                  background: isActive ? `${group.color}15` : "transparent",
                  borderBottom: isActive ? `2px solid ${group.color}` : "2px solid transparent",
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? group.color : "var(--ink-2, #64748b)",
                }}
              >
                {fmtTime(slot.startAt)}–{fmtTime(slot.endAt)}
                <span className={`badge ${badge}`} style={{ fontSize: "0.5rem" }}>
                  {slot.registrations.length}{slot.maxPersons ? `/${slot.maxPersons}` : ""}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Active slot */}
      {activeSlot && (
        <div className="p-4">
          <SlotItem slot={activeSlot} group={group} onRegister={() => onRegister(activeSlot)} />
        </div>
      )}
    </div>
  );
}

// ── Main board ────────────────────────────────────────────────────────────────

interface TaskBoardProps {
  groups: ShiftGroup[];
  onRegister: (slot: ShiftSlot, group: ShiftGroup) => void;
}

export function TaskBoard({ groups, onRegister }: Readonly<TaskBoardProps>) {
  const visibleGroups = groups.filter((g) => g.slots.length > 0);

  if (visibleGroups.length === 0) {
    return (
      <p className="text-center text-ink-2 text-[0.9rem] py-8">
        Er zijn nog geen shifts aangemaakt voor dit event.
      </p>
    );
  }

  return (
    <div className="grid gap-6">
      {visibleGroups.map((group) => (
        <GroupCard
          key={group.id}
          group={group}
          onRegister={(slot) => onRegister(slot, group)}
        />
      ))}
    </div>
  );
}
