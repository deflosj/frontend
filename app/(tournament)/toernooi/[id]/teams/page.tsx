import { notFound } from "next/navigation";

import { getTournament } from "@/lib/tournament-helpers";
import { Empty } from "../_shared";
import { TeamsView } from "./teams-view";

export default async function TeamsPage({
  params,
}: Readonly<{
  params: Promise<{ id: string }>;
}>) {
  const { id } = await params;
  const tournament = await getTournament(id);
  if (!tournament) notFound();

  const { teams, poules } = tournament;
  if (!teams.length) return <Empty text="Nog geen teams ingeschreven." />;

  return <TeamsView teams={teams} poules={poules} tournamentId={id} />;
}
