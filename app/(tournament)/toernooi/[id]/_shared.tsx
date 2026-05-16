import Link from "next/link";

import { fmt, matchSideClass, teamName } from "@/lib/tournament-helpers";
import { TournamentMatch, TournamentTeam } from "@/lib/tournament-types";

// ── Match block ───────────────────────────────────────────────────────────────

export function MatchBlock({
  match,
  teams,
  size = "sm",
}: Readonly<{
  match: TournamentMatch | undefined;
  teams: TournamentTeam[];
  size?: "sm" | "lg";
}>) {
  if (!match) {
    return (
      <div className="rounded-xl border border-dashed border-rule bg-surface px-4 py-5 text-center text-xs text-muted">
        Nog geen match
      </div>
    );
  }

  const nameA = teamName(teams, match.teamAId);
  const nameB = teamName(teams, match.teamBId);
  const isPlayed = match.scoreA !== null && match.scoreB !== null;
  const winnerA = isPlayed && match.scoreA! > match.scoreB!;
  const winnerB = isPlayed && match.scoreB! > match.scoreA!;
  const classA = matchSideClass(isPlayed, winnerA);
  const classB = matchSideClass(isPlayed, winnerB);
  const textSize = size === "lg" ? "text-base" : "text-sm";
  const scoreSize = size === "lg" ? "text-xl font-black" : "text-base font-bold";

  return (
    <div
      className={`overflow-hidden rounded-xl border bg-surface ${
        size === "lg" ? "border-pink/30" : "border-rule"
      }`}
    >
      {/* Track / time bar */}
      {match.track !== null && (
        <div className="flex items-center gap-2 border-b border-rule bg-surface px-4 py-2">
          <span className="text-xs font-bold text-pink">Baan {match.track}</span>
          <span className="text-rule">·</span>
          <span className="text-xs text-muted">
            {fmt(match.time ?? new Date().toISOString())}
          </span>
        </div>
      )}

      {/* Teams + score */}
      <div className="flex items-center gap-3 px-4 py-4">
        <span className={`min-w-0 flex-1 truncate text-right font-semibold ${textSize} ${classA}`}>
          {nameA}
        </span>

        {isPlayed ? (
          <span
            className={`shrink-0 rounded-lg bg-ink/5 px-3 py-1 text-center tabular-nums text-ink ${scoreSize}`}
          >
            {match.scoreA}–{match.scoreB}
          </span>
        ) : (
          <span className="shrink-0 px-2 text-xs font-semibold uppercase tracking-widest text-rule">
            vs
          </span>
        )}

        <span className={`min-w-0 flex-1 truncate font-semibold ${textSize} ${classB}`}>
          {nameB}
        </span>
      </div>
    </div>
  );
}

// ── Team card ─────────────────────────────────────────────────────────────────

function TeamCardInner({ team }: Readonly<{ team: TournamentTeam }>) {
  return (
    <>
      <div className="mb-3 flex items-start justify-between gap-2">
        <h4 className="font-semibold text-ink">{team.name}</h4>
        {team.isPresent && (
          <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
            Aanwezig
          </span>
        )}
      </div>
      <p className="mb-2 text-[0.625rem] font-semibold uppercase tracking-widest text-pink">
        Kapitein: {team.captainName}
      </p>
      <div className="flex flex-col gap-0.5">
        {[team.speler1, team.speler2, team.speler3, team.speler4].map((speler) => (
          <p key={speler} className="text-xs text-muted">
            {speler}
          </p>
        ))}
      </div>
    </>
  );
}

export function TeamCard({
  team,
  href,
}: Readonly<{ team: TournamentTeam; href?: string }>) {
  const base =
    "rounded-2xl border border-rule bg-surface px-5 py-4 transition-colors";

  if (href) {
    return (
      <Link href={href} className={`${base} block hover:border-pink/25 hover:bg-pink-soft`}>
        <TeamCardInner team={team} />
      </Link>
    );
  }

  return (
    <div className={base}>
      <TeamCardInner team={team} />
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

export function Empty({ text }: Readonly<{ text: string }>) {
  return <p className="text-sm text-muted">{text}</p>;
}
