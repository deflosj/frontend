"use client";

import { useTournament } from "../tournament-context";
import { PlanningPanel } from "./planning-panel";

export default function TournamentSchemaPage() {
  const { tournament, setTournament } = useTournament();
  const poules = tournament.poules.filter((p) => p.phase === "GROUP_STAGE");

  return (
    <div className="flex flex-wrap items-start gap-6">
      <div className="min-w-0 flex-[999_1_560px]">
        <PlanningPanel tournament={tournament} onUpdate={setTournament} />
      </div>

      <section aria-labelledby="poules-title" className="min-w-0 flex-[1_1_300px]">
        <h2 id="poules-title" className="mb-3 text-base font-semibold">
          Poules <span className="font-mono text-sm font-normal text-ink-2">{poules.length}</span>
        </h2>
        {poules.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-rule px-4 py-6 text-sm text-ink-2">
            Nog niet geloot. De poules verschijnen hier zodra je ze genereert.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {poules.map((p) => {
              const teams = tournament.teams.filter((t) => t.pouleId === p.id);
              const tracks = [...new Set(
                tournament.matches.filter((m) => m.pouleId === p.id && m.track !== null).map((m) => m.track),
              )];
              return (
                <div key={p.id} className="rounded-xl border border-rule bg-surface px-4 py-3">
                  <div className="mb-2 flex items-baseline justify-between gap-2">
                    <p className="text-sm font-semibold">{p.name}</p>
                    {tracks.length > 0 && (
                      <span className="font-mono text-xs text-ink-2">baan {tracks.join(", ")}</span>
                    )}
                  </div>
                  <ul className="flex flex-col gap-1 text-[13px] text-ink-2">
                    {teams.map((t) => <li key={t.id} className="truncate">{t.name}</li>)}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
