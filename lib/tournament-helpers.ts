import type { ActiveTournament, TournamentTeam } from "./tournament-types";

export async function getTournament(id: string): Promise<ActiveTournament | null> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";
  try {
    const res = await fetch(`${base}/tournaments/${id}`, { cache: "no-store" });
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

export function fmt(iso: string): string {
  return new Date(iso).toLocaleTimeString("nl-BE", { hour: "2-digit", minute: "2-digit" });
}

export function saldoClass(saldo: number): string {
  if (saldo > 0) return "text-green-600";
  if (saldo < 0) return "text-red-500";
  return "text-muted";
}

export function matchSideClass(isPlayed: boolean, isWinner: boolean): string {
  if (isPlayed && isWinner) return "text-ink";
  if (isPlayed) return "text-muted";
  return "text-ink-2";
}
