"use client";

import { useState } from "react";

import { IconTrophy } from "@/components/ui/icons/IconTrophy";
import { KO_ROUNDS, feederLabels, posNumber } from "@/lib/tournament-live";
import type { TournamentMatch } from "@/lib/tournament-types";
import { fmtTime } from "@/utils/DateHelpers";

/**
 * Knock-outbracket zoals in het ontwerp:
 *  - laptop/tv: langs twee kanten naar de finale in het midden (MirroredBracket);
 *  - gsm: één richting, te beginnen bij een gekozen ronde (ForwardBracket).
 * Alle kaarten zijn even groot zodat de lijnen recht lopen. Uur en baan staan
 * als tabjes op de bovenrand. Maten in em: de tv zet alles groter via font-size.
 */

export const winnerOf = (m: TournamentMatch | undefined): number | null => {
  if (!m) return null;
  if (m.winnerId) return m.winnerId;
  if (m.scoreA === null || m.scoreB === null || m.scoreA === m.scoreB) return null;
  return m.scoreA > m.scoreB ? m.teamAId : m.teamBId;
};

export interface BracketCommon {
  matches: TournamentMatch[];
  nameOf: Map<number, string>;
  year?: number;
  teamId?: number | null;
  isFollowed?: (id: number | null | undefined) => boolean;
  onPick?: (id: number) => void;
  projected?: boolean;
}

interface Round {
  phase: TournamentMatch["phase"];
  label: string;
  short: string;
  prefix: string;
  n: number;
}

function useRounds(matches: TournamentMatch[]): Round[] {
  return KO_ROUNDS.filter((r) => r.phase !== "FINAL" && matches.some((m) => m.phase === r.phase)).map((r) => {
    const own = matches.filter((m) => m.phase === r.phase);
    return { ...r, n: Math.max(...own.map((m) => posNumber(m.bracketPos)), own.length) };
  });
}

function roundTime(matches: TournamentMatch[], phase: string, projected: boolean) {
  const own = matches.filter((m) => m.phase === phase && m.scheduledAt).map((m) => m.scheduledAt!).sort();
  if (!own.length) return projected ? "voorlopig" : "";
  const t = own[0] === own.at(-1) ? fmtTime(own[0]) : `${fmtTime(own[0])}–${fmtTime(own.at(-1)!)}`;
  return projected ? `voorlopig · ${t}` : t;
}

// ── Kaart ─────────────────────────────────────────────────────────────────────

function KoCard({
  m,
  pos,
  size,
  common,
  big = false,
  dashed = false,
  mirrored = false,
}: Readonly<{ m: TournamentMatch | undefined; pos: string; size: number; common: BracketCommon; big?: boolean; dashed?: boolean; mirrored?: boolean }>) {
  const { nameOf, teamId = null, isFollowed = () => false, onPick, projected = false } = common;
  const [fa, fb] = feederLabels(pos, size);
  const w = winnerOf(m);
  const mine = !!teamId && (m?.teamAId === teamId || m?.teamBId === teamId);
  const time = m?.scheduledAt ? fmtTime(m.scheduledAt) : "";
  const baan = m?.track ? `Baan ${m.track}` : "";
  const [tl, tr] = mirrored ? [baan, time] : [time, baan];
  const hot = mine || big;
  const tab = `absolute -top-[0.72em] inline-flex h-[1.45em] items-center rounded-full border bg-surface px-[0.55em] text-[0.8em] font-bold tabular-nums ${
    hot ? "border-pink text-pink-ink" : "border-pink/40 text-ink"
  }`;

  const row = (id: number | null, fallback: string, score: number | null | undefined) => {
    const lost = !!w && w !== id;
    const fav = isFollowed(id);
    const cls = !id
      ? "italic font-normal text-ink-2"
      : id === teamId
        ? "font-bold text-pink-ink"
        : fav
          ? lost ? "font-medium text-pink-ink/60" : "font-semibold text-pink-ink"
          : lost ? "font-normal text-ink-2" : "font-semibold";
    return (
      <button
        type="button"
        disabled={!id || !onPick}
        onClick={() => id && onPick?.(id)}
        title={id ? nameOf.get(id) : fallback}
        className="group flex min-w-0 items-center gap-[0.4em] text-left disabled:cursor-default"
      >
        <span className={`min-w-0 flex-1 truncate ${cls} ${id && onPick ? "group-hover:underline group-hover:underline-offset-2" : ""}`}>
          {id ? nameOf.get(id) ?? "?" : fallback.replace(/^Winnaar /, "W. ").replace(/^Verliezer /, "V. ")}
        </span>
        <span className={`min-w-[1em] text-right tabular-nums ${lost ? "text-ink-2" : "font-bold"}`}>{score ?? ""}</span>
      </button>
    );
  };

  return (
    <div
      className={`relative z-[2] flex h-[4.6em] w-full items-center rounded-[0.75em] border bg-surface px-[0.7em] pt-[0.4em] transition-opacity duration-300 ${
        mine ? "border-pink bg-pink-soft" : big ? "border-pink shadow-[0_1.2em_2.6em_-1.6em_rgba(255,93,146,.75)]" : "border-rule"
      } ${!big && !mine && (dashed || projected || !m || m.scoreA === null) ? "border-dashed" : ""} ${teamId && !mine ? "opacity-35" : ""}`}
    >
      {tl && <span className={`${tab} left-[0.6em]`}>{tl}</span>}
      {tr && <span className={`${tab} right-[0.6em]`}>{tr}</span>}
      <div className="flex min-w-0 flex-1 flex-col gap-[0.12em]">
        {row(m?.teamAId ?? null, fa, m?.scoreA)}
        <span aria-hidden="true" className="h-px bg-rule" />
        {row(m?.teamBId ?? null, fb, m?.scoreB)}
      </div>
    </div>
  );
}

/** Finale in het midden: beker en label erboven, winnaar en kleine finale eronder.
 *  De finalekaart zelf staat exact in het midden, zodat de lijnen er recht op uitkomen. */
function FinalBlock({
  common,
  byPos,
  size,
  lines,
}: Readonly<{ common: BracketCommon; byPos: Map<string, TournamentMatch>; size: number; lines: "both" | "left" | "none" }>) {
  const final = byPos.get("F1");
  const cf = byPos.get("CF1");
  const champ = winnerOf(final);
  const mine = !!common.teamId && (final?.teamAId === common.teamId || final?.teamBId === common.teamId);
  const line = `absolute top-1/2 w-[0.75em] border-t-2 ${mine ? "border-pink" : "border-rule"}`;
  return (
    <div className="relative flex h-full items-center">
      {lines !== "none" && <span aria-hidden="true" className={`${line} right-full`} />}
      {lines === "both" && <span aria-hidden="true" className={`${line} left-full`} />}
      <div className="absolute inset-x-0 bottom-[calc(50%+3.3em)] flex flex-col items-center gap-[0.5em]">
        <span className={`flex h-[3.4em] w-[3.4em] items-center justify-center rounded-full ${champ ? "bg-pink text-[#16161a] shadow-[0_0_0_0.55em_var(--pink-soft)]" : "bg-pink-soft text-pink-ink"}`}>
          <IconTrophy />
        </span>
        <span className="text-[0.78em] font-bold uppercase tracking-[0.12em] text-pink-ink">Finale</span>
      </div>
      <div className="w-full">
        <KoCard m={final} pos="F1" size={size} common={common} big />
      </div>
      <div className="absolute inset-x-0 top-[calc(50%+3.1em)] flex flex-col items-center gap-[0.6em]">
        {champ && (
          <span className="t-pop rounded-full bg-pink px-[1em] py-[0.35em] text-[0.9em] font-bold text-[#16161a]">
            Winnaar{common.year ? ` ${common.year}` : ""} · {common.nameOf.get(champ)}
          </span>
        )}
        {cf && (
          <>
            <span className="mt-[0.4em] text-[0.72em] font-bold uppercase tracking-[0.12em] text-ink-2">Kleine finale</span>
            <div className="mt-[0.5em] w-full">
              <KoCard m={cf} pos="CF1" size={size} common={common} dashed={cf.scoreA === null} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Laptop / tv: langs twee kanten ────────────────────────────────────────────

export function MirroredBracket({ rowEm = 5.9, ...common }: Readonly<BracketCommon & { rowEm?: number }>) {
  const { matches, teamId = null, projected = false } = common;
  const byPos = new Map(matches.filter((m) => m.bracketPos).map((m) => [m.bracketPos!, m]));
  const rounds = useRounds(matches);
  const L = rounds.length;
  const H = Math.max(1, (rounds[0]?.n ?? 2) / 2);
  const size = (rounds[0]?.n ?? 1) * 2;
  const cols = 2 * L + 1;

  const cells: React.ReactNode[] = [];
  rounds.forEach((r, ci) => {
    const half = r.n / 2;
    const span = H / half;
    for (const side of ["l", "r"] as const) {
      for (let k = 0; k < half; k++) {
        const i = side === "l" ? k + 1 : half + k + 1;
        const pos = r.prefix + i;
        const m = byPos.get(pos);
        const mine = !!teamId && (m?.teamAId === teamId || m?.teamBId === teamId);
        const cls = [
          "t-mb",
          side === "l" ? "o-r" : "o-l",
          ci === L - 1 ? "flat" : k % 2 === 0 ? "top" : "bot",
          ci > 0 ? (side === "l" ? "i-l" : "i-r") : "",
          mine && winnerOf(m) === teamId ? "hot-out" : "",
          mine && ci > 0 ? "hot-in" : "",
        ].join(" ");
        cells.push(
          <div
            key={pos}
            className={`${cls} t-col-in`}
            style={{ gridColumn: side === "l" ? ci + 1 : cols - ci, gridRow: `${2 + k * span} / span ${span}`, animationDelay: `${ci * 60}ms` }}
          >
            <KoCard m={m} pos={pos} size={size} common={common} mirrored={side === "r"} />
          </div>
        );
      }
    }
  });

  return (
    <div
      className="grid gap-x-[1.5em] text-[0.875em]"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gridTemplateRows: `auto repeat(${H}, ${rowEm}em)` }}
    >
      {rounds.map((r, ci) => (
        <div key={`hl-${r.phase}`} className="flex flex-col gap-[0.1em] pb-[1.1em]" style={{ gridColumn: ci + 1, gridRow: 1 }}>
          <span className="text-[1.05em] font-semibold">{r.label}</span>
          <span className="text-[0.85em] text-ink-2">{roundTime(matches, r.phase, projected)}</span>
        </div>
      ))}
      {rounds.map((r, ci) => (
        <div key={`hr-${r.phase}`} className="flex flex-col items-end gap-[0.1em] pb-[1.1em] text-right" style={{ gridColumn: cols - ci, gridRow: 1 }}>
          <span className="text-[1.05em] font-semibold">{r.label}</span>
          <span className="text-[0.85em] text-ink-2">{roundTime(matches, r.phase, projected)}</span>
        </div>
      ))}
      {cells}
      <div style={{ gridColumn: L + 1, gridRow: `2 / span ${H}` }}>
        <FinalBlock common={common} byPos={byPos} size={size} lines={L ? "both" : "none"} />
      </div>
    </div>
  );
}

// ── Gsm: één richting, vanaf een gekozen ronde ────────────────────────────────

export function ForwardBracket(common: Readonly<BracketCommon>) {
  const { matches, teamId = null, projected = false } = common;
  const byPos = new Map(matches.filter((m) => m.bracketPos).map((m) => [m.bracketPos!, m]));
  const all = useRounds(matches);
  const [start, setStart] = useState(0);
  const k = Math.min(start, all.length);
  const vis = all.slice(k);
  const H = vis[0]?.n ?? 1;
  const rowPx = Math.max(82, Math.ceil(380 / H));
  const size = (all[0]?.n ?? 1) * 2;
  const chips = [...all.map((r) => r.short), "Finale"];

  const cells: React.ReactNode[] = [];
  vis.forEach((r, j) => {
    const span = H / r.n;
    for (let i = 1; i <= r.n; i++) {
      const pos = r.prefix + i;
      const m = byPos.get(pos);
      const mine = !!teamId && (m?.teamAId === teamId || m?.teamBId === teamId);
      const cls = [
        "t-mb o-r",
        j === vis.length - 1 ? "flat" : i % 2 === 1 ? "top" : "bot",
        j > 0 ? "i-l" : "",
        mine && winnerOf(m) === teamId ? "hot-out" : "",
        mine && j > 0 ? "hot-in" : "",
      ].join(" ");
      cells.push(
        <div key={pos} className={`${cls} t-col-in`} style={{ gridColumn: j + 1, gridRow: `${2 + (i - 1) * span} / span ${span}`, animationDelay: `${j * 60}ms` }}>
          <KoCard m={m} pos={pos} size={size} common={common} />
        </div>
      );
    }
  });

  return (
    <div className="flex flex-col gap-3">
      <div role="group" aria-label="Vanaf ronde" className="-mx-5 flex gap-1.5 overflow-x-auto px-5 [scrollbar-width:none] sm:-mx-8 sm:px-8">
        {chips.map((c, idx) => (
          <button
            key={c}
            type="button"
            aria-pressed={k === idx}
            onClick={() => setStart(idx)}
            className={`t-press h-10 shrink-0 rounded-full border px-4 text-sm font-semibold ${k === idx ? "border-ink bg-ink text-paper" : "border-rule bg-surface"}`}
          >
            {c}
          </button>
        ))}
      </div>
      <p className="text-[0.8125rem] text-ink-2">{vis.length ? "Schuif opzij voor de volgende rondes →" : "Finale en kleine finale"}</p>
      <div className="-mx-5 overflow-x-auto px-5 pb-6 pt-1 [scrollbar-width:none] sm:-mx-8 sm:px-8">
        <div
          key={k}
          className="grid w-max gap-x-[1.5em] text-[0.875rem]"
          style={{ gridTemplateColumns: `${vis.length ? `repeat(${vis.length}, 210px) ` : ""}240px`, gridTemplateRows: `auto repeat(${H}, ${rowPx}px)` }}
        >
          {vis.map((r, j) => (
            <div key={r.phase} className="flex flex-col gap-0.5 pb-[1.1em]" style={{ gridColumn: j + 1, gridRow: 1 }}>
              <span className="font-semibold">{r.label}</span>
              <span className="text-xs text-ink-2">{roundTime(matches, r.phase, projected)}</span>
            </div>
          ))}
          {cells}
          <div style={{ gridColumn: vis.length + 1, gridRow: `2 / span ${H}` }}>
            <FinalBlock common={common} byPos={byPos} size={size} lines={vis.length ? "left" : "none"} />
          </div>
        </div>
      </div>
    </div>
  );
}
