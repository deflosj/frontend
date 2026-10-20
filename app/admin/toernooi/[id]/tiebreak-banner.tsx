"use client";

import { usePathname } from "next/navigation";
import { tiebreaksNeeded } from "@/lib/tournament-live";
import { TiePicker } from "./scores/scores-view";
import { useTournament } from "./tournament-context";

/**
 * Bal gooien (reglement art. 9.5) op elke adminpagina van het toernooi, zodra
 * een poule uitgespeeld is en ploegen volledig gelijk staan. Op Scores staat
 * het al bij de poule zelf.
 */
export function TiebreakBanner() {
  const { tournament, reload } = useTournament();
  const pathname = usePathname();
  if (pathname.endsWith("/scores")) return null;
  const open = tiebreaksNeeded(tournament).filter((t) => !t.resolved);
  if (open.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      {open.map((t) => (
        <TiePicker
          key={t.key}
          tournamentId={tournament.id}
          kind={t.kind}
          teams={t.teams}
          resolved={false}
          onDone={reload}
          context={t.label}
          className=""
        />
      ))}
    </div>
  );
}
