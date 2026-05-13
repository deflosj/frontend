import type { Metadata } from "next";
import Link from "next/link";

import {
  ActiveTournament,
  PHASE_LABELS,
  PHASE_ORDER,
  Phase,
  TournamentMatch,
  TournamentPoule,
  TournamentTeam,
} from "@/lib/tournament-types";

// ── Types ─────────────────────────────────────────────────────────────────────

type Tab = "standen" | "wedstrijden" | "finale" | "teams" | "reglement";
const TABS: { key: Tab; label: string }[] = [
  { key: "standen", label: "Standen" },
  { key: "wedstrijden", label: "Wedstrijden" },
  { key: "finale", label: "Finale" },
  { key: "teams", label: "Teams" },
  { key: "reglement", label: "Reglement" },
];

// ── Data ──────────────────────────────────────────────────────────────────────

async function getTournament(id: string): Promise<ActiveTournament | null> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";
  try {
    const res = await fetch(`${base}/tournaments/${id}`, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json() as Promise<ActiveTournament>;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const t = await getTournament(id);
  return {
    title: t ? `${t.name} | Toernooi` : "Toernooi",
    description: t ? `Standen, wedstrijden en finale van ${t.name}.` : undefined,
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function sortStandings(teams: TournamentTeam[]): TournamentTeam[] {
  return [...teams].sort(
    (a, b) => b.points - a.points || b.saldo - a.saldo || b.goalsFor - a.goalsFor
  );
}

function teamName(teams: TournamentTeam[], id: number | null): string {
  if (!id) return "TBD";
  return teams.find((t) => t.id === id)?.name ?? "TBD";
}

function fmt(iso: string): string {
  return new Date(iso).toLocaleTimeString("nl-BE", { hour: "2-digit", minute: "2-digit" });
}

function saldoClass(saldo: number): string {
  if (saldo > 0) return "text-green-600";
  if (saldo < 0) return "text-red-500";
  return "text-muted";
}

function matchSideClass(isPlayed: boolean, isWinner: boolean): string {
  if (isPlayed && isWinner) return "text-ink";
  if (isPlayed) return "text-muted";
  return "text-ink-2";
}

// ── Shared match block ────────────────────────────────────────────────────────

function MatchBlock({
  match,
  teams,
  size = "sm",
}: Readonly<{
  match: TournamentMatch | undefined;
  teams: TournamentTeam[];
  size?: "sm" | "lg";
}>) {
  if (!match) {
    return (
      <div className="rounded-xl border border-dashed border-rule bg-surface px-4 py-5 text-center text-xs text-muted">
        Nog geen match
      </div>
    );
  }

  const nameA = teamName(teams, match.teamAId);
  const nameB = teamName(teams, match.teamBId);
  const isPlayed = match.scoreA !== null && match.scoreB !== null;
  const winnerA = isPlayed && match.scoreA! > match.scoreB!;
  const winnerB = isPlayed && match.scoreB! > match.scoreA!;
  const classA = matchSideClass(isPlayed, winnerA);
  const classB = matchSideClass(isPlayed, winnerB);
  const textSize = size === "lg" ? "text-base" : "text-sm";
  const scoreSize = size === "lg" ? "text-xl" : "text-base";

  return (
    <div className="rounded-xl border border-rule bg-surface px-4 py-4">
      {match.track !== null && (
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted">
          Baan {match.track} · {fmt(match.time)}
        </p>
      )}
      <div className="flex items-center gap-3">
        <span className={`flex-1 text-right font-semibold ${textSize} ${classA}`}>{nameA}</span>
        {isPlayed ? (
          <span
            className={`min-w-14 shrink-0 text-center font-bold tabular-nums ${scoreSize} text-ink`}
          >
            {match.scoreA} – {match.scoreB}
          </span>
        ) : (
          <span className="min-w-14 shrink-0 text-center text-sm font-medium text-muted">
            vs
          </span>
        )}
        <span className={`flex-1 font-semibold ${textSize} ${classB}`}>{nameB}</span>
      </div>
    </div>
  );
}

// ── Tab: Standen ──────────────────────────────────────────────────────────────

function TabStanden({
  poules,
  teams,
}: Readonly<{ poules: TournamentPoule[]; teams: TournamentTeam[] }>) {
  const groupPoules = poules.filter((p) => p.phase === "GROUP");
  if (!groupPoules.length) {
    return <Empty text="Nog geen poules of teams ingevoerd." />;
  }

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      {groupPoules.map((poule) => {
        const pouleTeams = sortStandings(teams.filter((t) => t.pouleId === poule.id));
        if (!pouleTeams.length) return null;
        return (
          <div key={poule.id} className="overflow-hidden rounded-2xl border border-rule">
            <div className="border-b border-rule bg-surface px-4 py-3">
              <h3 className="font-bold text-ink">{poule.name}</h3>
              {poule.description && (
                <p className="mt-0.5 text-xs text-muted">{poule.description}</p>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-rule text-xs font-semibold uppercase tracking-widest text-muted">
                    <th className="py-2.5 pl-4 pr-2 text-center">#</th>
                    <th className="px-2 py-2.5 text-left">Team</th>
                    <th className="px-2 py-2.5 text-center">G</th>
                    <th className="px-2 py-2.5 text-center">W</th>
                    <th className="hidden px-2 py-2.5 text-center sm:table-cell">GL</th>
                    <th className="px-2 py-2.5 text-center">V</th>
                    <th className="hidden px-2 py-2.5 text-center sm:table-cell">V+</th>
                    <th className="hidden px-2 py-2.5 text-center sm:table-cell">V-</th>
                    <th className="hidden px-2 py-2.5 text-center sm:table-cell">Sal</th>
                    <th className="px-2 py-2.5 pr-4 text-center">Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {pouleTeams.map((team, i) => (
                    <tr
                      key={team.id}
                      className="border-b border-rule/50 last:border-0 hover:bg-surface"
                    >
                      <td className="py-3 pl-4 pr-2 text-center tabular-nums text-muted">{i + 1}</td>
                      <td className="px-2 py-3 font-medium text-ink">{team.name}</td>
                      <td className="px-2 py-3 text-center tabular-nums text-ink-2">{team.played}</td>
                      <td className="px-2 py-3 text-center tabular-nums text-ink-2">{team.won}</td>
                      <td className="hidden px-2 py-3 text-center tabular-nums text-ink-2 sm:table-cell">{team.drawn}</td>
                      <td className="px-2 py-3 text-center tabular-nums text-ink-2">{team.lost}</td>
                      <td className="hidden px-2 py-3 text-center tabular-nums text-ink-2 sm:table-cell">{team.goalsFor}</td>
                      <td className="hidden px-2 py-3 text-center tabular-nums text-ink-2 sm:table-cell">{team.goalsAgainst}</td>
                      <td className={`hidden px-2 py-3 text-center tabular-nums font-medium sm:table-cell ${saldoClass(team.saldo)}`}>
                        {team.saldo > 0 ? `+${team.saldo}` : team.saldo}
                      </td>
                      <td className="px-2 py-3 pr-4 text-center tabular-nums font-bold text-ink">
                        {team.points}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Tab: Wedstrijden ──────────────────────────────────────────────────────────

function TabWedstrijden({
  matches,
  teams,
}: Readonly<{ matches: TournamentMatch[]; teams: TournamentTeam[] }>) {
  if (!matches.length) return <Empty text="Nog geen wedstrijden ingevoerd." />;

  const phases = PHASE_ORDER.filter((p) => matches.some((m) => m.phase === p));

  return (
    <div className="flex flex-col gap-10">
      {phases.map((phase) => {
        const phaseMatches = matches
          .filter((m) => m.phase === phase)
          .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
        return (
          <div key={phase}>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-widest text-muted">
              {PHASE_LABELS[phase]}
            </h3>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {phaseMatches.map((m) => (
                <MatchBlock key={m.id} match={m} teams={teams} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Tab: Finale (bracket) ─────────────────────────────────────────────────────

function TabFinale({
  matches,
  teams,
}: Readonly<{ matches: TournamentMatch[]; teams: TournamentTeam[] }>) {
  const knockoutPhases = new Set<Phase>(["R16", "R8", "QUARTER", "SEMI", "CONSOLATION_FINAL", "FINAL", "TIEBREAK"]);
  const hasKnockout = matches.some((m) => knockoutPhases.has(m.phase));

  if (!hasKnockout) {
    return <Empty text="De knockoutfase is nog niet begonnen." />;
  }

  const byPos = (pos: string) => matches.find((m) => m.bracketPos === pos);
  const byPhase = (phase: Phase) => matches.filter((m) => m.phase === phase);

  const final = byPos("F1");
  const sf1 = byPos("SF1");
  const sf2 = byPos("SF2");
  const consolation = byPos("CF1");

  let finalWinnerId: number | null = final?.winnerId ?? null;
  if (!finalWinnerId && final && final.scoreA !== null && final.scoreB !== null) {
    finalWinnerId = final.scoreA > final.scoreB ? (final.teamAId ?? null) : (final.teamBId ?? null);
  }
  const winnerName = finalWinnerId ? teamName(teams, finalWinnerId) : null;

  const earlyRounds = (["R16", "R8", "QUARTER"] as Phase[]).filter((p) =>
    matches.some((m) => m.phase === p)
  );

  return (
    <div className="flex flex-col gap-10">
      {/* Winner banner */}
      {winnerName && (
        <div className="rounded-2xl border border-pink/30 bg-pink-soft px-6 py-5 text-center">
          <p className="mb-1 text-[0.6875rem] font-semibold uppercase tracking-widest text-pink">
            Winnaar
          </p>
          <p className="text-2xl font-bold text-ink">🏆 {winnerName}</p>
        </div>
      )}

      {/* Earlier rounds */}
      {earlyRounds.map((phase) => (
        <div key={phase}>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-widest text-muted">
            {PHASE_LABELS[phase]}
          </h3>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {byPhase(phase).map((m) => (
              <MatchBlock key={m.id} match={m} teams={teams} />
            ))}
          </div>
        </div>
      ))}

      {/* Semi-finals + Final bracket */}
      {(sf1 ?? sf2 ?? final) && (
        <div>
          <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-muted">
            Halve finales &amp; Finale
          </h3>
          <div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr]">
            {/* Left: semis */}
            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted">
                Halve finales
              </p>
              <MatchBlock match={sf1} teams={teams} />
              <MatchBlock match={sf2} teams={teams} />
            </div>

            {/* Connector */}
            <div className="hidden items-center justify-center lg:flex">
              <div className="flex flex-col items-center gap-1 text-rule">
                <div className="h-16 w-px bg-rule" />
                <span className="text-xs text-muted">→</span>
                <div className="h-16 w-px bg-rule" />
              </div>
            </div>

            {/* Right: Final */}
            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-pink">
                Finale
              </p>
              <MatchBlock match={final} teams={teams} size="lg" />
            </div>
          </div>
        </div>
      )}

      {/* Consolation final */}
      {consolation && (
        <div>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-widest text-muted">
            Troostfinale
          </h3>
          <div className="max-w-sm">
            <MatchBlock match={consolation} teams={teams} />
          </div>
        </div>
      )}

      {/* Tiebreaker */}
      {byPhase("TIEBREAK").length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-widest text-muted">
            Tiebreaker
          </h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {byPhase("TIEBREAK").map((m) => (
              <MatchBlock key={m.id} match={m} teams={teams} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tab: Teams ────────────────────────────────────────────────────────────────

function TabTeams({
  teams,
  poules,
}: Readonly<{ teams: TournamentTeam[]; poules: TournamentPoule[] }>) {
  if (!teams.length) return <Empty text="Nog geen teams ingeschreven." />;

  const byPoule = poules
    .filter((p) => p.phase === "GROUP")
    .map((poule) => ({
      poule,
      teams: sortStandings(teams.filter((t) => t.pouleId === poule.id)),
    }))
    .filter((g) => g.teams.length > 0);

  const noPoule = teams.filter((t) => !t.pouleId);

  return (
    <div className="flex flex-col gap-10">
      {byPoule.map(({ poule, teams: pouleTeams }) => (
        <div key={poule.id}>
          <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-muted">
            {poule.name}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {pouleTeams.map((team) => (
              <TeamCard key={team.id} team={team} />
            ))}
          </div>
        </div>
      ))}
      {noPoule.length > 0 && (
        <div>
          <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-muted">
            Overige teams
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {noPoule.map((team) => (
              <TeamCard key={team.id} team={team} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TeamCard({ team }: Readonly<{ team: TournamentTeam }>) {
  return (
    <div className="rounded-2xl border border-rule bg-surface px-5 py-4">
      <div className="mb-2 flex items-start justify-between gap-2">
        <h4 className="font-semibold text-ink">{team.name}</h4>
        {team.isPresent && (
          <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
            Aanwezig
          </span>
        )}
      </div>
      <p className="mb-2 text-[0.625rem] font-semibold uppercase tracking-widest text-pink">
        Kapitein: {team.captainName}
      </p>
      <div className="flex flex-col gap-0.5">
        {[team.speler1, team.speler2, team.speler3, team.speler4].map((speler) => (
          <p key={speler} className="text-xs text-muted">
            {speler}
          </p>
        ))}
      </div>
    </div>
  );
}

// ── Tab: Reglement ────────────────────────────────────────────────────────────

function TabReglement({ rules }: Readonly<{ rules: { description: string } | null }>) {
  if (!rules) return <Empty text="Nog geen reglement toegevoegd." />;
  return (
    <div className="max-w-2xl rounded-2xl border border-rule bg-surface px-6 py-5">
      <p className="whitespace-pre-line text-sm leading-relaxed text-ink-2">
        {rules.description}
      </p>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function Empty({ text }: Readonly<{ text: string }>) {
  return <p className="text-sm text-muted">{text}</p>;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function TournamentDetailPage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}>) {
  const { id } = await params;
  const { tab: rawTab } = await searchParams;
  const tab: Tab =
    (["standen", "wedstrijden", "finale", "teams", "reglement"] as Tab[]).find(
      (t) => t === rawTab
    ) ?? "standen";

  const tournament = await getTournament(id);

  if (!tournament) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-5">
        <div className="text-center">
          <h1 className="mb-3 text-2xl font-bold text-ink">Toernooi niet gevonden</h1>
          <Link href="/toernooi" className="text-sm font-semibold text-pink hover:underline">
            ← Terug naar overzicht
          </Link>
        </div>
      </div>
    );
  }

  const { poules, teams, matches, rules } = tournament;
  const playedCount = matches.filter((m) => m.scoreA !== null).length;

  return (
    <div>
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="border-b border-rule">
        <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
          <Link
            href="/toernooi"
            className="mb-4 inline-flex items-center gap-1 text-xs font-semibold text-muted hover:text-ink"
          >
            ← Alle toernooien
          </Link>

          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="mb-2 text-[0.6875rem] font-semibold uppercase tracking-widest text-pink">
                {tournament.year}
                {tournament.isActive && (
                  <span className="ml-2 rounded-full bg-pink px-2 py-0.5 text-white">
                    Actief
                  </span>
                )}
              </p>
              <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
                {tournament.name}
              </h1>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-ink-2">
              <span>
                <strong className="tabular-nums text-ink">{teams.length}</strong> teams
              </span>
              <span>
                <strong className="tabular-nums text-ink">{poules.length}</strong> poules
              </span>
              <span>
                <strong className="tabular-nums text-ink">{playedCount}</strong>/
                {matches.length} gespeeld
              </span>
            </div>
          </div>

          {/* Tab bar */}
          <div className="mt-6 flex gap-1 overflow-x-auto">
            {TABS.map(({ key, label }) => (
              <Link
                key={key}
                href={`/toernooi/${id}?tab=${key}`}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  tab === key
                    ? "bg-ink text-paper"
                    : "text-ink-2 hover:bg-ink/5 hover:text-ink"
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tab content ────────────────────────────────────── */}
      <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
        {tab === "standen" && <TabStanden poules={poules} teams={teams} />}
        {tab === "wedstrijden" && <TabWedstrijden matches={matches} teams={teams} />}
        {tab === "finale" && <TabFinale matches={matches} teams={teams} />}
        {tab === "teams" && <TabTeams teams={teams} poules={poules} />}
        {tab === "reglement" && <TabReglement rules={rules} />}
      </div>
    </div>
  );
}
