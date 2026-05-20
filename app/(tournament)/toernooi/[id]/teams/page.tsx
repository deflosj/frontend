import { notFound } from "next/navigation";

import { getTournament, sortStandings } from "@/lib/tournament-helpers";
import { Empty, TeamCard } from "../_shared";

export default async function TeamsPage({
  params,
}: Readonly<{
  params: Promise<{ id: string }>;
}>) {
  const { id } = await params;
  const tournament = await getTournament(id);
  if (!tournament) notFound();

  const { teams, poules } = tournament;
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
          <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-ink-2">
            {poule.name}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {pouleTeams.map((team) => (
              <TeamCard
                key={team.id}
                team={team}
                href={`/toernooi/${id}/teams/${team.id}`}
              />
            ))}
          </div>
        </div>
      ))}
      {noPoule.length > 0 && (
        <div>
          <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-ink-2">
            Overige teams
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {noPoule.map((team) => (
              <TeamCard
                key={team.id}
                team={team}
                href={`/toernooi/${id}/teams/${team.id}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
