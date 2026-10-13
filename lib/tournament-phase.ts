import { playerCount } from "@/lib/team-roster";
import type { ActiveTournament, TournamentTeam } from "@/lib/tournament-types";

/** De vijf fases van een toernooi, zoals de admin ze toont. */
export const TOURNAMENT_PHASES = ["Inschrijvingen", "Poules geloot", "Schema klaar", "Eventdag", "Afgerond"] as const;

/** Index in TOURNAMENT_PHASES, afgeleid uit status, poules en wedstrijden. */
export function tournamentPhase(t: ActiveTournament): number {
  if (t.status === "COMPLETED") return 4;
  if (t.status === "ONGOING") return 3;
  if (t.matches.some((m) => m.phase === "GROUP_STAGE")) return 2;
  if (t.poules.some((p) => p.phase === "GROUP_STAGE")) return 1;
  return 0;
}

/** Alle vier spelers echt ingevuld (placeholders als "K1" of "S3" tellen niet). */
export function isTeamComplete(team: Pick<TournamentTeam, "speler1" | "speler2" | "speler3" | "speler4">): boolean {
  return playerCount(team) === 4;
}
