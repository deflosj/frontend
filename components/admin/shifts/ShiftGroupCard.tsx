"use client";

import { useState } from "react";
import { ShiftGroup, ShiftSlot } from "@/types/shifts";
import { SLOT_STATUS_META } from "@/constants/shifts";
import { apiFetch } from "@/lib/api";
import { fmtTime } from "@/utils/DateHelpers";
import { IconX, IconEdit, IconTrash } from "@/components/ui/icons";
import { SlotForm } from "./SlotForm";
import { ShiftGroupForm } from "./ShiftGroupForm";

function slotStatus(slot: ShiftSlot): "OPEN" | "ALMOST_FULL" | "FULL" | "CLOSED" {
  if (slot.isClosed || slot.isLocked) return "CLOSED";
  const count = slot.registrations.length;
  if (!slot.isUnlimited && slot.maxPersons !== null) {
    if (count >= slot.maxPersons) return "FULL";
    if (count >= slot.maxPersons * 0.8) return "ALMOST_FULL";
  }
  return "OPEN";
}

function capacityLabel(slot: ShiftSlot): string {
  const count = slot.registrations.length;
  if (slot.isUnlimited) return `${count} / ∞`;
  return `${count} / ${slot.maxPersons ?? "?"}`;
}

interface ShiftGroupCardProps {
  group: ShiftGroup;
  eventId: number;
  baseDate: string;
  onGroupsUpdated: (groups: ShiftGroup[]) => void;
}

export function ShiftGroupCard({ group, eventId, baseDate, onGroupsUpdated }: Readonly<ShiftGroupCardProps>) {
  const [selectedSlotIdx, setSelectedSlotIdx] = useState(0);
  const [addingSlot, setAddingSlot] = useState(false);
  const [editingSlotId, setEditingSlotId] = useState<number | null>(null);
  const [editingGroup, setEditingGroup] = useState(false);
  const [deletingSlotId, setDeletingSlotId] = useState<number | null>(null);

  const color = group.color;
  const slots = group.slots;
  const activeSlot = slots[selectedSlotIdx] ?? slots[0] ?? null;

  async function deleteGroup() {
    if (!confirm(`Groep "${group.name}" verwijderen? Dit verwijdert ook alle slots en registraties.`)) return;
    try {
      const groups = await apiFetch<ShiftGroup[]>(`events/${eventId}/shifts/groups/${group.id}`, { method: "DELETE" });
      onGroupsUpdated(groups);
    } catch { /* ignore */ }
  }

  async function deleteSlot(slotId: number) {
    if (!confirm("Slot verwijderen?")) return;
    setDeletingSlotId(slotId);
    try {
      const groups = await apiFetch<ShiftGroup[]>(`events/${eventId}/shifts/slots/${slotId}`, { method: "DELETE" });
      onGroupsUpdated(groups);
      if (selectedSlotIdx >= (groups.find((g) => g.id === group.id)?.slots.length ?? 0)) {
        setSelectedSlotIdx(0);
      }
    } catch { /* ignore */ } finally {
      setDeletingSlotId(null);
    }
  }

  async function removeRegistration(regId: number) {
    try {
      const groups = await apiFetch<ShiftGroup[]>(`events/${eventId}/shifts/registrations/${regId}`, { method: "DELETE" });
      onGroupsUpdated(groups);
    } catch { /* ignore */ }
  }

  async function toggleLock(slot: ShiftSlot) {
    try {
      const groups = await apiFetch<ShiftGroup[]>(`events/${eventId}/shifts/slots/${slot.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isLocked: !slot.isLocked }),
      });
      onGroupsUpdated(groups);
    } catch { /* ignore */ }
  }

  async function toggleClose(slot: ShiftSlot) {
    try {
      const groups = await apiFetch<ShiftGroup[]>(`events/${eventId}/shifts/slots/${slot.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isClosed: !slot.isClosed }),
      });
      onGroupsUpdated(groups);
    } catch { /* ignore */ }
  }

  return (
    <div style={{
      background: "var(--bg)",
      border: "1px solid var(--border)",
      borderTop: `3px solid ${color}`,
      borderRadius: "10px",
      overflow: "hidden",
    }}>
      {/* Card header */}
      <div style={{ padding: "0.85rem 1rem 0.6rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        {group.icon && <span style={{ fontSize: "1.1rem" }}>{group.icon}</span>}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: "0.95rem", color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {group.name}
          </p>
          {group.description && (
            <p style={{ margin: "0.1rem 0 0", fontSize: "0.72rem", color: "var(--ink-2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {group.description}
            </p>
          )}
        </div>
        <button type="button" onClick={() => setEditingGroup(true)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-2)", padding: "0.2rem" }} title="Bewerken">
          <IconEdit />
        </button>
        <button type="button" onClick={deleteGroup} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-2)", padding: "0.2rem" }} title="Verwijderen">
          <IconTrash />
        </button>
      </div>

      {editingGroup && (
        <div style={{ padding: "0 1rem 0.75rem" }}>
          <ShiftGroupForm
            eventId={eventId}
            initial={group}
            onSaved={(groups) => { onGroupsUpdated(groups); setEditingGroup(false); }}
            onCancel={() => setEditingGroup(false)}
          />
        </div>
      )}

      {/* Slot tabs */}
      {slots.length > 0 && (
        <div style={{ display: "flex", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", overflowX: "auto" }}>
          {slots.map((slot, i) => {
            const status = slotStatus(slot);
            const { badge } = SLOT_STATUS_META[status];
            const isActive = i === selectedSlotIdx;
            return (
              <button
                key={slot.id}
                type="button"
                onClick={() => { setSelectedSlotIdx(i); setEditingSlotId(null); setAddingSlot(false); }}
                style={{
                  padding: "0.45rem 0.75rem",
                  background: isActive ? `${color}18` : "transparent",
                  border: "none",
                  borderBottom: isActive ? `2px solid ${color}` : "2px solid transparent",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontSize: "0.75rem",
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? color : "var(--ink-2)",
                  whiteSpace: "nowrap",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.3rem",
                }}
              >
                {fmtTime(slot.startAt)}–{fmtTime(slot.endAt)}
                <span className={`badge ${badge}`} style={{ fontSize: "0.52rem" }}>
                  {capacityLabel(slot)}
                </span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => { setAddingSlot(true); setEditingSlotId(null); }}
            style={{
              padding: "0.45rem 0.65rem",
              background: "transparent",
              border: "none",
              borderBottom: "2px solid transparent",
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: "0.75rem",
              color: color,
              fontWeight: 500,
              whiteSpace: "nowrap",
              marginLeft: "auto",
            }}
          >
            + Slot
          </button>
        </div>
      )}

      {/* Active slot detail */}
      {activeSlot && !editingSlotId && !addingSlot && (
        <div style={{ padding: "0.75rem 1rem" }}>
          {/* Slot info row */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
            <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text)", fontFamily: "monospace" }}>
              {fmtTime(activeSlot.startAt)} – {fmtTime(activeSlot.endAt)}
            </span>
            {activeSlot.title && <span style={{ fontSize: "0.78rem", color: "var(--text)" }}>· {activeSlot.title}</span>}
            {(() => {
              const status = slotStatus(activeSlot);
              const { label, badge } = SLOT_STATUS_META[status];
              return <span className={`badge ${badge}`} style={{ fontSize: "0.58rem" }}>{label}</span>;
            })()}
            {activeSlot.location && (
              <span style={{ fontSize: "0.72rem", color: "var(--ink-2)" }}>📍 {activeSlot.location}</span>
            )}
            <div style={{ marginLeft: "auto", display: "flex", gap: "0.3rem" }}>
              <button type="button" className="btn-sm btn-sm--ghost" style={{ fontSize: "0.68rem" }} onClick={() => toggleLock(activeSlot)}>
                {activeSlot.isLocked ? "🔒 Unlock" : "🔓 Lock"}
              </button>
              <button type="button" className="btn-sm btn-sm--ghost" style={{ fontSize: "0.68rem" }} onClick={() => toggleClose(activeSlot)}>
                {activeSlot.isClosed ? "Heropenen" : "Sluiten"}
              </button>
              <button type="button" className="btn-sm btn-sm--ghost" style={{ fontSize: "0.68rem" }} onClick={() => setEditingSlotId(activeSlot.id)}>
                Bewerken
              </button>
              <button
                type="button"
                className="btn-sm btn-sm--danger"
                style={{ fontSize: "0.68rem" }}
                disabled={deletingSlotId === activeSlot.id}
                onClick={() => deleteSlot(activeSlot.id)}
              >
                Verwijderen
              </button>
            </div>
          </div>

          {activeSlot.description && (
            <p style={{ margin: "0 0 0.5rem", fontSize: "0.75rem", color: "var(--ink-2)" }}>{activeSlot.description}</p>
          )}
          {activeSlot.notes && (
            <p style={{ margin: "0 0 0.5rem", fontSize: "0.72rem", color: "var(--ink-2)", fontStyle: "italic" }}>📝 {activeSlot.notes}</p>
          )}

          {/* Registrations */}
          {activeSlot.registrations.length === 0 ? (
            <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--ink-2)", fontStyle: "italic" }}>Nog niemand ingeschreven</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
              {activeSlot.registrations.map((r) => (
                <div key={r.id} style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.75rem", color: "var(--text)" }}>
                  <span>👤</span>
                  <span style={{ flex: 1 }}>{r.name}{r.email ? ` · ${r.email}` : ""}</span>
                  <button
                    type="button"
                    onClick={() => removeRegistration(r.id)}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: "0.1rem", color: "var(--ink-2)", lineHeight: 1 }}
                    title="Verwijder inschrijving"
                  >
                    <IconX />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Edit slot form */}
      {editingSlotId !== null && activeSlot && (
        <div style={{ padding: "0.75rem 1rem" }}>
          <SlotForm
            eventId={eventId}
            groupId={group.id}
            baseDate={baseDate}
            initial={activeSlot}
            onSaved={(groups) => { onGroupsUpdated(groups); setEditingSlotId(null); }}
            onCancel={() => setEditingSlotId(null)}
            onDelete={() => deleteSlot(activeSlot.id)}
          />
        </div>
      )}

      {/* Add slot form */}
      {addingSlot && (
        <div style={{ padding: "0.75rem 1rem" }}>
          <SlotForm
            eventId={eventId}
            groupId={group.id}
            baseDate={baseDate}
            onSaved={(groups) => { onGroupsUpdated(groups); setAddingSlot(false); setSelectedSlotIdx(Math.max(0, (groups.find((g) => g.id === group.id)?.slots.length ?? 1) - 1)); }}
            onCancel={() => setAddingSlot(false)}
          />
        </div>
      )}

      {/* No slots yet: show add button */}
      {slots.length === 0 && !addingSlot && (
        <div style={{ padding: "0.75rem 1rem" }}>
          <button
            type="button"
            onClick={() => setAddingSlot(true)}
            style={{
              width: "100%",
              padding: "0.75rem",
              border: `1.5px dashed ${color}`,
              borderRadius: "8px",
              background: "transparent",
              color: color,
              fontSize: "0.78rem",
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            + Shift-slot toevoegen
          </button>
        </div>
      )}
    </div>
  );
}
