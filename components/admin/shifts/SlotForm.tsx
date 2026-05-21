"use client";

import { useState } from "react";
import { ShiftGroup, ShiftSlot, SlotFormData } from "@/types/shifts";
import { apiFetch } from "@/lib/api";
import { timeInputToISO, isoToTimeInput } from "@/utils/DateHelpers";

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.45rem 0.7rem",
  border: "1px solid var(--border)",
  borderRadius: "8px",
  background: "var(--bg)",
  color: "var(--text)",
  fontSize: "0.82rem",
  fontFamily: "inherit",
  outline: "none",
  boxSizing: "border-box",
};

interface SlotFormProps {
  eventId: number;
  groupId: number;
  /** Base date used to build ISO strings from time inputs. */
  baseDate: string;
  initial?: ShiftSlot;
  onSaved: (groups: ShiftGroup[]) => void;
  onCancel: () => void;
  onDelete?: () => void;
}

export function SlotForm({ eventId, groupId, baseDate, initial, onSaved, onCancel, onDelete }: Readonly<SlotFormProps>) {
  const [form, setForm] = useState<SlotFormData>({
    title: initial?.title ?? "",
    startTime: isoToTimeInput(initial?.startAt ?? null),
    endTime: isoToTimeInput(initial?.endAt ?? null),
    maxPersons: initial?.maxPersons ?? null,
    isUnlimited: initial?.isUnlimited ?? false,
    description: initial?.description ?? "",
    location: initial?.location ?? "",
    requiredRole: initial?.requiredRole ?? "",
    notes: initial?.notes ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isEdit = !!initial;

  async function save() {
    if (!form.startTime || !form.endTime) return;
    setSaving(true);
    setError("");
    try {
      const payload = {
        title: form.title.trim() || null,
        startAt: timeInputToISO(baseDate, form.startTime),
        endAt: timeInputToISO(baseDate, form.endTime),
        maxPersons: form.isUnlimited ? null : form.maxPersons,
        isUnlimited: form.isUnlimited,
        description: form.description.trim() || null,
        location: form.location.trim() || null,
        requiredRole: form.requiredRole.trim() || null,
        notes: form.notes.trim() || null,
      };

      const url = isEdit
        ? `events/${eventId}/shifts/slots/${initial.id}`
        : `events/${eventId}/shifts/groups/${groupId}/slots`;
      const groups = await apiFetch<ShiftGroup[]>(url, {
        method: isEdit ? "PATCH" : "POST",
        body: JSON.stringify(payload),
      });
      onSaved(groups);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Opslaan mislukt.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{
      background: "var(--bg-alt)",
      border: "1px solid var(--border)",
      borderRadius: "10px",
      padding: "0.875rem",
      display: "grid",
      gap: "0.5rem",
    }}>
      {error && (
        <p style={{ margin: 0, padding: "0.4rem 0.6rem", background: "#fce8e6", color: "#c5221f", borderRadius: "7px", fontSize: "0.78rem" }}>
          {error}
        </p>
      )}

      <input
        autoFocus
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
        placeholder="Naam slot (optioneel)"
        style={inputStyle}
        disabled={saving}
      />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
        <div>
          <label htmlFor="slot-start" style={{ display: "block", fontSize: "0.68rem", color: "var(--ink-2)", marginBottom: "0.2rem" }}>Van *</label>
          <input id="slot-start" type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} style={inputStyle} disabled={saving} />
        </div>
        <div>
          <label htmlFor="slot-end" style={{ display: "block", fontSize: "0.68rem", color: "var(--ink-2)", marginBottom: "0.2rem" }}>Tot *</label>
          <input id="slot-end" type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} style={inputStyle} disabled={saving} />
        </div>
      </div>

      <div>
        <label style={{ display: "block", fontSize: "0.68rem", color: "var(--ink-2)", marginBottom: "0.3rem" }}>Max. personen</label>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <input
            type="number"
            min={1}
            value={form.isUnlimited ? "" : (form.maxPersons ?? "")}
            onChange={(e) => setForm({ ...form, maxPersons: e.target.value ? Number(e.target.value) : null })}
            placeholder="Aantal"
            disabled={saving || form.isUnlimited}
            style={{ ...inputStyle, width: "90px" }}
          />
          <label style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.78rem", color: "var(--text)", cursor: "pointer", userSelect: "none" }}>
            <input
              type="checkbox"
              checked={form.isUnlimited}
              onChange={(e) => setForm({ ...form, isUnlimited: e.target.checked, maxPersons: e.target.checked ? null : form.maxPersons })}
              disabled={saving}
              style={{ cursor: "pointer" }}
            />
            Onbeperkt
          </label>
        </div>
      </div>

      <input
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        placeholder="Beschrijving / instructies (optioneel)"
        style={inputStyle}
        disabled={saving}
      />

      <input
        value={form.location}
        onChange={(e) => setForm({ ...form, location: e.target.value })}
        placeholder="Locatie (optioneel)"
        style={inputStyle}
        disabled={saving}
      />

      <input
        value={form.notes}
        onChange={(e) => setForm({ ...form, notes: e.target.value })}
        placeholder="Publieke notities (bijv. Kom 15 min vroeger)"
        style={inputStyle}
        disabled={saving}
      />

      <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.15rem", alignItems: "center" }}>
        {isEdit && onDelete && (
          <button type="button" className="btn-sm btn-sm--danger" onClick={onDelete} disabled={saving} style={{ fontSize: "0.78rem" }}>
            Verwijderen
          </button>
        )}
        <div style={{ display: "flex", gap: "0.5rem", marginLeft: "auto" }}>
          <button type="button" className="btn-sm btn-sm--ghost" onClick={onCancel} disabled={saving} style={{ fontSize: "0.78rem" }}>
            Annuleren
          </button>
          <button
            type="button"
            className="btn-sm btn-sm--primary"
            onClick={save}
            disabled={saving || !form.startTime || !form.endTime}
            style={{ fontSize: "0.78rem" }}
          >
            {saving ? "Opslaan…" : isEdit ? "Bijwerken" : "Slot toevoegen"}
          </button>
        </div>
      </div>
    </div>
  );
}
