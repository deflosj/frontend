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

// ── Voorlopige knock-out ("als de poules nu zouden stoppen") ─────────────────

export const nextPowerOfTwo = (n: number) => 2 ** Math.ceil(Math.log2(Math.max(2, n)));

/** Eerste-rondekoppels als seednummers (1-based; > N = vrijloting).
 *  Zelfde regels als de backend-generator: klassieke bracketvolgorde, en twee
 *  teams uit dezelfde poule worden uit elkaar gehaald door de tegenstander te
 *  ruilen met die van een koppel van zo gelijk mogelijke sterkte. */
export function firstRoundPairs(seeds: { pouleId: number | null }[]): Array<[number, number]> {
  const size = nextPowerOfTwo(seeds.length);
  const order = bracketOrder(size);
  const pairs: Array<[number, number]> = [];
  for (let i = 0; i < size; i += 2) pairs.push([order[i], order[i + 1]]);
  const poule = (seed: number) => (seed <= seeds.length ? seeds[seed - 1].pouleId : null);
  const clash = ([a, b]: [number, number]) => poule(a) !== null && poule(a) === poule(b);
  for (let i = 0; i < pairs.length; i++) {
    if (!clash(pairs[i])) continue;
    const candidates = pairs
      .map((p, j) => ({ j, dist: Math.abs(p[1] - pairs[i][1]) }))
      .filter(({ j }) => j !== i)
      .sort((x, y) => x.dist - y.dist);
    for (const { j } of candidates) {
      const a: [number, number] = [pairs[i][0], pairs[j][1]];
      const b: [number, number] = [pairs[j][0], pairs[i][1]];
      if (!clash(a) && !clash(b)) {
        pairs[i] = a;
        pairs[j] = b;
        break;
      }
    }
  }
  return pairs;
}

export interface ProjectedPair {
  /** Volgnummer in de eerste ronde (1-based), zoals R32-n. */
  n: number;
  a: RankedTeam | null;
  b: RankedTeam | null;
}

/** Eerste knock-outronde op basis van de huidige ranking. */
export function projectFirstRound(ranking: RankedTeam[]): ProjectedPair[] {
  const q = ranking.filter((r) => r.qualifies);
  if (q.length < 2) return [];
  const pairs = firstRoundPairs(q.map((r) => ({ pouleId: r.team.pouleId })));
  return pairs.map(([sa, sb], i) => ({ n: i + 1, a: q[sa - 1] ?? null, b: q[sb - 1] ?? null }));
}

/** Waarom een team (voorlopig) wel of niet doorgaat, in gewone taal. */
export function qualifyReason(
  r: RankedTeam,
  ranking: RankedTeam[],
  pouleName: string,
  advancingPerPoule: number,
  bestNths: number
): string {
  const pts = (n: number) => `${n} punt${n === 1 ? "" : "en"}`;
  const sal = (n: number) => `${n > 0 ? "+" : ""}${n}`;
  const ord = (n: number) => `${n}${n === 1 || n === 8 || n >= 20 ? "ste" : "de"}`;
  const t = r.team;
  if (r.kind === "first") return `Wint ${pouleName} met ${pts(t.points)} (saldo ${sal(t.saldo)}).`;
  if (r.kind === "second") return `${r.place}de in ${pouleName} met ${pts(t.points)}: de top ${advancingPerPoule} gaat rechtstreeks door.`;
  const nths = ranking.filter((x) => x.place === advancingPerPoule + 1);
  const idx = nths.findIndex((x) => x.team.id === t.id);
  if (r.kind === "nth") {
    const firstOut = nths[bestNths];
    const margin = firstOut
      ? firstOut.team.points < t.points
        ? ` ${pts(t.points - firstOut.team.points)} voorsprong op de eerste afvaller.`
        : ` Even veel punten als de eerste afvaller, het saldo beslist (${sal(t.saldo)} tegen ${sal(firstOut.team.saldo)}).`
      : "";
    return `${r.place}de in ${pouleName}, maar ${ord(idx + 1)} van de ${nths.length} ${r.place}des: de ${bestNths} beste gaan door.${margin}`;
  }
  if (r.place === advancingPerPoule + 1 && bestNths > 0) {
    const lastIn = nths[bestNths - 1];
    const short = lastIn
      ? lastIn.team.points > t.points
        ? ` ${pts(lastIn.team.points - t.points)} tekort op ${lastIn.team.name}, de laatste die doorgaat.`
        : ` Gelijk in punten met ${lastIn.team.name}, maar slechter saldo (${sal(t.saldo)} tegen ${sal(lastIn.team.saldo)}).`
      : "";
    return `${r.place}de in ${pouleName}, ${ord(idx + 1)} van de ${nths.length} ${r.place}des: enkel de ${bestNths} beste gaan door.${short}`;
  }
  return `${r.place}de in ${pouleName}. Enkel de top ${advancingPerPoule}${bestNths > 0 ? ` en de ${bestNths} beste ${advancingPerPoule + 1}des` : ""} gaan door.`;
}

/** Volledige voorlopige knock-out als wedstrijden (negatieve ids, geen uren):
 *  eerste ronde ingevuld uit de huidige ranking, vrijlotingen doorgeschoven,
 *  latere rondes leeg. Zelfde opbouw als de generator in de backend. */
export interface KnockoutSchedule {
  start: Date;
  slotMinutes: number;
  finalsSlotMinutes: number;
  roundBreakMinutes: number;
  trackCount: number;
}

/** Wanneer de knock-out start en hoe lang de matchen duren, zoals de backend
 *  het schema zal opmaken: laatste poulematch + slot + pauze. */
export function knockoutScheduleFor(t: {
  matches: TournamentMatch[];
  trackCount?: number;
  knockoutPauseMinutes?: number;
  knockoutSlotMinutes?: number | null;
  finalsSlotMinutes?: number;
  roundBreakMinutes?: number;
}): KnockoutSchedule | undefined {
  const group = t.matches.filter((m) => m.phase === "GROUP_STAGE" && m.scheduledAt);
  if (!group.length) return undefined;
  const slot = slotMinutes(group);
  const last = Math.max(...group.map((m) => new Date(m.scheduledAt!).getTime()));
  return {
    start: new Date(last + (slot + (t.knockoutPauseMinutes ?? 15)) * 60_000),
    slotMinutes: t.knockoutSlotMinutes ?? slot,
    finalsSlotMinutes: t.finalsSlotMinutes ?? 30,
    roundBreakMinutes: t.roundBreakMinutes ?? 0,
    trackCount: t.trackCount ?? 6,
  };
}

const LATE_PHASES = new Set<Phase>(["QUARTER_FINAL", "SEMI_FINAL", "CONSOLATION_FINAL", "FINAL"]);

export function projectedKnockout(
  poules: TournamentPoule[],
  teams: TournamentTeam[],
  advancingPerPoule: number,
  bestNths: number,
  withConsolation = true,
  schedule?: KnockoutSchedule
): TournamentMatch[] {
  const ranking = rankTeams(pouleTables(poules, teams), advancingPerPoule, bestNths);
  const firstRound = projectFirstRound(ranking);
  if (firstRound.length === 0) return [];
  const size = firstRound.length * 2;
  // Rondes van groot naar klein die bij deze bracketgrootte horen.
  const byMatches: Record<number, { phase: Phase; pos: (n: number) => string }> = {
    16: { phase: "ROUND_OF_32", pos: (n) => `R32-${n}` },
    8: { phase: "ROUND_OF_16", pos: (n) => `R16-${n}` },
    4: { phase: "QUARTER_FINAL", pos: (n) => `QF${n}` },
    2: { phase: "SEMI_FINAL", pos: (n) => `SF${n}` },
    1: { phase: "FINAL", pos: () => "F1" },
  };
  let id = -1;
  const blank = (phase: Phase, pos: string): TournamentMatch => ({
    id: id--, phase, pouleId: null, teamAId: null, teamBId: null, winnerId: null,
    scoreA: null, scoreB: null, scheduledAt: null, track: null, bracketPos: pos,
  });
  const out: TournamentMatch[] = [];
  const levels: TournamentMatch[][] = [];
  for (let n = size / 2; n >= 1; n /= 2) {
    const meta = byMatches[n];
    if (!meta) return [];
    levels.push(Array.from({ length: n }, (_, i) => blank(meta.phase, meta.pos(i + 1))));
  }
  firstRound.forEach((p, i) => {
    const m = levels[0][i];
    m.teamAId = p.a?.team.id ?? null;
    m.teamBId = p.b?.team.id ?? null;
    if (!p.a || !p.b) {
      // Vrijloting: het team staat meteen in de volgende ronde.
      const next = levels[1]?.[Math.floor(i / 2)];
      const t = (p.a ?? p.b)?.team.id ?? null;
      if (next) {
        if (i % 2 === 0) next.teamAId = t;
        else next.teamBId = t;
      }
      m.teamAId = m.teamBId = null;
      m.bracketPos = null; // niet tonen
    }
  });
  if (withConsolation && size >= 4) levels[levels.length - 1].unshift(blank("CONSOLATION_FINAL", "CF1"));
  // Uren en banen zoals de backend ze zal plannen.
  let roundStart = schedule?.start.getTime() ?? 0;
  for (const l of levels) {
    const playable = l.filter((m) => m.bracketPos !== null);
    if (schedule) {
      const slot = playable.some((m) => LATE_PHASES.has(m.phase)) ? schedule.finalsSlotMinutes : schedule.slotMinutes;
      playable.forEach((m, i) => {
        m.scheduledAt = new Date(roundStart + Math.floor(i / schedule.trackCount) * slot * 60_000).toISOString();
        m.track = (i % schedule.trackCount) + 1;
      });
      const slots = Math.max(1, Math.ceil(playable.length / schedule.trackCount));
      roundStart += (slots * slot + schedule.roundBreakMinutes) * 60_000;
    }
    out.push(...playable);
  }
  return out;
}
