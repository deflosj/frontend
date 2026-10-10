"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";

import {
  matchStatus,
  pouleLetter,
  pouleTables,
  pouleTracks,
  projectFirstRound,
  projectedKnockout,
  knockoutScheduleFor,
  isKnockout,
  qualifyReason,
  rankTeams,
  useAutoRefresh,
  useNow,
  type RankedTeam,
} from "@/lib/tournament-live";
import type { TournamentMatch, TournamentPoule, TournamentTeam } from "@/lib/tournament-types";
import { fmtTime } from "@/utils/DateHelpers";
import { PageHead } from "../_shared";
import {
  Chip,
  FilterButton,
  FilterPanel,
  FilterPills,
  FilterSection,
  IconInfo,
  InfoSheet,
  Segmented,
  TeamSearch,
  Toggle,
  useAnimKey,
  usePersisted,
  type ActiveFilter,
} from "../_filters";
import { FollowStar, StarMark, useFollowed } from "../_follow";

interface Props {
  poules: TournamentPoule[];
  teams: TournamentTeam[];
  matches: TournamentMatch[];
  isActive: boolean;
  advancingPerPoule: number;
  bestNths: number;
  ko?: {
    trackCount?: number;
    knockoutPauseMinutes?: number;
    knockoutSlotMinutes?: number | null;
    finalsSlotMinutes?: number;
    roundBreakMinutes?: number;
    withConsolation?: boolean;
  };
}

const salCls = (v: number) => (v > 0 ? "text-green-700 dark:text-green-400" : v < 0 ? "text-red-600 dark:text-red-400" : "");
const fmtSal = (v: number) => `${v > 0 ? "+" : ""}${v}`;
const KIND_CLS: Record<RankedTeam["kind"], string> = {
  first: "bg-pink-soft text-pink-ink",
  second: "bg-pink-soft text-pink-ink",
  nth: "bg-ink/10 text-ink",
  out: "border border-dashed border-rule text-ink-2",
};

export function PoulesView({ poules, teams, matches, isActive, advancingPerPoule, bestNths, ko }: Readonly<Props>) {
  const now = useNow();
  useAutoRefresh(isActive);

  const [q, setQ] = useState("");
  const [teamId, setTeamId] = useState<number | null>(null);
  const followed = useFollowed();
  const [view, setView] = usePersisted<"poules" | "rank">("standen", "view", "poules");
  const [track, setTrack] = usePersisted("standen", "track", 0);
  const [pouleId, setPouleId] = usePersisted("standen", "poule", 0);
  const [onlyQual, setOnlyQual] = usePersisted("standen", "onlyQual", false);
  const [open, setOpen] = useState(false);
  const [info, setInfo] = useState(false);
  const params = useParams<{ id?: string }>();

  const tables = useMemo(() => pouleTables(poules, teams), [poules, teams]);
  const ranking = useMemo(() => rankTeams(tables, advancingPerPoule, bestNths), [tables, advancingPerPoule, bestNths]);
  const rankById = useMemo(() => new Map(ranking.map((r) => [r.team.id, r])), [ranking]);
  const trackOf = useMemo(() => pouleTracks(matches), [matches]);
  const tracks = [...new Set(trackOf.values())].sort((a, b) => a - b);
  const qualifyCount = ranking.filter((r) => r.qualifies).length;
  // Voorlopige tegenstander in de eerste knock-outronde, "als het nu stopt".
  // Eerste knock-outmatch per ploeg: de echte als het schema er is, anders
  // de voorlopige "als het nu stopt", met uur en baan.
  const opponentOf = useMemo(() => {
    const map = new Map<number, { opp: string; at: string | null; track: number | null }>();
    const real = matches.filter((m) => m.bracketPos && isKnockout(m.phase));
    const firstPhase = real.length ? real.reduce((a, b) => ((a.scheduledAt ?? "") <= (b.scheduledAt ?? "") ? a : b)).phase : null;
    const r1 = real.length
      ? real.filter((m) => m.phase === firstPhase)
      : projectedKnockout(poules, teams, advancingPerPoule, bestNths, ko?.withConsolation ?? true, knockoutScheduleFor({ matches, ...ko }));
    const nameOf = new Map(teams.map((t) => [t.id, t.name]));
    for (const m of r1) {
      if (!m.teamAId || !m.teamBId) continue;
      map.set(m.teamAId, { opp: nameOf.get(m.teamBId) ?? "?", at: m.scheduledAt, track: m.track });
      map.set(m.teamBId, { opp: nameOf.get(m.teamAId) ?? "?", at: m.scheduledAt, track: m.track });
    }
    // Vrijgeloot: wel door, maar geen match in de eerste ronde.
    for (const p of projectFirstRound(ranking)) if (p.a && !p.b && !map.has(p.a.team.id)) map.set(p.a.team.id, { opp: "", at: null, track: null });
    return map;
  }, [ranking, matches, poules, teams, advancingPerPoule, bestNths, ko]);
  const firstRoundName = qualifyCount > 16 ? "1/16 finale" : qualifyCount > 8 ? "1/8 finale" : qualifyCount > 4 ? "kwartfinale" : "halve finale";
  const pouleNameOf = (t: TournamentTeam) => {
    const p = poules.find((x) => x.id === t.pouleId);
    return p ? `poule ${pouleLetter(p)}` : "de poule";
  };
  const myRows = ranking.filter((r) => followed.has(r.team.id));
  const statusOf = (r: RankedTeam) => {
    const reason = qualifyReason(r, ranking, pouleNameOf(r.team), advancingPerPoule, bestNths);
    const o = opponentOf.get(r.team.id);
    const when = o?.at ? ` om ${fmtTime(o.at)}${o.track ? ` op baan ${o.track}` : ""}` : "";
    const koLine = r.qualifies && o
      ? o.opp === ""
        ? "Vrijgeloot in de eerste knock-outronde."
        : `${finished ? "Speelt" : "Zou spelen"} in de ${firstRoundName}${when} tegen ${o.opp}.`
      : "";
    return { reason, ko: koLine };
  };

  const groupMatches = matches.filter((m) => m.phase === "GROUP_STAGE");
  const played = groupMatches.filter((m) => m.scoreA !== null && m.scoreB !== null).length;
  const finished = groupMatches.length > 0 && played === groupMatches.length;

  const team = teamId ? teams.find((t) => t.id === teamId) : undefined;
  const query = q.trim().toLowerCase();

  const poulePass = (p: TournamentPoule) => {
    if (track && trackOf.get(p.id) !== track) return false;
    if (pouleId && p.id !== pouleId) return false;
    if (team && team.pouleId !== p.id) return false;
    return true;
  };
  const rowPass = (t: TournamentTeam) => {
    if (onlyQual && !rankById.get(t.id)?.qualifies) return false;
    if (!team && query && !t.name.toLowerCase().includes(query)) return false;
    return true;
  };

  const shownPoules = tables
    .filter((t) => poulePass(t.poule))
    .map((t) => ({ ...t, rows: t.rows.filter(rowPass), fav: t.rows.some((r) => followed.has(r.id)) }))
    .filter((t) => t.rows.length > 0)
    // Poules met een gevolgde ploeg eerst; verder de gewone volgorde (sort is stabiel).
    .sort((a, b) => Number(b.fav) - Number(a.fav));
  const shownRanking = ranking.filter((r) => {
    const p = poules.find((x) => x.id === r.team.pouleId);
    return (!p || poulePass(p) || (!!team && !track && !pouleId)) && rowPass(r.team);
  });

  const active: ActiveFilter[] = [];
  if (track) active.push({ label: `Baan ${track}`, onRemove: () => setTrack(0) });
  if (pouleId) {
    const p = poules.find((x) => x.id === pouleId);
    active.push({ label: p ? `Poule ${pouleLetter(p)}` : "Poule", onRemove: () => setPouleId(0) });
  }
  if (onlyQual) active.push({ label: `Enkel de ${qualifyCount} die doorgaan`, onRemove: () => setOnlyQual(false) });
  const clearFilters = () => {
    setTrack(0);
    setPouleId(0);
    setOnlyQual(false);
  };

  const animKey = useAnimKey([view, track, pouleId, onlyQual, teamId, followed.ids.join()]);
  const teamOptions = [...teams]
    .filter((t) => t.pouleId !== null)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((t) => {
      const p = poules.find((x) => x.id === t.pouleId);
      return { id: t.id, name: t.name, meta: p ? `Poule ${pouleLetter(p)}` : undefined };
    });
  const pick = (id: number) => {
    setTeamId(id);
    setQ("");
  };

  const count = view === "poules" ? shownPoules.length : shownRanking.length;
  const applyLabel = view === "poules" ? `Toon ${count} poule${count === 1 ? "" : "s"}` : `Toon ${count} teams`;
  const mine = team ? rankById.get(team.id) : undefined;
  const teamPoule = team ? poules.find((p) => p.id === team.pouleId) : undefined;

  return (
    <div className="flex flex-col gap-6">
      <PageHead
        title="Standen"
        subtitle={`${tables.length} poules · ${finished ? "eindstand na" : "voorlopige stand na"} ${played} van ${groupMatches.length} poulewedstrijden`}
      />

      <section aria-label="Zoeken en filteren" className="sticky top-[60px] z-20 -mx-5 flex flex-col gap-2.5 border-b border-rule bg-paper px-5 py-3 sm:-mx-8 sm:px-8 md:static md:mx-0 md:border-0 md:bg-transparent md:p-0">
        <div className="relative flex items-start gap-2.5">
          <div className="min-w-0 flex-1">
            <TeamSearch options={teamOptions} selected={team ? { id: team.id, name: team.name } : null} selectedAction={team ? <FollowStar teamId={team.id} name={team.name} followed={followed} /> : null} onSelect={(id) => (id === null ? setTeamId(null) : pick(id))} query={q} onQuery={setQ} />
          </div>
          <FilterButton count={active.length} open={open} onClick={() => setOpen((o) => !o)} controls="stand-filters" />
          <div className="hidden md:block">
            <Segmented label="Weergave" value={view} onChange={setView} options={[{ key: "poules", label: "Per poule" }, { key: "rank", label: `Ranking 1–${ranking.length}` }]} />
          </div>
          <FilterPanel id="stand-filters" open={open} onClose={() => setOpen(false)} onClear={clearFilters} applyLabel={applyLabel}>
            {tracks.length > 1 && (
              <FilterSection title="Baan" hint="Elke baan speelt vaste poules, bv. baan 1 = poule A en B.">
                <div className="flex flex-wrap gap-1.5">
                  <Chip on={track === 0} onClick={() => setTrack(0)}>Alle</Chip>
                  {tracks.map((t) => (
                    <Chip key={t} square on={track === t} onClick={() => { setTrack(t); setPouleId(0); }}>{t}</Chip>
                  ))}
                </div>
              </FilterSection>
            )}
            <FilterSection title="Poule">
              <div className="grid grid-cols-7 gap-1.5">
                <Chip square on={pouleId === 0} onClick={() => setPouleId(0)}>Alle</Chip>
                {tables.map(({ poule }) => (
                  <Chip key={poule.id} square on={pouleId === poule.id} onClick={() => { setPouleId(poule.id); setTrack(0); }}>
                    {pouleLetter(poule)}
                  </Chip>
                ))}
              </div>
            </FilterSection>
            <Toggle on={onlyQual} onClick={() => setOnlyQual((v) => !v)}>Enkel de {qualifyCount} teams die doorgaan</Toggle>
          </FilterPanel>
        </div>
        <div className="md:hidden">
          <Segmented stretch label="Weergave" value={view} onChange={setView} options={[{ key: "poules", label: "Per poule" }, { key: "rank", label: `Ranking 1–${ranking.length}` }]} />
        </div>
        <FilterPills filters={active} onClear={clearFilters} />
      </section>

      {team && mine && (
        <section key={team.id} aria-label="Jouw team" className="t-rise flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-pink bg-surface px-4 py-3.5">
          <div className="flex min-w-[220px] flex-1 flex-col gap-0.5">
            <span className="text-xs font-bold text-ink-2">
              Poule {teamPoule ? pouleLetter(teamPoule) : "–"}
              {teamPoule && trackOf.get(teamPoule.id) ? ` · baan ${trackOf.get(teamPoule.id)}` : ""}
            </span>
            <span className="text-lg font-extrabold">
              {mine.place}
              {mine.place === 1 ? "ste" : "de"} in de poule · {team.points} punten
            </span>
          </div>
          <span className={`inline-flex h-7 items-center rounded-full px-3 text-xs font-bold ${KIND_CLS[mine.kind]}`}>
            {finished ? "" : "Voorlopig: "}
            {mine.label}
          </span>
          <span className="text-[0.8125rem] text-ink-2">
            Plaats {mine.seed} van {ranking.length} in de ranking
          </span>
          <p className="basis-full text-sm leading-relaxed text-ink-2">
            {statusOf(mine).reason} {statusOf(mine).ko}
          </p>
        </section>
      )}

      {!team && played > 0 && myRows.length > 0 && (
        <section aria-labelledby="jouw-ploegen" className="flex flex-col gap-2.5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="jouw-ploegen" className="text-[0.95rem] font-bold">Jouw ploegen {finished ? "na de poules" : "als het nu stopt"}</h2>
            <button type="button" onClick={() => setInfo(true)} className="inline-flex items-center gap-1.5 text-[0.8125rem] font-semibold text-ink-2 hover:text-ink">
              <IconInfo size={14} /> Hoe werkt de loting?
            </button>
          </div>
          <ul className="grid gap-2 md:grid-cols-2">
            {myRows.map((r, i) => {
              const st = statusOf(r);
              return (
                <li
                  key={r.team.id}
                  className={`t-rise flex flex-col gap-2 rounded-2xl border bg-surface px-4 py-3.5 ${r.qualifies ? "border-pink" : "border-rule"}`}
                  style={{ animationDelay: `${i * 45}ms` }}
                >
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => pick(r.team.id)} className="min-w-0 flex-1 truncate text-left text-base font-bold hover:underline hover:underline-offset-2">
                      {r.team.name}
                    </button>
                    <span className={`inline-flex h-7 shrink-0 items-center rounded-full px-3 text-xs font-bold ${KIND_CLS[r.kind]}`}>
                      {r.qualifies ? (finished ? "Door" : "Gaat door") : finished ? "Uitgeschakeld" : "Ligt eruit"}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-ink-2">
                    {st.reason}
                    {st.ko && <> <span className="font-semibold text-ink">{st.ko}</span></>}
                  </p>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {count === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-rule px-6 py-12 text-center">
          <p className="font-bold">Niets te tonen met deze filters</p>
          <button type="button" onClick={() => { clearFilters(); setTeamId(null); setQ(""); }} className="t-press mt-2 h-11 rounded-full border border-rule bg-surface px-5 text-sm font-semibold">
            Alles wissen
          </button>
        </div>
      ) : view === "poules" ? (
        <>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-ink-2">
            <span className="inline-flex items-center gap-1.5"><span className="h-3.5 w-1 rounded-sm bg-pink" />Top {advancingPerPoule}: rechtstreeks door</span>
            {bestNths > 0 && (
              <span className="inline-flex items-center gap-1.5"><span className="h-3.5 w-1 rounded-sm bg-ink/30" />{advancingPerPoule + 1}de: kans als een van de {bestNths} beste</span>
            )}
            <span>Winst 2 · gelijk 1 · verlies 0</span>
            <button type="button" onClick={() => setInfo(true)} className="inline-flex items-center gap-1.5 font-semibold text-ink-2 hover:text-ink">
              <IconInfo size={14} /> Wie gaat door?
            </button>
          </div>
          <div key={animKey} className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {shownPoules.map(({ poule, rows, fav }, i) => {
              const pm = groupMatches.filter((m) => m.pouleId === poule.id);
              const done = pm.filter((m) => m.scoreA !== null && m.scoreB !== null).length;
              const live = pm.some((m) => matchStatus(m, now) === "live");
              const next = pm
                .filter((m) => matchStatus(m, now) === "next")
                .sort((a, b) => new Date(a.scheduledAt ?? 0).getTime() - new Date(b.scheduledAt ?? 0).getTime())[0];
              const name = (id: number | null) => teams.find((t) => t.id === id)?.name ?? "?";
              const isMine = team?.pouleId === poule.id;
              return (
                <div
                  key={poule.id}
                  className={`t-rise flex flex-col overflow-hidden rounded-2xl border bg-surface ${isMine ? "border-pink shadow-[inset_0_0_0_1px_var(--pink)]" : fav ? "border-pink/50" : "border-rule"}`}
                  style={{ animationDelay: `${Math.min(i, 11) * 35}ms` }}
                >
                  <div className="flex items-center gap-2.5 px-4 pb-1.5 pt-3.5">
                    <span className="text-[1.05rem] font-extrabold">Poule {pouleLetter(poule)}</span>
                    <span className="text-xs font-semibold text-ink-2">
                      {trackOf.get(poule.id) ? `Baan ${trackOf.get(poule.id)} · ` : ""}
                      {done}/{pm.length} gespeeld
                    </span>
                    {live && <span className="ml-auto inline-flex items-center gap-1.5 text-[0.6875rem] font-bold text-pink-ink"><span className="t-live-dot" />bezig</span>}
                  </div>
                  <div role="table" aria-label={`Stand poule ${pouleLetter(poule)}`}>
                    <div role="row" className="grid min-h-8 grid-cols-[34px_minmax(0,1fr)_26px_44px_42px] items-center border-b border-rule text-[0.6875rem] font-semibold text-ink-2 sm:grid-cols-[34px_minmax(0,1fr)_26px_26px_30px_26px_44px_46px]">
                      <span role="columnheader" className="pl-4">#</span>
                      <span role="columnheader">Team</span>
                      <span role="columnheader" className="text-right" title="Gespeeld">G</span>
                      <span role="columnheader" className="hidden text-right sm:block" title="Gewonnen">W</span>
                      <span role="columnheader" className="hidden text-right sm:block" title="Gelijk">GL</span>
                      <span role="columnheader" className="hidden text-right sm:block" title="Verloren">V</span>
                      <span role="columnheader" className="text-right">+/−</span>
                      <span role="columnheader" className="pr-4 text-right">Pnt</span>
                    </div>
                    {rows.map((t) => {
                      const place = t.pouleId ? tables.find((x) => x.poule.id === t.pouleId)!.rows.findIndex((r) => r.id === t.id) + 1 : 0;
                      const bar = place <= advancingPerPoule ? "before:bg-pink" : place === advancingPerPoule + 1 && bestNths > 0 ? "before:bg-ink/30" : "before:hidden";
                      return (
                        <div
                          key={t.id}
                          role="row"
                          className={`relative grid min-h-11 grid-cols-[34px_minmax(0,1fr)_26px_44px_42px] items-center border-b border-rule text-sm tabular-nums transition-colors last:border-0 before:absolute before:bottom-2 before:left-0 before:top-2 before:w-1 before:rounded-r before:content-[''] sm:min-h-10 sm:grid-cols-[34px_minmax(0,1fr)_26px_26px_30px_26px_44px_46px] sm:text-[0.8125rem] ${bar} ${t.id === teamId ? "bg-pink-soft" : ""}`}
                        >
                          <span role="cell" className="pl-4 font-bold">{place}</span>
                          <span role="cell" className="min-w-0">
                            <button type="button" onClick={() => pick(t.id)} className={`block max-w-full truncate text-left hover:underline hover:underline-offset-2 ${followed.has(t.id) ? "font-bold text-pink-ink" : "font-semibold"}`}>
                              {followed.has(t.id) && <StarMark />}
                              {t.name}
                            </button>
                          </span>
                          <span role="cell" className="text-right">{t.played}</span>
                          <span role="cell" className="hidden text-right sm:block">{t.won}</span>
                          <span role="cell" className="hidden text-right sm:block">{t.drawn}</span>
                          <span role="cell" className="hidden text-right sm:block">{t.lost}</span>
                          <span role="cell" className={`text-right ${salCls(t.saldo)}`}>{fmtSal(t.saldo)}</span>
                          <span role="cell" className="pr-4 text-right font-extrabold">{t.points}</span>
                        </div>
                      );
                    })}
                  </div>
                  <p className="mt-auto border-t border-rule px-4 py-2.5 text-xs text-ink-2">
                    {done === pm.length
                      ? "Poule afgewerkt"
                      : live
                        ? `Nu bezig${trackOf.get(poule.id) ? ` op baan ${trackOf.get(poule.id)}` : ""}`
                        : next
                          ? `Volgende ${fmtTime(next.scheduledAt)}: ${name(next.teamAId)} – ${name(next.teamBId)}`
                          : ""}
                  </p>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <>
          <button type="button" onClick={() => setInfo(true)} className="t-press inline-flex h-10 items-center gap-2 self-start rounded-full border border-rule bg-surface px-4 text-sm font-semibold text-ink-2 hover:border-ink-2 hover:text-ink">
            <IconInfo /> Hoe wordt de knock-out geloot?
          </button>
          <div key={animKey} className="t-rise overflow-x-auto rounded-2xl border border-rule bg-surface">
            <div role="table" aria-label="Ranking na de poules" className="min-w-0 md:min-w-[720px]">
              <div role="row" className="hidden min-h-[38px] grid-cols-[64px_minmax(0,1fr)_70px_56px_64px_56px_200px] items-center gap-2 border-b border-rule px-3 text-[0.72rem] font-semibold text-ink-2 md:grid">
                <span role="columnheader">Plaats</span>
                <span role="columnheader">Team</span>
                <span role="columnheader" title="Poule en plaats in de poule">Poule</span>
                <span role="columnheader" className="text-right">Pnt</span>
                <span role="columnheader" className="text-right">+/−</span>
                <span role="columnheader" className="text-right">Voor</span>
                <span role="columnheader">Status</span>
              </div>
              {shownRanking.map((r, i) => {
                const prev = shownRanking[i - 1];
                const advTotal = tables.length * advancingPerPoule;
                const cut =
                  bestNths > 0 && r.seed === advTotal + 1 && (!prev || prev.seed <= advTotal)
                    ? `Beste ${advancingPerPoule + 1}des — ${bestNths} van de ${tables.length} gaan door`
                    : r.seed === qualifyCount + 1 && (!prev || prev.seed <= qualifyCount)
                      ? "Grens: hieronder ligt het toernooi eruit"
                      : "";
                const p = poules.find((x) => x.id === r.team.pouleId);
                const isMe = r.team.id === teamId;
                return (
                  <div key={r.team.id}>
                    {cut && <div className="border-b border-rule bg-pink-soft px-4 py-2.5 text-xs font-bold text-pink-ink md:px-6">{cut}</div>}
                    <div
                      role="row"
                      className={`flex min-h-14 items-center gap-3 border-b border-rule px-3.5 tabular-nums last:border-0 md:grid md:min-h-11 md:grid-cols-[64px_minmax(0,1fr)_70px_56px_64px_56px_200px] md:gap-2 md:px-3 ${isMe ? "bg-pink-soft" : ""} ${r.qualifies ? "" : "text-ink-2"}`}
                    >
                      <span role="cell" className="w-7 text-[0.95rem] font-extrabold md:w-auto md:text-sm">{r.seed}</span>
                      <span role="cell" className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <button type="button" onClick={() => pick(r.team.id)} className={`block max-w-full truncate text-left text-sm hover:underline hover:underline-offset-2 ${followed.has(r.team.id) ? "font-bold text-pink-ink" : "font-semibold"}`}>
                          {followed.has(r.team.id) && <StarMark />}
                          {r.team.name}
                        </button>
                        <span className="text-xs text-ink-2 md:hidden">
                          {p ? pouleLetter(p) : ""}
                          {r.place} · {r.team.points} pnt · {fmtSal(r.team.saldo)}
                        </span>
                      </span>
                      <span role="cell" className="hidden font-semibold text-ink-2 md:block">{p ? pouleLetter(p) : ""}{r.place}</span>
                      <span role="cell" className="hidden text-right font-extrabold md:block">{r.team.points}</span>
                      <span role="cell" className={`hidden text-right md:block ${salCls(r.team.saldo)}`}>{fmtSal(r.team.saldo)}</span>
                      <span role="cell" className="hidden text-right md:block">{r.team.goalsFor}</span>
                      <span role="cell">
                        <span className={`inline-flex h-6 items-center whitespace-nowrap rounded-full px-2.5 text-[0.7rem] font-bold ${KIND_CLS[r.kind]}`}>
                          <span className="md:hidden">{r.short}</span>
                          <span className="hidden md:inline">{r.label}</span>
                        </span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      <InfoSheet open={info} onClose={() => setInfo(false)} title="Wie gaat door naar de knock-out?">
        <p>
          De top {advancingPerPoule} van elke poule gaat rechtstreeks door
          {bestNths > 0 ? <>, samen met de <strong className="text-ink">{bestNths} beste {advancingPerPoule + 1}des</strong></> : null}.
          {qualifyCount > 0 && <> Dat zijn {qualifyCount} ploegen.</>}
        </p>
        <p>
          Binnen een poule tellen eerst de punten (winst 2, gelijk 1, verlies 0), dan het saldo, dan de gemaakte punten.
          Zo worden ook de {advancingPerPoule + 1}des onderling vergeleken.
        </p>
        <p>
          Voor de loting komen eerst alle poulewinnaars (beste eerst), dan alle {advancingPerPoule}des
          {bestNths > 0 ? <>, dan de beste {advancingPerPoule + 1}des</> : null}. Zo krijgt elke ploeg een plaats van 1 tot {qualifyCount || "N"}.
        </p>
        <p>
          In de eerste ronde speelt plaats 1 tegen de laatste plaats, plaats 2 tegen de voorlaatste, enzovoort.
          {bestNths > 0 && <> De beste poulewinnaar speelt dus tegen de zwakste {advancingPerPoule + 1}de die doorgaat.</>}{" "}
          Twee ploegen uit dezelfde poule treffen elkaar nooit in de eerste ronde.
        </p>
        <Link href={`/toernooi/${params?.id ?? ""}/rules`} className="self-start font-semibold text-ink underline underline-offset-4">
          Naar het reglement
        </Link>
      </InfoSheet>
    </div>
  );
}
