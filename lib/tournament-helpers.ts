import type { ActiveTournament, TournamentTeam } from "./tournament-types";
import { API_BASE } from "./api";

export async function getTournament(id: string): Promise<ActiveTournament | null> {
  try {
    const res = await fetch(`${API_BASE}tournaments/${id}`, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json() as Promise<ActiveTournament>;
  } catch {
    return null;
  }
}

/** Stand binnen een poule: de plaats die de backend volgens het reglement
 *  berekent (onderling resultaat, bal gooien, forfaits). */
export function sortStandings(teams: TournamentTeam[]): TournamentTeam[] {
  return [...teams].sort(
    (a, b) =>
      (a.pouleRank && b.pouleRank ? a.pouleRank - b.pouleRank : 0) ||
      b.points - a.points ||
      b.saldo - a.saldo ||
      b.goalsFor - a.goalsFor ||
      a.goalsAgainst - b.goalsAgainst
  );
}

export function teamName(
  teams: Pick<TournamentTeam, "id" | "name">[],
  id: number | null
): string {
  if (!id) return "TBD";
  return teams.find((t) => t.id === id)?.name ?? "TBD";
}

export function saldoClass(saldo: number): string {
  if (saldo > 0) return "text-green-600";
  if (saldo < 0) return "text-red-500";
  return "text-ink-2";
}

export function matchSideClass(isPlayed: boolean, isWinner: boolean): string {
  if (isPlayed && isWinner) return "text-ink";
  if (isPlayed) return "text-ink-2";
  return "text-ink-2";
}

const dayKey = (d: Date) => d.toLocaleDateString("sv-SE", { timeZone: "Europe/Brussels" });

/**
 * "Live" pas vanaf de eventdag zelf (dag van de eerste geplande match), niet
 * zodra het toernooi actief staat. Zo staat alles al online in de aanloop,
 * maar toont de site pas "Live" op de dag van het toernooi.
 */
export function isTournamentLive(t: Pick<ActiveTournament, "isActive" | "status" | "matches">, now = new Date()): boolean {
  if (!t.isActive || t.status === "COMPLETED") return false;
  if (t.status === "ONGOING") return true;
  const first = t.matches
    .map((m) => m.scheduledAt)
    .filter((s): s is string => !!s)
    .sort()[0];
  if (!first) return false;
  return dayKey(now) >= dayKey(new Date(first));
}
