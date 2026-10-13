"use client";

import { Suspense } from "react";
import { useTournament } from "../tournament-context";
import { MailTab } from "../mail-tab";

export default function TournamentCommunicationPage() {
  const { tournament } = useTournament();
  // MailTab leest ?naar=onvolledig; useSearchParams vraagt een Suspense-grens.
  return (
    <Suspense>
      <MailTab tournament={tournament} />
    </Suspense>
  );
}
