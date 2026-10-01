import Link from "next/link";
import { notFound } from "next/navigation";

import { getTournament, saldoClass, sortStandings } from "@/lib/tournament-helpers";
import { PHASE_LABELS, Phase } from "@/lib/tournament-types";
import { MatchBlock, SectionHead } from "../../_shared";

function Stat({
  value,
  label,
  tint = false,
  valueClass = "text-ink",
}: Readonly<{ value: React.ReactNode; label: string; tint?: boolean; valueClass?: string }>) {
  return (
    <div
      className={`rounded-xl border px-4 py-4 text-center ${
        tint ? "border-pink/20 bg-pink-soft" : "border-rule bg-surface"
      }`}
    >
      <p className={`text-2xl font-bold tabular-nums ${valueClass}`}>{value}</p>
      <p
        className={`mt-1 ${
          tint
            ? "text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-pink"
            : "text-xs text-ink-2"
        }`}
      >
        {label}
      </p>
    </div>
  );
}

export default async function TeamDetailPage({
  params,
}: Readonly<{
  params: Promise<{ id: string; teamId: string }>;
}>) {
  const { id, teamId } = await params;
  const tournament = await getTournament(id);
  if (!tournament) notFound();

  const { teams, matches, poules } = tournament;
  const team = teams.find((t) => t.id === Number(teamId));
  if (!team) notFound();

  const poule = poules.find((p) => p.id === team.pouleId);
  const pouleTeams = poule ? sortStandings(teams.filter((t) => t.pouleId === poule.id)) : [];
  const standing = pouleTeams.findIndex((t) => t.id === team.id) + 1;

  const teamMatches = matches
    .filter((m) => m.teamAId === team.id || m.teamBId === team.id)
    .sort((a, b) => new Date(a.scheduledAt ?? 0).getTime() - new Date(b.scheduledAt ?? 0).getTime());

  const spelers = [team.speler1, team.speler2, team.speler3, team.speler4].filter(Boolean);
  const chips = spelers.includes(team.captainName)
    ? spelers
    : [team.captainName, ...spelers];

  const label = (phase: Phase, mPouleId: number | null) =>
    phase === "GROUP_STAGE" ? poules.find((p) => p.id === mPouleId)?.name : PHASE_LABELS[phase];

  return (
    <div className="flex flex-col gap-8">
      <Link
        href={`/toernooi/${id}/teams`}
        className="self-start text-[0.8125rem] font-semibold text-ink-2 transition-colors hover:text-ink"
      >
        ← Alle teams
      </Link>

      {/* Team hero */}
      <div className="rounded-2xl border border-rule bg-surface px-6 py-6">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            {poule && (
              <p className="mb-1 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-pink">
                {poule.name}
                {standing > 0 && ` · #${standing}`}
              </p>
            )}
            <h2 className="text-2xl font-bold text-ink">{team.name}</h2>
          </div>
          {team.isPresent && (
            <span className="shrink-0 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
              Aanwezig
            </span>
          )}
        </div>

        <p className="mb-2 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-ink-2">
          Spelers
        </p>
        <div className="flex flex-wrap gap-2">
          {chips.map((speler, i) => {
            const isCaptain = speler === team.captainName;
            return (
              <span
                key={`${speler}-${i}`}
                className={`rounded-full border px-3.5 py-1.5 text-[0.8125rem] ${
                  isCaptain
                    ? "border-pink/20 bg-pink-soft font-semibold text-ink"
                    : "border-rule text-ink-2"
                }`}
              >
                {speler}
                {isCaptain && " · kapitein"}
              </span>
            );
          })}
        </div>
      </div>

      {/* Stats */}
      {team.played > 0 && (
        <div>
          <SectionHead title="Statistieken · poulefase" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat value={team.played} label="Gespeeld" />
            <Stat value={team.won} label="Gewonnen" />
            <Stat value={team.drawn} label="Gelijk" />
            <Stat value={team.lost} label="Verloren" />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat value={team.goalsFor} label="Punten voor" />
            <Stat value={team.goalsAgainst} label="Punten tegen" />
            <Stat
              value={team.saldo > 0 ? `+${team.saldo}` : team.saldo}
              label="Saldo"
              valueClass={saldoClass(team.saldo)}
            />
            <Stat value={team.points} label="Punten poule" tint />
          </div>
        </div>
      )}

      {/* Matches */}
      {teamMatches.length > 0 && (
        <div>
          <SectionHead title="Wedstrijden" />
          <div className="grid gap-3 sm:grid-cols-2">
            {teamMatches.map((m) => (
              <MatchBlock
                key={m.id}
                match={m}
                teams={teams}
                label={label(m.phase, m.pouleId)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
