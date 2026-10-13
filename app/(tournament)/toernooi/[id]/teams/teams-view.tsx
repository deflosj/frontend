"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";

import { compareStanding, isPlayed, matchStatus, pouleLetter, useNow } from "@/lib/tournament-live";
import type { TournamentMatch, TournamentPoule, TournamentTeam } from "@/lib/tournament-types";
import { rosterOf } from "@/lib/team-roster";
import { fmtTime } from "@/utils/DateHelpers";
import { PageHead } from "../_shared";
import { IconClose, usePersisted } from "../_filters";
import { FollowStar, IconStar, StarMark, useFollowed, type Followed } from "../_follow";

interface Props {
  teams: TournamentTeam[];
  poules: TournamentPoule[];
  matches: TournamentMatch[];
  tournamentId: string;
}

type View = "naam" | "poule";

const nth = (n: number) => `${n}${n === 1 ? "ste" : "de"}`;

/** Wat een ploeg nu of straks doet, voor de favorietenkaart en de lijst. */
interface Upcoming {
  live: boolean;
  match: TournamentMatch | null;
  opponent: string;
  /** Sorteersleutel: live eerst, dan op uur, ploegen zonder match achteraan. */
  sortKey: string;
  /** Tekst als er geen match (meer) is. */
  idle: string;
}

export function TeamsView({ teams, poules, matches, tournamentId }: Readonly<Props>) {
  const now = useNow();
  const followed = useFollowed();
  const [search, setSearch] = useState("");
  const [view, setView] = usePersisted<View>("teams", "view", "naam");

  const groupPoules = useMemo(() => poules.filter((p) => p.phase === "GROUP_STAGE"), [poules]);
  const pouleOf = useMemo(() => new Map(groupPoules.map((p) => [p.id, p])), [groupPoules]);
  const nameOf = useMemo(() => new Map(teams.map((t) => [t.id, t.name])), [teams]);
  const started = matches.some((m) => m.phase === "GROUP_STAGE" && isPlayed(m));

  const placeOf = useMemo(() => {
    const map = new Map<number, number>();
    for (const p of groupPoules) {
      teams.filter((t) => t.pouleId === p.id).sort(compareStanding).forEach((t, i) => map.set(t.id, i + 1));
    }
    return map;
  }, [teams, groupPoules]);

  const upcomingOf = (t: TournamentTeam): Upcoming => {
    const own = matches
      .filter((m) => m.teamAId === t.id || m.teamBId === t.id)
      .sort((a, b) => (a.scheduledAt ?? "").localeCompare(b.scheduledAt ?? ""));
    const cur = own.find((m) => matchStatus(m, now) === "live");
    const nx = cur ?? own.find((m) => matchStatus(m, now) === "next") ?? null;
    const opp = nx ? nameOf.get((nx.teamAId === t.id ? nx.teamBId : nx.teamAId) ?? 0) ?? "nog te bepalen" : "";
    return {
      live: !!cur,
      match: nx,
      opponent: opp,
      sortKey: cur ? "0" : nx?.scheduledAt ? `1${nx.scheduledAt}` : "2",
      idle: own.length ? "Alle geplande matchen gespeeld" : "Het schema volgt nog",
    };
  };

  const metaOf = (t: TournamentTeam) => {
    const poule = t.pouleId ? pouleOf.get(t.pouleId) : undefined;
    if (!poule) return "Nog geen poule";
    const place = placeOf.get(t.id);
    return started && place ? `Poule ${pouleLetter(poule)} · ${nth(place)}` : `Poule ${pouleLetter(poule)}`;
  };

  // ── Mijn ploegen ──────────────────────────────────────────────────────────
  const favs = teams
    .filter((t) => followed.has(t.id))
    .map((t) => ({ team: t, up: upcomingOf(t) }))
    .sort((a, b) => a.up.sortKey.localeCompare(b.up.sortKey) || a.team.name.localeCompare(b.team.name, "nl"));

  // ── Alle ploegen ──────────────────────────────────────────────────────────
  const q = search.trim().toLowerCase();
  const rows = teams
    .map((t) => {
      if (!q || t.name.toLowerCase().includes(q)) return { team: t, hit: "" };
      const player = rosterOf(t).find((p) => p.name.toLowerCase().includes(q));
      return player ? { team: t, hit: player.name } : null;
    })
    .filter((r): r is { team: TournamentTeam; hit: string } => r !== null);

  const groups = (() => {
    if (view === "poule" && groupPoules.length > 0) {
      const out = groupPoules
        .map((p) => {
          const own = rows.filter((r) => r.team.pouleId === p.id);
          own.sort((a, b) => (started ? compareStanding(a.team, b.team) : a.team.name.localeCompare(b.team.name, "nl")));
          return { key: String(p.id), label: `Poule ${pouleLetter(p)}`, rows: own };
        })
        .filter((g) => g.rows.length > 0);
      const loose = rows.filter((r) => !r.team.pouleId || !pouleOf.has(r.team.pouleId));
      return loose.length ? [...out, { key: "none", label: "Nog zonder poule", rows: loose }] : out;
    }
    const map = new Map<string, typeof rows>();
    for (const r of [...rows].sort((a, b) => a.team.name.localeCompare(b.team.name, "nl"))) {
      const first = r.team.name.trim()[0]?.toUpperCase() ?? "#";
      const letter = /\p{L}/u.test(first) ? first.normalize("NFD").replace(/\p{M}/gu, "") : "#";
      if (!map.has(letter)) map.set(letter, []);
      map.get(letter)!.push(r);
    }
    return [...map.entries()].map(([label, rs]) => ({ key: label, label, rows: rs }));
  })();

  const href = (t: TournamentTeam) => `/toernooi/${tournamentId}/teams/${t.id}`;

  return (
    <div className="flex flex-col gap-7">
      <PageHead title="Teams" subtitle={`${teams.length} ploegen`} />

      {favs.length === 0 ? (
        <div className="flex items-center gap-3 rounded-2xl border border-dashed border-rule bg-surface px-4 py-3.5">
          <span className="shrink-0 text-pink"><IconStar size={18} /></span>
          <p className="text-sm leading-snug">
            Volg je ploeg met de ster, dan staat ze hier bovenaan met haar volgende match.
          </p>
        </div>
      ) : (
        <FavStrip favs={favs} followed={followed} metaOf={metaOf} href={href} />
      )}

      <section aria-labelledby="alle-ploegen" className="flex flex-col gap-3">
        <h2 id="alle-ploegen" className="text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-ink-2">Alle ploegen</h2>

        <div className="flex flex-col gap-2.5 md:flex-row md:items-center">
          <div className="flex h-12 items-center gap-2.5 rounded-xl border border-rule bg-surface pl-4 pr-1.5 focus-within:border-ink-2 md:h-11 md:flex-1">
            <span className="shrink-0 text-ink-2"><Search size={15} strokeWidth={2} aria-hidden /></span>
            <label htmlFor="team-zoek" className="sr-only">Filter op ploeg- of spelersnaam</label>
            <input
              id="team-zoek"
              type="search"
              placeholder="Filter op ploeg of speler"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-full min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-ink-2 md:text-sm [&::-webkit-search-cancel-button]:hidden"
            />
            {search && (
              <button type="button" onClick={() => setSearch("")} aria-label="Filter wissen" className="t-press flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-2 hover:bg-ink/5 hover:text-ink">
                <IconClose size={14} />
              </button>
            )}
          </div>

          {groupPoules.length > 0 && (
            <div role="tablist" aria-label="Groepering" className="grid grid-cols-2 rounded-xl bg-ink/[0.06] p-[3px] md:w-64">
              {([["naam", "A–Z"], ["poule", "Per poule"]] as const).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={view === key}
                  onClick={() => setView(key)}
                  className={`t-press h-10 rounded-[9px] text-sm font-semibold md:h-9 ${view === key ? "bg-surface text-ink shadow-[0_1px_2px_rgba(22,22,26,.08)]" : "text-ink-2 hover:text-ink"}`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {q && rows.length > 0 && (
          <p className="text-[0.8125rem] text-ink-2" aria-live="polite">
            {rows.length} {rows.length === 1 ? "resultaat" : "resultaten"} voor “{search.trim()}”
          </p>
        )}

        {rows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-rule px-6 py-10 text-center">
            <p className="font-semibold">Geen ploeg of speler gevonden</p>
            <button type="button" onClick={() => setSearch("")} className="t-press mt-1 h-11 rounded-full border border-rule bg-surface px-5 text-sm font-semibold">
              Toon alle ploegen
            </button>
          </div>
        ) : (
          <div className="md:columns-2 md:gap-10 lg:columns-3">
            {groups.map((g) => (
              <section key={g.key} aria-label={g.label} className="break-inside-avoid pb-2">
                <h3 className="pb-1 pt-3 font-mono text-xs font-bold text-ink-2">{g.label}</h3>
                <ul>
                  {g.rows.map(({ team: t, hit }, i) => {
                    const live = upcomingOf(t).live;
                    const poule = t.pouleId ? pouleOf.get(t.pouleId) : undefined;
                    const tag = view === "poule" && started ? String(i + 1) : poule ? pouleLetter(poule) : "–";
                    return (
                      <li key={t.id} className="border-b border-rule">
                        <Link href={href(t)} className="flex min-h-[52px] items-center gap-3 py-1.5 hover:text-ink-2">
                          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                            <span className="truncate text-[0.9375rem] font-medium">
                              {followed.has(t.id) && <StarMark />}
                              {t.name}
                            </span>
                            {hit && <span className="truncate text-xs text-ink-2">Speler: {hit}</span>}
                          </span>
                          {live && <span className="t-live-dot shrink-0" role="img" aria-label="speelt nu" />}
                          <span
                            aria-label={view === "poule" && started ? `${tag}de in de poule` : `Poule ${tag}`}
                            className="flex h-6 min-w-7 shrink-0 items-center justify-center rounded-md border border-rule px-1.5 font-mono text-xs font-bold text-ink-2"
                          >
                            {tag}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// ── Mijn ploegen: swipe-kaarten ───────────────────────────────────────────────

function FavStrip({
  favs,
  followed,
  metaOf,
  href,
}: Readonly<{
  favs: { team: TournamentTeam; up: Upcoming }[];
  followed: Followed;
  metaOf: (t: TournamentTeam) => string;
  href: (t: TournamentTeam) => string;
}>) {
  const scroller = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const many = favs.length > 1;

  const onScroll = () => {
    const el = scroller.current;
    const first = el?.firstElementChild as HTMLElement | null;
    if (!el || !first) return;
    const step = first.offsetWidth + 12;
    setActive(Math.max(0, Math.min(favs.length - 1, Math.round(el.scrollLeft / step))));
  };

  return (
    <section aria-labelledby="mijn-ploegen" className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <h2 id="mijn-ploegen" className="flex items-center gap-1.5 text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-ink-2">
          <span className="text-pink"><IconStar filled size={12} /></span>
          {many ? `Mijn ploegen · ${favs.length}` : "Jouw ploeg"}
        </h2>
        {many && (
          <span aria-hidden="true" className="flex gap-1.5 md:hidden">
            {favs.map(({ team }, i) => (
              <span key={team.id} className={`h-1.5 rounded-full transition-all ${i === active ? "w-4 bg-ink" : "w-1.5 bg-rule"}`} />
            ))}
          </span>
        )}
      </div>

      <div
        ref={scroller}
        onScroll={many ? onScroll : undefined}
        className={
          many
            ? "-mx-5 flex snap-x snap-mandatory scroll-px-5 gap-3 overflow-x-auto px-5 pb-1 [scrollbar-width:none] sm:-mx-8 sm:scroll-px-8 sm:px-8 md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 lg:grid-cols-3"
            : "grid md:grid-cols-2 lg:grid-cols-3"
        }
      >
        {favs.map(({ team, up }) => (
          <FavCard key={team.id} team={team} up={up} meta={metaOf(team)} href={href(team)} followed={followed} narrow={many} />
        ))}
      </div>
    </section>
  );
}

function FavCard({
  team,
  up,
  meta,
  href,
  followed,
  narrow,
}: Readonly<{ team: TournamentTeam; up: Upcoming; meta: string; href: string; followed: Followed; narrow: boolean }>) {
  const players = rosterOf(team);
  const m = up.match;

  return (
    <article
      className={`relative flex flex-col gap-3 rounded-2xl border-[1.5px] bg-surface p-4 ${up.live ? "border-pink" : "border-rule"} ${
        narrow ? "w-[min(300px,82vw)] shrink-0 snap-start md:w-auto" : ""
      }`}
    >
      <Link href={href} aria-label={`${team.name}: alle matchen en resultaten`} className="absolute inset-0 z-[1] rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink" />

      <div className="flex items-start gap-2">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className={`flex items-center gap-1.5 text-xs font-bold ${up.live ? "text-pink-ink" : "text-ink-2"}`}>
            {up.live && <span className="t-live-dot" aria-hidden="true" />}
            {up.live ? "Speelt nu" : m ? "Volgende match" : up.idle}
          </span>
          <h3 className="text-[1.0625rem] font-bold leading-tight tracking-tight">{team.name}</h3>
          <span className="text-[0.8125rem] text-ink-2">{meta}</span>
        </div>
        <span className="relative z-[2] -mr-2 -mt-2">
          <FollowStar teamId={team.id} name={team.name} followed={followed} />
        </span>
      </div>

      {m && (
        <dl className="grid grid-cols-3 gap-2 rounded-xl bg-paper p-3">
          <div className="flex flex-col gap-0.5">
            <dt className="text-[0.6875rem] text-ink-2">{up.live ? "Sinds" : "Uur"}</dt>
            <dd className="font-mono text-lg font-bold">{fmtTime(m.scheduledAt) || "–"}</dd>
          </div>
          <div className="flex flex-col gap-0.5">
            <dt className="text-[0.6875rem] text-ink-2">Baan</dt>
            <dd className="font-mono text-lg font-bold">{m.track ?? "–"}</dd>
          </div>
          <div className="flex min-w-0 flex-col gap-0.5">
            <dt className="text-[0.6875rem] text-ink-2">Tegen</dt>
            <dd className="line-clamp-2 text-[0.8125rem] font-semibold leading-snug">{up.opponent}</dd>
          </div>
        </dl>
      )}

      {players.length > 0 && (
        <p className="mt-auto text-[0.8125rem] leading-relaxed text-ink-2">
          {players.map((p, i) => (
            <span key={`${p.name}-${i}`}>
              {i > 0 && " · "}
              {p.name}
              {p.captain && " (K)"}
            </span>
          ))}
        </p>
      )}
    </article>
  );
}
