"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, Bike, ChevronRight, ExternalLink, Mail, Newspaper, Tv, UserPlus, Users } from "lucide-react";
import { apiFetch, getTokenPayload } from "@/lib/api";
import type { ActiveTournament, TournamentListItem } from "@/lib/tournament-types";
import type { Registration } from "@/lib/registration-types";
import { TOURNAMENT_PHASES as PHASES, isTeamComplete as isComplete, tournamentPhase } from "@/lib/tournament-phase";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ContactMessage {
  id: number;
  name: string;
  subject: string | null;
  status: "UNREAD" | "READ" | "ARCHIVED";
  createdAt: string;
}
interface CalEvent { id: number; title: string; startsAt: string }
interface ShiftStats { total: number; assigned: number }

type Tone = "pink" | "warn" | "neutral";
interface Todo { key: string; tone: Tone; Icon: LucideIcon; title: string; sub: string; action: string; href: string }

// ── Helpers ───────────────────────────────────────────────────────────────────

function daysAgo(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000));
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Goeiemorgen";
  if (h < 18) return "Goeiemiddag";
  return "Goeienavond";
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("nl-BE", { day: "numeric", month: "short" });
}

const TONE: Record<Tone, string> = {
  pink: "bg-pink-soft text-pink-ink",
  warn: "bg-[var(--warn-bg)] text-[var(--warn-fg)]",
  neutral: "bg-ink/5 text-ink-2",
};

// ── Onderdelen ────────────────────────────────────────────────────────────────

function Metric({ label, value, of, bar }: Readonly<{ label: string; value: number | string; of?: number; bar?: "pink" | "ink" }>) {
  const pct = typeof value === "number" && of ? Math.min(100, Math.round((value / of) * 100)) : null;
  return (
    <div className="rounded-xl bg-paper px-4 py-3.5">
      <p className="text-xs text-ink-2">{label}</p>
      <p className="mt-1 font-mono text-2xl font-semibold tabular-nums">
        {value}
        {of !== undefined && <span className="text-base text-ink-2"> / {of}</span>}
      </p>
      {pct !== null && (
        <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-rule">
          <div className={`h-full ${bar === "pink" ? "bg-pink" : "bg-ink"}`} style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  );
}

function EventCard({ t }: Readonly<{ t: ActiveTournament }>) {
  const phase = tournamentPhase(t);
  const complete = t.teams.filter(isComplete).length;
  const groupMatches = t.matches.filter((m) => m.teamAId !== null && m.teamBId !== null);
  const played = groupMatches.filter((m) => m.winnerId !== null || (m.scoreA !== null && m.scoreB !== null)).length;
  const poules = t.poules.filter((p) => p.phase === "GROUP_STAGE").length;
  const deadline = t.teamEditDeadline ? new Date(t.teamEditDeadline) : null;
  const deadlineOpen = deadline && deadline.getTime() > Date.now();

  return (
    <section aria-labelledby="ev-title" className="flex flex-col gap-5 rounded-2xl border border-rule bg-surface p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <span className="inline-flex items-center gap-2 self-start rounded-full bg-pink-soft px-2.5 py-1 text-xs font-semibold text-pink-ink">
            {phase === 3 ? <span className="t-live-dot" /> : <span className="h-1.5 w-1.5 rounded-full bg-pink" />}
            {PHASES[phase]}
            {deadlineOpen && phase === 0 && <> · wijzigen tot {fmtDate(t.teamEditDeadline!)}</>}
          </span>
          <h2 id="ev-title" className="text-[22px] font-semibold tracking-tight">{t.name} {t.year}</h2>
        </div>
        <Link href={`/admin/toernooi/${t.id}`} className="btn-sm btn-sm--ghost">
          Naar toernooi <ArrowRight size={16} strokeWidth={1.75} />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Metric label="Teams" value={t.teams.length} />
        <Metric label="Volledig (4 spelers)" value={complete} of={t.teams.length || undefined} bar="pink" />
        <Metric label="Aanwezig" value={t.teams.filter((x) => x.isPresent).length} of={t.teams.length || undefined} bar="ink" />
        {phase >= 2
          ? <Metric label="Wedstrijden gespeeld" value={played} of={groupMatches.length || undefined} bar="ink" />
          : <Metric label="Poules" value={poules || "—"} />}
      </div>

      <ol aria-label="Fases" className="grid grid-cols-5 gap-2">
        {PHASES.map((label, i) => (
          <li key={label} className="flex flex-col gap-2" aria-current={i === phase ? "step" : undefined}>
            <div className={`h-1 rounded-full ${i <= phase ? "bg-pink" : "bg-rule"}`} />
            <span className={`text-xs ${i === phase ? "font-semibold text-ink" : "text-ink-2"} max-sm:sr-only`}>{label}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

function TodoList({ todos, loading }: Readonly<{ todos: Todo[]; loading: boolean }>) {
  return (
    <section aria-labelledby="todo-title" className="overflow-hidden rounded-2xl border border-rule bg-surface">
      <div className="flex items-center justify-between px-5 pb-3 pt-4">
        <h2 id="todo-title" className="text-base font-semibold">Aandacht nodig</h2>
        {!loading && <span className="font-mono text-xs text-ink-2">{todos.length} open</span>}
      </div>
      {loading && <p className="border-t border-rule px-5 py-6 text-sm text-ink-2">Laden…</p>}
      {!loading && todos.length === 0 && (
        <p className="border-t border-rule px-5 py-6 text-sm text-ink-2">Niets dat op je wacht. Mooi zo.</p>
      )}
      {todos.map((t) => (
        <Link
          key={t.key}
          href={t.href}
          className="group flex min-h-[64px] items-center gap-3.5 border-t border-rule px-5 py-3 transition-colors hover:bg-paper"
        >
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] ${TONE[t.tone]}`}>
            <t.Icon size={18} strokeWidth={1.75} aria-hidden />
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <strong className="text-sm font-semibold">{t.title}</strong>
            <span className="truncate text-[13px] text-ink-2">{t.sub}</span>
          </span>
          <span className="hidden text-[13px] font-semibold sm:inline">{t.action}</span>
          <ChevronRight size={16} className="text-ink-2 sm:hidden" aria-hidden />
        </Link>
      ))}
    </section>
  );
}

function QuickLink({ href, Icon, label, external }: Readonly<{ href: string; Icon: LucideIcon; label: string; external?: boolean }>) {
  const cls = "flex h-11 items-center gap-3 rounded-xl border border-rule bg-surface px-3.5 text-sm font-medium transition-colors hover:bg-paper";
  const inner = (<><Icon size={17} strokeWidth={1.75} aria-hidden />{label}</>);
  return external
    ? <a href={href} target="_blank" rel="noreferrer" className={cls}>{inner}</a>
    : <Link href={href} className={cls}>{inner}</Link>;
}

// ── Pagina ────────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [tournament, setTournament] = useState<ActiveTournament | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [nextEvent, setNextEvent] = useState<{ ev: CalEvent; stats: ShiftStats } | null>(null);
  const [name, setName] = useState("");

  useEffect(() => {
    setName(getTokenPayload()?.username ?? "");

    async function loadTournament() {
      const list = await apiFetch<TournamentListItem[]>("tournaments");
      const pick = list.find((t) => t.isActive) ?? list.find((t) => t.status !== "COMPLETED");
      if (pick) setTournament(await apiFetch<ActiveTournament>(`tournaments/${pick.id}`));
    }
    async function loadEvent() {
      const evs = await apiFetch<CalEvent[]>("content/events/all");
      const upcoming = evs
        .filter((e) => new Date(e.startsAt).getTime() > Date.now())
        .sort((a, b) => a.startsAt.localeCompare(b.startsAt))[0];
      if (upcoming) {
        const stats = await apiFetch<ShiftStats>(`events/${upcoming.id}/portal/stats`);
        setNextEvent({ ev: upcoming, stats });
      }
    }

    Promise.allSettled([
      loadTournament(),
      loadEvent(),
      apiFetch<Registration[]>("registrations").then(setRegistrations),
      apiFetch<ContactMessage[]>("contact/messages").then(setMessages),
    ]).finally(() => setLoading(false));
  }, []);

  // ── Wat wacht er op jou? ──
  const todos: Todo[] = [];
  const pending = registrations.filter((r) => r.status === "PENDING");
  if (pending.length > 0) {
    const oldest = Math.max(...pending.map((r) => daysAgo(r.timestamp)));
    todos.push({
      key: "regs", tone: "pink", Icon: Bike, href: "/admin/inschrijvingen", action: "Beoordelen",
      title: `${pending.length} ${pending.length === 1 ? "inschrijving wacht" : "inschrijvingen wachten"} op goedkeuring`,
      sub: `Dorpelingenkoers · oudste van ${oldest === 0 ? "vandaag" : `${oldest} ${oldest === 1 ? "dag" : "dagen"} geleden`}`,
    });
  }
  if (tournament) {
    const incomplete = tournament.teams.filter((t) => !isComplete(t)).length;
    if (incomplete > 0) {
      todos.push({
        key: "teams", tone: "warn", Icon: Users, href: `/admin/toernooi/${tournament.id}/teams`, action: "Bekijken",
        title: `${incomplete} ${incomplete === 1 ? "team is" : "teams zijn"} onvolledig`,
        sub: `${tournament.name} · minder dan 4 spelers ingevuld`,
      });
    }
  }
  const unread = messages.filter((m) => m.status === "UNREAD");
  if (unread.length > 0) {
    todos.push({
      key: "msgs", tone: "neutral", Icon: Mail, href: "/admin/messages", action: "Openen",
      title: `${unread.length} ${unread.length === 1 ? "ongelezen bericht" : "ongelezen berichten"}`,
      sub: `Laatste: ${unread[0].subject ? `“${unread[0].subject}”` : `van ${unread[0].name}`}`,
    });
  }
  if (nextEvent && nextEvent.stats.total > nextEvent.stats.assigned) {
    const open = nextEvent.stats.total - nextEvent.stats.assigned;
    todos.push({
      key: "shifts", tone: "neutral", Icon: Users, href: "/admin/helpers", action: "Invullen",
      title: `${open} ${open === 1 ? "helperplaats" : "helperplaatsen"} nog open`,
      sub: `${nextEvent.ev.title} · ${fmtDate(nextEvent.ev.startsAt)} · ${nextEvent.stats.assigned} van ${nextEvent.stats.total} ingevuld`,
    });
  }

  const today = new Date().toLocaleDateString("nl-BE", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="mx-auto flex max-w-[1120px] flex-col gap-7">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1.5 text-[13px] text-ink-2 first-letter:uppercase">{today}</p>
          <h1 className="text-[28px] font-semibold tracking-[-0.03em] sm:text-[32px]">
            {greeting()}{name && `, ${name}`}
          </h1>
        </div>
        <a href="/" target="_blank" rel="noreferrer" className="btn-sm btn-sm--ghost">
          <ExternalLink size={16} strokeWidth={1.75} /> Bekijk site
        </a>
      </header>

      {tournament && <EventCard t={tournament} />}

      <div className="flex flex-wrap items-start gap-6">
        <div className="min-w-0 flex-[999_1_480px]">
          <TodoList todos={todos} loading={loading} />
        </div>

        <div className="flex min-w-0 flex-[1_1_280px] flex-col gap-6">
          <section aria-labelledby="quick-title" className="flex flex-col gap-2.5">
            <h2 id="quick-title" className="text-base font-semibold">Snel</h2>
            {tournament && <QuickLink href={`/admin/toernooi/${tournament.id}/teams`} Icon={UserPlus} label="Team toevoegen" />}
            <QuickLink href="/admin/news" Icon={Newspaper} label="Nieuwsbericht schrijven" />
            <QuickLink href="/admin/uitnodigingen" Icon={Mail} label="Uitnodiging maken" />
            {tournament && <QuickLink href={`/tv/${tournament.id}`} Icon={Tv} label="TV-scherm openen" external />}
          </section>

          {messages.length > 0 && (
            <section aria-labelledby="msg-title" className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h2 id="msg-title" className="text-base font-semibold">Recente berichten</h2>
                <Link href="/admin/messages" className="text-[13px] font-semibold text-ink-2 hover:text-ink">Alle</Link>
              </div>
              <ul className="flex flex-col gap-3 text-[13px]">
                {messages.slice(0, 4).map((m) => (
                  <li key={m.id} className="flex gap-2.5">
                    <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${m.status === "UNREAD" ? "bg-pink" : "bg-rule"}`} aria-hidden />
                    <span className="min-w-0 flex-1 text-ink-2">
                      <strong className="font-semibold text-ink">{m.name}</strong>
                      {m.subject && <span className="block truncate">{m.subject}</span>}
                    </span>
                    <span className="font-mono text-ink-2">{fmtDate(m.createdAt)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
