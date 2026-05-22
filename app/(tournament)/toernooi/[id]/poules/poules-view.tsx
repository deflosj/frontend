"use client";

import { useState } from "react";

import { saldoClass, sortStandings } from "@/lib/tournament-helpers";
import { TournamentMatch, TournamentPoule, TournamentTeam } from "@/lib/tournament-types";
import { MatchBlock } from "../_shared";

interface Props {
  poules: TournamentPoule[];
  teams: TournamentTeam[];
  matches: TournamentMatch[];
}

export function PoulesView({ poules, teams, matches }: Readonly<Props>) {
  const groupPoules = poules.filter((p) => p.phase === "GROUP");
  const [activeId, setActiveId] = useState<number>(groupPoules[0]?.id ?? -1);

  const activePoule = groupPoules.find((p) => p.id === activeId);
  const pouleTeams = activePoule ? sortStandings(teams.filter((t) => t.pouleId === activeId)) : [];
  const pouleMatches = matches
    .filter((m) => m.pouleId === activeId)
    .sort((a, b) => new Date(a.time ?? 0).getTime() - new Date(b.time ?? 0).getTime());

  return (
    <div className="flex flex-col gap-6">
      {/* Poule tab strip */}
      {groupPoules.length > 1 && (
        <div className="-mx-5 flex overflow-x-auto border-b border-rule px-5 sm:-mx-8 sm:px-8">
          {groupPoules.map((p) => (
            <button
              key={p.id}
              onClick={() => setActiveId(p.id)}
              className={`relative shrink-0 px-4 py-2.5 text-sm font-semibold transition-colors ${
                activeId === p.id ? "text-ink" : "text-ink/35 hover:text-ink/60"
              }`}
            >
              {p.name}
              <span
                className={`absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-pink transition-opacity ${
                  activeId === p.id ? "opacity-100" : "opacity-0"
                }`}
              />
            </button>
          ))}
        </div>
      )}

      {/* Standings */}
      {pouleTeams.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-rule">
          {activePoule?.description && (
            <div className="border-b border-rule bg-surface px-4 py-3">
              <p className="text-xs text-ink-2">{activePoule.description}</p>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-rule text-xs font-semibold uppercase tracking-widest text-ink-2">
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
                    <td className="py-3 pl-4 pr-2 text-center tabular-nums text-ink-2">{i + 1}</td>
                    <td className="px-2 py-3 font-medium text-ink">{team.name}</td>
                    <td className="px-2 py-3 text-center tabular-nums text-ink-2">{team.played}</td>
                    <td className="px-2 py-3 text-center tabular-nums text-ink-2">{team.won}</td>
                    <td className="hidden px-2 py-3 text-center tabular-nums text-ink-2 sm:table-cell">
                      {team.drawn}
                    </td>
                    <td className="px-2 py-3 text-center tabular-nums text-ink-2">{team.lost}</td>
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
      )}

      {/* Poule matches */}
      {pouleMatches.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-widest text-ink-2">
            Wedstrijden
          </h3>
          <div className="flex flex-col gap-2 sm:grid sm:grid-cols-2">
            {pouleMatches.map((m) => (
              <MatchBlock key={m.id} match={m} teams={teams} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
