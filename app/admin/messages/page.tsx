"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

interface ContactMessage {
  id: number;
  name: string;
  email: string;
  subject: string | null;
  body: string;
  status: "UNREAD" | "READ" | "ARCHIVED";
  createdAt: string;
  readAt: string | null;
}

const statusLabel: Record<string, string> = {
  UNREAD: "Ongelezen",
  READ: "Gelezen",
  ARCHIVED: "Gearchiveerd",
};

const statusBadge: Record<string, string> = {
  UNREAD: "pink",
  READ: "green",
  ARCHIVED: "gray",
};

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [busy, setBusy] = useState<number | null>(null);

  async function load() {
    try {
      setMessages(await apiFetch<ContactMessage[]>("/contact/messages"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function markRead(id: number) {
    setBusy(id);
    try {
      await apiFetch(`/contact/messages/${id}/read`, { method: "PATCH" });
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, status: "READ", readAt: new Date().toISOString() } : m))
      );
    } finally {
      setBusy(null);
    }
  }

  async function archive(id: number) {
    setBusy(id);
    try {
      await apiFetch(`/contact/messages/${id}/archive`, { method: "PATCH" });
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, status: "ARCHIVED" } : m))
      );
    } finally {
      setBusy(null);
    }
  }

  const unread = messages.filter((m) => m.status === "UNREAD").length;

  return (
    <>
      <div className="admin-page-header">
        <h1>Berichten</h1>
        <p>
          Contactberichten van bezoekers
          {unread > 0 && (
            <span style={{ marginLeft: "0.5rem" }}>
              <span className="badge badge--pink">{unread} ongelezen</span>
            </span>
          )}
        </p>
      </div>

      <div className="admin-table-wrapper">
        <div className="admin-table-header">
          <h2>Berichten ({messages.length})</h2>
        </div>

        {loading ? (
          <p className="admin-empty">Laden…</p>
        ) : messages.length === 0 ? (
          <p className="admin-empty">Geen berichten ontvangen.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Naam</th>
                <th>E-mail</th>
                <th>Onderwerp</th>
                <th>Status</th>
                <th>Datum</th>
                <th>Acties</th>
              </tr>
            </thead>
            <tbody>
              {messages.map((msg) => (
                <>
                  <tr
                    key={msg.id}
                    style={{ cursor: "pointer" }}
                    onClick={() => setExpanded(expanded === msg.id ? null : msg.id)}
                  >
                    <td>
                      <strong>{msg.name}</strong>
                    </td>
                    <td>{msg.email}</td>
                    <td>{msg.subject ?? "—"}</td>
                    <td>
                      <span className={`badge badge--${statusBadge[msg.status]}`}>
                        {statusLabel[msg.status]}
                      </span>
                    </td>
                    <td>{new Date(msg.createdAt).toLocaleDateString("nl-BE")}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="row-actions">
                        {msg.status === "UNREAD" && (
                          <button
                            className="btn-sm btn-sm--success"
                            onClick={() => markRead(msg.id)}
                            disabled={busy === msg.id}
                            type="button"
                          >
                            Gelezen
                          </button>
                        )}
                        {msg.status !== "ARCHIVED" && (
                          <button
                            className="btn-sm btn-sm--ghost"
                            onClick={() => archive(msg.id)}
                            disabled={busy === msg.id}
                            type="button"
                          >
                            Archiveer
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>

                  {expanded === msg.id && (
                    <tr key={`${msg.id}-body`}>
                      <td
                        colSpan={6}
                        style={{
                          background: "var(--bg-alt)",
                          padding: "1rem 1.4rem",
                          fontSize: "0.875rem",
                          color: "var(--text-2)",
                          whiteSpace: "pre-wrap",
                          borderBottom: "1px solid var(--border)",
                        }}
                      >
                        {msg.body}
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
