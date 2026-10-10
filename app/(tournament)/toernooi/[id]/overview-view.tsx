"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  KO_SHORT,
  compareStanding,
  isKnockout,
  isPlayed,
  matchStatus,
  pouleLetter,
  useAutoRefresh,
  useNow,
} from "@/lib/tournament-live";
import type { ActiveTournament, TournamentMatch } from "@/lib/tournament-types";
import { fmtTime } from "@/utils/DateHelpers";
import { IconClose, TeamSearch } from "./_filters";
import { FollowStar, useFollowed } from "./_follow";

type Moment = "pre" | "live" | "post";

type DoorIcon = "doc" | "team" | "grid" | "cal" | "cup";
interface Door {
  title: string;
  sub: string;
  href: string;
  icon: DoorIcon;
  hot?: boolean;
}

const DOOR_ICONS: Record<DoorIcon, React.ReactNode> = {
  doc: <><path d="M7 3h7l5 5v13H7z" /><path d="M14 3v5h5" /><path d="M10 13h6M10 17h6" /></>,
  team: <><circle cx="9" cy="8" r="3.2" /><path d="M3.5 19c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5" /><circle cx="17" cy="9" r="2.6" /><path d="M15.5 14.2c2.6-.3 4.6 1.3 5 4.8" /></>,
  grid: <><rect x="4" y="4" width="7" height="7" rx="1.5" /><rect x="13" y="4" width="7" height="7" rx="1.5" /><rect x="4" y="13" width="7" height="7" rx="1.5" /><rect x="13" y="13" width="7" height="7" rx="1.5" /></>,
  cal: <><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M8 3v4M16 3v4M4 10h16" /></>,
  cup: <><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4z" /><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3" /></>,
};

const t = (m: TournamentMatch) => new Date(m.scheduledAt ?? 0).getTime();
const winnerOf = (m: TournamentMatch | undefined) => {
  if (!m || !isPlayed(m) || m.scoreA === m.scoreB) return m?.winnerId ?? null;
  return m.winnerId ?? (m.scoreA! > m.scoreB! ? m.teamAId : m.teamBId);
};
const nth = (n: number) => `${n}${n === 1 ? "ste" : "de"}`;
const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function OverviewView({ tournament }: Readonly<{ tournament: ActiveTournament }>) {
  const now = useNow();
  useAutoRefresh(tournament.isActive);
  const [q, setQ] = useState("");
  const [teamId, setTeamId] = useState<number | null>(null);
  const followed = useFollowed();

  const { id, name, teams, poules, matches } = tournament;
  const base = `/toernooi/${id}`;
  const nameOf = useMemo(() => new Map(teams.map((x) => [x.id, x.name])), [teams]);
  const sorted = useMemo(() => [...matches].filter((m) => m.scheduledAt).sort((a, b) => t(a) - t(b)), [matches]);

  const final = matches.find((m) => m.bracketPos === "F1" || m.phase === "FINAL");
  const consolation = matches.find((m) => m.bracketPos === "CF1" || m.phase === "CONSOLATION_FINAL");
  const champ = winnerOf(final);
  const started = matches.some((m) => isPlayed(m)) || (sorted[0] && t(sorted[0]) <= now);
  const moment: Moment = champ || tournament.status === "COMPLETED" ? "post" : started ? "live" : "pre";

  const group = matches.filter((m) => m.phase === "GROUP_STAGE");
  const groupOpen = group.filter((m) => !isPlayed(m));
  const live = matches.filter((m) => matchStatus(m, now) === "live");
  const next = sorted.find((m) => !isPlayed(m) && t(m) > now);
  const firstKO = sorted.find((m) => isKnockout(m.phase));
  const koTeams = matches.filter((m) => m.phase === firstKO?.phase).length * 2;
  const groupSlots = [...new Set(group.map((m) => m.scheduledAt))].sort();
  const doneSlots = groupSlots.filter((s) => group.filter((m) => m.scheduledAt === s).every(isPlayed)).length;

  // ── Kop ─────────────────────────────────────────────────
  let kicker = name;
  let title = name;
  let status = "";
  let doors: Door[] = [];

  if (moment === "pre") {
    const first = sorted[0];
    const days = first ? Math.ceil((t(first) - now) / 86_400_000) : null;
    kicker = days && days > 0 ? `${name}, over ${days} ${days === 1 ? "dag" : "dagen"}` : name;
    title = first ? capital(new Date(first.scheduledAt!).toLocaleDateString("nl-BE", { weekday: "long", day: "numeric", month: "long" })) : "Binnenkort";
    status = [
      first ? `Eerste bal om ${fmtTime(first.scheduledAt)}.` : "Het schema volgt nog.",
      teams.length ? `${teams.length} ploegen doen mee.` : "",
    ].join(" ").trim();
    // Inschrijven gebeurt ter plaatse aan de balie, niet via de site.
    doors = [
      { title: "Reglement", sub: "Spelregels en puntentelling", href: `${base}/rules`, icon: "doc", hot: true },
      { title: "Teams", icon: "team", sub: teams.length ? `${teams.length} ploegen ingeschreven` : "Nog geen ploegen", href: `${base}/teams` },
      { title: "Poules", icon: "grid", sub: tournament.poules.length ? "Wie speelt tegen wie" : "Indeling volgt nog", href: `${base}/poules` },
      { title: "Wedstrijden", icon: "cal", sub: matches.length ? `${matches.length} wedstrijden gepland` : "Schema volgt na de indeling", href: `${base}/matches` },
    ];
  } else if (moment === "live") {
    const koPhase = !groupOpen.length ? sorted.find((m) => isKnockout(m.phase) && !isPlayed(m))?.phase : undefined;
    title = groupOpen.length || !koPhase ? "Poules bezig" : `${capital(KO_SHORT[koPhase] ?? "Knock-out").replace(/e$/, "es")} bezig`;
    if (koPhase === "FINAL") title = "Finale bezig";
    status = [
      next ? `Volgende ronde om ${fmtTime(next.scheduledAt)}.` : live.length ? "Laatste wedstrijden bezig." : "",
      groupOpen.length && firstKO ? `De knock-out begint om ${fmtTime(firstKO.scheduledAt)}.` : "",
    ].join(" ").trim();
    doors = [
      { title: "Wedstrijden", icon: "cal", sub: live.length ? `${live.length} ${live.length === 1 ? "match" : "matchen"} bezig` : next ? `Volgende om ${fmtTime(next.scheduledAt)}` : "Alle wedstrijden", href: `${base}/matches`, hot: true },
      { title: "Standen", icon: "grid", sub: groupOpen.length ? `Ronde ${Math.min(doneSlots + 1, groupSlots.length)} van ${groupSlots.length} in de poules` : "Eindstand van de poules", href: `${base}/poules` },
      { title: "Finales", icon: "cup", sub: firstKO ? (groupOpen.length ? `Start om ${fmtTime(firstKO.scheduledAt)} met ${koTeams} ploegen` : "Volg de knock-out") : "Voorlopige bracket", href: `${base}/brackets` },
      { title: "Reglement", icon: "doc", sub: "Spelregels en puntentelling", href: `${base}/rules` },
    ];
  } else {
    kicker = `Winnaar ${name}`;
    title = champ ? nameOf.get(champ) ?? name : name;
    if (final && champ && isPlayed(final)) {
      const champA = final.teamAId === champ;
      const loser = nameOf.get((champA ? final.teamBId : final.teamAId) ?? 0) ?? "";
      const score = champA ? `${final.scoreA}–${final.scoreB}` : `${final.scoreB}–${final.scoreA}`;
      const third = winnerOf(consolation);
      status = `Finale gewonnen met ${score} tegen ${loser}.${third ? ` ${nameOf.get(third)} worden derde.` : ""}`;
    } else {
      status = "Het toernooi is afgelopen.";
    }
    doors = [
      { title: "Finales", icon: "cup", sub: "Hoe de knock-out verliep", href: `${base}/brackets`, hot: true },
      { title: "Eindstanden", icon: "grid", sub: `Alle ${poules.filter((p) => p.phase === "GROUP_STAGE").length} poules en de ranking`, href: `${base}/poules` },
      { title: "Wedstrijden", icon: "cal", sub: `Alle ${matches.filter(isPlayed).length} uitslagen`, href: `${base}/matches` },
      { title: "Reglement", icon: "doc", sub: "Spelregels en puntentelling", href: `${base}/rules` },
    ];
  }

  // ── Zoek je ploeg ───────────────────────────────────────
  const describe = (tid: number): string | null => {
    const team = teams.find((x) => x.id === tid);
    if (!team) return null;
    const poule = poules.find((p) => p.id === team.pouleId);
    const letter = poule ? pouleLetter(poule) : "?";
    const place = teams.filter((x) => x.pouleId === team.pouleId).sort(compareStanding).findIndex((x) => x.id === team.id) + 1;
    const mine = sorted.filter((m) => m.teamAId === team.id || m.teamBId === team.id);
    const opp = (m: TournamentMatch) => nameOf.get((m.teamAId === team.id ? m.teamBId : m.teamAId) ?? 0) ?? "nog te bepalen";
    const where = (m: TournamentMatch) => `${m.track !== null ? ` op baan ${m.track}` : ""} tegen ${opp(m)}`;

    if (moment === "pre") {
      const f = mine[0];
      return f ? `Poule ${letter}. Jullie eerste match is om ${fmtTime(f.scheduledAt)}${where(f)}.` : `Ingeschreven${poule ? ` in poule ${letter}` : ""}. Het schema volgt nog.`;
    }
    if (moment === "live") {
      const cur = mine.find((m) => matchStatus(m, now) === "live");
      const nx = mine.find((m) => matchStatus(m, now) === "next");
      const stand = place ? ` Voorlopig ${nth(place)} in poule ${letter}.` : "";
      if (cur) return `Speelt nu${where(cur)}.${stand}`;
      if (nx) return `Volgende match om ${fmtTime(nx.scheduledAt)}${where(nx)}.${stand}`;
      const lastKO = [...mine].reverse().find((m) => isKnockout(m.phase) && isPlayed(m));
      if (lastKO && winnerOf(lastKO) !== team.id) return `Uitgeschakeld in de ${KO_SHORT[lastKO.phase]?.toLowerCase()} door ${opp(lastKO)}.`;
      return `Alle geplande matchen gespeeld.${stand}`;
    }
    const ko = mine.filter((m) => isKnockout(m.phase));
    const last = ko.at(-1);
    if (!last) return `${nth(place)} in poule ${letter}, net niet bij de knock-out.`;
    const won = winnerOf(last) === team.id;
    if (last.phase === "FINAL") return won ? "Winnaar van het toernooi." : "Tweede: verloren in de finale.";
    if (last.phase === "CONSOLATION_FINAL") return won ? "Derde: kleine finale gewonnen." : "Vierde: kleine finale verloren.";
    return `Uitgeschakeld in de ${KO_SHORT[last.phase]?.toLowerCase()} door ${opp(last)}.`;
  };
  const answer = teamId ? describe(teamId) : null;

  // ── Jouw ploegen (gevolgd met een ster) ─────────────────
  const mineTeams = followed.ids.map((fid) => teams.find((x) => x.id === fid)).filter((x) => x !== undefined);
  const playingNow = new Set(live.flatMap((m) => [m.teamAId, m.teamBId]));

  const teamOptions = [...teams]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((x) => {
      const p = poules.find((pp) => pp.id === x.pouleId);
      return { id: x.id, name: x.name, meta: p ? `Poule ${pouleLetter(p)}` : undefined };
    });
  const searchTitle = moment === "pre" ? "Al ingeschreven? Zoek je ploeg" : moment === "live" ? "Waar speelt mijn ploeg?" : "Hoe deed jouw ploeg het?";

  return (
    <div className="mx-auto flex max-w-[680px] flex-col gap-8 pt-2 sm:gap-9 sm:pt-10">
      <section className="flex flex-col gap-2.5">
        <p className="flex items-center gap-2.5 text-sm font-medium text-ink-2">
          {moment === "live" && (
            <span className="inline-flex items-center gap-2 font-semibold text-pink-ink">
              <span className="t-live-dot" />
              Live
            </span>
          )}
          <span>{kicker}</span>
        </p>
        <h1 className="text-[2.25rem] font-semibold leading-[1.04] tracking-[-0.035em] text-ink sm:text-[3.25rem]">{title}</h1>
        {status && <p className="max-w-[32em] text-[1.0625rem] leading-relaxed text-ink-2">{status}</p>}
      </section>

      {mineTeams.length > 0 && (
        <section aria-labelledby="jouw-ploegen" className="flex flex-col gap-2.5">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="jouw-ploegen" className="text-sm font-semibold text-ink-2">Jouw ploegen</h2>
            {matches.length > 0 && (
              <Link href={`${base}/matches?mijn=1`} className="text-[0.8125rem] font-medium text-ink-2 hover:text-ink hover:underline hover:underline-offset-2">
                Hun wedstrijden
              </Link>
            )}
          </div>
          <ul className="flex flex-col overflow-hidden rounded-2xl border border-rule bg-surface">
            {mineTeams.map((tm, i) => (
              <li key={tm.id} className="t-rise flex items-center gap-1 border-b border-rule py-1 pl-4 pr-1.5 last:border-0 sm:pl-5" style={{ animationDelay: `${i * 40}ms` }}>
                <Link href={`${base}/teams/${tm.id}`} className="group flex min-w-0 flex-1 flex-col gap-0.5 py-2.5">
                  <span className="flex items-center gap-2 text-base font-semibold group-hover:underline group-hover:underline-offset-2">
                    {playingNow.has(tm.id) && <span className="t-live-dot" aria-label="speelt nu" />}
                    <span className="truncate">{tm.name}</span>
                  </span>
                  <span className="text-[0.9375rem] leading-snug text-ink-2">{describe(tm.id)}</span>
                </Link>
                <FollowStar teamId={tm.id} name={tm.name} followed={followed} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {teams.length > 0 && (
        <section className="flex flex-col gap-2.5">
          <p className="text-sm font-semibold text-ink-2">{mineTeams.length > 0 ? "Nog een ploeg zoeken" : searchTitle}</p>
          {answer && teamId ? (
            <div key={teamId} className="t-rise flex items-center gap-1 rounded-2xl border border-pink bg-surface py-3.5 pl-5 pr-1.5">
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-base font-semibold">{nameOf.get(teamId)}</span>
                <span className="text-[0.9375rem] leading-relaxed text-ink-2">{answer}</span>
              </div>
              <FollowStar teamId={teamId} name={nameOf.get(teamId) ?? ""} followed={followed} />
              <button
                type="button"
                onClick={() => setTeamId(null)}
                aria-label="Andere ploeg zoeken"
                className="t-press flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-ink-2 hover:bg-ink/5 hover:text-ink md:h-9 md:w-9"
              >
                <IconClose size={16} />
              </button>
            </div>
          ) : (
            <TeamSearch options={teamOptions} selected={null} onSelect={(x) => x !== null && setTeamId(x)} query={q} onQuery={setQ} placeholder="Naam van een ploeg" />
          )}
        </section>
      )}

      <nav aria-label="Naar" className="overflow-hidden rounded-2xl border border-rule bg-surface">
        {doors.map((d) => (
          <Link
            key={d.title}
            href={d.href}
            className="group flex min-h-[72px] items-center gap-4 border-b border-rule py-3.5 pl-4 pr-3 transition-colors last:border-0 hover:bg-ink/[0.03] sm:pl-5"
          >
            <span
              aria-hidden="true"
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px] ${d.hot ? "bg-pink-soft text-pink-ink" : "bg-ink/[0.07] text-ink-2"}`}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                {DOOR_ICONS[d.icon]}
              </svg>
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-[1.03rem] font-semibold tracking-[-0.01em]">{d.title}</span>
              <span className="truncate text-sm text-ink-2">{d.sub}</span>
            </span>
            <span aria-hidden="true" className="text-ink-2 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-ink">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m9 6 6 6-6 6" />
              </svg>
            </span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
