"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { IconSearch } from "@/components/ui/icons/IconSearch";
import { compareStanding, isPlayed, matchStatus, pouleLetter, pouleTracks, useNow } from "@/lib/tournament-live";
import type { TournamentMatch, TournamentPoule, TournamentTeam } from "@/lib/tournament-types";
import { rosterOf } from "@/lib/team-roster";
import { fmtTime } from "@/utils/DateHelpers";
import { PageHead } from "../_shared";
import { Chip, usePersisted } from "../_filters";
import { FollowStar, IconStar, useFollowed, type Followed } from "../_follow";

interface Props {
  teams: TournamentTeam[];
  poules: TournamentPoule[];
  matches: TournamentMatch[];
  tournamentId: string;
}

// Vaste pastels met donkere tekst: leesbaar in licht én donker thema.
const AVATAR = ["bg-[#ffc9db]", "bg-[#c8e6ff]", "bg-[#d7f5c8]", "bg-[#ffe2b8]", "bg-[#e3d6ff]", "bg-[#c9f0ec]"];
const SKIP = /^(de|het|les|the|en|van|&)$/i;

function initials(name: string) {
  const words = name.replace(/[^\p{L}\p{N} ]/gu, " ").split(/\s+/).filter((w) => w && !SKIP.test(w));
  const a = words[0]?.[0] ?? "?";
  const b = words[1]?.[0] ?? words[0]?.[1] ?? "";
  return (a + b).toUpperCase();
}
function hue(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 997;
  return AVATAR[h % AVATAR.length];
}
const nth = (n: number) => `${n}${n === 1 ? "ste" : "de"}`;

export function TeamsView({ teams, poules, matches, tournamentId }: Readonly<Props>) {
  const now = useNow();
  const followed = useFollowed();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = usePersisted<string>("teams", "filter", "all");
  const [flipped, setFlipped] = useState<Set<number>>(new Set());

  const groupPoules = poules.filter((p) => p.phase === "GROUP_STAGE");
  const trackOf = useMemo(() => pouleTracks(matches), [matches]);
  const nameOf = useMemo(() => new Map(teams.map((t) => [t.id, t.name])), [teams]);
  const groupMatches = useMemo(
    () => matches.filter((m) => m.phase === "GROUP_STAGE").sort((a, b) => (a.scheduledAt ?? "").localeCompare(b.scheduledAt ?? "")),
    [matches]
  );
  const started = groupMatches.some(isPlayed);

  const placeOf = useMemo(() => {
    const map = new Map<number, number>();
    for (const p of groupPoules) {
      teams.filter((t) => t.pouleId === p.id).sort(compareStanding).forEach((t, i) => map.set(t.id, i + 1));
    }
    return map;
  }, [teams, groupPoules]);

  const q = search.trim().toLowerCase();
  const hit = (t: TournamentTeam) =>
    !q || [t.name, t.captainName, t.speler1, t.speler2, t.speler3, t.speler4].join(" ").toLowerCase().includes(q);
  const shown = teams.filter((t) => {
    if (filter === "mine" && !followed.has(t.id)) return false;
    if (filter !== "all" && filter !== "mine" && String(t.pouleId) !== filter) return false;
    return hit(t);
  });

  // Groepen: per poule (poules met een gevolgde ploeg eerst), of één lijst bij zoeken/mijn ploegen.
  const groups = (() => {
    if (q || filter === "mine" || groupPoules.length === 0) {
      const title = filter === "mine" ? "Mijn ploegen" : q ? "Zoekresultaten" : "Ingeschreven ploegen";
      return [{ key: "all", title, sub: `${shown.length} ploeg${shown.length === 1 ? "" : "en"}`, teams: [...shown].sort((a, b) => a.name.localeCompare(b.name)) }];
    }
    return groupPoules
      .map((p) => {
        const own = shown.filter((t) => t.pouleId === p.id);
        const sorted = started ? own.sort(compareStanding) : own.sort((a, b) => a.name.localeCompare(b.name));
        return { key: String(p.id), title: `Poule ${pouleLetter(p)}`, sub: trackOf.get(p.id) ? `baan ${trackOf.get(p.id)}` : "", teams: sorted, fav: own.some((t) => followed.has(t.id)) };
      })
      .filter((g) => g.teams.length > 0)
      .sort((a, b) => Number(b.fav) - Number(a.fav))
      .concat(
        shown.some((t) => !t.pouleId)
          ? [{ key: "none", title: "Nog zonder poule", sub: "", teams: shown.filter((t) => !t.pouleId), fav: false }]
          : []
      );
  })();

  const toggleFlip = (id: number) =>
    setFlipped((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const cardInfo = (t: TournamentTeam) => {
    const own = groupMatches.filter((m) => m.teamAId === t.id || m.teamBId === t.id);
    const form = own.map((m) => {
      if (!isPlayed(m)) return "open" as const;
      const mine = m.teamAId === t.id ? m.scoreA! : m.scoreB!;
      const other = m.teamAId === t.id ? m.scoreB! : m.scoreA!;
      return mine > other ? ("w" as const) : mine < other ? ("l" as const) : ("d" as const);
    });
    const all = matches
      .filter((m) => m.teamAId === t.id || m.teamBId === t.id)
      .sort((a, b) => (a.scheduledAt ?? "").localeCompare(b.scheduledAt ?? ""));
    const cur = all.find((m) => matchStatus(m, now) === "live");
    const nx = all.find((m) => matchStatus(m, now) === "next");
    const opp = (m: TournamentMatch) => nameOf.get((m.teamAId === t.id ? m.teamBId : m.teamAId) ?? 0) ?? "nog te bepalen";
    const next = cur
      ? `Speelt nu${cur.track !== null ? ` op baan ${cur.track}` : ""} tegen ${opp(cur)}`
      : nx
        ? `Volgende: ${fmtTime(nx.scheduledAt)}${nx.track !== null ? ` op baan ${nx.track}` : ""} tegen ${opp(nx)}`
        : all.length
          ? "Alle geplande matchen gespeeld"
          : "Het schema volgt nog";
    const poule = groupPoules.find((p) => p.id === t.pouleId);
    const place = placeOf.get(t.id);
    const meta = poule
      ? started && place
        ? `Poule ${pouleLetter(poule)} · ${nth(place)}`
        : `Poule ${pouleLetter(poule)}${trackOf.get(poule.id) ? ` · baan ${trackOf.get(poule.id)}` : ""}`
      : "Nog geen poule";
    return { form, next, meta, live: !!cur };
  };

  const mineCount = teams.filter((t) => followed.has(t.id)).length;

  return (
    <div className="flex flex-col gap-6">
      <PageHead title="Teams" subtitle={`${teams.length} ploegen · tik op een kaart voor de spelers`} />

      <section aria-label="Zoeken en filteren" className="flex flex-col gap-3">
        <div className="flex h-12 items-center gap-2.5 rounded-xl border border-rule bg-surface px-4 focus-within:border-ink-2 md:h-11">
          <span className="shrink-0 text-ink-2"><IconSearch /></span>
          <label htmlFor="team-zoek" className="sr-only">Zoek op ploeg of speler</label>
          <input
            id="team-zoek"
            type="search"
            placeholder="Zoek op ploeg of speler"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-full min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-ink-2 md:text-sm"
          />
        </div>
        <div className="-mx-5 flex gap-1.5 overflow-x-auto px-5 [scrollbar-width:none] sm:-mx-8 sm:px-8 md:mx-0 md:flex-wrap md:px-0">
          <Chip on={filter === "all"} onClick={() => setFilter("all")}>Alle</Chip>
          <Chip on={filter === "mine"} onClick={() => setFilter("mine")}>
            <span className="inline-flex items-center gap-1.5"><IconStar filled={filter === "mine"} size={13} /> Mijn ploegen {mineCount > 0 ? mineCount : ""}</span>
          </Chip>
          {groupPoules.map((p) => (
            <Chip key={p.id} on={filter === String(p.id)} onClick={() => setFilter(String(p.id))}>Poule {pouleLetter(p)}</Chip>
          ))}
        </div>
      </section>

      {groups.length === 0 || groups.every((g) => g.teams.length === 0) ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-rule px-6 py-12 text-center">
          {filter === "mine" ? (
            <>
              <p className="font-semibold">Je volgt nog geen ploegen</p>
              <p className="inline-flex items-center gap-1 text-sm text-ink-2">Tik op <IconStar size={13} /> bij een ploeg om ze hier te verzamelen.</p>
            </>
          ) : (
            <p className="font-semibold">Geen ploeg of speler gevonden</p>
          )}
          <button type="button" onClick={() => { setFilter("all"); setSearch(""); }} className="t-press mt-2 h-11 rounded-full border border-rule bg-surface px-5 text-sm font-semibold">
            Toon alle ploegen
          </button>
        </div>
      ) : (
        groups.map((g, gi) => (
          <section key={g.key} aria-labelledby={`grp-${g.key}`} className="flex flex-col gap-2.5">
            <div className="flex items-baseline gap-2.5">
              <h2 id={`grp-${g.key}`} className="text-base font-semibold">{g.title}</h2>
              {g.sub && <span className="text-[0.8125rem] text-ink-2">{g.sub}</span>}
            </div>
            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
              {g.teams.map((t, i) => (
                <FlipCard
                  key={t.id}
                  team={t}
                  info={cardInfo(t)}
                  flipped={flipped.has(t.id)}
                  onFlip={() => toggleFlip(t.id)}
                  followed={followed}
                  href={`/toernooi/${tournamentId}/teams/${t.id}`}
                  delay={Math.min(gi * 4 + i, 16) * 25}
                />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}

// ── Kaart ─────────────────────────────────────────────────────────────────────

const DOT: Record<"w" | "l" | "d" | "open", string> = {
  w: "bg-green-600",
  l: "bg-red-600",
  d: "bg-neutral-400",
  open: "bg-transparent shadow-[inset_0_0_0_1.5px_var(--rule)]",
};

function FlipCard({
  team,
  info,
  flipped,
  onFlip,
  followed,
  href,
  delay,
}: Readonly<{
  team: TournamentTeam;
  info: { form: ("w" | "l" | "d" | "open")[]; next: string; meta: string; live: boolean };
  flipped: boolean;
  onFlip: () => void;
  followed: Followed;
  href: string;
  delay: number;
}>) {
  const fav = followed.has(team.id);
  const players = rosterOf(team);
  const w = info.form.filter((f) => f === "w").length;
  const l = info.form.filter((f) => f === "l").length;
  const d = info.form.filter((f) => f === "d").length;
  const face = `absolute inset-0 flex flex-col gap-2.5 rounded-2xl border px-4 pb-3 pt-3.5 [backface-visibility:hidden] ${fav ? "border-pink" : "border-rule"}`;

  return (
    <div className="t-rise h-[184px] [perspective:1000px]" style={{ animationDelay: `${delay}ms` }}>
      <div
        className={`relative h-full w-full transition-transform duration-500 ease-[cubic-bezier(.3,1.2,.4,1)] [transform-style:preserve-3d] motion-reduce:transition-none ${flipped ? "[transform:rotateY(180deg)]" : ""}`}
      >
        {/* Voorkant */}
        <div className={`${face} bg-surface`} aria-hidden={flipped} inert={flipped}>
          <button type="button" onClick={onFlip} aria-label={`Draai om: spelers van ${team.name}`} className="absolute inset-0 z-[1] rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink" />
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[0.9rem] font-bold tracking-tight text-[#16161a] ${hue(team.name)}`}>
              {initials(team.name)}
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="truncate text-[0.975rem] font-semibold">{team.name}</span>
              <span className="flex items-center gap-1.5 text-[0.8125rem] text-ink-2">
                {info.live && <span className="t-live-dot" aria-label="speelt nu" />}
                {info.meta}
              </span>
            </span>
            <span className="relative z-[2]">
              <FollowStar teamId={team.id} name={team.name} followed={followed} size="sm" />
            </span>
          </div>
          {team.motto && <p className="line-clamp-2 text-sm italic leading-snug text-ink-2">“{team.motto}”</p>}
          <div className="mt-auto flex items-center justify-between gap-2">
            {info.form.length > 0 ? (
              <span role="img" aria-label={`${w} gewonnen, ${l} verloren${d ? `, ${d} gelijk` : ""}`} className="flex gap-1.5">
                {info.form.map((f, i) => <span key={i} className={`h-2.5 w-2.5 rounded-full ${DOT[f]}`} />)}
              </span>
            ) : <span />}
            <span aria-hidden="true" className="inline-flex items-center gap-1 text-xs text-ink-2">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 15.5-6.2L21 8" /><path d="M21 3v5h-5" /></svg>
              spelers
            </span>
          </div>
        </div>

        {/* Achterkant */}
        <div className={`${face} bg-paper [transform:rotateY(180deg)]`} aria-hidden={!flipped} inert={!flipped}>
          <button type="button" onClick={onFlip} aria-label={`Terug naar de voorkant van ${team.name}`} className="absolute inset-0 z-[1] rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink" />
          <span className="truncate text-xs font-semibold text-ink-2">{team.name}</span>
          <ul className="grid grid-cols-2 gap-x-3 gap-y-1">
            {players.slice(0, 6).map((p, i) => (
              <li key={`${p.name}-${i}`} className="flex min-w-0 items-baseline gap-1.5 text-sm">
                <span className="truncate">{p.name}</span>
                {p.captain && <span className="shrink-0 text-[0.6875rem] font-semibold text-pink-ink">kapitein</span>}
              </li>
            ))}
            {players.length === 0 && <li className="text-sm text-ink-2">Nog geen spelers ingevuld</li>}
          </ul>
          <div className="mt-auto flex items-end justify-between gap-2 border-t border-rule pt-2">
            <span className="text-[0.8125rem] leading-snug">{info.next}</span>
            <Link href={href} className="relative z-[2] shrink-0 text-xs font-semibold text-ink-2 underline underline-offset-2 hover:text-ink">
              Details
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
