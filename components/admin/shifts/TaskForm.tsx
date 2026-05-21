import { SHIFTS, SHIFT_LABELS } from "@/constants/shifts";
import { apiFetch } from "@/lib/api";
import { Shift, Task, TaskFormData, TaskStatus } from "@/types/shifts";
import { timeInputToISO } from "@/utils/DateHelpers";
import { useState } from "react";

interface TaskFormProps {
  eventId: number;
  selectedDay: Date;
  initial: Partial<TaskFormData> & { shift: Shift };
  taskId?: number;
  onSaved: (tasks: Task[]) => void;
  onCancel: () => void;
  onDelete?: () => void;
  hideShift?: boolean;
}

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

function submitLabel(saving: boolean, isEdit: boolean): string {
  if (saving) return "Opslaan…";
  return isEdit ? "Bijwerken" : "Taak toevoegen";
}

export function TaskForm({ eventId, selectedDay, initial, taskId, onSaved, onCancel, onDelete, hideShift }: Readonly<TaskFormProps>) {
  const [form, setForm] = useState<TaskFormData>({
    title: initial.title ?? "",
    description: initial.description ?? "",
    shift: initial.shift,
    startTime: initial.startTime ?? "",
    endTime: initial.endTime ?? "",
    maxHelpers: initial.maxHelpers ?? null,
    status: initial.status ?? "OPEN",
  });
  const [unlimited, setUnlimited] = useState(initial.maxHelpers == null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isEdit = taskId !== undefined;

  async function save() {
    if (!form.title.trim()) return;
    setSaving(true);
    setError("");
    try {
      const payload: Record<string, unknown> = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        shift: form.shift,
        startAt: timeInputToISO(selectedDay.toISOString(), form.startTime),
        endAt: timeInputToISO(selectedDay.toISOString(), form.endTime),
        maxHelpers: unlimited ? null : (form.maxHelpers ?? null),
      };
      if (isEdit) payload.status = form.status;

      await apiFetch(
        `events/${eventId}/portal/tasks${isEdit ? `/${taskId}` : ""}`,
        { method: isEdit ? "PATCH" : "POST", body: JSON.stringify(payload) }
      );
      // Always refetch to get the full up-to-date list
      const updated = await apiFetch<Task[]>(`events/${eventId}/portal/tasks`);
      onSaved(updated);
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
        placeholder="Taaknaam *"
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

      {!hideShift && (
        <select
          value={form.shift}
          onChange={(e) => setForm({ ...form, shift: e.target.value as Shift })}
          style={inputStyle}
          disabled={saving}
        >
          {SHIFTS.map((s) => (
            <option key={s} value={s}>{SHIFT_LABELS[s]}</option>
          ))}
        </select>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
        <div>
          <label htmlFor="tf-start" style={{ display: "block", fontSize: "0.68rem", color: "var(--ink-2)", marginBottom: "0.2rem" }}>Van</label>
          <input id="tf-start" type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} style={inputStyle} disabled={saving} />
        </div>
        <div>
          <label htmlFor="tf-end" style={{ display: "block", fontSize: "0.68rem", color: "var(--ink-2)", marginBottom: "0.2rem" }}>Tot</label>
          <input id="tf-end" type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} style={inputStyle} disabled={saving} />
        </div>
      </div>

      <div>
        <label style={{ display: "block", fontSize: "0.68rem", color: "var(--ink-2)", marginBottom: "0.3rem" }}>
          Max. helpers
        </label>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <input
            type="number"
            min={1}
            value={unlimited ? "" : (form.maxHelpers ?? "")}
            onChange={(e) => setForm({ ...form, maxHelpers: e.target.value ? Number(e.target.value) : null })}
            placeholder="Aantal"
            disabled={saving || unlimited}
            style={{ ...inputStyle, width: "90px" }}
          />
          <label style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.78rem", color: "var(--text)", cursor: "pointer", userSelect: "none" }}>
            <input
              type="checkbox"
              checked={unlimited}
              onChange={(e) => { setUnlimited(e.target.checked); if (e.target.checked) setForm((f) => ({ ...f, maxHelpers: null })); }}
              disabled={saving}
              style={{ cursor: "pointer" }}
            />
            Onbeperkt
          </label>
        </div>
      </div>

      {isEdit && (
        <select
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value as TaskStatus })}
          style={inputStyle}
          disabled={saving}
        >
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">Bezig</option>
          <option value="DONE">Afgerond</option>
        </select>
      )}

      <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.15rem", alignItems: "center" }}>
        {isEdit && onDelete && (
          <button
            type="button"
            className="btn-sm btn-sm--danger"
            onClick={onDelete}
            disabled={saving}
            style={{ fontSize: "0.78rem" }}
          >
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
            disabled={saving || !form.title.trim()}
            style={{ fontSize: "0.78rem" }}
          >
            {submitLabel(saving, isEdit)}
          </button>
        </div>
      </div>
    </div>
  );
}
