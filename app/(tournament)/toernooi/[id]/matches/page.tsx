import { notFound } from "next/navigation";

import { getTournament } from "@/lib/tournament-helpers";
import { PHASE_LABELS, PHASE_ORDER } from "@/lib/tournament-types";
import { Empty, MatchBlock } from "../_shared";

export default async function MatchesPage({
  params,
}: Readonly<{
  params: Promise<{ id: string }>;
}>) {
  const { id } = await params;
  const tournament = await getTournament(id);
  if (!tournament) notFound();

  const { matches, teams } = tournament;
  if (!matches.length) return <Empty text="Nog geen wedstrijden ingevoerd." />;

  const phases = PHASE_ORDER.filter((p) => matches.some((m) => m.phase === p));

  return (
    <div className="flex flex-col gap-10">
      {phases.map((phase) => {
        const phaseMatches = matches
          .filter((m) => m.phase === phase)
          .sort(
            (a, b) =>
              new Date(a.time ?? 0).getTime() - new Date(b.time ?? 0).getTime()
          );
        return (
          <div key={phase}>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-widest text-ink-2">
              {PHASE_LABELS[phase]}
            </h3>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {phaseMatches.map((m) => (
                <MatchBlock key={m.id} match={m} teams={teams} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
