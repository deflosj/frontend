"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

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

export default function AdminDashboardPage() {
  const [news, setNews] = useState<NewsPost[]>([]);
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      apiFetch<NewsPost[]>("/content/news"),
      apiFetch<CalEvent[]>("/content/events"),
      apiFetch<Member[]>("/members"),
      apiFetch<ContactMessage[]>("/contact/messages"),
    ]).then(([n, e, m, msg]) => {
      if (n.status === "fulfilled") setNews(n.value);
      if (e.status === "fulfilled") setEvents(e.value);
      if (m.status === "fulfilled") setMembers(m.value);
      if (msg.status === "fulfilled") setMessages(msg.value);
      setLoading(false);
    });
  }, []);

  const unread = messages.filter((m) => m.status === "UNREAD").length;

  const stats = [
    { label: "Nieuwsartikelen", value: news.length },
    { label: "Events", value: events.length },
    { label: "Leden", value: members.length },
    { label: "Ongelezen berichten", value: unread, accent: unread > 0 },
  ];

  const recentMessages = messages.slice(0, 6);

  return (
    <>
      <div className="admin-page-header">
        <h1>Dashboard</h1>
        <p>Welkom in het beheerderspaneel van De Flosj</p>
      </div>

      <div className="admin-stats">
        {stats.map((s) => (
          <div className="admin-stat" key={s.label}>
            <p className="admin-stat__label">{s.label}</p>
            <p
              className="admin-stat__value"
              style={s.accent ? { color: "var(--accent)" } : undefined}
            >
              {loading ? "—" : s.value}
            </p>
          </div>
        ))}
      </div>

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
                    <span className={`badge badge--${
                      msg.status === "UNREAD" ? "pink" :
                      msg.status === "READ" ? "green" : "gray"
                    }`}>
                      {msg.status === "UNREAD" ? "Ongelezen" :
                       msg.status === "READ" ? "Gelezen" : "Gearchiveerd"}
                    </span>
                  </td>
                  <td>{fmt(msg.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="admin-section">
        <div className="admin-table-wrapper">
          <div className="admin-table-header">
            <h2>Snelkoppelingen</h2>
          </div>
          <table className="admin-table">
            <tbody>
              {[
                { href: "/admin/news", label: "Nieuws beheren" },
                { href: "/admin/events", label: "Events beheren" },
                { href: "/admin/sponsors", label: "Sponsors beheren" },
                { href: "/admin/members", label: "Leden bekijken" },
                { href: "/admin/messages", label: "Berichten lezen" },
              ].map((link) => (
                <tr key={link.href}>
                  <td>
                    <Link
                      href={link.href}
                      style={{ color: "var(--accent-strong)", fontWeight: 500 }}
                    >
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
