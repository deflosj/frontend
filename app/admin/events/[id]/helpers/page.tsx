"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import type { CalEvent } from "@/components/events/event-drawer";
import { IconTrash, IconX } from "@/components/icons";

// ── Types ─────────────────────────────────────────────────────────────────────

type Shift = "SETUP" | "DURING" | "BREAKDOWN";
type TaskStatus = "OPEN" | "IN_PROGRESS" | "DONE";
type RSVPStatus = "NO_RESPONSE" | "YES" | "NO";

interface Task {
  id: number;
  eventId: number;
  title: string;
  description: string | null;
  shift: Shift;
  assignedToId: number | null;
  assignedTo: { id: number; username: string; email: string } | null;
  startAt: string | null;
  endAt: string | null;
  status: TaskStatus;
}

interface Attendee {
  id: number;
  name: string;
  email: string | null;
  status: RSVPStatus;
  user: { id: number; username: string; email: string } | null;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const SHIFTS: Shift[] = ["SETUP", "DURING", "BREAKDOWN"];

const SHIFT_LABELS: Record<Shift, string> = {
  SETUP: "Opbouw",
  DURING: "Tijdens",
  BREAKDOWN: "Afbouw",
};

const STATUS_CLASS: Record<TaskStatus, string> = {
  OPEN: "badge--gray",
  IN_PROGRESS: "badge--yellow",
  DONE: "badge--green",
};

const STATUS_LABEL: Record<TaskStatus, string> = {
  OPEN: "Open",
  IN_PROGRESS: "Bezig",
  DONE: "Klaar",
};

const RSVP_CLASS: Record<RSVPStatus, string> = {
  NO_RESPONSE: "badge--gray",
  YES: "badge--green",
  NO: "badge--red",
};

const RSVP_LABEL: Record<RSVPStatus, string> = {
  NO_RESPONSE: "Geen reactie",
  YES: "Aanwezig",
  NO: "Afwezig",
};

// ── Shared styles ─────────────────────────────────────────────────────────────

const inlineInput: React.CSSProperties = {
  width: "100%",
  padding: "0.4rem 0.6rem",
  border: "1px solid var(--border)",
  borderRadius: "8px",
  background: "var(--bg)",
  color: "var(--text)",
  fontSize: "0.82rem",
  fontFamily: "inherit",
  outline: "none",
};

// ── Task card ─────────────────────────────────────────────────────────────────

interface TaskCardProps {
  task: Task;
  editing: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaved: (updated: Task) => void;
  onDelete: (id: number) => void;
  eventId: number;
}

function TaskCard({ task, editing, onStartEdit, onCancelEdit, onSaved, onDelete, eventId }: Readonly<TaskCardProps>) {
  const [title, setTitle]           = useState(task.title);
  const [description, setDesc]      = useState(task.description ?? "");
  const [startAt, setStartAt]       = useState(task.startAt ? task.startAt.slice(0, 16) : "");
  const [endAt, setEndAt]           = useState(task.endAt ? task.endAt.slice(0, 16) : "");
  const [assignEmail, setEmail]     = useState(task.assignedTo?.email ?? "");
  const [assignName, setName]       = useState(task.assignedTo?.username ?? "");
  const [status, setStatus]         = useState<TaskStatus>(task.status);
  const [saving, setSaving]         = useState(false);
  const [deleting, setDeleting]     = useState(false);
  const [error, setError]           = useState("");

  async function save() {
    if (!title.trim()) return;
    setSaving(true); setError("");
    try {
      const updated = await apiFetch<Task>(`/events/${eventId}/portal/tasks/${task.id}`, {
        method: "PATCH",
        body: JSON.stringify({ title: title.trim(), description: description || null, startAt: startAt || null, endAt: endAt || null, assignEmail: assignEmail || "", assignName, status }),
      });
      if (updated) onSaved(updated);
      onCancelEdit();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Opslaan mislukt.");
    } finally { setSaving(false); }
  }

  async function doDelete() {
    setDeleting(true);
    try {
      await apiFetch(`/events/${eventId}/portal/tasks/${task.id}`, { method: "DELETE" });
      onDelete(task.id);
    } catch { setDeleting(false); }
  }

  if (editing) {
    return (
      <div style={{ background: "var(--bg-alt)", border: "1px solid var(--accent)", borderRadius: "10px", padding: "0.875rem", marginBottom: "0.5rem" }}>
        {error && <p style={{ margin: "0 0 0.5rem", fontSize: "0.78rem", color: "#c5221f" }}>{error}</p>}
        <div style={{ display: "grid", gap: "0.5rem" }}>
          <input style={inlineInput} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Taaknaam *" disabled={saving} />
          <input style={inlineInput} value={description} onChange={(e) => setDesc(e.target.value)} placeholder="Omschrijving (optioneel)" disabled={saving} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
            <input style={inlineInput} type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} disabled={saving} title="Starttijd" />
            <input style={inlineInput} type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} disabled={saving} title="Eindtijd" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
            <input style={inlineInput} value={assignEmail} onChange={(e) => setEmail(e.target.value)} placeholder="E-mail helper" disabled={saving} />
            <input style={inlineInput} value={assignName} onChange={(e) => setName(e.target.value)} placeholder="Naam helper" disabled={saving} />
          </div>
          <select
            style={{ ...inlineInput, cursor: "pointer" }}
            value={status}
            onChange={(e) => setStatus(e.target.value as TaskStatus)}
            disabled={saving}
          >
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">Bezig</option>
            <option value="DONE">Klaar</option>
          </select>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem" }}>
          <button type="button" className="btn-sm btn-sm--primary" onClick={save} disabled={saving || !title.trim()}>
            {saving ? "…" : "Opslaan"}
          </button>
          <button type="button" className="btn-sm btn-sm--ghost" onClick={onCancelEdit} disabled={saving}>
            Annuleren
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        background: task.status === "DONE" ? "color-mix(in srgb, #1e7e34 5%, var(--bg))" : "var(--bg)",
        border: "1px solid var(--border)",
        borderRadius: "10px",
        padding: "0.75rem 0.875rem",
        marginBottom: "0.5rem",
        cursor: "pointer",
      }}
      onClick={onStartEdit}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onStartEdit()}
      aria-label={`Taak bewerken: ${task.title}`}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.5rem" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontWeight: 500, fontSize: "0.875rem", color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {task.title}
          </p>
          {task.assignedTo ? (
            <p style={{ margin: "0.2rem 0 0", fontSize: "0.75rem", color: "var(--accent)", fontWeight: 500 }}>
              @{task.assignedTo.username}
            </p>
          ) : (
            <p style={{ margin: "0.2rem 0 0", fontSize: "0.75rem", color: "var(--muted)" }}>
              Niet toegewezen
            </p>
          )}
          {(task.startAt || task.endAt) && (
            <p style={{ margin: "0.2rem 0 0", fontSize: "0.72rem", color: "var(--muted)", fontFamily: "var(--font-geist-mono), monospace" }}>
              {task.startAt ? new Date(task.startAt).toLocaleTimeString("nl-BE", { hour: "2-digit", minute: "2-digit" }) : ""}
              {task.startAt && task.endAt ? " – " : ""}
              {task.endAt ? new Date(task.endAt).toLocaleTimeString("nl-BE", { hour: "2-digit", minute: "2-digit" }) : ""}
            </p>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexShrink: 0 }}>
          <span className={`badge ${STATUS_CLASS[task.status]}`}>{STATUS_LABEL[task.status]}</span>
          <button
            type="button"
            className="btn-sm btn-sm--danger"
            style={{ padding: "0.25rem 0.4rem" }}
            onClick={(e) => { e.stopPropagation(); doDelete(); }}
            disabled={deleting}
            aria-label="Taak verwijderen"
          >
            <IconTrash />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Add task form ─────────────────────────────────────────────────────────────

interface AddTaskFormProps {
  shift: Shift;
  eventId: number;
  onAdded: (task: Task) => void;
  onCancel: () => void;
}

function AddTaskForm({ shift, eventId, onAdded, onCancel }: Readonly<AddTaskFormProps>) {
  const [title, setTitle]       = useState("");
  const [description, setDesc]  = useState("");
  const [startAt, setStartAt]   = useState("");
  const [endAt, setEndAt]       = useState("");
  const [assignEmail, setEmail] = useState("");
  const [assignName, setName]   = useState("");
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  async function save() {
    if (!title.trim()) return;
    setSaving(true); setError("");
    try {
      const task = await apiFetch<Task>(`/events/${eventId}/portal/tasks`, {
        method: "POST",
        body: JSON.stringify({ title: title.trim(), description: description || null, shift, startAt: startAt || null, endAt: endAt || null, assignEmail: assignEmail || undefined, assignName: assignName || undefined }),
      });
      onAdded(task);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Opslaan mislukt.");
      setSaving(false);
    }
  }

  return (
    <div style={{ background: "var(--bg-alt)", border: "1px dashed var(--accent)", borderRadius: "10px", padding: "0.875rem", marginBottom: "0.5rem" }}>
      {error && <p style={{ margin: "0 0 0.5rem", fontSize: "0.78rem", color: "#c5221f" }}>{error}</p>}
      <div style={{ display: "grid", gap: "0.5rem" }}>
        <input ref={inputRef} style={inlineInput} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Taaknaam *" disabled={saving} onKeyDown={(e) => e.key === "Enter" && save()} />
        <input style={inlineInput} value={description} onChange={(e) => setDesc(e.target.value)} placeholder="Omschrijving (optioneel)" disabled={saving} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
          <input style={inlineInput} type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} disabled={saving} title="Starttijd" />
          <input style={inlineInput} type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} disabled={saving} title="Eindtijd" />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
          <input style={inlineInput} value={assignEmail} onChange={(e) => setEmail(e.target.value)} placeholder="E-mail helper (optioneel)" disabled={saving} />
          <input style={inlineInput} value={assignName} onChange={(e) => setName(e.target.value)} placeholder="Naam helper" disabled={saving} />
        </div>
      </div>
      <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem" }}>
        <button type="button" className="btn-sm btn-sm--primary" onClick={save} disabled={saving || !title.trim()}>
          {saving ? "…" : "Toevoegen"}
        </button>
        <button type="button" className="btn-sm btn-sm--ghost" onClick={onCancel} disabled={saving}>
          Annuleren
        </button>
      </div>
    </div>
  );
}

// ── Shift column ──────────────────────────────────────────────────────────────

interface ShiftColumnProps {
  shift: Shift;
  tasks: Task[];
  eventId: number;
  onTasksChange: (tasks: Task[]) => void;
}

function ShiftColumn({ shift, tasks, eventId, onTasksChange }: Readonly<ShiftColumnProps>) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);

  const assigned = tasks.filter((t) => t.assignedToId !== null).length;
  const allDone = tasks.length > 0 && assigned === tasks.length;

  function handleSaved(updated: Task) {
    onTasksChange(tasks.map((t) => (t.id === updated.id ? updated : t)));
    setEditingId(null);
  }

  function handleDelete(id: number) {
    onTasksChange(tasks.filter((t) => t.id !== id));
  }

  function handleAdded(task: Task) {
    onTasksChange([...tasks, task]);
    setAdding(false);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <h3 style={{ margin: 0, fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text)" }}>
            {SHIFT_LABELS[shift]}
          </h3>
          {tasks.length > 0 && (
            <span
              className={`badge ${allDone ? "badge--green" : assigned > 0 ? "badge--yellow" : "badge--red"}`}
              style={{ fontSize: "0.6rem" }}
            >
              {assigned}/{tasks.length}
            </span>
          )}
        </div>
        {!adding && (
          <button
            type="button"
            className="btn-sm btn-sm--ghost"
            style={{ fontSize: "0.72rem", padding: "0.2rem 0.5rem" }}
            onClick={() => { setAdding(true); setEditingId(null); }}
          >
            + Taak
          </button>
        )}
      </div>

      <div style={{ flex: 1 }}>
        {tasks.length === 0 && !adding && (
          <p style={{ fontSize: "0.78rem", color: "var(--muted)", margin: "0 0 0.5rem" }}>
            Nog geen taken voor deze shift.
          </p>
        )}
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            editing={editingId === task.id}
            onStartEdit={() => { setEditingId(task.id); setAdding(false); }}
            onCancelEdit={() => setEditingId(null)}
            onSaved={handleSaved}
            onDelete={handleDelete}
            eventId={eventId}
          />
        ))}
        {adding && (
          <AddTaskForm shift={shift} eventId={eventId} onAdded={handleAdded} onCancel={() => setAdding(false)} />
        )}
      </div>
    </div>
  );
}

// ── Attendance panel ──────────────────────────────────────────────────────────

function AttendancePanel({ eventId }: Readonly<{ eventId: number }>) {
  const [list, setList]     = useState<Attendee[]>([]);
  const [loading, setLoading] = useState(true);
  const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

  const load = useCallback(async () => {
    try {
      const rows = await apiFetch<Attendee[]>(`/events/${eventId}/portal/attendance`);
      setList(rows);
    } finally { setLoading(false); }
  }, [eventId]);

  useEffect(() => { load(); }, [load]);

  async function updateRsvp(id: number, status: RSVPStatus) {
    try {
      await apiFetch(`/events/${eventId}/portal/attendance/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setList((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    } catch { /* ignore */ }
  }

  async function remove(id: number) {
    try {
      await apiFetch(`/events/${eventId}/portal/attendance/${id}`, { method: "DELETE" });
      setList((prev) => prev.filter((a) => a.id !== id));
    } catch { /* ignore */ }
  }

  const yesCount = list.filter((a) => a.status === "YES").length;

  return (
    <div className="admin-table-wrapper">
      <div className="admin-table-header">
        <div>
          <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 500 }}>Feestje aanwezigen</h2>
          {!loading && (
            <p style={{ margin: "0.1rem 0 0", fontSize: "0.75rem", color: "var(--muted)" }}>
              {yesCount} aanwezig · {list.length} uitgenodigd
            </p>
          )}
        </div>
        <a
          href={`${BASE}/events/${eventId}/portal/export`}
          className="btn-sm btn-sm--ghost"
          style={{ fontSize: "0.75rem" }}
          download
        >
          Exporteer CSV
        </a>
      </div>

      {loading ? (
        <p className="admin-empty">Laden…</p>
      ) : list.length === 0 ? (
        <p className="admin-empty">Nog geen aanwezigen.</p>
      ) : (
        <div style={{ maxHeight: "260px", overflowY: "auto" }}>
          {list.map((a) => (
            <div
              key={a.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.6rem 1.4rem",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: 500, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {a.name}
                </p>
                {a.email && (
                  <p style={{ margin: 0, fontSize: "0.72rem", color: "var(--muted)" }}>{a.email}</p>
                )}
              </div>
              <select
                value={a.status}
                onChange={(e) => updateRsvp(a.id, e.target.value as RSVPStatus)}
                style={{ ...inlineInput, width: "auto", minWidth: "110px", cursor: "pointer" }}
                aria-label={`RSVP status voor ${a.name}`}
              >
                <option value="NO_RESPONSE">Geen reactie</option>
                <option value="YES">Aanwezig</option>
                <option value="NO">Afwezig</option>
              </select>
              <span className={`badge ${RSVP_CLASS[a.status]}`} style={{ flexShrink: 0 }}>
                {RSVP_LABEL[a.status]}
              </span>
              <button
                type="button"
                className="btn-sm btn-sm--danger"
                style={{ padding: "0.25rem 0.4rem", flexShrink: 0 }}
                onClick={() => remove(a.id)}
                aria-label="Verwijder aanwezige"
              >
                <IconX />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Access panel ──────────────────────────────────────────────────────────────

function AccessPanel({ eventId }: Readonly<{ eventId: number }>) {
  const [token, setToken]       = useState<string | null>(null);
  const [generating, setGen]    = useState(false);
  const [copied, setCopied]     = useState(false);
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const inviteUrl = token ? `${origin}/helpers/${token}` : null;

  async function generate() {
    setGen(true);
    try {
      const { token: t } = await apiFetch<{ token: string }>(`/events/${eventId}/portal/invite`, { method: "POST" });
      setToken(t);
    } finally { setGen(false); }
  }

  async function copy() {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="admin-table-wrapper">
      <div className="admin-table-header">
        <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 500 }}>Toegang & Uitnodigingen</h2>
      </div>
      <div style={{ padding: "1.1rem 1.4rem", display: "grid", gap: "1rem" }}>
        <div>
          <button
            type="button"
            className="btn-sm btn-sm--primary"
            onClick={generate}
            disabled={generating}
          >
            {generating ? "Genereren…" : "Nieuwe uitnodigingslink genereren"}
          </button>
          {inviteUrl && (
            <div style={{ marginTop: "0.75rem", display: "grid", gap: "0.4rem" }}>
              <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--muted)" }}>
                Deel deze link met je helpers:
              </p>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <code style={{ flex: 1, padding: "0.4rem 0.6rem", background: "var(--bg-alt)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "0.72rem", color: "var(--text-2)", wordBreak: "break-all" }}>
                  {inviteUrl}
                </code>
                <button type="button" className="btn-sm btn-sm--ghost" onClick={copy} style={{ flexShrink: 0 }}>
                  {copied ? "Gekopieerd!" : "Kopieer"}
                </button>
              </div>
            </div>
          )}
        </div>

        <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
          <p style={{ margin: "0 0 0.6rem", fontSize: "0.75rem", fontWeight: 600, color: "var(--text)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Wie ziet wat?
          </p>
          <div style={{ display: "grid", gap: "0.4rem", fontSize: "0.82rem", color: "var(--text-2)" }}>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <span className="badge badge--pink" style={{ flexShrink: 0 }}>Admin</span>
              <span>Alle taken beheren, aanwezigenlijst, uitnodigingen genereren, CSV exporteren.</span>
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <span className="badge badge--blue" style={{ flexShrink: 0 }}>Helper</span>
              <span>Taken bekijken en claimen via de uitnodigingslink. Geen privé-informatie zichtbaar.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function EventHelpersPage({
  params,
}: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = use(params);
  const eventId = Number.parseInt(id, 10);

  const [event, setEvent]   = useState<CalEvent | null>(null);
  const [tasks, setTasks]   = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  useEffect(() => {
    Promise.all([
      apiFetch<CalEvent>(`/content/events/${eventId}`),
      apiFetch<Task[]>(`/events/${eventId}/portal/tasks`),
    ])
      .then(([ev, ts]) => { setEvent(ev); setTasks(ts); })
      .catch((err) => setFetchError(err instanceof Error ? err.message : "Laden mislukt."))
      .finally(() => setLoading(false));
  }, [eventId]);

  if (loading) return <p className="admin-empty">Laden…</p>;
  if (fetchError) return <p className="admin-empty" style={{ color: "var(--accent)" }}>{fetchError}</p>;
  if (!event) return null;

  const totalTasks    = tasks.length;
  const assignedTasks = tasks.filter((t) => t.assignedToId !== null).length;

  return (
    <>
      {/* Back + header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <Link
          href="/admin/events"
          style={{ fontSize: "0.8rem", color: "var(--muted)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.3rem", marginBottom: "0.75rem" }}
        >
          ← Alle events
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 500, letterSpacing: "-0.03em", color: "var(--text)" }}>
            {event.title}
          </h1>
          <span className="badge badge--pink">Helpers</span>
          {totalTasks > 0 && (
            <span className={`badge ${assignedTasks === totalTasks ? "badge--green" : assignedTasks > 0 ? "badge--yellow" : "badge--red"}`}>
              {assignedTasks}/{totalTasks} taken toegewezen
            </span>
          )}
        </div>
        {event.location && (
          <p style={{ margin: "0.35rem 0 0", fontSize: "0.875rem", color: "var(--muted)" }}>
            {event.location} · {new Date(event.startsAt).toLocaleDateString("nl-BE", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        )}
      </div>

      {/* Three-panel layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: "1.5rem", alignItems: "start" }}>

        {/* Left: shift planning board */}
        <div className="admin-table-wrapper" style={{ overflow: "visible" }}>
          <div className="admin-table-header">
            <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 500 }}>Takenbord per shift</h2>
            <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--muted)" }}>
              Klik op een taak om te bewerken
            </p>
          </div>
          <div style={{ padding: "1.25rem 1.4rem", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.5rem" }}>
            {SHIFTS.map((shift) => (
              <ShiftColumn
                key={shift}
                shift={shift}
                tasks={tasks.filter((t) => t.shift === shift)}
                eventId={eventId}
                onTasksChange={(updated) =>
                  setTasks((prev) => [
                    ...prev.filter((t) => t.shift !== shift),
                    ...updated,
                  ])
                }
              />
            ))}
          </div>
        </div>

        {/* Right: attendance + access stacked */}
        <div style={{ display: "grid", gap: "1.5rem" }}>
          <AttendancePanel eventId={eventId} />
          <AccessPanel eventId={eventId} />
        </div>
      </div>
    </>
  );
}
