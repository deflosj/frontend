import { notFound } from "next/navigation";

import { getTournament } from "@/lib/tournament-helpers";
import { OverviewView } from "./overview-view";

export default async function TournamentOverviewPage({
  params,
}: Readonly<{
  params: Promise<{ id: string }>;
}>) {
  const { id } = await params;
  const tournament = await getTournament(id);
  if (!tournament) notFound();

  return <OverviewView tournament={{ ...tournament, id: Number(id) }} />;
}
