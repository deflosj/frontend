import { notFound } from "next/navigation";

import { getTournament } from "@/lib/tournament-helpers";
import { Phase } from "@/lib/tournament-types";
import { Empty } from "../_shared";
import { BracketView } from "./bracket-view";

const KNOCKOUT_SET = new Set<Phase>([
  "ROUND_OF_32",
  "ROUND_OF_16",
  "QUARTER_FINAL",
  "SEMI_FINAL",
  "CONSOLATION_FINAL",
  "FINAL",
  "TIEBREAK",
]);

export default async function BracketsPage({
  params,
}: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  const tournament = await getTournament(id);
  if (!tournament) notFound();

  const { matches, teams, poules, year } = tournament;
  const hasKnockout = matches.some((m) => KNOCKOUT_SET.has(m.phase));
  const hasPoules = poules.some((p) => p.phase === "GROUP_STAGE") && teams.some((t) => t.pouleId);

  // Zonder knock-out tonen we een voorlopige bracket op basis van de huidige standen.
  if (!hasKnockout && !hasPoules) {
    return <Empty text="De bracket verschijnt zodra de poules ingedeeld zijn." />;
  }

  return (
    <BracketView
      matches={matches}
      teams={teams}
      poules={poules}
      advancingPerPoule={tournament.teamsAdvancingPerPoule ?? 2}
      bestNths={tournament.bestNthsAdvancing ?? 0}
      ko={{
        trackCount: tournament.trackCount,
        knockoutPauseMinutes: tournament.knockoutPauseMinutes,
        knockoutSlotMinutes: tournament.knockoutSlotMinutes,
        finalsSlotMinutes: tournament.finalsSlotMinutes,
        roundBreakMinutes: tournament.roundBreakMinutes,
        withConsolation: tournament.withConsolation,
      }}
      year={year}
      isActive={tournament.isActive}
    />
  );
}
