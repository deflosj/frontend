"use client";

import { Panel } from "@/components/admin/ui";
import { useTournament } from "../tournament-context";
import { PlanningPanel } from "./planning-panel";

export default function TournamentSchemaPage() {
  const { tournament, setTournament } = useTournament();
  const poules = tournament.poules.filter((p) => p.phase === "GROUP_STAGE");

  return (
    <div className="flex flex-col gap-5">
      <PlanningPanel tournament={tournament} onUpdate={setTournament} />

      {poules.length > 0 && (
        <Panel
          id="poules"
          collapsible
          defaultOpen={false}
          title={<>Poules <span className="font-mono text-sm font-normal text-ink-2">{poules.length}</span></>}
          description="Welke teams samen in een poule zitten, en op welke baan ze spelen."
          flush
        >
          <div className="-mb-px -mr-px grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {poules.map((p) => {
              const teams = tournament.teams.filter((t) => t.pouleId === p.id);
              const tracks = [...new Set(
                tournament.matches.filter((m) => m.pouleId === p.id && m.track !== null).map((m) => m.track),
              )];
              return (
                <div key={p.id} className="border-b border-r border-rule px-5 py-4">
                  <div className="mb-2 flex items-baseline justify-between gap-2">
                    <p className="text-sm font-semibold">{p.name}</p>
                    {tracks.length > 0 && <span className="text-xs text-ink-2">baan {tracks.join(", ")}</span>}
                  </div>
                  <ol className="flex flex-col gap-1 text-[13px] text-ink-2">
                    {teams.map((t) => <li key={t.id} className="truncate" title={t.name}>{t.name}</li>)}
                  </ol>
                </div>
              );
            })}
          </div>
        </Panel>
      )}
    </div>
  );
}
