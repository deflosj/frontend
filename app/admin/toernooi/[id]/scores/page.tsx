"use client";

import { useTournament } from "../tournament-context";
import { ScoresView } from "./scores-view";

export default function TournamentScoresPage() {
  const { tournament, setTournament } = useTournament();
  return <ScoresView tournament={tournament} onUpdate={setTournament} />;
}
