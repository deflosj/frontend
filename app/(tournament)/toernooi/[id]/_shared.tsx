import Link from "next/link";

import { matchSideClass, saldoClass, teamName } from "@/lib/tournament-helpers";
import { TournamentMatch, TournamentTeam } from "@/lib/tournament-types";
import { fmtTime } from "@/utils/DateHelpers";

// ── Section heading ───────────────────────────────────────────────────────────

export function SectionHead({
  title,
  action,
}: Readonly<{ title: string; action?: React.ReactNode }>) {
  return (
    <div className="mb-3.5 flex items-center justify-between gap-4">
      <p className="text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-ink-2">{title}</p>
      {action}
    </div>
  );
}

// ── Page heading ──────────────────────────────────────────────────────────────

export function PageHead({
  title,
  subtitle,
}: Readonly<{ title: string; subtitle?: React.ReactNode }>) {
  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold tracking-tight text-ink sm:text-3xl">{title}</h1>
      {subtitle && <p className="text-[0.85rem] text-ink-2">{subtitle}</p>}
    </div>
  );
}

// ── Tab strip ─────────────────────────────────────────────────────────────────

export interface TabItem {
  key: string;
  label: string;
}

export function TabStrip({
  tabs,
  active,
  onSelect,
  compact = false,
}: Readonly<{
  tabs: TabItem[];
  active: string;
  onSelect: (key: string) => void;
  compact?: boolean;
}>) {
  return (
    <div className="-mx-5 flex overflow-x-auto border-b border-rule px-5 sm:-mx-8 sm:px-8">
      {tabs.map(({ key, label }) => {
        const isActive = key === active;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onSelect(key)}
            className={`relative shrink-0 py-2.5 text-[0.85rem] font-semibold transition-colors ${
              compact ? "px-3" : "px-4"
            } ${isActive ? "text-ink" : "text-ink/35 hover:text-ink/60"}`}
          >
            {label}
            <span
              className={`absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-pink transition-opacity ${
                isActive ? "opacity-100" : "opacity-0"
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}

// ── Match block ───────────────────────────────────────────────────────────────

export function MatchBlock({
  match,
  teams,
  size = "sm",
  label,
  highlight = false,
}: Readonly<{
  match: TournamentMatch | undefined;
  /** Enkel id en naam zijn nodig — zo werkt dit blok ook in het teamportaal. */
  teams: Pick<TournamentTeam, "id" | "name">[];
  size?: "sm" | "lg";
  /** Poulenaam of fasenaam, links in de balk boven de wedstrijd. */
  label?: string;
  /** Roze rand — voor de eerstvolgende of belangrijkste wedstrijd. */
  highlight?: boolean;
}>) {
  if (!match) {
    return (
      <div className="rounded-xl border border-dashed border-rule bg-surface px-4 py-5 text-center text-xs text-ink-2">
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
  const scoreSize = size === "lg" ? "text-xl font-bold" : "text-[0.9375rem] font-bold";
  const showBar = label !== undefined || match.track !== null;

  return (
    <div
      className={`overflow-hidden rounded-xl border bg-surface ${
        highlight || size === "lg" ? "border-pink/30" : "border-rule"
      }`}
    >
      {/* Poule of fase · baan · tijd */}
      {showBar && (
        <div className="flex items-center gap-2 border-b border-rule px-3.5 py-2">
          {label && <span className="text-[0.6875rem] font-semibold text-ink-2">{label}</span>}
          {label && match.track !== null && <span className="text-rule">·</span>}
          {match.track !== null && (
            <>
              <span className="text-[0.6875rem] font-bold text-pink">Baan {match.track}</span>
              {match.scheduledAt && (
                <>
                  <span className="text-rule">·</span>
                  <span className="text-[0.6875rem] text-ink-2">{fmtTime(match.scheduledAt)}</span>
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* Teams + score */}
      <div className="flex items-center gap-3 px-3.5 py-3.5">
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
          <span className="shrink-0 px-2 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-ink/35">
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

// ── Standings table ───────────────────────────────────────────────────────────

/** rij-achtergrond: top 2 gaat door (roze), derde plaats kan doorstoten (grijs) */
function standingRowClass(rank: number): string {
  if (rank <= 2) return "bg-pink/[0.06]";
  if (rank === 3) return "bg-ink/[0.04]";
  return "";
}

const TH = "px-2 py-2.5 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-ink-2";
const TD = "px-2 py-2.5 text-center tabular-nums text-ink-2";

export function StandingsTable({
  teams,
  variant = "full",
}: Readonly<{ teams: TournamentTeam[]; variant?: "full" | "compact" }>) {
  const full = variant === "full";

  return (
    <table className="w-full text-[0.85rem]">
      <thead>
        <tr className="border-b border-rule">
          <th className={`${TH} pl-4 text-center`}>#</th>
          <th className={`${TH} text-left`}>Team</th>
          <th className={`${TH} text-center`}>G</th>
          <th className={`${TH} text-center`}>W</th>
          <th className={`${TH} hidden text-center sm:table-cell`}>GL</th>
          <th className={`${TH} text-center`}>V</th>
          {full && <th className={`${TH} hidden text-center md:table-cell`}>V+</th>}
          {full && <th className={`${TH} hidden text-center md:table-cell`}>V-</th>}
          <th className={`${TH} hidden text-center sm:table-cell`}>Sal</th>
          <th className={`${TH} pr-4 text-center`}>Pts</th>
        </tr>
      </thead>
      <tbody>
        {teams.map((team, i) => (
          <tr
            key={team.id}
            className={`border-b border-rule/55 last:border-0 ${standingRowClass(i + 1)}`}
          >
            <td className={`${TD} pl-4`}>{i + 1}</td>
            <td className="px-2 py-2.5 font-medium text-ink">{team.name}</td>
            <td className={TD}>{team.played}</td>
            <td className={TD}>{team.won}</td>
            <td className={`${TD} hidden sm:table-cell`}>{team.drawn}</td>
            <td className={TD}>{team.lost}</td>
            {full && <td className={`${TD} hidden md:table-cell`}>{team.goalsFor}</td>}
            {full && <td className={`${TD} hidden md:table-cell`}>{team.goalsAgainst}</td>}
            <td className={`${TD} hidden font-medium sm:table-cell ${saldoClass(team.saldo)}`}>
              {team.saldo > 0 ? `+${team.saldo}` : team.saldo}
            </td>
            <td className="px-2 py-2.5 pr-4 text-center font-bold tabular-nums text-ink">
              {team.points}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function StandingsLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5 border-t border-rule px-3.5 py-2.5">
      <span className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-[3px] border border-pink/20 bg-pink/[0.06]" />
        <span className="text-[0.6875rem] text-ink-2">Top 2 gaat direct door</span>
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-[3px] border border-rule bg-ink/[0.04]" />
        <span className="text-[0.6875rem] text-ink-2">Beste derdes ook</span>
      </span>
    </div>
  );
}

// ── Team card ─────────────────────────────────────────────────────────────────

function TeamCardInner({ team }: Readonly<{ team: TournamentTeam }>) {
  const spelers = [team.speler1, team.speler2, team.speler3, team.speler4].filter(Boolean);

  return (
    <>
      <h4 className="mb-0.5 text-[0.9375rem] font-semibold text-ink">{team.name}</h4>
      <p className="mb-2.5 text-[0.6875rem] font-semibold text-pink">
        Kapitein · {team.captainName}
      </p>
      <div className="mb-3.5 flex flex-col gap-0.5">
        {spelers.map((speler, i) => (
          <p key={`${speler}-${i}`} className="text-xs text-ink-2">
            {speler}
          </p>
        ))}
      </div>
      <div className="mt-auto flex items-center gap-1.5 border-t border-rule/55 pt-2.5">
        <span
          className={`h-[7px] w-[7px] shrink-0 rounded-full ${
            team.isPresent ? "bg-green-700" : "bg-rule"
          }`}
        />
        <span className={`text-[0.7rem] ${team.isPresent ? "text-ink-2" : "text-ink/35"}`}>
          {team.isPresent ? "Aanwezig" : "Nog niet aanwezig"}
        </span>
      </div>
    </>
  );
}

export function TeamCard({
  team,
  href,
}: Readonly<{ team: TournamentTeam; href?: string }>) {
  const base =
    "flex flex-col rounded-2xl border border-rule bg-surface px-[18px] py-4 transition-colors";

  if (href) {
    return (
      <Link href={href} className={`${base} hover:border-pink/25 hover:bg-pink-soft`}>
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
  return <p className="text-sm text-ink-2">{text}</p>;
}
