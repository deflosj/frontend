import { notFound } from "next/navigation";

import { getTournament } from "@/lib/tournament-helpers";
import { Empty } from "../_shared";
import { MatchesView } from "./matches-view";

export default async function MatchesPage({
  params,
}: Readonly<{
  params: Promise<{ id: string }>;
}>) {
  const { id } = await params;
  const tournament = await getTournament(id);
  if (!tournament) notFound();

  const { matches, teams, poules } = tournament;
  if (!matches.length) return <Empty text="Nog geen wedstrijden ingevoerd." />;

  return <MatchesView matches={matches} teams={teams} poules={poules} />;
}
