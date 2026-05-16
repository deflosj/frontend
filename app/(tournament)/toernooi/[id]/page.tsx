import Link from "next/link";
import { notFound } from "next/navigation";

import { getTournament, saldoClass, sortStandings } from "@/lib/tournament-helpers";
import { PHASE_LABELS, Phase } from "@/lib/tournament-types";
import { MatchBlock } from "./_shared";

export default async function TournamentOverviewPage({
  params,
}: Readonly<{
  params: Promise<{ id: string }>;
}>) {
  const { id } = await params;
  const tournament = await getTournament(id);
  if (!tournament) notFound();

  const { name, year, isActive, poules, teams, matches } = tournament;

  const played = matches.filter((m) => m.scoreA !== null);
  const upcoming = matches
    .filter((m) => m.scoreA === null && m.teamAId && m.teamBId)
    .sort((a, b) => new Date(a.time ?? 0).getTime() - new Date(b.time ?? 0).getTime());

  const recentResults = [...played]
    .sort((a, b) => new Date(b.time ?? 0).getTime() - new Date(a.time ?? 0).getTime())
    .slice(0, 6);

  const nextMatches = upcoming.slice(0, 6);

  const groupPoules = poules.filter((p) => p.phase === "GROUP");
  const progress = matches.length > 0 ? Math.round((played.length / matches.length) * 100) : 0;

  const knockoutPhase = (["FINAL", "SEMI", "QUARTER", "R8", "R16"] as Phase[]).find((p) =>
    matches.some((m) => m.phase === p)
  );

  return (
    <div className="flex flex-col gap-10">

      {/* ── Tournament hero ───────────────────────────────────── */}
      <div>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="text-[0.6875rem] font-semibold uppercase tracking-widest text-pink">
            {year}
          </span>
          {isActive && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-pink px-2.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-white">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />{"Live"}
            </span>
          )}
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">{name}</h1>
      </div>

      {/* ── Progress ──────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-rule bg-surface px-6 py-5">
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <p className="text-sm font-semibold text-ink">
            <span className="text-2xl font-bold tabular-nums text-ink">{played.length}</span>
            <span className="ml-1.5 text-ink-2">/ {matches.length} wedstrijden gespeeld</span>
          </p>
          <span className="shrink-0 text-sm font-bold tabular-nums text-pink">{progress}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-rule">
          <div
            className="h-full rounded-full bg-pink transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { value: teams.length, label: "Teams" },
            { value: groupPoules.length, label: "Poules" },
            { value: played.length, label: "Gespeeld" },
            { value: upcoming.length, label: "Te spelen" },
          ].map(({ value, label }) => (
            <div key={label} className="rounded-xl bg-paper px-3 py-3 text-center">
              <p className="text-xl font-bold tabular-nums text-ink">{value}</p>
              <p className="text-[0.6rem] font-semibold uppercase tracking-widest text-muted">
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Knockout status ───────────────────────────────────── */}
      {knockoutPhase && (
        <div className="flex items-center justify-between rounded-2xl border border-pink/20 bg-pink-soft px-6 py-4">
          <div>
            <p className="text-[0.625rem] font-semibold uppercase tracking-widest text-pink">
              Huidige fase
            </p>
            <p className="mt-0.5 font-bold text-ink">{PHASE_LABELS[knockoutPhase]}</p>
          </div>
          <Link
            href={`/toernooi/${id}/brackets`}
            className="rounded-full bg-pink px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-pink/85"
          >
            Bekijk bracket →
          </Link>
        </div>
      )}

      {/* ── Recent results + upcoming ─────────────────────────── */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Recent results */}
        {recentResults.length > 0 && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-widest text-muted">
                Recente resultaten
              </h2>
              <Link
                href={`/toernooi/${id}/matches`}
                className="text-xs font-semibold text-pink hover:underline"
              >
                Alle wedstrijden →
              </Link>
            </div>
            <div className="flex flex-col gap-2">
              {recentResults.map((m) => (
                <MatchBlock key={m.id} match={m} teams={teams} />
              ))}
            </div>
          </div>
        )}

        {/* Upcoming */}
        {nextMatches.length > 0 && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-widest text-muted">
                Volgende wedstrijden
              </h2>
              <Link
                href={`/toernooi/${id}/matches`}
                className="text-xs font-semibold text-pink hover:underline"
              >
                Alle wedstrijden →
              </Link>
            </div>
            <div className="flex flex-col gap-2">
              {nextMatches.map((m) => (
                <MatchBlock key={m.id} match={m} teams={teams} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Standings snapshot ────────────────────────────────── */}
      {groupPoules.length > 0 && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-widest text-muted">Standen</h2>
            <Link
              href={`/toernooi/${id}/poules`}
              className="text-xs font-semibold text-pink hover:underline"
            >
              Volledige standen →
            </Link>
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
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
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-rule text-xs font-semibold uppercase tracking-widest text-muted">
                        <th className="py-2 pl-4 pr-2 text-center">#</th>
                        <th className="px-2 py-2 text-left">Team</th>
                        <th className="px-2 py-2 text-center">G</th>
                        <th className="hidden px-2 py-2 text-center sm:table-cell">Sal</th>
                        <th className="px-2 py-2 pr-4 text-center">Pts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pouleTeams.map((team, i) => (
                        <tr
                          key={team.id}
                          className="border-b border-rule/50 last:border-0 hover:bg-surface"
                        >
                          <td className="py-2.5 pl-4 pr-2 text-center tabular-nums text-muted">
                            {i + 1}
                          </td>
                          <td className="px-2 py-2.5 font-medium text-ink">{team.name}</td>
                          <td className="px-2 py-2.5 text-center tabular-nums text-ink-2">
                            {team.played}
                          </td>
                          <td
                            className={`hidden px-2 py-2.5 text-center tabular-nums font-medium sm:table-cell ${saldoClass(team.saldo)}`}
                          >
                            {team.saldo > 0 ? `+${team.saldo}` : team.saldo}
                          </td>
                          <td className="px-2 py-2.5 pr-4 text-center tabular-nums font-bold text-ink">
                            {team.points}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
