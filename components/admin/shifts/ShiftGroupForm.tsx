"use client";

import { useState } from "react";
import { ShiftGroup, ShiftGroupFormData } from "@/types/shifts";
import { DEFAULT_GROUP_COLORS } from "@/constants/shifts";
import { apiFetch } from "@/lib/api";

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

interface ShiftGroupFormProps {
  eventId: number;
  initial?: ShiftGroup;
  onSaved: (groups: ShiftGroup[]) => void;
  onCancel: () => void;
}

export function ShiftGroupForm({ eventId, initial, onSaved, onCancel }: Readonly<ShiftGroupFormProps>) {
  const [form, setForm] = useState<ShiftGroupFormData>({
    name: initial?.name ?? "",
    description: initial?.description ?? "",
    color: initial?.color ?? DEFAULT_GROUP_COLORS[0],
    icon: initial?.icon ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isEdit = !!initial;

  async function save() {
    if (!form.name.trim()) return;
    setSaving(true);
    setError("");
    try {
      const url = isEdit
        ? `events/${eventId}/shifts/groups/${initial.id}`
        : `events/${eventId}/shifts/groups`;
      const groups = await apiFetch<ShiftGroup[]>(url, {
        method: isEdit ? "PATCH" : "POST",
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim() || null,
          color: form.color,
          icon: form.icon.trim() || null,
        }),
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
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        placeholder="Naam van de groep *"
        style={inputStyle}
        onKeyDown={(e) => e.key === "Enter" && save()}
        disabled={saving}
      />

      <input
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        placeholder="Beschrijving (optioneel)"
        style={inputStyle}
        disabled={saving}
      />

      <input
        value={form.icon}
        onChange={(e) => setForm({ ...form, icon: e.target.value })}
        placeholder="Icoon (emoji, bijv. 🍺)"
        style={inputStyle}
        disabled={saving}
      />

      <div>
        <label style={{ display: "block", fontSize: "0.68rem", color: "var(--ink-2)", marginBottom: "0.3rem" }}>Kleur</label>
        <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
          {DEFAULT_GROUP_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setForm({ ...form, color: c })}
              style={{
                width: "24px",
                height: "24px",
                borderRadius: "50%",
                background: c,
                border: form.color === c ? "3px solid var(--text)" : "2px solid transparent",
                cursor: "pointer",
                padding: 0,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          ))}
          <input
            type="color"
            value={form.color}
            onChange={(e) => setForm({ ...form, color: e.target.value })}
            style={{ width: "24px", height: "24px", border: "none", padding: 0, cursor: "pointer", borderRadius: "50%" }}
            title="Aangepaste kleur"
          />
        </div>
      </div>

      <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.15rem", justifyContent: "flex-end" }}>
        <button type="button" className="btn-sm btn-sm--ghost" onClick={onCancel} disabled={saving} style={{ fontSize: "0.78rem" }}>
          Annuleren
        </button>
        <button
          type="button"
          className="btn-sm btn-sm--primary"
          onClick={save}
          disabled={saving || !form.name.trim()}
          style={{ fontSize: "0.78rem" }}
        >
          {saving ? "Opslaan…" : isEdit ? "Bijwerken" : "Groep toevoegen"}
        </button>
      </div>
    </div>
  );
}
