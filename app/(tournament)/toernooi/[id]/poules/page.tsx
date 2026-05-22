import { notFound } from "next/navigation";

import { getTournament } from "@/lib/tournament-helpers";
import { Empty } from "../_shared";
import { PoulesView } from "./poules-view";

export default async function PoulesPage({
  params,
}: Readonly<{
  params: Promise<{ id: string }>;
}>) {
  const { id } = await params;
  const tournament = await getTournament(id);
  if (!tournament) notFound();

  const { poules, teams, matches } = tournament;
  const groupPoules = poules.filter((p) => p.phase === "GROUP");

  if (!groupPoules.length) {
    return <Empty text="Nog geen poules of teams ingevoerd." />;
  }

  return <PoulesView poules={poules} teams={teams} matches={matches} />;
}
