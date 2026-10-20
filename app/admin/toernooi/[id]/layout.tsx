"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExternalLink, Tv, Zap } from "lucide-react";
import { apiFetch } from "@/lib/api";
import type { ActiveTournament } from "@/lib/tournament-types";
import { TOURNAMENT_PHASES, tournamentPhase } from "@/lib/tournament-phase";
import { TournamentProvider } from "./tournament-context";
import { TiebreakBanner } from "./tiebreak-banner";

const SECTIONS = [
  { slug: "", label: "Overzicht" },
  { slug: "teams", label: "Teams" },
  { slug: "schema", label: "Poules & schema" },
  { slug: "scores", label: "Scores" },
  { slug: "communicatie", label: "Communicatie" },
  { slug: "instellingen", label: "Instellingen" },
] as const;

export default function TournamentLayout({
  params,
  children,
}: Readonly<{ params: Promise<{ id: string }>; children: React.ReactNode }>) {
  const { id } = use(params);
  const pathname = usePathname();
  const [tournament, setTournament] = useState<ActiveTournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  const reload = useCallback(async () => {
    try {
      setTournament(await apiFetch<ActiveTournament>(`tournaments/${id}`));
      setFetchError("");
    } catch (e) {
      setFetchError(e instanceof Error ? e.message : "Niet gevonden.");
    }
  }, [id]);

  useEffect(() => {
    reload().finally(() => setLoading(false));
  }, [reload]);

  if (loading) return <p className="admin-empty">Laden…</p>;
  if (fetchError || !tournament) {
    return <p className="admin-empty" style={{ color: "var(--err-fg)" }}>{fetchError || "Toernooi niet gevonden."}</p>;
  }

  const base = `/admin/toernooi/${tournament.id}`;
  const phase = tournamentPhase(tournament);

  // Eventdag-modus: eigen, compacte kop voor op de gsm.
  if (pathname.startsWith(`${base}/eventdag`)) {
    return (
      <TournamentProvider value={{ tournament, setTournament, reload }}>
        <div className="mx-auto flex min-w-0 max-w-[640px] flex-col gap-4">
          <TiebreakBanner />
          {children}
        </div>
      </TournamentProvider>
    );
  }

  return (
    <TournamentProvider value={{ tournament, setTournament, reload }}>
      <div className="mx-auto flex min-w-0 max-w-[1120px] flex-col gap-6">
        <header className="flex flex-col gap-3.5">
          <nav aria-label="Kruimelpad" className="text-[13px] text-ink-2">
            <Link href="/admin/toernooi" className="hover:text-ink">Toernooien</Link>
            <span aria-hidden className="mx-1.5">/</span>
            {tournament.year}
          </nav>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-[28px] font-semibold tracking-[-0.03em] sm:text-[30px]">{tournament.name}</h1>
              <span className="inline-flex items-center gap-2 rounded-full bg-pink-soft px-2.5 py-1 text-xs font-semibold text-pink-ink">
                {phase === 3 ? <span className="t-live-dot" /> : <span className="h-1.5 w-1.5 rounded-full bg-pink" />}
                {TOURNAMENT_PHASES[phase]}
              </span>
              {!tournament.isActive && <span className="badge badge--gray">Niet actief</span>}
            </div>
            <div className="flex flex-wrap gap-2">
              {/* Op gsm enkel de eventdag-knop: tv en publieke pagina open je niet van daar. */}
              <span className="sm:hidden">
                <Link href={`${base}/eventdag`} className="btn-sm btn-sm--primary">
                  <Zap size={16} strokeWidth={1.75} /> Eventdag-modus
                </Link>
              </span>
              <span className="flex gap-2 max-sm:hidden">
                <Link href={`${base}/eventdag`} className="btn-sm btn-sm--ghost">
                  <Zap size={16} strokeWidth={1.75} /> Eventdag
                </Link>
                <a href={`/toernooi/${tournament.id}`} target="_blank" rel="noreferrer" className="btn-sm btn-sm--ghost">
                  <ExternalLink size={16} strokeWidth={1.75} /> Publieke pagina
                </a>
                <a
                  href={`/tv/${tournament.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-sm btn-sm--primary"
                  title="Open op de laptop aan de tv en druk F voor volledig scherm"
                >
                  <Tv size={16} strokeWidth={1.75} /> TV-scherm
                </a>
              </span>
            </div>
          </div>

          <nav aria-label="Toernooi onderdelen" className="-mx-1 flex gap-7 overflow-x-auto border-b border-rule px-1">
            {SECTIONS.map((s) => {
              const href = s.slug ? `${base}/${s.slug}` : base;
              const active = s.slug ? pathname.startsWith(href) : pathname === base;
              return (
                <Link
                  key={s.slug}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`-mb-px inline-flex h-11 shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-0.5 text-sm transition-colors ${
                    active ? "border-pink font-semibold text-ink" : "border-transparent text-ink-2 hover:text-ink"
                  }`}
                >
                  {s.label}
                  {s.slug === "teams" && (
                    <span className="font-mono text-xs font-normal text-ink-2">{tournament.teams.length}</span>
                  )}
                </Link>
              );
            })}
          </nav>
        </header>

        <TiebreakBanner />

        {/* min-w-0: brede tabellen scrollen binnen hun kaart i.p.v. de pagina op te rekken */}
        <div className="min-w-0">{children}</div>
      </div>
    </TournamentProvider>
  );
}
