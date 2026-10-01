"use client";

import { Fragment, useMemo, useState } from "react";

import { teamName } from "@/lib/tournament-helpers";
import { PHASE_LABELS, Phase, TournamentMatch, TournamentTeam } from "@/lib/tournament-types";
import { IconTrophy } from "@/components/ui/icons/IconTrophy";
import { MatchBlock, PageHead, SectionHead } from "../_shared";

// ── Layout constants (uit het designcanvas) ───────────────
const SLOT_H = 104; // px per slot in de breedste ronde
const CARD_H = 64; // px hoogte van een bracketkaart
const COL_W = 176; // px breedte van een rondekolom
const CONN_W = 18; // px breedte van een connectorstrook
const FINAL_W = 180; // px breedte van de finalekolom
const CONSOL_GAP = 40; // px tussen bracket en troostfinale

const PRE_FINAL_PHASES: Phase[] = ["ROUND_OF_32", "ROUND_OF_16", "QUARTER_FINAL", "SEMI_FINAL"];

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

// ── Bracketkaart ──────────────────────────────────────────
function MatchCard({
  match,
  teams,
  title,
  dashed = false,
}: Readonly<{
  match: TournamentMatch | undefined;
  teams: TournamentTeam[];
  title?: string;
  dashed?: boolean;
}>) {
  const height = title ? CARD_H + 24 : CARD_H;

  if (!match || (!match.teamAId && !match.teamBId)) {
    return (
      <div
        style={{ height }}
        className="flex flex-col overflow-hidden rounded-xl border border-dashed border-rule bg-surface"
      >
        {title && (
          <div className="border-b border-rule py-1 text-center text-[0.5625rem] font-bold uppercase tracking-wider text-ink-2">
            {title}
          </div>
        )}
        <div className="flex flex-1 items-center px-3 text-xs text-ink-2">TBD</div>
        <div className="flex flex-1 items-center border-t border-rule px-3 text-xs text-ink-2">
          TBD
        </div>
      </div>
    );
  }

  const nameA = teamName(teams, match.teamAId);
  const nameB = teamName(teams, match.teamBId);
  const played = match.scoreA !== null;
  const winA = played && (match.scoreA ?? 0) > (match.scoreB ?? 0);
  const winB = played && (match.scoreB ?? 0) > (match.scoreA ?? 0);

  const row = (name: string, score: number | null, isWinner: boolean, border: boolean) => (
    <div
      className={`flex flex-1 items-center justify-between gap-2 px-3 text-[0.8125rem] ${
        border ? "border-t border-rule" : ""
      } ${isWinner ? "bg-pink/[0.06]" : ""}`}
    >
      <span className={`truncate ${isWinner ? "font-semibold text-ink" : "text-ink-2"}`}>
        {name}
      </span>
      {played && (
        <span
          className={`shrink-0 tabular-nums ${isWinner ? "font-bold text-pink" : "text-ink-2"}`}
        >
          {score}
        </span>
      )}
    </div>
  );

  return (
    <div
      style={{ height }}
      className={`flex flex-col overflow-hidden rounded-xl border bg-surface shadow-sm ${
        dashed ? "border-dashed border-rule" : "border-rule"
      }`}
    >
      {title && (
        <div className="border-b border-rule py-1 text-center text-[0.5625rem] font-bold uppercase tracking-wider text-ink-2">
          {title}
        </div>
      )}
      {row(nameA, match.scoreA, winA, false)}
      {row(nameB, match.scoreB, winB, true)}
    </div>
  );
}

// ── Rondekolom ────────────────────────────────────────────
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
      {matches.map((match, i) => (
        <div
          key={match.id}
          style={{ position: "absolute", top: i * slotH + (slotH - CARD_H) / 2, left: 0, right: 0 }}
        >
          <MatchCard match={match} teams={teams} />
        </div>
      ))}
    </div>
  );
}

// ── Connectors ────────────────────────────────────────────
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
        const midY = (topCenter + botCenter) / 2;

        return (
          <Fragment key={receiver.id}>
            <div
              style={{
                position: "absolute",
                left: mirrored ? undefined : 0,
                right: mirrored ? 0 : undefined,
                top: topCenter,
                width: 2,
                height: botCenter - topCenter,
              }}
              className="bg-rule"
            />
            <div
              style={{ position: "absolute", left: 0, top: midY - 1, width: CONN_W, height: 2 }}
              className="bg-rule"
            />
          </Fragment>
        );
      })}
    </div>
  );
}

function HorzConn({ totalH }: Readonly<{ totalH: number }>) {
  return (
    <div style={{ width: CONN_W, height: totalH, flexShrink: 0 }} className="relative">
      <div
        style={{ position: "absolute", left: 0, top: totalH / 2 - 1, width: CONN_W, height: 2 }}
        className="bg-rule"
      />
    </div>
  );
}

// ── View ──────────────────────────────────────────────────
interface Props {
  matches: TournamentMatch[];
  teams: TournamentTeam[];
  year: number;
}

export function BracketView({ matches, teams, year }: Readonly<Props>) {
  const hasR16 = matches.some((m) => m.phase === "ROUND_OF_32");
  const [showR16, setShowR16] = useState(false);

  const r16Matches = useMemo(
    () => sortByPos(matches.filter((m) => m.phase === "ROUND_OF_32")),
    [matches]
  );
  const finalMatches = useMemo(
    () => sortByPos(matches.filter((m) => m.phase === "FINAL")),
    [matches]
  );
  const consolationMatches = useMemo(
    () => sortByPos(matches.filter((m) => m.phase === "CONSOLATION_FINAL")),
    [matches]
  );
  const tiebreakerMatches = useMemo(
    () => sortByPos(matches.filter((m) => m.phase === "TIEBREAK")),
    [matches]
  );

  // Rondes in de boom — de 1/16 zit er nooit in, die is te breed voor een laptop
  const treePhases = PRE_FINAL_PHASES.filter(
    (p) => p !== "ROUND_OF_32" && matches.some((m) => m.phase === p)
  );
  const treeRounds = treePhases.map((p) => sortByPos(matches.filter((m) => m.phase === p)));

  const leftRounds = treeRounds.map((r) => r.slice(0, Math.floor(r.length / 2)));
  const rightRounds = treeRounds.map((r) => r.slice(Math.floor(r.length / 2))).reverse();
  const leftPhases = treePhases;
  const rightPhases = treePhases.slice().reverse();

  // Winnaar
  const [finalMatch] = finalMatches;
  let finalWinnerId = finalMatch?.winnerId ?? null;
  if (!finalWinnerId && finalMatch && finalMatch.scoreA !== null) {
    finalWinnerId =
      (finalMatch.scoreA ?? 0) >= (finalMatch.scoreB ?? 0) ? finalMatch.teamAId : finalMatch.teamBId;
  }
  const winnerName = finalWinnerId ? teamName(teams, finalWinnerId) : null;

  // Hoeveel teams zijn er nog over?
  const livePhase = (
    ["ROUND_OF_32", "ROUND_OF_16", "QUARTER_FINAL", "SEMI_FINAL", "FINAL"] as Phase[]
  ).find((p) =>
    matches.some((m) => m.phase === p && m.scoreA === null)
  );
  // Aantal teams in een ronde = aantal wedstrijden x 2. Tellen via team-ids
  // klopt niet zolang de loting nog TBD-plekken heeft.
  const teamsLeft = livePhase
    ? matches.filter((m) => m.phase === livePhase).length * 2
    : null;

  const outerCount = leftRounds[0]?.length ?? 1;
  const totalH = Math.max(outerCount, 1) * SLOT_H;
  const sideCount = leftRounds.length;
  const sideW = sideCount * (COL_W + CONN_W);
  const totalW = sideW + FINAL_W + sideW;

  const hasTree = leftRounds.length > 0 && finalMatches.length > 0;
  const [consolation] = consolationMatches;
  const consolationInTree = hasTree && consolationMatches.length === 1;
  const treeH = totalH + (consolationInTree ? CONSOL_GAP + CARD_H + 24 : 0);

  return (
    <div className="flex flex-col gap-7">
      {/* ── Kop ────────────────────────────────────────── */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHead title="Knockoutfase" />
        <div className="flex items-center gap-2.5 rounded-full border border-pink/20 bg-pink-soft px-4 py-2">
          <span className="flex text-pink">
            <IconTrophy />
          </span>
          <span className="text-[0.8125rem] font-semibold text-ink">
            {winnerName
              ? `${winnerName} wint ${year}`
              : `${teamsLeft ?? teams.length} van ${teams.length} teams over`}
          </span>
        </div>
      </div>

      {/* ── Scope-schakelaar ───────────────────────────── */}
      {hasR16 && hasTree && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-1 rounded-[10px] bg-ink/5 p-1">
            {[
              { key: true, label: PHASE_LABELS.ROUND_OF_32 },
              { key: false, label: `Vanaf ${PHASE_LABELS.ROUND_OF_16.replace(" finales", "")}` },
            ].map(({ key, label }) => (
              <button
                key={String(key)}
                type="button"
                onClick={() => setShowR16(key)}
                className={`rounded-[7px] px-4 py-1.5 text-[0.78rem] font-semibold transition-colors ${
                  showR16 === key ? "bg-surface text-ink shadow-sm" : "text-ink-2 hover:text-ink"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <span className="text-[0.78rem] text-ink-2">
            {r16Matches.length * 2} teams startten in de {PHASE_LABELS.ROUND_OF_32}
          </span>
        </div>
      )}

      {/* ── 1/16 als lijst ─────────────────────────────── */}
      {showR16 && hasR16 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {r16Matches.map((m) => (
            <MatchBlock key={m.id} match={m} teams={teams} label={PHASE_LABELS.ROUND_OF_32} />
          ))}
        </div>
      ) : (
        hasTree && (
          <div className="overflow-x-auto pb-2">
            {/* Fase-labels */}
            <div className="mb-3.5 flex" style={{ width: totalW, minWidth: totalW }}>
              {leftPhases.map((phase) => (
                <div key={`lbl-l-${phase}`} style={{ width: COL_W + CONN_W, flexShrink: 0 }}>
                  <p className="text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-ink-2">
                    {PHASE_LABELS[phase]}
                  </p>
                </div>
              ))}
              <div style={{ width: FINAL_W, flexShrink: 0 }}>
                <p className="text-center text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-pink">
                  {PHASE_LABELS.FINAL}
                </p>
              </div>
              {rightPhases.map((phase) => (
                <div key={`lbl-r-${phase}`} style={{ width: COL_W + CONN_W, flexShrink: 0 }}>
                  <p className="text-right text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-ink-2">
                    {PHASE_LABELS[phase]}
                  </p>
                </div>
              ))}
            </div>

            {/* Boom */}
            <div
              style={{ height: treeH, width: totalW, minWidth: totalW }}
              className="relative"
            >
              <div style={{ height: totalH }} className="flex">
                {leftRounds.map((round, i) => {
                  const feederSlotH = totalH / Math.max(round.length, 1);
                  return (
                    <Fragment key={`left-${leftPhases[i]}`}>
                      <RoundCol matches={round} teams={teams} totalH={totalH} />
                      {i === leftRounds.length - 1 ? (
                        <HorzConn totalH={totalH} />
                      ) : (
                        <BracketConn
                          receiverMatches={leftRounds[i + 1]}
                          feederSlotH={feederSlotH}
                          totalH={totalH}
                        />
                      )}
                    </Fragment>
                  );
                })}

                <RoundCol
                  matches={finalMatches}
                  teams={teams}
                  totalH={totalH}
                  width={FINAL_W}
                />

                {rightRounds.map((round, i) => (
                  <Fragment key={`right-${rightPhases[i]}`}>
                    {/* De strook links van deze kolom verbindt DEZE ronde
                        (de voeders, verder van het midden) met de ronde
                        ernaast richting de finale (de ontvanger). */}
                    {i === 0 ? (
                      <HorzConn totalH={totalH} />
                    ) : (
                      <BracketConn
                        receiverMatches={rightRounds[i - 1]}
                        feederSlotH={totalH / Math.max(round.length, 1)}
                        totalH={totalH}
                        mirrored
                      />
                    )}
                    <RoundCol matches={round} teams={teams} totalH={totalH} />
                  </Fragment>
                ))}
              </div>

              {/* Troostfinale hangt onder de finale, met stippellijnen
                  vanaf beide halve finales */}
              {consolationInTree && (
                <>
                  <div
                    style={{
                      position: "absolute",
                      left: sideW - CONN_W,
                      top: totalH / 2,
                      width: 0,
                      height: totalH / 2 + CONSOL_GAP,
                    }}
                    className="border-l-2 border-dashed border-rule"
                  />
                  <div
                    style={{
                      position: "absolute",
                      left: sideW + FINAL_W,
                      top: totalH / 2,
                      width: 0,
                      height: totalH / 2 + CONSOL_GAP,
                    }}
                    className="border-l-2 border-dashed border-rule"
                  />
                  <div
                    style={{
                      position: "absolute",
                      left: sideW - CONN_W,
                      top: totalH + CONSOL_GAP,
                      width: FINAL_W + CONN_W,
                      height: 0,
                    }}
                    className="border-t-2 border-dashed border-rule"
                  />
                  <div
                    style={{
                      position: "absolute",
                      left: sideW,
                      top: totalH + CONSOL_GAP,
                      width: FINAL_W,
                    }}
                  >
                    <MatchCard
                      match={consolation}
                      teams={teams}
                      title={
                        consolation?.track !== null && consolation?.track !== undefined
                          ? `${PHASE_LABELS.CONSOLATION_FINAL} · Baan ${consolation.track}`
                          : PHASE_LABELS.CONSOLATION_FINAL
                      }
                      dashed
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        )
      )}

      {/* ── Finale zonder boom (nog geen voorrondes) ───── */}
      {!showR16 && !hasTree && finalMatches.length > 0 && (
        <div>
          <SectionHead title={PHASE_LABELS.FINAL} />
          <div className="grid gap-3 sm:grid-cols-2">
            {finalMatches.map((m) => (
              <MatchBlock key={m.id} match={m} teams={teams} size="lg" />
            ))}
          </div>
        </div>
      )}

      {/* ── 1/16 zonder boom ───────────────────────────── */}
      {!hasTree && hasR16 && (
        <div>
          <SectionHead title={PHASE_LABELS.ROUND_OF_32} />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {r16Matches.map((m) => (
              <MatchBlock key={m.id} match={m} teams={teams} />
            ))}
          </div>
        </div>
      )}

      {/* ── Troostfinale los (meerdere of geen boom) ────── */}
      {consolationMatches.length > 0 && !consolationInTree && (
        <div>
          <SectionHead title={PHASE_LABELS.CONSOLATION_FINAL} />
          <div className="grid gap-3 sm:grid-cols-2">
            {consolationMatches.map((m) => (
              <MatchBlock key={m.id} match={m} teams={teams} />
            ))}
          </div>
        </div>
      )}

      {/* ── Tiebreak ───────────────────────────────────── */}
      {tiebreakerMatches.length > 0 && (
        <div>
          <SectionHead title={PHASE_LABELS.TIEBREAK} />
          <div className="grid gap-3 sm:grid-cols-2">
            {tiebreakerMatches.map((m) => (
              <MatchBlock key={m.id} match={m} teams={teams} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
