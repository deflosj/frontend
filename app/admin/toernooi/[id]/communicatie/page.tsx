"use client";

import { useTournament } from "../tournament-context";
import { MailTab } from "../mail-tab";

export default function TournamentCommunicationPage() {
  const { tournament } = useTournament();
  return <MailTab tournament={tournament} />;
}
