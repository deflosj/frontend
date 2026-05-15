"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import type { TournamentListItem } from "@/lib/tournament-types";

interface NewsPost { id: number; publishedAt: string | null }
interface CalEvent { id: number; isPublished: boolean }
interface Member { id: number }
interface ContactMessage {
  id: number;
  name: string;
  email: string;
  subject: string | null;
  status: "UNREAD" | "READ" | "ARCHIVED";
  createdAt: string;
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("nl-BE");
}

function badgeVariant(status: ContactMessage["status"]): string {
  if (status === "UNREAD") return "pink";
  if (status === "READ")   return "green";
  return "gray";
}

function statusLabel(status: ContactMessage["status"]): string {
  if (status === "UNREAD") return "Ongelezen";
  if (status === "READ")   return "Gelezen";
  return "Gearchiveerd";
}

export default function AdminDashboardPage() {
  const [news, setNews] = useState<NewsPost[]>([]);
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [tournaments, setTournaments] = useState<TournamentListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      apiFetch<NewsPost[]>("/content/news"),
      apiFetch<CalEvent[]>("/content/events"),
      apiFetch<Member[]>("/members"),
      apiFetch<ContactMessage[]>("/contact/messages"),
      apiFetch<TournamentListItem[]>("/tournaments"),
    ]).then(([n, e, m, msg, t]) => {
      if (n.status === "fulfilled") setNews(n.value);
      if (e.status === "fulfilled") setEvents(e.value);
      if (m.status === "fulfilled") setMembers(m.value);
      if (msg.status === "fulfilled") setMessages(msg.value);
      if (t.status === "fulfilled") setTournaments(t.value);
      setLoading(false);
    });
  }, []);

  const unread = messages.filter((m) => m.status === "UNREAD").length;
  const activeTournament = tournaments.find((t) => t.isActive);

  const stats = [
    { label: "Toernooien", value: tournaments.length, href: "/admin/toernooi" },
    { label: "Nieuwsartikelen", value: news.length, href: "/admin/news" },
    { label: "Events", value: events.length, href: "/admin/events" },
    { label: "Leden", value: members.length, href: "/admin/members" },
    { label: "Ongelezen berichten", value: unread, href: "/admin/messages", accent: unread > 0 },
  ];

  const recentMessages = messages.slice(0, 6);

  return (
    <>
      <div className="admin-page-header">
        <h1>Dashboard</h1>
        <p>Welkom in het beheerderspaneel van De Flosj</p>
      </div>

      {/* ── Active tournament banner ───────────────────────── */}
      {!loading && activeTournament && (
        <div
          style={{
            marginBottom: "1.5rem",
            padding: "1rem 1.25rem",
            borderRadius: "var(--radius-lg)",
            background: "var(--accent-soft)",
            border: "1px solid color-mix(in srgb, var(--accent) 20%, transparent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
          }}
        >
          <div>
            <p style={{ margin: 0, fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--accent-strong)", fontFamily: "var(--font-geist-mono), monospace" }}>
              Actief toernooi
            </p>
            <p style={{ margin: "0.2rem 0 0", fontWeight: 500, color: "var(--text)" }}>
              {activeTournament.name} — {activeTournament.year}
            </p>
          </div>
          <Link href="/admin/toernooi" className="btn-sm btn-sm--ghost" style={{ flexShrink: 0 }}>
            Beheren →
          </Link>
        </div>
      )}

      {/* ── Stats ─────────────────────────────────────────── */}
      <div className="admin-stats" style={{ gridTemplateColumns: "repeat(5, minmax(0, 1fr))" }}>
        {stats.map((s) => (
          <Link href={s.href} key={s.label} className="admin-stat" style={{ textDecoration: "none", display: "block" }}>
            <p className="admin-stat__label">{s.label}</p>
            <p
              className="admin-stat__value"
              style={s.accent ? { color: "var(--accent)" } : undefined}
            >
              {loading ? "—" : s.value}
            </p>
          </Link>
        ))}
      </div>

      {/* ── Recent messages ───────────────────────────────── */}
      <div className="admin-table-wrapper">
        <div className="admin-table-header">
          <h2>Recente berichten</h2>
          <Link href="/admin/messages" className="btn-sm btn-sm--ghost">
            Alle berichten
          </Link>
        </div>

        {loading ? (
          <p className="admin-empty">Laden…</p>
        ) : recentMessages.length === 0 ? (
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
              </tr>
            </thead>
            <tbody>
              {recentMessages.map((msg) => (
                <tr key={msg.id}>
                  <td><strong>{msg.name}</strong></td>
                  <td>{msg.email}</td>
                  <td>{msg.subject ?? "—"}</td>
                  <td>
                    <span className={`badge badge--${badgeVariant(msg.status)}`}>
                      {statusLabel(msg.status)}
                    </span>
                  </td>
                  <td>{fmt(msg.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Quick links ───────────────────────────────────── */}
      <div className="admin-section">
        <div className="admin-table-wrapper">
          <div className="admin-table-header">
            <h2>Snelkoppelingen</h2>
          </div>
          <table className="admin-table">
            <tbody>
              {[
                { href: "/admin/toernooi",  label: "Toernooien beheren"  },
                { href: "/admin/news",      label: "Nieuws beheren"       },
                { href: "/admin/events",    label: "Events beheren"       },
                { href: "/admin/sponsors",  label: "Sponsors beheren"     },
                { href: "/admin/members",   label: "Leden bekijken"       },
                { href: "/admin/messages",  label: "Berichten lezen"      },
              ].map((link) => (
                <tr key={link.href}>
                  <td>
                    <Link href={link.href} style={{ color: "var(--accent-strong)", fontWeight: 500 }}>
                      {link.label} →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
