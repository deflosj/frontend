"use client";

import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import type { CalEvent } from "@/components/admin/events/event-drawer";
import type { Task, TaskAssignee } from "@/types/shifts";

interface HelperAssignmentRef {
  eventId: number;
  taskId: number;
  assigneeId: number;
}

interface HelperRow {
  key: string;
  name: string;
  email: string | null;
  userId: number | null;
  events: string[];
  assignments: number;
  latestEventAt: string;
  refs: HelperAssignmentRef[];
}

interface LoadState {
  events: CalEvent[];
  tasksByEvent: Map<number, Task[]>;
  rows: HelperRow[];
  eventCount: number;
  taskCount: number;
  assignmentCount: number;
  helperCount: number;
}

interface Notice {
  type: "success" | "error";
  message: string;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizeName(name: string) {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

function assigneeKey(a: TaskAssignee): string {
  if (a.email) return `email:${normalizeEmail(a.email)}`;
  if (a.userId != null) return `user:${a.userId}`;
  return `name:${normalizeName(a.name)}`;
}

function formatDateLabel(iso: string): string {
  return new Date(iso).toLocaleDateString("nl-BE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function aggregateHelpers(events: CalEvent[], tasksByEvent: Map<number, Task[]>): LoadState {
  const rowsByKey = new Map<string, HelperRow>();
  const emailIndex = new Map<string, string>();
  const userIndex = new Map<number, string>();
  const nameIndex = new Map<string, string>();
  let taskCount = 0;
  let assignmentCount = 0;

  for (const event of events) {
    const tasks = tasksByEvent.get(event.id) ?? [];
    taskCount += tasks.length;

    for (const task of tasks) {
      for (const assignee of task.assignees ?? []) {
        assignmentCount += 1;

        const emailKey = assignee.email ? emailIndex.get(normalizeEmail(assignee.email)) : undefined;
        const userKey = assignee.userId != null ? userIndex.get(assignee.userId) : undefined;
        const nameKey = nameIndex.get(normalizeName(assignee.name));
        const key = emailKey ?? userKey ?? nameKey ?? assigneeKey(assignee);

        let row = rowsByKey.get(key);
        if (!row) {
          row = {
            key,
            name: assignee.name,
            email: assignee.email,
            userId: assignee.userId,
            events: [],
            assignments: 0,
            latestEventAt: event.startsAt,
            refs: [],
          };
          rowsByKey.set(key, row);
        }

        if (!row.email && assignee.email) row.email = assignee.email;
        if (row.userId == null && assignee.userId != null) row.userId = assignee.userId;
        if (!row.name.trim()) row.name = assignee.name;

        if (!row.events.includes(event.title)) row.events.push(event.title);
        if (new Date(event.startsAt).getTime() > new Date(row.latestEventAt).getTime()) {
          row.latestEventAt = event.startsAt;
        }
        row.assignments += 1;
        row.refs.push({ eventId: event.id, taskId: task.id, assigneeId: assignee.id });

        if (assignee.email) emailIndex.set(normalizeEmail(assignee.email), key);
        if (assignee.userId != null) userIndex.set(assignee.userId, key);
        nameIndex.set(normalizeName(assignee.name), key);
      }
    }
  }

  const rows = [...rowsByKey.values()].sort((a, b) => {
    const byName = a.name.localeCompare(b.name, "nl-BE", { sensitivity: "base" });
    if (byName !== 0) return byName;
    return b.assignments - a.assignments;
  });

  return {
    events,
    tasksByEvent,
    rows,
    eventCount: events.length,
    taskCount,
    assignmentCount,
    helperCount: rows.length,
  };
}

export default function YearlyHelpersPage() {
  const year = useMemo(() => new Date().getFullYear(), []);

  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState<Notice | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [state, setState] = useState<LoadState>({
    events: [],
    tasksByEvent: new Map(),
    rows: [],
    eventCount: 0,
    taskCount: 0,
    assignmentCount: 0,
    helperCount: 0,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const allEvents = await apiFetch<CalEvent[]>("content/events/all");
      const yearEvents = allEvents.filter((event) => new Date(event.startsAt).getFullYear() === year);
      const tasksResults = await Promise.allSettled(
        yearEvents.map(async (event) => [event.id, await apiFetch<Task[]>(`events/${event.id}/portal/tasks`)] as const)
      );

      const tasksByEvent = new Map<number, Task[]>();
      const failedEvents: string[] = [];

      tasksResults.forEach((result, index) => {
        const event = yearEvents[index];
        if (result.status === "fulfilled") {
          const [eventId, tasks] = result.value;
          tasksByEvent.set(eventId, tasks);
        } else {
          failedEvents.push(event.title);
        }
      });

      const nextState = aggregateHelpers(yearEvents, tasksByEvent);
      setState(nextState);

      if (failedEvents.length > 0) {
        setNotice({
          type: "error",
          message: `Helpers geladen met waarschuwing: ${failedEvents.length} event${failedEvents.length === 1 ? "" : "s"} kon(nen) niet worden ingeladen.`,
        });
      }
    } catch (err) {
      setNotice({
        type: "error",
        message: err instanceof Error ? err.message : "Helpers laden mislukt.",
      });
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => { load(); }, [load]);

  async function handleReset() {
    setResetting(true);
    setConfirmOpen(false);
    try {
      const deletes = state.rows.flatMap((row) => row.refs.map((ref) =>
        apiFetch(`events/${ref.eventId}/portal/tasks/${ref.taskId}/assignees/${ref.assigneeId}`, { method: "DELETE" })
      ));
      const results = await Promise.allSettled(deletes);
      const removed = results.filter((result) => result.status === "fulfilled").length;
      const failed = results.length - removed;

      await load();

      setNotice({
        type: failed > 0 ? "error" : "success",
        message: failed > 0
          ? `${removed} helpertoewijzingen verwijderd, ${failed} mislukt.`
          : `${removed} helpertoewijzingen verwijderd.`,
      });
    } catch (err) {
      setNotice({
        type: "error",
        message: err instanceof Error ? err.message : "Reset mislukt.",
      });
    } finally {
      setResetting(false);
    }
  }

  useEffect(() => {
    if (!notice) return;
    const timer = globalThis.setTimeout(() => setNotice(null), 5000);
    return () => globalThis.clearTimeout(timer);
  }, [notice]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return state.rows;
    return state.rows.filter((row) =>
      row.name.toLowerCase().includes(q) ||
      (row.email ?? "").toLowerCase().includes(q) ||
      row.events.some((event) => event.toLowerCase().includes(q))
    );
  }, [search, state.rows]);

  if (loading) return <p className="admin-empty">Laden…</p>;

  return (
    <>
      {notice && (
        <output
          style={{
            position: "fixed",
            top: "1rem",
            right: "1rem",
            zIndex: 60,
            maxWidth: "24rem",
            padding: "0.85rem 1rem",
            borderRadius: "14px",
            border: `1px solid ${notice.type === "success" ? "#bbf7d0" : "#fecaca"}`,
            background: notice.type === "success" ? "#f0fdf4" : "#fef2f2",
            color: notice.type === "success" ? "#166534" : "#991b1b",
            boxShadow: "0 12px 32px rgba(15, 23, 42, 0.12)",
            fontSize: "0.875rem",
            fontWeight: 500,
          }}
        >
          {notice.message}
        </output>
      )}

      <div style={{ marginBottom: "1.5rem" }}>
        <Link
          href="/admin"
          style={{ fontSize: "0.8rem", color: "var(--ink-2)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.3rem", marginBottom: "0.75rem" }}
        >
          ← Dashboard
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 500, letterSpacing: "-0.03em", color: "var(--text)" }}>
              Helpers {year}
            </h1>
            <span className="badge badge--pink">Jaaroverzicht</span>
          </div>
          <Button onClick={() => setConfirmOpen(true)} variant="destructive" size="sm" disabled={resetting || state.assignmentCount === 0}>
            {resetting ? "Resetten…" : "Reset helpers"}
          </Button>
        </div>
        <p style={{ margin: "0.35rem 0 0", fontSize: "0.875rem", color: "var(--ink-2)" }}>
          Alle vrijwilligers die dit jaar op taken zijn toegewezen, samengevoegd over alle events.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <div className="admin-stat">
          <p className="admin-stat__label">Helpers</p>
          <p className="admin-stat__value">{state.helperCount}</p>
        </div>
        <div className="admin-stat">
          <p className="admin-stat__label">Toewijzingen</p>
          <p className="admin-stat__value">{state.assignmentCount}</p>
        </div>
        <div className="admin-stat">
          <p className="admin-stat__label">Taken</p>
          <p className="admin-stat__value">{state.taskCount}</p>
        </div>
        <div className="admin-stat">
          <p className="admin-stat__label">Events</p>
          <p className="admin-stat__value">{state.eventCount}</p>
        </div>
      </div>

      <div className="admin-table-wrapper">
        <div className="admin-table-header" style={{ gap: "0.75rem", flexWrap: "wrap" }}>
          <div style={{ display: "grid", gap: "0.2rem" }}>
            <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 500 }}>Vrijwilligerslijst</h2>
            <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--ink-2)" }}>
              Zoek op naam, e-mail of eventnaam.
            </p>
          </div>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Zoek helpers…"
            style={{
              minWidth: "16rem",
              padding: "0.6rem 0.75rem",
              borderRadius: "10px",
              border: "1px solid var(--border)",
              background: "var(--bg)",
              color: "var(--text)",
              font: "inherit",
            }}
          />
        </div>

        <div style={{ padding: "1rem 1.4rem" }}>
          {filteredRows.length === 0 ? (
            <p style={{ margin: 0, color: "var(--ink-2)", fontSize: "0.875rem" }}>
              Geen helpers gevonden voor {year}.
            </p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
                <thead>
                  <tr style={{ textAlign: "left", color: "var(--ink-2)" }}>
                    <th style={{ padding: "0.6rem 0.5rem 0.6rem 0", borderBottom: "1px solid var(--border)" }}>Naam</th>
                    <th style={{ padding: "0.6rem 0.5rem", borderBottom: "1px solid var(--border)" }}>E-mail</th>
                    <th style={{ padding: "0.6rem 0.5rem", borderBottom: "1px solid var(--border)" }}>Gebruiker</th>
                    <th style={{ padding: "0.6rem 0.5rem", borderBottom: "1px solid var(--border)" }}>Events</th>
                    <th style={{ padding: "0.6rem 0.5rem", borderBottom: "1px solid var(--border)" }}>Toewijzingen</th>
                    <th style={{ padding: "0.6rem 0 0.6rem 0.5rem", borderBottom: "1px solid var(--border)" }}>Laatste event</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row) => (
                    <tr key={row.key}>
                      <td style={{ padding: "0.65rem 0.5rem 0.65rem 0", borderBottom: "1px solid var(--border)", fontWeight: 500 }}>
                        {row.name}
                      </td>
                      <td style={{ padding: "0.65rem 0.5rem", borderBottom: "1px solid var(--border)", color: row.email ? "var(--text)" : "var(--accent)" }}>
                        {row.email ?? "Geen e-mail"}
                      </td>
                      <td style={{ padding: "0.65rem 0.5rem", borderBottom: "1px solid var(--border)", color: "var(--ink-2)" }}>
                        {row.userId ?? "—"}
                      </td>
                      <td style={{ padding: "0.65rem 0.5rem", borderBottom: "1px solid var(--border)" }}>
                        {row.events.length}
                      </td>
                      <td style={{ padding: "0.65rem 0.5rem", borderBottom: "1px solid var(--border)" }}>
                        {row.assignments}
                      </td>
                      <td style={{ padding: "0.65rem 0 0.65rem 0.5rem", borderBottom: "1px solid var(--border)", color: "var(--ink-2)" }}>
                        {formatDateLabel(row.latestEventAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Dialog.Root open={confirmOpen} onOpenChange={setConfirmOpen}>
        <Dialog.Portal>
          <Dialog.Overlay
            style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.48)", zIndex: 50 }}
          />
          <Dialog.Content
            aria-label="Helpers reset bevestigen"
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "min(560px, calc(100vw - 2rem))",
              zIndex: 51,
              background: "var(--bg)",
              border: "1px solid var(--border)",
              borderRadius: "18px",
              boxShadow: "0 24px 72px rgba(15, 23, 42, 0.24)",
              padding: "1.25rem",
            }}
          >
            <Dialog.Title style={{ margin: 0, fontSize: "1.05rem", fontWeight: 600 }}>
              Helpers resetten voor {year}
            </Dialog.Title>
            <Dialog.Description style={{ marginTop: "0.45rem", fontSize: "0.9rem", lineHeight: 1.55, color: "var(--ink-2)" }}>
              Dit verwijdert alle helpertoewijzingen uit taken van {year}. Gebruik dit pas nadat de bedankingsavond of thank-you party voorbij is.
            </Dialog.Description>

            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.25rem", justifyContent: "flex-end", flexWrap: "wrap" }}>
              <Button type="button" variant="outline" size="sm" onClick={() => setConfirmOpen(false)} disabled={resetting}>
                Annuleren
              </Button>
              <Button type="button" variant="destructive" size="sm" onClick={handleReset} disabled={resetting || state.assignmentCount === 0}>
                {resetting ? "Resetten…" : "Bevestigen en resetten"}
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}