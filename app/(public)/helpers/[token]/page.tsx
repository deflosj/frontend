"use client";

import { use, useEffect, useRef, useState } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

type Shift = "SETUP" | "DURING" | "BREAKDOWN";
type TaskStatus = "OPEN" | "IN_PROGRESS" | "DONE";
type RSVPStatus = "NO_RESPONSE" | "YES" | "NO";

interface TaskAssignee {
  id: number;
  name: string;
  email: string | null;
}

interface Task {
  id: number;
  eventId: number;
  title: string;
  description: string | null;
  shift: Shift;
  maxHelpers: number | null;
  assignees: TaskAssignee[];
  startAt: string | null;
  endAt: string | null;
  status: TaskStatus;
}

interface PortalEvent {
  id: number;
  title: string;
  description: string | null;
  location: string | null;
  startsAt: string;
  endsAt: string | null;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const SHIFTS: Shift[] = ["SETUP", "DURING", "BREAKDOWN"];

const SHIFT_LABELS: Record<Shift, string> = {
  SETUP: "Opbouw",
  DURING: "Tijdens",
  BREAKDOWN: "Afbouw",
};

const BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api").replace(/\/$/, "");

// ── Utilities ─────────────────────────────────────────────────────────────────

function fmtTime(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("nl-BE", { hour: "2-digit", minute: "2-digit" });
}

function getEventDays(startsAt: string, endsAt: string | null): Date[] {
  const start = new Date(startsAt);
  start.setHours(0, 0, 0, 0);
  const end = endsAt ? new Date(endsAt) : new Date(startsAt);
  end.setHours(0, 0, 0, 0);
  const days: Date[] = [];
  const cur = new Date(start);
  while (cur <= end) {
    days.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

function taskMatchesDay(task: Task, day: Date): boolean {
  if (!task.startAt) return true; // timeless tasks show on every day
  const d = new Date(task.startAt);
  return (
    d.getFullYear() === day.getFullYear() &&
    d.getMonth() === day.getMonth() &&
    d.getDate() === day.getDate()
  );
}

// ── Claim modal ───────────────────────────────────────────────────────────────

interface ClaimFormProps {
  task: Task;
  token: string;
  onClaimed: (taskId: number, assigneeName: string) => void;
  onCancel: () => void;
}

function ClaimForm({ task, token, onClaimed, onCancel }: Readonly<ClaimFormProps>) {
  const [name, setName]   = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => { nameRef.current?.focus(); }, []);

  async function claim() {
    if (!name.trim()) return;
    setSaving(true); setError("");
    try {
      const res = await fetch(
        `${BASE}/events/${task.eventId}/portal/tasks/${task.id}/claim?token=${encodeURIComponent(token)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim(), email: email.trim() || undefined }),
        }
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      onClaimed(task.id, name.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Overnemen mislukt.");
    } finally { setSaving(false); }
  }

  const spotsLeft = task.maxHelpers === null ? null : task.maxHelpers - task.assignees.length;

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 50,
      display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem",
    }}>
      <div style={{
        background: "var(--paper, #fff)", borderRadius: "1rem", padding: "2rem",
        width: "min(420px, 100%)", boxShadow: "0 8px 32px rgba(0,0,0,0.16)",
      }}>
        <h2 style={{ margin: "0 0 0.35rem", fontSize: "1.2rem", fontWeight: 600, color: "var(--ink, #1a1a1a)" }}>
          Taak overnemen
        </h2>
        <p style={{ margin: "0 0 0.4rem", fontSize: "0.9rem", color: "var(--ink-2, #666)" }}>
          <strong style={{ color: "var(--ink, #1a1a1a)" }}>{task.title}</strong> — vul je gegevens in.
        </p>
        {spotsLeft !== null && (
          <p style={{ margin: "0 0 1.25rem", fontSize: "0.8rem", color: "#888" }}>
            Nog {spotsLeft} {spotsLeft === 1 ? "plek" : "plekken"} beschikbaar
          </p>
        )}

        {error && (
          <p style={{ margin: "0 0 1rem", padding: "0.6rem 0.875rem", borderRadius: "8px", background: "#fce8e6", color: "#c5221f", fontSize: "0.85rem" }}>
            {error}
          </p>
        )}

        <div style={{ display: "grid", gap: "0.75rem", marginBottom: "1.25rem" }}>
          <div>
            <label htmlFor="claim-name" style={{ display: "block", fontSize: "0.8rem", fontWeight: 500, color: "var(--ink-2, #666)", marginBottom: "0.3rem" }}>
              Naam *
            </label>
            <input
              id="claim-name"
              ref={nameRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jouw naam"
              disabled={saving}
              onKeyDown={(e) => e.key === "Enter" && claim()}
              style={{ width: "100%", padding: "0.6rem 0.875rem", border: "1px solid #ddd", borderRadius: "10px", fontSize: "0.9rem", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
            />
          </div>
          <div>
            <label htmlFor="claim-email" style={{ display: "block", fontSize: "0.8rem", fontWeight: 500, color: "var(--ink-2, #666)", marginBottom: "0.3rem" }}>
              E-mail (optioneel)
            </label>
            <input
              id="claim-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jij@voorbeeld.be"
              disabled={saving}
              style={{ width: "100%", padding: "0.6rem 0.875rem", border: "1px solid #ddd", borderRadius: "10px", fontSize: "0.9rem", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button
            type="button"
            onClick={claim}
            disabled={saving || !name.trim()}
            style={{ flex: 1, padding: "0.6rem", borderRadius: "8px", border: "none", background: "#1a1a1a", color: "#fff", fontSize: "0.9rem", fontWeight: 500, cursor: "pointer", fontFamily: "inherit", opacity: saving || !name.trim() ? 0.5 : 1 }}
          >
            {saving ? "Bezig…" : "Taak overnemen"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            style={{ padding: "0.6rem 1rem", borderRadius: "8px", border: "1px solid #ddd", background: "transparent", fontSize: "0.9rem", cursor: "pointer", fontFamily: "inherit" }}
          >
            Annuleren
          </button>
        </div>
      </div>
    </div>
  );
}

// ── RSVP form ─────────────────────────────────────────────────────────────────

interface RsvpFormProps {
  eventId: number;
  token: string;
}

function RsvpForm({ eventId, token }: Readonly<RsvpFormProps>) {
  const [name, setName]     = useState("");
  const [email, setEmail]   = useState("");
  const [status, setStatus] = useState<RSVPStatus>("YES");
  const [saving, setSaving] = useState(false);
  const [done, setDone]     = useState(false);
  const [error, setError]   = useState("");

  async function submit() {
    if (!name.trim()) return;
    setSaving(true); setError("");
    try {
      const res = await fetch(`${BASE}/events/${eventId}/portal/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim() || undefined, status, token }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Aanmelden mislukt.");
    } finally { setSaving(false); }
  }

  if (done) {
    return (
      <div style={{ padding: "1.5rem", background: "#e6f4ea", borderRadius: "1rem", textAlign: "center" }}>
        <p style={{ margin: 0, fontWeight: 600, color: "#1e7e34", fontSize: "1rem" }}>
          {status === "YES" ? "Super, je bent ingeschreven voor het feestje!" : "Jammer, we zetten je op de lijst als afwezig."}
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: "1.5rem", background: "#f8f8f8", borderRadius: "1rem", border: "1px solid #eee" }}>
      <h3 style={{ margin: "0 0 0.35rem", fontSize: "1.1rem", fontWeight: 600, color: "#1a1a1a" }}>
        Ben je erbij op het feestje?
      </h3>
      <p style={{ margin: "0 0 1.25rem", fontSize: "0.875rem", color: "#666" }}>
        Laat weten of je de bedankingsborrel erbij bent.
      </p>

      {error && (
        <p style={{ margin: "0 0 1rem", padding: "0.6rem 0.875rem", borderRadius: "8px", background: "#fce8e6", color: "#c5221f", fontSize: "0.85rem" }}>
          {error}
        </p>
      )}

      <div style={{ display: "grid", gap: "0.75rem", marginBottom: "1rem" }}>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Jouw naam *"
          disabled={saving}
          style={{ padding: "0.6rem 0.875rem", border: "1px solid #ddd", borderRadius: "10px", fontSize: "0.9rem", outline: "none", fontFamily: "inherit" }}
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="E-mail (optioneel)"
          disabled={saving}
          style={{ padding: "0.6rem 0.875rem", border: "1px solid #ddd", borderRadius: "10px", fontSize: "0.9rem", outline: "none", fontFamily: "inherit" }}
        />
        <div style={{ display: "flex", gap: "0.75rem" }}>
          {(["YES", "NO"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              style={{
                flex: 1, padding: "0.6rem", borderRadius: "8px", border: "2px solid",
                borderColor: status === s ? (s === "YES" ? "#1e7e34" : "#c5221f") : "#ddd",
                background: status === s ? (s === "YES" ? "#e6f4ea" : "#fce8e6") : "transparent",
                color: status === s ? (s === "YES" ? "#1e7e34" : "#c5221f") : "#666",
                fontWeight: status === s ? 600 : 400, fontSize: "0.9rem",
                cursor: "pointer", fontFamily: "inherit",
              }}
            >
              {s === "YES" ? "Ja, ik ben erbij!" : "Helaas, ik kan niet"}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={submit}
        disabled={saving || !name.trim()}
        style={{ width: "100%", padding: "0.65rem", borderRadius: "8px", border: "none", background: "#1a1a1a", color: "#fff", fontSize: "0.9rem", fontWeight: 500, cursor: "pointer", fontFamily: "inherit", opacity: saving || !name.trim() ? 0.5 : 1 }}
      >
        {saving ? "Bezig…" : "Aanmelden"}
      </button>
    </div>
  );
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
    <div style={{
      padding: "1rem 1.25rem",
      border: `1px solid ${isFull ? "#c3e6cb" : "#e5e5e5"}`,
      borderRadius: "0.875rem",
      background: isFull ? "#f0faf3" : "#fff",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontWeight: 600, fontSize: "0.975rem", color: "#1a1a1a" }}>
            {task.title}
          </p>
          {task.description && (
            <p style={{ margin: "0.2rem 0 0", fontSize: "0.82rem", color: "#666" }}>
              {task.description}
            </p>
          )}
          {(task.startAt || task.endAt) && (
            <p style={{ margin: "0.3rem 0 0", fontSize: "0.78rem", color: "#999", fontFamily: "monospace" }}>
              {fmtTime(task.startAt)}{task.startAt && task.endAt ? " – " : ""}{fmtTime(task.endAt)}
            </p>
          )}

          {/* Assignees */}
          {task.assignees?.length > 0 && (
            <div style={{ marginTop: "0.5rem", display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
              {task.assignees.map((a) => (
                <span
                  key={a.id}
                  style={{ padding: "0.2rem 0.55rem", background: "#e8f5e9", color: "#2e7d32", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 500 }}
                >
                  ✓ {a.name}
                </span>
              ))}
            </div>
          )}
        </div>

        <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.4rem" }}>
          {/* Capacity badge */}
          {task.maxHelpers !== null && (
            <span style={{
              fontSize: "0.72rem",
              fontWeight: 600,
              padding: "0.2rem 0.55rem",
              borderRadius: "999px",
              background: isFull ? "#c3e6cb" : "#f3f3f3",
              color: isFull ? "#1e7e34" : "#666",
            }}>
              {assigneeCount}/{task.maxHelpers}
            </span>
          )}

          {!isFull ? (
            <button
              type="button"
              onClick={onClaim}
              style={{ padding: "0.5rem 1rem", borderRadius: "8px", border: "none", background: "#1a1a1a", color: "#fff", fontSize: "0.82rem", fontWeight: 500, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}
            >
              Taak overnemen
            </button>
          ) : (
            <span style={{ padding: "0.4rem 0.8rem", borderRadius: "8px", background: "#c3e6cb", color: "#1e7e34", fontSize: "0.78rem", fontWeight: 600 }}>
              Vol
            </span>
          )}

          <span style={{ fontSize: "0.72rem", color: "#999" }}>{spotsLabel()}</span>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function HelperPortalPage({
  params,
}: Readonly<{ params: Promise<{ token: string }> }>) {
  const { token } = use(params);

  const [event, setEvent]               = useState<PortalEvent | null>(null);
  const [tasks, setTasks]               = useState<Task[]>([]);
  const [loading, setLoading]           = useState(true);
  const [fetchError, setFetchError]     = useState("");
  const [claimingTask, setClaimingTask] = useState<Task | null>(null);
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);

  useEffect(() => {
    fetch(`${BASE}/events/portal/invite/${encodeURIComponent(token)}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({})) as { error?: string };
          throw new Error(body.error ?? "Ongeldige link");
        }
        return res.json() as Promise<{ event: PortalEvent; tasks: Task[] }>;
      })
      .then(({ event: ev, tasks: ts }) => { setEvent(ev); setTasks(ts); })
      .catch((err) => setFetchError(err instanceof Error ? err.message : "Laden mislukt."))
      .finally(() => setLoading(false));
  }, [token]);

  function handleClaimed(taskId: number, assigneeName: string) {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, assignees: [...t.assignees, { id: -Date.now(), name: assigneeName, email: null }] }
          : t
      )
    );
    setClaimingTask(null);
  }

  if (loading) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#999" }}>Laden…</p>
      </div>
    );
  }

  if (fetchError || !event) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "0.75rem" }}>
        <p style={{ fontSize: "1.1rem", fontWeight: 600, color: "#c5221f" }}>Ongeldige uitnodigingslink</p>
        <p style={{ color: "#999", fontSize: "0.9rem" }}>{fetchError}</p>
      </div>
    );
  }

  const days = getEventDays(event.startsAt, event.endsAt);
  const selectedDay = days[selectedDayIdx] ?? days[0];

  return (
    <>
      {claimingTask && (
        <ClaimForm
          task={claimingTask}
          token={token}
          onClaimed={handleClaimed}
          onCancel={() => setClaimingTask(null)}
        />
      )}

      <div style={{ maxWidth: "760px", margin: "0 auto", padding: "2rem 1rem" }}>
        {/* Event header */}
        <div style={{ marginBottom: "2rem" }}>
          <span style={{ display: "inline-block", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#999", marginBottom: "0.5rem" }}>
            Helperportal
          </span>
          <h1 style={{ margin: "0 0 0.4rem", fontSize: "1.9rem", fontWeight: 700, letterSpacing: "-0.03em" }}>
            {event.title}
          </h1>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", fontSize: "0.875rem", color: "#666" }}>
            <span>
              {new Date(event.startsAt).toLocaleDateString("nl-BE", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              {event.endsAt && ` – ${new Date(event.endsAt).toLocaleDateString("nl-BE", { day: "numeric", month: "long", year: "numeric" })}`}
            </span>
            {event.location && <span>📍 {event.location}</span>}
          </div>
          {event.description && (
            <p style={{ margin: "0.75rem 0 0", fontSize: "0.9rem", color: "#555", lineHeight: 1.6 }}>
              {event.description}
            </p>
          )}
        </div>

        {/* Intro */}
        <div style={{ padding: "1rem 1.25rem", background: "#f0f4ff", borderRadius: "0.875rem", marginBottom: "2rem", border: "1px solid #d0d8ff" }}>
          <p style={{ margin: 0, fontSize: "0.875rem", color: "#3355cc" }}>
            <strong>Bedankt dat je wil helpen!</strong> Klik op een taak om die over te nemen. Als een taak vol is kan je hem niet meer claimen.
          </p>
        </div>

        {/* Day tabs for multi-day events */}
        {days.length > 1 && (
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
            {days.map((day, i) => {
              const isActive = i === selectedDayIdx;
              const label = day.toLocaleDateString("nl-BE", { weekday: "short", day: "numeric", month: "short" });
              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => setSelectedDayIdx(i)}
                  style={{
                    padding: "0.4rem 1rem",
                    borderRadius: "999px",
                    border: `2px solid ${isActive ? "#1a1a1a" : "#ddd"}`,
                    background: isActive ? "#1a1a1a" : "transparent",
                    color: isActive ? "#fff" : "#666",
                    fontSize: "0.82rem",
                    fontWeight: isActive ? 600 : 400,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}

        {/* Task board by shift */}
        <div style={{ display: "grid", gap: "2rem" }}>
          {SHIFTS.map((shift) => {
            const shiftTasks = tasks.filter((t) => t.shift === shift && taskMatchesDay(t, selectedDay));
            if (shiftTasks.length === 0) return null;
            const filled = shiftTasks.reduce((acc, t) => acc + (t.assignees?.length ?? 0), 0);
            const capacity = shiftTasks.reduce<number | null>((acc, t) => {
              if (acc === null || t.maxHelpers === null) return null;
              return acc + t.maxHelpers;
            }, 0);
            const capacityLabel = capacity === null ? `${filled} helper${filled !== 1 ? "s" : ""}` : `${filled}/${capacity} ingevuld`;

            return (
              <div key={shift}>
                <h2 style={{ margin: "0 0 1rem", fontSize: "1rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#1a1a1a" }}>
                  {SHIFT_LABELS[shift]}
                  <span style={{ marginLeft: "0.6rem", fontSize: "0.72rem", fontWeight: 400, color: "#999", textTransform: "none", letterSpacing: 0 }}>
                    ({capacityLabel})
                  </span>
                </h2>
                <div style={{ display: "grid", gap: "0.75rem" }}>
                  {shiftTasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onClaim={() => setClaimingTask(task)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
