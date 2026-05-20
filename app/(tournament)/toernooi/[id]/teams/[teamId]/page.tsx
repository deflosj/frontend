import Link from "next/link";
import { notFound } from "next/navigation";

import { getTournament, saldoClass, sortStandings } from "@/lib/tournament-helpers";
import { MatchBlock } from "../../_shared";

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
  const pouleTeams = poule
    ? sortStandings(teams.filter((t) => t.pouleId === poule.id))
    : [];
  const standing = pouleTeams.findIndex((t) => t.id === team.id) + 1;

  const teamMatches = matches.filter(
    (m) => m.teamAId === team.id || m.teamBId === team.id
  );

  return (
    <div className="flex flex-col gap-10">
      {/* Team hero */}
      <div className="rounded-2xl border border-rule bg-surface px-6 py-6">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            {poule && (
              <p className="mb-1 text-[0.625rem] font-semibold uppercase tracking-widest text-pink">
                {poule.name}
                {standing > 0 && ` · #${standing}`}
              </p>
            )}
            <h2 className="text-2xl font-bold text-ink">{team.name}</h2>
          </div>
          {team.isPresent && (
            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
              Aanwezig
            </span>
          )}
        </div>

        <p className="mb-2 text-[0.6875rem] font-semibold uppercase tracking-widest text-ink-2">
          Spelers
        </p>
        <p className="mb-1 font-semibold text-ink">{team.captainName}</p>
        <div className="flex flex-col gap-0.5">
          {[team.speler1, team.speler2, team.speler3, team.speler4].map((s) => (
            <p key={s} className="text-sm text-ink-2">
              {s}
            </p>
          ))}
        </div>
      </div>

      {/* Stats */}
      {team.played > 0 && (
        <div>
          <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-ink-2">
            Statistieken
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(
              [
                { label: "Gespeeld", value: team.played },
                { label: "Gewonnen", value: team.won },
                { label: "Gelijk", value: team.drawn },
                { label: "Verloren", value: team.lost },
              ] as const
            ).map(({ label, value }) => (
              <div
                key={label}
                className="rounded-xl border border-rule bg-surface px-4 py-4 text-center"
              >
                <p className="text-2xl font-bold tabular-nums text-ink">{value}</p>
                <p className="mt-1 text-xs text-ink-2">{label}</p>
              </div>
            ))}
          </div>

          <div className="mt-3 grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-rule bg-surface px-4 py-4 text-center">
              <p className="text-2xl font-bold tabular-nums text-ink">{team.goalsFor}</p>
              <p className="mt-1 text-xs text-ink-2">Punten voor</p>
            </div>
            <div className="rounded-xl border border-rule bg-surface px-4 py-4 text-center">
              <p className="text-2xl font-bold tabular-nums text-ink">{team.goalsAgainst}</p>
              <p className="mt-1 text-xs text-ink-2">Punten tegen</p>
            </div>
            <div className="rounded-xl border border-rule bg-surface px-4 py-4 text-center">
              <p className={`text-2xl font-bold tabular-nums ${saldoClass(team.saldo)}`}>
                {team.saldo > 0 ? `+${team.saldo}` : team.saldo}
              </p>
              <p className="mt-1 text-xs text-ink-2">Saldo</p>
            </div>
          </div>

          <div className="mt-3 rounded-xl border border-pink/20 bg-pink-soft px-4 py-4 text-center">
            <p className="text-3xl font-bold tabular-nums text-ink">{team.points}</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-pink">
              Punten
            </p>
          </div>
        </div>
      )}

      {/* Matches */}
      {teamMatches.length > 0 && (
        <div>
          <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-ink-2">
            Wedstrijden
          </h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {teamMatches.map((m) => (
              <MatchBlock key={m.id} match={m} teams={teams} />
            ))}
          </div>
        </div>
      )}

      <Link
        href={`/toernooi/${id}/teams`}
        className="self-start text-sm font-semibold text-ink-2 hover:text-ink"
      >
        ← Alle teams
      </Link>
    </div>
  );
}
