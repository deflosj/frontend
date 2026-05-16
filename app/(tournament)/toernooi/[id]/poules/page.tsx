import { notFound } from "next/navigation";

import { getTournament, saldoClass, sortStandings } from "@/lib/tournament-helpers";
import { Empty } from "../_shared";

export default async function PoulesPage({
  params,
}: Readonly<{
  params: Promise<{ id: string }>;
}>) {
  const { id } = await params;
  const tournament = await getTournament(id);
  if (!tournament) notFound();

  const { poules, teams } = tournament;
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
                      <td className="py-3 pl-4 pr-2 text-center tabular-nums text-muted">
                        {i + 1}
                      </td>
                      <td className="px-2 py-3 font-medium text-ink">{team.name}</td>
                      <td className="px-2 py-3 text-center tabular-nums text-ink-2">
                        {team.played}
                      </td>
                      <td className="px-2 py-3 text-center tabular-nums text-ink-2">
                        {team.won}
                      </td>
                      <td className="hidden px-2 py-3 text-center tabular-nums text-ink-2 sm:table-cell">
                        {team.drawn}
                      </td>
                      <td className="px-2 py-3 text-center tabular-nums text-ink-2">
                        {team.lost}
                      </td>
                      <td className="hidden px-2 py-3 text-center tabular-nums text-ink-2 sm:table-cell">
                        {team.goalsFor}
                      </td>
                      <td className="hidden px-2 py-3 text-center tabular-nums text-ink-2 sm:table-cell">
                        {team.goalsAgainst}
                      </td>
                      <td
                        className={`hidden px-2 py-3 text-center tabular-nums font-medium sm:table-cell ${saldoClass(team.saldo)}`}
                      >
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
