/**
 * Rekenwerk voor de publieke toernooipagina's: status van een wedstrijd
 * (bezig / nog te spelen / gespeeld), de ranking 1..N na de poules en de
 * labels van knock-outplekken die nog niet ingevuld zijn.
 *
 * Volgt exact de regels van de backendgenerator (tournamentScheduling.ts):
 * eerst alle poulewinnaars, dan alle tweedes, … en tot slot de beste n-des;
 * klassieke bracket 1 vs N.
 */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import type { Phase, TournamentMatch, TournamentPoule, TournamentTeam } from "./tournament-types";

// ── Tijd & status ─────────────────────────────────────────────────────────────

export type MatchStatus = "live" | "next" | "done";

export const isPlayed = (m: TournamentMatch) => m.scoreA !== null && m.scoreB !== null;
export const isKnockout = (p: Phase) => p !== "GROUP_STAGE" && p !== "TIEBREAK";

/** Kleinste tijdsverschil tussen twee wedstrijden op dezelfde baan — dat is
 *  de slotduur. Zonder bruikbare data: 20 minuten. */
export function slotMinutes(matches: TournamentMatch[]): number {
  const byTrack = new Map<number, number[]>();
  for (const m of matches) {
    if (m.track === null || !m.scheduledAt) continue;
    byTrack.set(m.track, [...(byTrack.get(m.track) ?? []), new Date(m.scheduledAt).getTime()]);
  }
  let best = Infinity;
  for (const times of byTrack.values()) {
    const sorted = [...new Set(times)].sort((a, b) => a - b);
    for (let i = 1; i < sorted.length; i++) best = Math.min(best, sorted[i] - sorted[i - 1]);
  }
  return Number.isFinite(best) && best > 0 ? Math.round(best / 60000) : 20;
}

/** Gespeeld = er staat een score. Bezig = het slot is begonnen maar er is nog
 *  geen score (ook als het slot al voorbij is: dan loopt de match uit). */
export function matchStatus(m: TournamentMatch, now: number): MatchStatus {
  if (isPlayed(m)) return "done";
  if (m.scheduledAt && new Date(m.scheduledAt).getTime() <= now) return "live";
  return "next";
}

/** Huidige tijd, elke 30 s bijgewerkt (statussen schuiven vanzelf door). */
export function useNow(intervalMs = 30_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

/** Tijdens een actief toernooi de serverdata elke minuut verversen. */
export function useAutoRefresh(active: boolean, intervalMs = 60_000) {
  const router = useRouter();
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(t);
  }, [active, intervalMs, router]);
}

// ── Poules & ranking ──────────────────────────────────────────────────────────

export const compareStanding = (a: TournamentTeam, b: TournamentTeam) =>
  b.points - a.points || b.saldo - a.saldo || b.goalsFor - a.goalsFor || a.name.localeCompare(b.name);

export const pouleLetter = (p: Pick<TournamentPoule, "name">) => p.name.replace(/^poule\s+/i, "");

/** Stand per poule, gesorteerd. */
export function pouleTables(poules: TournamentPoule[], teams: TournamentTeam[]) {
  return poules
    .filter((p) => p.phase === "GROUP_STAGE")
    .map((p) => ({ poule: p, rows: teams.filter((t) => t.pouleId === p.id).sort(compareStanding) }));
}

/** Meest gebruikte baan per poule (baan 1 = poule A en B, …). */
export function pouleTracks(matches: TournamentMatch[]): Map<number, number> {
  const counts = new Map<number, Map<number, number>>();
  for (const m of matches) {
    if (m.pouleId === null || m.track === null) continue;
    const c = counts.get(m.pouleId) ?? new Map<number, number>();
    c.set(m.track, (c.get(m.track) ?? 0) + 1);
    counts.set(m.pouleId, c);
  }
  const out = new Map<number, number>();
  for (const [pouleId, c] of counts) {
    out.set(pouleId, [...c.entries()].sort((a, b) => b[1] - a[1])[0][0]);
  }
  return out;
}

export interface RankedTeam {
  team: TournamentTeam;
  seed: number;
  /** Plaats in de eigen poule (1-based). */
  place: number;
  qualifies: boolean;
  kind: "first" | "second" | "nth" | "out";
  label: string;
  short: string;
}

/** Ranking 1..N over alle poules heen, zoals de knock-outgenerator ze loot. */
export function rankTeams(
  tables: ReturnType<typeof pouleTables>,
  advancingPerPoule: number,
  bestNths: number
): RankedTeam[] {
  const maxPlace = Math.max(0, ...tables.map((t) => t.rows.length));
  const out: RankedTeam[] = [];
  for (let place = 1; place <= maxPlace; place++) {
    const group = tables.map((t) => t.rows[place - 1]).filter(Boolean).sort(compareStanding);
    group.forEach((team, i) => {
      let kind: RankedTeam["kind"] = "out";
      if (place <= advancingPerPoule) kind = place === 1 ? "first" : "second";
      else if (place === advancingPerPoule + 1 && i < bestNths) kind = "nth";
      const label =
        kind === "first" ? "Door als poulewinnaar"
        : kind === "second" ? `Door als ${place}de`
        : kind === "nth" ? `Beste ${place}de (${i + 1}/${bestNths})`
        : "Uitgeschakeld";
      const short = kind === "out" ? "Eruit" : kind === "nth" ? `Beste ${place}de` : "Door";
      out.push({ team, seed: 0, place, qualifies: kind !== "out", kind, label, short });
    });
  }
  out.forEach((r, i) => (r.seed = i + 1));
  return out;
}

// ── Knock-out ─────────────────────────────────────────────────────────────────

/** Klassieke bracketvolgorde: size 8 → [1,8,4,5,2,7,3,6]. */
export function bracketOrder(size: number): number[] {
  let order = [1];
  while (order.length < size) {
    const n = order.length * 2;
    order = order.flatMap((s) => [s, n + 1 - s]);
  }
  return order;
}

export const KO_ROUNDS: { phase: Phase; label: string; short: string; prefix: string }[] = [
  { phase: "ROUND_OF_32", label: "1/16 finales", short: "1/16", prefix: "R32-" },
  { phase: "ROUND_OF_16", label: "1/8 finales", short: "1/8", prefix: "R16-" },
  { phase: "QUARTER_FINAL", label: "Kwartfinales", short: "KF", prefix: "QF" },
  { phase: "SEMI_FINAL", label: "Halve finales", short: "HF", prefix: "SF" },
  { phase: "FINAL", label: "Finale", short: "Finale", prefix: "F" },
];

/** Volgnummer uit een bracketPos (R32-7 → 7, QF2 → 2, F1 → 1). */
export const posNumber = (pos: string | null) => Number(/(\d+)$/.exec(pos ?? "")?.[1] ?? 0);

/** Wat er op een lege plek komt: "Plaats 1", "Winnaar 1/16 #3", … */
export function feederLabels(pos: string | null, bracketSize = 32): [string, string] {
  if (!pos) return ["Nog te bepalen", "Nog te bepalen"];
  const n = posNumber(pos);
  const order = bracketOrder(bracketSize);
  if (pos.startsWith("R32-") || (bracketSize === 16 && pos.startsWith("R16-"))) {
    return [`Plaats ${order[2 * n - 2]}`, `Plaats ${order[2 * n - 1]}`];
  }
  if (pos.startsWith("R16-")) return [`Winnaar 1/16 #${2 * n - 1}`, `Winnaar 1/16 #${2 * n}`];
  if (pos.startsWith("QF")) return [`Winnaar 1/8 #${2 * n - 1}`, `Winnaar 1/8 #${2 * n}`];
  if (pos.startsWith("SF")) return [`Winnaar KF ${2 * n - 1}`, `Winnaar KF ${2 * n}`];
  if (pos === "F1") return ["Winnaar HF 1", "Winnaar HF 2"];
  if (pos === "CF1") return ["Verliezer HF 1", "Verliezer HF 2"];
  return ["Nog te bepalen", "Nog te bepalen"];
}

/** Grootte van de bracket = 2 × aantal wedstrijden in de eerste ronde. */
export function bracketSize(matches: TournamentMatch[]): number {
  for (const r of KO_ROUNDS) {
    const n = matches.filter((m) => m.phase === r.phase).length;
    if (n > 0) return n * 2;
  }
  return 2;
}

export const KO_SHORT: Partial<Record<Phase, string>> = {
  ROUND_OF_32: "1/16 finale",
  ROUND_OF_16: "1/8 finale",
  QUARTER_FINAL: "Kwartfinale",
  SEMI_FINAL: "Halve finale",
  CONSOLATION_FINAL: "Kleine finale",
  FINAL: "Finale",
  TIEBREAK: "Tiebreak",
};
