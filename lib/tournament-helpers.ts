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

export function sortStandings(teams: TournamentTeam[]): TournamentTeam[] {
  return [...teams].sort(
    (a, b) => b.points - a.points || b.saldo - a.saldo || b.goalsFor - a.goalsFor
  );
}

export function teamName(teams: TournamentTeam[], id: number | null): string {
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
