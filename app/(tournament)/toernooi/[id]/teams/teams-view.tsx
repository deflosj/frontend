"use client";

import { useMemo, useState } from "react";

import { sortStandings } from "@/lib/tournament-helpers";
import { TournamentPoule, TournamentTeam } from "@/lib/tournament-types";
import { TeamCard } from "../_shared";

interface Props {
  teams: TournamentTeam[];
  poules: TournamentPoule[];
  tournamentId: string;
}

export function TeamsView({ teams, poules, tournamentId }: Readonly<Props>) {
  const [search, setSearch] = useState("");
  const [activePouleId, setActivePouleId] = useState<number | null>(null);

  const groupPoules = poules.filter((p) => p.phase === "GROUP");

  const filtered = useMemo(() => {
    return teams.filter((t) => {
      if (activePouleId !== null && t.pouleId !== activePouleId) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const haystack = [t.name, t.captainName, t.speler1, t.speler2, t.speler3, t.speler4]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [teams, search, activePouleId]);

  const isFiltering = search.trim() !== "" || activePouleId !== null;

  const byPoule = useMemo(
    () =>
      groupPoules
        .map((poule) => ({
          poule,
          teams: sortStandings(filtered.filter((t) => t.pouleId === poule.id)),
        }))
        .filter((g) => g.teams.length > 0),
    [groupPoules, filtered]
  );

  const noPoule = filtered.filter((t) => !t.pouleId);

  function renderTeams() {
    if (filtered.length === 0) return <p className="text-sm text-ink-2">Geen teams gevonden.</p>;
    if (isFiltering) {
      return (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((team) => (
            <TeamCard key={team.id} team={team} href={`/toernooi/${tournamentId}/teams/${team.id}`} />
          ))}
        </div>
      );
    }
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
                  href={`/toernooi/${tournamentId}/teams/${team.id}`}
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
                  href={`/toernooi/${tournamentId}/teams/${team.id}`}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Search */}
      <input
        type="search"
        placeholder="Zoek op team of speler..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="h-11 w-full rounded-xl border border-rule bg-surface px-4 text-sm text-ink placeholder:text-ink-2 focus:outline-none focus:ring-2 focus:ring-pink/30"
      />

      {/* Poule tab strip */}
      {groupPoules.length > 1 && (
        <div className="-mx-5 flex overflow-x-auto border-b border-rule px-5 sm:-mx-8 sm:px-8">
          <button
            onClick={() => setActivePouleId(null)}
            className={`relative shrink-0 px-3 py-2.5 text-sm font-semibold transition-colors ${
              activePouleId === null ? "text-ink" : "text-ink/35 hover:text-ink/60"
            }`}
          >
            {"Alle"}
            <span
              className={`absolute bottom-0 left-1 right-1 h-0.5 rounded-full bg-pink transition-opacity ${
                activePouleId === null ? "opacity-100" : "opacity-0"
              }`}
            />
          </button>
          {groupPoules.map((p) => (
            <button
              key={p.id}
              onClick={() => setActivePouleId(p.id)}
              className={`relative shrink-0 px-3 py-2.5 text-sm font-semibold transition-colors ${
                activePouleId === p.id ? "text-ink" : "text-ink/35 hover:text-ink/60"
              }`}
            >
              {p.name}
              <span
                className={`absolute bottom-0 left-1 right-1 h-0.5 rounded-full bg-pink transition-opacity ${
                  activePouleId === p.id ? "opacity-100" : "opacity-0"
                }`}
              />
            </button>
          ))}
        </div>
      )}

      {/* Count */}
      <p className="text-xs text-ink-2">
        <span className="font-semibold text-ink">{filtered.length}</span> teams
      </p>

      {/* Results */}
      {renderTeams()}
    </div>
  );
}
