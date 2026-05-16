"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import type { TournamentListItem } from "@/lib/tournament-types";
import type { Registration } from "@/lib/registration-types";
import { DataTable, type ColumnDef } from "@/components/admin/data-table";

// ── Types ─────────────────────────────────────────────────────────────────────

interface NewsPost { id: number; publishedAt: string | null }
interface CalEvent { id: number; isPublished: boolean }
interface ContactMessage {
  id: number;
  name: string;
  email: string;
  subject: string | null;
  status: "UNREAD" | "READ" | "ARCHIVED";
  createdAt: string;
}

// ── Cell components (module scope — required by S6478) ────────────────────────

function MsgNameCell({ name }: Readonly<{ name: string }>) {
  return <strong>{name}</strong>;
}

function MsgSubjectCell({ subject }: Readonly<{ subject: string | null }>) {
  return <>{subject ?? <span style={{ color: "var(--muted)" }}>—</span>}</>;
}

function MsgStatusBadge({ status }: Readonly<{ status: ContactMessage["status"] }>) {
  let color = "gray";
  let label = "Gearchiveerd";
  if (status === "UNREAD") { color = "pink";  label = "Ongelezen"; }
  else if (status === "READ") { color = "green"; label = "Gelezen"; }
  return <span className={`badge badge--${color}`}>{label}</span>;
}

function MsgDateCell({ iso }: Readonly<{ iso: string }>) {
  return <>{new Date(iso).toLocaleDateString("nl-BE")}</>;
}

// ── Columns ───────────────────────────────────────────────────────────────────

const MSG_COLUMNS: ColumnDef<ContactMessage>[] = [
  { key: "name",      header: "Naam",       cell: (m) => <MsgNameCell name={m.name} /> },
  { key: "email",     header: "E-mail",     cell: (m) => m.email },
  { key: "subject",   header: "Onderwerp",  cell: (m) => <MsgSubjectCell subject={m.subject} /> },
  { key: "status",    header: "Status",     cell: (m) => <MsgStatusBadge status={m.status} /> },
  { key: "createdAt", header: "Datum",      cell: (m) => <MsgDateCell iso={m.createdAt} /> },
];

// ── Quick links ───────────────────────────────────────────────────────────────

const QUICK_LINKS = [
  { href: "/admin/toernooi",       label: "Toernooien beheren" },
  { href: "/admin/news",           label: "Nieuws beheren"     },
  { href: "/admin/events",         label: "Events beheren"     },
  { href: "/admin/sponsors",       label: "Sponsors beheren"   },
  { href: "/admin/members",        label: "Leden bekijken"     },
  { href: "/admin/messages",       label: "Berichten lezen"    },
  { href: "/admin/inschrijvingen", label: "Inschrijvingen"     },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const [news, setNews]                   = useState<NewsPost[]>([]);
  const [events, setEvents]               = useState<CalEvent[]>([]);
  const [messages, setMessages]           = useState<ContactMessage[]>([]);
  const [tournaments, setTournaments]     = useState<TournamentListItem[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading]             = useState(true);

  useEffect(() => {
    Promise.allSettled([
      apiFetch<NewsPost[]>("/content/news"),
      apiFetch<CalEvent[]>("/content/events"),
      apiFetch<ContactMessage[]>("/contact/messages"),
      apiFetch<TournamentListItem[]>("/tournaments"),
      apiFetch<Registration[]>("/registrations"),
    ]).then(([n, e, msg, t, r]) => {
      if (n.status   === "fulfilled") setNews(n.value);
      if (e.status   === "fulfilled") setEvents(e.value);
      if (msg.status === "fulfilled") setMessages(msg.value);
      if (t.status   === "fulfilled") setTournaments(t.value);
      if (r.status   === "fulfilled") setRegistrations(r.value);
      setLoading(false);
    });
  }, []);

  const unread           = messages.filter((m) => m.status === "UNREAD").length;
  const pendingRegs      = registrations.filter((r) => r.status === "PENDING").length;
  const activeTournament = tournaments.find((t) => t.isActive);
  const recentMessages   = messages.slice(0, 6);

  const stats = [
    { label: "Toernooien",          value: tournaments.length,   href: "/admin/toernooi"       },
    { label: "Inschrijvingen",       value: registrations.length, href: "/admin/inschrijvingen" },
    { label: "In afwachting",        value: pendingRegs,          href: "/admin/inschrijvingen", accent: pendingRegs > 0 },
    { label: "Nieuwsartikelen",     value: news.length,          href: "/admin/news"           },
    { label: "Events",              value: events.length,        href: "/admin/events"         },
    { label: "Ongelezen berichten", value: unread,               href: "/admin/messages",       accent: unread > 0 },
  ];

  return (
    <>
      <div className="admin-page-header">
        <h1>Dashboard</h1>
        <p>Welkom in het beheerderspaneel van De Flosj</p>
      </div>

      {/* Active tournament banner */}
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

      {/* Stats */}
      <div className="admin-stats" style={{ gridTemplateColumns: "repeat(6, minmax(0, 1fr))" }}>
        {stats.map((s) => (
          <Link href={s.href} key={s.label} className="admin-stat" style={{ textDecoration: "none", display: "block" }}>
            <p className="admin-stat__label">{s.label}</p>
            <p className="admin-stat__value" style={s.accent ? { color: "var(--accent)" } : undefined}>
              {loading ? "—" : s.value}
            </p>
          </Link>
        ))}
      </div>

      {/* Recent messages */}
      <DataTable
        title="Recente berichten"
        headerAction={
          <Link href="/admin/messages" className="btn-sm btn-sm--ghost">
            Alle berichten
          </Link>
        }
        data={recentMessages}
        columns={MSG_COLUMNS}
        loading={loading}
        emptyText="Geen berichten ontvangen."
      />

      {/* Quick links */}
      <div className="admin-section">
        <div className="admin-table-wrapper">
          <div className="admin-table-header">
            <h2>Snelkoppelingen</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "0.5rem", padding: "1rem" }}>
            {QUICK_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="btn-sm btn-sm--ghost"
                style={{ justifyContent: "flex-start" }}
              >
                {link.label} →
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
