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

type Moment = "pre" | "live" | "post";

interface Door {
  title: string;
  sub: string;
  href: string;
  hot?: boolean;
}

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
      teams.length ? `Al ${teams.length} ploegen zijn ingeschreven.` : "",
    ].join(" ").trim();
    const regOpen = tournament.isActive && (!tournament.teamEditDeadline || new Date(tournament.teamEditDeadline).getTime() > now);
    doors = [
      ...(regOpen ? [{ title: "Inschrijven", sub: "Schrijf je ploeg in", href: "/team-aanmelden", hot: true }] : []),
      { title: "Reglement", sub: "Spelregels en puntentelling", href: `${base}/rules`, hot: !regOpen },
      { title: "Teams", sub: teams.length ? `${teams.length} ploegen ingeschreven` : "Nog geen ploegen", href: `${base}/teams` },
      { title: "Wedstrijden", sub: matches.length ? `${matches.length} wedstrijden gepland` : "Schema volgt na de indeling", href: `${base}/matches` },
    ].slice(0, 4);
  } else if (moment === "live") {
    const koPhase = !groupOpen.length ? sorted.find((m) => isKnockout(m.phase) && !isPlayed(m))?.phase : undefined;
    title = groupOpen.length || !koPhase ? "Poules bezig" : `${capital(KO_SHORT[koPhase] ?? "Knock-out").replace(/e$/, "es")} bezig`;
    if (koPhase === "FINAL") title = "Finale bezig";
    status = [
      next ? `Volgende ronde om ${fmtTime(next.scheduledAt)}.` : live.length ? "Laatste wedstrijden bezig." : "",
      groupOpen.length && firstKO ? `De knock-out begint om ${fmtTime(firstKO.scheduledAt)}.` : "",
    ].join(" ").trim();
    doors = [
      { title: "Wedstrijden", sub: live.length ? `${live.length} ${live.length === 1 ? "match" : "matchen"} bezig` : next ? `Volgende om ${fmtTime(next.scheduledAt)}` : "Alle wedstrijden", href: `${base}/matches`, hot: true },
      { title: "Standen", sub: groupOpen.length ? `Ronde ${Math.min(doneSlots + 1, groupSlots.length)} van ${groupSlots.length} in de poules` : "Eindstand van de poules", href: `${base}/poules` },
      { title: "Bracket", sub: firstKO ? (groupOpen.length ? `Start om ${fmtTime(firstKO.scheduledAt)} met ${koTeams} ploegen` : "Volg de knock-out") : "Nog niet ingedeeld", href: `${base}/brackets` },
      { title: "Reglement", sub: "Spelregels en puntentelling", href: `${base}/rules` },
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
      { title: "Bracket", sub: "Hoe de knock-out verliep", href: `${base}/brackets`, hot: true },
      { title: "Eindstanden", sub: `Alle ${poules.filter((p) => p.phase === "GROUP_STAGE").length} poules en de ranking`, href: `${base}/poules` },
      { title: "Wedstrijden", sub: `Alle ${matches.filter(isPlayed).length} uitslagen`, href: `${base}/matches` },
      { title: "Reglement", sub: "Spelregels en puntentelling", href: `${base}/rules` },
    ];
  }

  // ── Zoek je ploeg ───────────────────────────────────────
  const answer = (() => {
    if (!teamId) return null;
    const team = teams.find((x) => x.id === teamId);
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
  })();

  const teamOptions = [...teams]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((x) => {
      const p = poules.find((pp) => pp.id === x.pouleId);
      return { id: x.id, name: x.name, meta: p ? `Poule ${pouleLetter(p)}` : undefined };
    });
  const searchTitle = moment === "pre" ? "Al ingeschreven? Zoek je ploeg" : moment === "live" ? "Waar speelt mijn ploeg?" : "Hoe deed jouw ploeg het?";

  return (
    <div className="mx-auto flex max-w-[820px] flex-col gap-9 pt-2 sm:gap-10 sm:pt-8">
      <section className="flex flex-col gap-3 sm:gap-4">
        {moment === "live" && (
          <span className="inline-flex items-center gap-2 self-start rounded-full bg-pink-soft py-1.5 pl-2.5 pr-3 text-[0.8125rem] font-bold text-pink-ink">
            <span className="t-live-dot" />
            Live
          </span>
        )}
        <p className="text-[0.95rem] font-semibold text-ink-2 sm:text-[1.05rem]">{kicker}</p>
        <h1 className="text-[2.75rem] font-black leading-[0.95] tracking-[-0.045em] text-ink sm:text-[clamp(3rem,7vw,5rem)]">{title}</h1>
        {status && <p className="max-w-[30em] text-[1.0625rem] leading-relaxed text-ink-2 sm:text-[1.1875rem]">{status}</p>}
      </section>

      {teams.length > 0 && (
        <section className="flex flex-col gap-2.5">
          <p className="text-[0.95rem] font-bold">{searchTitle}</p>
          {answer && teamId ? (
            <div key={teamId} className="t-rise flex items-start gap-2 rounded-2xl bg-pink-soft py-4 pl-5 pr-2">
              <div className="flex flex-1 flex-col gap-1">
                <span className="text-base font-extrabold text-pink-ink">{nameOf.get(teamId)}</span>
                <span className="text-[0.975rem] leading-relaxed text-ink">{answer}</span>
              </div>
              <button
                type="button"
                onClick={() => setTeamId(null)}
                aria-label="Andere ploeg zoeken"
                className="t-press flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-pink-ink hover:bg-pink/10"
              >
                <IconClose size={18} />
              </button>
            </div>
          ) : (
            <TeamSearch options={teamOptions} selected={null} onSelect={(x) => x !== null && setTeamId(x)} query={q} onQuery={setQ} placeholder="Naam van je ploeg" />
          )}
        </section>
      )}

      <nav aria-label="Naar" className="grid gap-2 sm:grid-cols-2 sm:gap-3">
        {doors.map((d) => (
          <Link
            key={d.title}
            href={d.href}
            className={`group t-press flex min-h-[84px] items-center justify-between gap-4 rounded-[18px] border px-5 py-4 sm:min-h-[150px] sm:items-end sm:rounded-[22px] sm:px-6 sm:py-5 ${
              d.hot ? "border-transparent bg-pink-soft hover:border-pink" : "border-rule bg-surface hover:border-ink"
            }`}
          >
            <span className="flex min-w-0 flex-col gap-1">
              <span className="text-xl font-extrabold tracking-tight sm:text-[1.625rem]">{d.title}</span>
              <span className="text-sm leading-snug text-ink-2 sm:text-[0.95rem]">{d.sub}</span>
            </span>
            <span
              aria-hidden="true"
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-[transform,background-color,color] duration-200 group-hover:translate-x-1 group-hover:bg-ink group-hover:text-paper sm:h-11 sm:w-11 ${
                d.hot ? "border-pink" : "border-rule"
              }`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" />
                <path d="m13 6 6 6-6 6" />
              </svg>
            </span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
