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
  return <>{subject ?? <span style={{ color: "var(--ink-2)" }}>—</span>}</>;
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
      apiFetch<NewsPost[]>("content/news"),
      apiFetch<CalEvent[]>("content/events"),
      apiFetch<ContactMessage[]>("contact/messages"),
      apiFetch<TournamentListItem[]>("tournaments"),
      apiFetch<Registration[]>("registrations"),
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
      <div className="mb-2">
        <h1 className="text-3xl font-medium text-ink" >Dashboard</h1>
        <p className="mt-1.5 text-base text-ink/75">Welkom in het beheerderspaneel van De Flosj</p>
      </div>

      {/* Active tournament banner */}
      {!loading && activeTournament && (
        <div className="flex items-center justify-between gap-4 rounded-lg bg-ink/5 p-4">
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
      <div className="grid gap-4 mb-8" style={{ gridTemplateColumns: "repeat(6, minmax(0, 1fr))" }}>
        {stats.map((s) => (
          <Link href={s.href} key={s.label} className="bg-surface border border-rule rounded-lg p-5 shadow" style={{ textDecoration: "none", display: "block" }}>
            <p className="text-xs font-semibold tracking-widest text-ink/75">{s.label}</p>
            <p className="text-3xl my-2  tracking-tight text-ink" style={s.accent ? { color: "var(--accent)" } : undefined}>
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
    </>
  );
}
