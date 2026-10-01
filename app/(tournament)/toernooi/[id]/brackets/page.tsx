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

  const { matches, teams, year } = tournament;

  if (!matches.some((m) => KNOCKOUT_SET.has(m.phase))) {
    return <Empty text="De knockoutfase is nog niet begonnen." />;
  }

  return <BracketView matches={matches} teams={teams} year={year} />;
}
