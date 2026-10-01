"use client";

import { useMemo, useState } from "react";

import { IconSearch } from "@/components/ui/icons/IconSearch";
import { sortStandings } from "@/lib/tournament-helpers";
import { TournamentPoule, TournamentTeam } from "@/lib/tournament-types";
import { PageHead, SectionHead, TabStrip, TeamCard } from "../_shared";

interface Props {
  teams: TournamentTeam[];
  poules: TournamentPoule[];
  tournamentId: string;
}

export function TeamsView({ teams, poules, tournamentId }: Readonly<Props>) {
  const [search, setSearch] = useState("");
  const [activePouleId, setActivePouleId] = useState<number | null>(null);

  const groupPoules = poules.filter((p) => p.phase === "GROUP_STAGE");

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
  const grid = "grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";

  function renderTeams() {
    if (filtered.length === 0) return <p className="text-sm text-ink-2">Geen teams gevonden.</p>;
    if (isFiltering) {
      return (
        <div className={grid}>
          {filtered.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              href={`/toernooi/${tournamentId}/teams/${team.id}`}
            />
          ))}
        </div>
      );
    }
    return (
      <div className="flex flex-col gap-8">
        {byPoule.map(({ poule, teams: pouleTeams }) => (
          <div key={poule.id}>
            <SectionHead title={poule.name} />
            <div className={grid}>
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
            <SectionHead title="Overige teams" />
            <div className={grid}>
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
      <PageHead
        title="Teams"
        subtitle={
          groupPoules.length > 0
            ? `${teams.length} teams verdeeld over ${groupPoules.length} ${
                groupPoules.length === 1 ? "poule" : "poules"
              }`
            : `${teams.length} ingeschreven teams`
        }
      />

      {/* Zoeken */}
      <div className="flex h-11 items-center gap-2.5 rounded-xl border border-rule bg-surface px-4 focus-within:ring-2 focus-within:ring-pink/30">
        <span className="shrink-0 text-ink-2">
          <IconSearch />
        </span>
        <input
          type="search"
          placeholder="Zoek op team of speler..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-full min-w-0 flex-1 bg-transparent text-sm text-ink placeholder:text-ink-2 focus:outline-none"
        />
      </div>

      {/* Poule tab strip */}
      {groupPoules.length > 1 && (
        <TabStrip
          tabs={[
            { key: "ALL", label: "Alle" },
            ...groupPoules.map((p) => ({ key: String(p.id), label: p.name })),
          ]}
          active={activePouleId === null ? "ALL" : String(activePouleId)}
          onSelect={(key) => setActivePouleId(key === "ALL" ? null : Number(key))}
          compact
        />
      )}

      <p className="text-xs text-ink-2">
        <span className="font-semibold text-ink">{filtered.length}</span> teams
      </p>

      {renderTeams()}
    </div>
  );
}
