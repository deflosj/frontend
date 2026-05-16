import { Fragment } from "react";
import { notFound } from "next/navigation";

import { getTournament, teamName } from "@/lib/tournament-helpers";
import { PHASE_LABELS, Phase, TournamentMatch, TournamentTeam } from "@/lib/tournament-types";
import { Empty } from "../_shared";

// ── Layout constants ──────────────────────────────────────
const SLOT_H   = 120; // px per slot in the outermost (widest) round
const CARD_H   = 68;  // px height of a match card
const COL_W    = 184; // px width of a round column
const CONN_W   = 40;  // px width of a connector strip
const FINAL_W  = 200; // px width of the center FINAL column

// Phases that appear in the visual bracket, outer → inner
const PRE_FINAL_PHASES: Phase[] = ["R16", "R8", "QUARTER", "SEMI"];

const KNOCKOUT_SET = new Set<Phase>([
  "R16", "R8", "QUARTER", "SEMI", "CONSOLATION_FINAL", "FINAL", "TIEBREAK",
]);

// ── Helpers ───────────────────────────────────────────────
function sortByPos(ms: TournamentMatch[]): TournamentMatch[] {
  return [...ms].sort((a, b) => {
    if (a.bracketPos && b.bracketPos) {
      const nA = Number.parseInt(a.bracketPos.split("-").at(-1) ?? "", 10);
      const nB = Number.parseInt(b.bracketPos.split("-").at(-1) ?? "", 10);
      if (!Number.isNaN(nA) && !Number.isNaN(nB)) return nA - nB;
      return a.bracketPos.localeCompare(b.bracketPos);
    }
    return a.id - b.id;
  });
}

// ── Match card ────────────────────────────────────────────
function MatchCard({
  match,
  teams,
}: Readonly<{ match: TournamentMatch | undefined; teams: TournamentTeam[] }>) {
  if (!match || (!match.teamAId && !match.teamBId)) {
    return (
      <div
        style={{ height: CARD_H }}
        className="flex flex-col overflow-hidden rounded-xl border border-dashed border-rule bg-surface"
      >
        <div className="flex flex-1 items-center px-3 text-xs text-muted">TBD</div>
        <div className="flex flex-1 items-center border-t border-rule px-3 text-xs text-muted">TBD</div>
      </div>
    );
  }

  const nameA = teamName(teams, match.teamAId);
  const nameB = teamName(teams, match.teamBId);
  const played  = match.scoreA !== null;
  const winA = played && (match.scoreA ?? 0) > (match.scoreB ?? 0);
  const winB = played && (match.scoreB ?? 0) > (match.scoreA ?? 0);

  return (
    <div
      style={{ height: CARD_H }}
      className="flex flex-col overflow-hidden rounded-xl border border-rule bg-surface text-sm shadow-sm"
    >
      <div className={`flex flex-1 items-center justify-between gap-2 px-3 ${winA ? "bg-pink/5" : ""}`}>
        <span className={`truncate ${winA ? "font-semibold text-ink" : "text-ink-2"}`}>{nameA}</span>
        {played && (
          <span className={`shrink-0 tabular-nums ${winA ? "font-bold text-pink" : "font-medium text-muted"}`}>
            {match.scoreA}
          </span>
        )}
      </div>
      <div className={`flex flex-1 items-center justify-between gap-2 border-t border-rule px-3 ${winB ? "bg-pink/5" : ""}`}>
        <span className={`truncate ${winB ? "font-semibold text-ink" : "text-ink-2"}`}>{nameB}</span>
        {played && (
          <span className={`shrink-0 tabular-nums ${winB ? "font-bold text-pink" : "font-medium text-muted"}`}>
            {match.scoreB}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Round column ──────────────────────────────────────────
function RoundCol({
  matches,
  teams,
  totalH,
  width = COL_W,
}: Readonly<{
  matches: TournamentMatch[];
  teams: TournamentTeam[];
  totalH: number;
  width?: number;
}>) {
  const slotH = totalH / Math.max(matches.length, 1);
  return (
    <div style={{ width, height: totalH, flexShrink: 0 }} className="relative">
      {matches.map((match, i) => {
        const top = i * slotH + (slotH - CARD_H) / 2;
        return (
          <div key={match.id} style={{ position: "absolute", top, left: 0, right: 0 }}>
            <MatchCard match={match} teams={teams} />
          </div>
        );
      })}
    </div>
  );
}

// ── Bracket connector ─────────────────────────────────────
// Draws N bracket shapes where each pair of feeder matches converges to one receiver.
//   normal  (mirrored=false): feeders left, receiver right → vertical on LEFT, horizontal → right
//   mirrored (mirrored=true): feeders right, receiver left → vertical on RIGHT, horizontal → left
function BracketConn({
  receiverMatches,
  feederSlotH,
  totalH,
  mirrored = false,
}: Readonly<{
  receiverMatches: TournamentMatch[];
  feederSlotH: number;
  totalH: number;
  mirrored?: boolean;
}>) {
  return (
    <div style={{ width: CONN_W, height: totalH, flexShrink: 0 }} className="relative">
      {receiverMatches.map((receiver, nextIdx) => {
        const topCenter = nextIdx * 2 * feederSlotH + feederSlotH / 2;
        const botCenter = (nextIdx * 2 + 1) * feederSlotH + feederSlotH / 2;
        const midY      = (topCenter + botCenter) / 2;

        return (
          <Fragment key={receiver.id}>
            {/* Vertical line connecting the two feeder centers */}
            <div
              style={{
                position : "absolute",
                left     : mirrored ? undefined : 0,
                right    : mirrored ? 0 : undefined,
                top      : topCenter,
                width    : 2,
                height   : botCenter - topCenter,
              }}
              className="bg-rule"
            />
            {/* Horizontal line at the midpoint (→ receiver) */}
            <div
              style={{
                position : "absolute",
                left     : 0,
                top      : midY - 1,
                width    : CONN_W,
                height   : 2,
              }}
              className="bg-rule"
            />
          </Fragment>
        );
      })}
    </div>
  );
}

// ── Simple horizontal connector (1-to-1, SF ↔ FINAL) ─────
function HorzConn({ totalH }: Readonly<{ totalH: number }>) {
  const midY = totalH / 2;
  return (
    <div style={{ width: CONN_W, height: totalH, flexShrink: 0 }} className="relative">
      <div
        style={{ position: "absolute", left: 0, top: midY - 1, width: CONN_W, height: 2 }}
        className="bg-rule"
      />
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────
export default async function BracketsPage({
  params,
}: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  const tournament = await getTournament(id);
  if (!tournament) notFound();

  const { matches, teams } = tournament;

  if (!matches.some((m) => KNOCKOUT_SET.has(m.phase))) {
    return <Empty text="De knockoutfase is nog niet begonnen." />;
  }

  // ── Build left & right rounds ───────────────────────────
  // preFinalPhases in outer→inner order (e.g. ["R16","QUARTER","SEMI"])
  const preFinalPhases = PRE_FINAL_PHASES.filter((p) => matches.some((m) => m.phase === p));
  const preFinalRounds = preFinalPhases.map((p) =>
    sortByPos(matches.filter((m) => m.phase === p))
  );

  // First half → left side (outer→inner); second half → right side (outer→inner),
  // then reversed so right side displays inner→outer from the FINAL outward.
  const leftRounds  = preFinalRounds.map((r) => r.slice(0, Math.floor(r.length / 2)));
  const rightRoundsRaw = preFinalRounds.map((r) => r.slice(Math.floor(r.length / 2)));
  const rightRounds = rightRoundsRaw.slice().reverse(); // now inner→outer (SF first)

  // Corresponding phase labels for header row
  const leftPhases  = preFinalPhases;
  const rightPhases = preFinalPhases.slice().reverse();

  // FINAL
  const finalMatches       = sortByPos(matches.filter((m) => m.phase === "FINAL"));
  const [finalMatch]       = finalMatches;
  const consolationMatches = sortByPos(matches.filter((m) => m.phase === "CONSOLATION_FINAL"));
  const tiebreakerMatches  = sortByPos(matches.filter((m) => m.phase === "TIEBREAK"));

  // Winner
  let finalWinnerId = finalMatch?.winnerId ?? null;
  if (!finalWinnerId && finalMatch?.scoreA !== null && finalMatch) {
    finalWinnerId =
      (finalMatch.scoreA ?? 0) >= (finalMatch.scoreB ?? 0)
        ? (finalMatch.teamAId ?? null)
        : (finalMatch.teamBId ?? null);
  }
  const winnerName = finalWinnerId ? teamName(teams, finalWinnerId) : null;

  // Height: determined by the outermost (widest) round on either side
  const outerLeftCount = leftRounds.length > 0 ? (leftRounds[0].length ?? 1) : 1;
  const totalH = Math.max(outerLeftCount, 1) * SLOT_H;

  // Total bracket width
  const sideCount  = leftRounds.length; // same for both sides
  const sideW      = sideCount * COL_W + sideCount * CONN_W; // each side: cols + connectors
  const totalW     = sideW + FINAL_W + sideW;

  const hasBracket = leftRounds.length > 0 || finalMatches.length > 0;

  return (
    <div className="flex flex-col gap-12">

      {/* ── Winner banner ──────────────────────────────── */}
      {winnerName && (
        <div className="rounded-2xl border border-pink/30 bg-pink-soft px-6 py-5 text-center">
          <p className="mb-1 text-[0.6875rem] font-semibold uppercase tracking-widest text-pink">
            Winnaar
          </p>
          <p className="text-2xl font-bold text-ink">{"🏆 "}{winnerName}</p>
        </div>
      )}

      {/* ── Visual bracket ─────────────────────────────── */}
      {hasBracket && (
        <div className="overflow-x-auto pb-2">

          {/* ── Phase labels ─────────────────────────── */}
          <div className="mb-3 flex" style={{ width: totalW, minWidth: totalW }}>
            {/* Left labels (outer→inner) */}
            {leftPhases.map((phase) => (
              <div key={`lbl-l-${phase}`} style={{ width: COL_W + CONN_W, flexShrink: 0 }}>
                <p className="text-[0.6875rem] font-bold uppercase tracking-widest text-muted">
                  {PHASE_LABELS[phase]}
                </p>
              </div>
            ))}

            {/* Center: FINAL label */}
            <div style={{ width: FINAL_W, flexShrink: 0 }}>
              <p className="text-center text-[0.6875rem] font-bold uppercase tracking-widest text-pink">
                {PHASE_LABELS["FINAL"]}
              </p>
            </div>

            {/* Right labels (inner→outer) */}
            {rightPhases.map((phase) => (
              <div key={`lbl-r-${phase}`} style={{ width: COL_W + CONN_W, flexShrink: 0 }}>
                <p className="text-right text-[0.6875rem] font-bold uppercase tracking-widest text-muted">
                  {PHASE_LABELS[phase]}
                </p>
              </div>
            ))}
          </div>

          {/* ── Bracket tree ─────────────────────────── */}
          <div style={{ height: totalH, width: totalW, minWidth: totalW }} className="relative flex">

            {/* ── LEFT SIDE (outer→inner) ──────────── */}
            {leftRounds.map((round, i) => {
              const feederSlotH = totalH / Math.max(round.length, 1);
              const nextRound   = leftRounds[i + 1];
              const isInnermost = i === leftRounds.length - 1;

              return (
                <Fragment key={`left-${leftPhases[i]}`}>
                  <RoundCol matches={round} teams={teams} totalH={totalH} />

                  {/* Bracket connector to next left round, or simple line to FINAL */}
                  {isInnermost ? (
                    /* SF-left → FINAL: just a horizontal line at center */
                    <HorzConn totalH={totalH} />
                  ) : (
                    /* Outer → inner bracket connector (feeder left, receiver right) */
                    <BracketConn
                      receiverMatches={nextRound}
                      feederSlotH={feederSlotH}
                      totalH={totalH}
                      mirrored={false}
                    />
                  )}
                </Fragment>
              );
            })}

            {/* ── FINAL (center) ───────────────────── */}
            <RoundCol
              matches={finalMatches}
              teams={teams}
              totalH={totalH}
              width={FINAL_W}
            />

            {/* ── RIGHT SIDE (inner→outer) ─────────── */}
            {rightRounds.map((round, i) => {
              const nextRound   = rightRounds[i + 1]; // further from center
              const isInnermost = i === 0;
              // Feeder for right-side bracket connectors is the NEXT (outer) round
              const feederSlotH = nextRound
                ? totalH / Math.max(nextRound.length, 1)
                : totalH / Math.max(round.length, 1);

              return (
                <Fragment key={`right-${rightPhases[i]}`}>
                  {/* FINAL → SF-right: just a horizontal line at center */}
                  {isInnermost ? (
                    <HorzConn totalH={totalH} />
                  ) : (
                    /* Inner → outer mirrored bracket connector (feeder RIGHT, receiver LEFT) */
                    <BracketConn
                      receiverMatches={round}
                      feederSlotH={feederSlotH}
                      totalH={totalH}
                      mirrored={true}
                    />
                  )}

                  <RoundCol matches={round} teams={teams} totalH={totalH} />
                </Fragment>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Consolation final ──────────────────────────── */}
      {consolationMatches.length > 0 && (
        <div>
          <h3 className="mb-3 text-[0.6875rem] font-bold uppercase tracking-widest text-muted">
            Troostfinale
          </h3>
          <div style={{ maxWidth: COL_W }} className="flex flex-col gap-2">
            {consolationMatches.map((m) => (
              <MatchCard key={m.id} match={m} teams={teams} />
            ))}
          </div>
        </div>
      )}

      {/* ── Tiebreaker ─────────────────────────────────── */}
      {tiebreakerMatches.length > 0 && (
        <div>
          <h3 className="mb-3 text-[0.6875rem] font-bold uppercase tracking-widest text-muted">
            Tiebreaker
          </h3>
          <div className="grid gap-2 sm:grid-cols-2" style={{ maxWidth: COL_W * 2 + 16 }}>
            {tiebreakerMatches.map((m) => (
              <MatchCard key={m.id} match={m} teams={teams} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
