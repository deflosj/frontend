import Link from "next/link";
import { notFound } from "next/navigation";

import { getTournament, sortStandings, teamName } from "@/lib/tournament-helpers";
import { PHASE_LABELS, Phase } from "@/lib/tournament-types";
import { MatchBlock, SectionHead, StandingsLegend, StandingsTable } from "./_shared";

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
    .sort((a, b) => new Date(a.scheduledAt ?? 0).getTime() - new Date(b.scheduledAt ?? 0).getTime());

  const recentResults = [...played]
    .sort((a, b) => new Date(b.scheduledAt ?? 0).getTime() - new Date(a.scheduledAt ?? 0).getTime())
    .slice(0, 6);

  const nextMatches = upcoming.slice(0, 6);

  const groupPoules = poules.filter((p) => p.phase === "GROUP_STAGE");
  const progress = matches.length > 0 ? Math.round((played.length / matches.length) * 100) : 0;

  const knockoutPhase = (["FINAL", "SEMI_FINAL", "QUARTER_FINAL", "ROUND_OF_16", "ROUND_OF_32"] as Phase[]).find((p) =>
    matches.some((m) => m.phase === p)
  );

  // Naam van de wedstrijd(en) in de huidige fase — "Finale · A vs B"
  const phaseMatches = knockoutPhase ? matches.filter((m) => m.phase === knockoutPhase) : [];
  const phaseSubject =
    phaseMatches.length === 1 && phaseMatches[0].teamAId && phaseMatches[0].teamBId
      ? `${teamName(teams, phaseMatches[0].teamAId)} vs ${teamName(teams, phaseMatches[0].teamBId)}`
      : `${phaseMatches.length} ${phaseMatches.length === 1 ? "wedstrijd" : "wedstrijden"}`;

  const poulenaam = (pouleId: number | null) =>
    poules.find((p) => p.id === pouleId)?.name ?? undefined;

  const matchLabel = (phase: Phase, pouleId: number | null) =>
    phase === "GROUP_STAGE" ? poulenaam(pouleId) : PHASE_LABELS[phase];

  const alleWedstrijden = (
    <Link
      href={`/toernooi/${id}/matches`}
      className="text-xs font-semibold text-pink hover:underline"
    >
      Alle wedstrijden →
    </Link>
  );

  return (
    <div className="flex flex-col gap-9">
      {/* ── Tournament hero ───────────────────────────────────── */}
      <div>
        <div className="mb-2 flex flex-wrap items-center gap-2.5">
          <span className="text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-pink">
            {year}
          </span>
          {isActive && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-pink px-2.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-white">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
              {"Live"}
            </span>
          )}
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">{name}</h1>
      </div>

      {/* ── Progress ──────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-rule bg-surface px-6 py-5">
        <div className="mb-3.5 flex items-baseline justify-between gap-4">
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
              <p className="mt-0.5 text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-ink-2">
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Knockout status ───────────────────────────────────── */}
      {knockoutPhase && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-pink/20 bg-pink-soft px-6 py-4">
          <div className="min-w-0">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-pink">
              Huidige fase
            </p>
            <p className="mt-0.5 font-bold text-ink">
              {PHASE_LABELS[knockoutPhase]} · {phaseSubject}
            </p>
          </div>
          <Link
            href={`/toernooi/${id}/brackets`}
            className="shrink-0 rounded-full bg-pink px-[18px] py-2 text-xs font-bold text-white transition-colors hover:bg-pink/85"
          >
            Bekijk bracket →
          </Link>
        </div>
      )}

      {/* ── Recent results + upcoming ─────────────────────────── */}
      <div className="grid gap-8 lg:grid-cols-2">
        {recentResults.length > 0 && (
          <div>
            <SectionHead title="Recente resultaten" action={alleWedstrijden} />
            <div className="flex flex-col gap-2">
              {recentResults.map((m) => (
                <MatchBlock
                  key={m.id}
                  match={m}
                  teams={teams}
                  label={matchLabel(m.phase, m.pouleId)}
                />
              ))}
            </div>
          </div>
        )}

        {nextMatches.length > 0 && (
          <div>
            <SectionHead title="Volgende wedstrijden" action={alleWedstrijden} />
            <div className="flex flex-col gap-2">
              {nextMatches.map((m, i) => (
                <MatchBlock
                  key={m.id}
                  match={m}
                  teams={teams}
                  label={matchLabel(m.phase, m.pouleId)}
                  highlight={i === 0}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Standings snapshot ────────────────────────────────── */}
      {groupPoules.length > 0 && (
        <div>
          <SectionHead
            title="Standen"
            action={
              <Link
                href={`/toernooi/${id}/poules`}
                className="text-xs font-semibold text-pink hover:underline"
              >
                Volledige standen →
              </Link>
            }
          />
          <div className="grid gap-5 xl:grid-cols-2">
            {groupPoules.map((poule) => {
              const pouleTeams = sortStandings(teams.filter((t) => t.pouleId === poule.id));
              if (!pouleTeams.length) return null;
              return (
                <div
                  key={poule.id}
                  className="overflow-hidden rounded-2xl border border-rule bg-surface"
                >
                  <div className="flex items-baseline justify-between gap-3 border-b border-rule px-3.5 py-3">
                    <h3 className="text-[0.9375rem] font-bold text-ink">{poule.name}</h3>
                    {poule.description && (
                      <p className="truncate text-[0.7rem] text-ink-2">{poule.description}</p>
                    )}
                  </div>
                  <StandingsTable teams={pouleTeams} variant="compact" />
                  <StandingsLegend />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
