"use client";

import { useState } from "react";

import { sortStandings } from "@/lib/tournament-helpers";
import { TournamentMatch, TournamentPoule, TournamentTeam } from "@/lib/tournament-types";
import {
  MatchBlock,
  PageHead,
  SectionHead,
  StandingsLegend,
  StandingsTable,
  TabStrip,
} from "../_shared";

interface Props {
  poules: TournamentPoule[];
  teams: TournamentTeam[];
  matches: TournamentMatch[];
}

export function PoulesView({ poules, teams, matches }: Readonly<Props>) {
  const groupPoules = poules.filter((p) => p.phase === "GROUP_STAGE");
  const [activeId, setActiveId] = useState<number>(groupPoules[0]?.id ?? -1);

  const activePoule = groupPoules.find((p) => p.id === activeId);
  const pouleTeams = activePoule ? sortStandings(teams.filter((t) => t.pouleId === activeId)) : [];
  const pouleMatches = matches
    .filter((m) => m.pouleId === activeId)
    .sort((a, b) => new Date(a.scheduledAt ?? 0).getTime() - new Date(b.scheduledAt ?? 0).getTime());

  const teamCount = teams.filter((t) => t.pouleId !== null).length;

  return (
    <div className="flex flex-col gap-6">
      <PageHead
        title="Standen"
        subtitle={`${teamCount} teams verdeeld over ${groupPoules.length} ${
          groupPoules.length === 1 ? "poule" : "poules"
        }`}
      />

      {/* Poule tab strip */}
      {groupPoules.length > 1 && (
        <TabStrip
          tabs={groupPoules.map((p) => ({ key: String(p.id), label: p.name }))}
          active={String(activeId)}
          onSelect={(key) => setActiveId(Number(key))}
          compact
        />
      )}

      {/* Standings */}
      {pouleTeams.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-rule bg-surface">
          <div className="flex items-baseline justify-between gap-3 border-b border-rule px-3.5 py-3">
            <h3 className="text-[0.9375rem] font-bold text-ink">{activePoule?.name}</h3>
            {activePoule?.description && (
              <p className="truncate text-[0.7rem] text-ink-2">{activePoule.description}</p>
            )}
          </div>
          <div className="overflow-x-auto">
            <StandingsTable teams={pouleTeams} />
          </div>
          <StandingsLegend />
        </div>
      )}

      {/* Poule matches */}
      {pouleMatches.length > 0 && (
        <div>
          <SectionHead title="Wedstrijden" />
          <div className="grid gap-3 sm:grid-cols-2">
            {pouleMatches.map((m) => (
              <MatchBlock key={m.id} match={m} teams={teams} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
