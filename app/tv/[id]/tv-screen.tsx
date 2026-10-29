"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { API_BASE } from "@/lib/api";

import {
  comparePouleRank,
  isKnockout,
  isPlayed,
  matchStatus,
  pouleLetter,
  pouleTables,
  pouleTracks,
  knockoutScheduleFor,
  KO_SHORT,
  projectedKnockout,
  rankTeams,
  swappedFirstRound,
  tiebreaksNeeded,
  useNow,
} from "@/lib/tournament-live";
import type { ActiveTournament, TournamentMatch } from "@/lib/tournament-types";
import { fmtTime } from "@/utils/DateHelpers";
import { MirroredBracket } from "@/app/(tournament)/toernooi/[id]/brackets/ko-bracket";

const SLIDE_MS = 15_000;
/** Zo vaak haalt de tv nieuwe scores op, ook als hij op pauze staat. */
const POLL_MS = 10_000;

/**
 * De tv haalt zelf de laatste stand op bij de API, los van de dia's of de
 * pauze. Zo staat een aangepaste score er binnen enkele seconden, ook als de
 * tv op de finales gepauzeerd staat. Mislukt een keer ophalen (wifi weg), dan
 * blijft het laatste beeld staan en probeert hij het gewoon opnieuw.
 */
function useLiveTournament(initial: ActiveTournament): ActiveTournament {
  const [data, setData] = useState(initial);
  useEffect(() => setData(initial), [initial]);
  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE}tournaments/${initial.id}`, { cache: "no-store" });
        if (!res.ok) return;
        const next = (await res.json()) as ActiveTournament;
        if (alive) setData({ ...next, id: initial.id });
      } catch {
        /* volgende keer opnieuw */
      }
    };
    const t = setInterval(load, POLL_MS);
    const onVisible = () => document.visibilityState === "visible" && void load();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      alive = false;
      clearInterval(t);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [initial.id]);
  return data;
}

const slideKey = (s: Slide) => (s.kind === "bracket" ? "bracket" : `${s.kind}-${s.page}`);
/** De tv hangt aan het raam: leesbaar tot ~3 m, dus er mag veel op één dia. */
const POULES_PER_SLIDE = 6;
const COURTS_PER_SLIDE = 6;

type Slide =
  | { kind: "courts"; page: number; pages: number }
  | { kind: "poules"; page: number; pages: number }
  | { kind: "bracket" };

/**
 * Het tv-scherm is altijd licht, ook als de laptop in donkere modus staat:
 * dezelfde kleuren als de admin en de publieke site (app/styles/globals.css).
 */
const LIGHT_THEME = {
  "--paper": "#faf8f5",
  "--surface": "#ffffff",
  "--ink": "#16161a",
  "--ink-2": "#4a4a52",
  "--rule": "#e6e3dc",
  "--pink": "#ff5d92",
  "--pink-soft": "#ffe1ec",
  "--pink-ink": "#7a1a3e",
  colorScheme: "light",
} as React.CSSProperties;


export function TvScreen({ tournament: initial }: Readonly<{ tournament: ActiveTournament }>) {
  // Vaker verversen dan de gewone pagina's: op de tv kijkt niemand op "vernieuwen".
  const tournament = useLiveTournament(initial);
  const now = useNow(10_000);
  const { name, year, teams, poules, matches } = tournament;
  const advancing = tournament.teamsAdvancingPerPoule ?? 2;
  const bestNths = tournament.bestNthsAdvancing ?? 0;

  const nameOf = useMemo(() => new Map(teams.map((t) => [t.id, t.name])), [teams]);
  const pouleOf = useMemo(() => new Map(poules.map((p) => [p.id, pouleLetter(p)])), [poules]);
  const tables = useMemo(() => pouleTables(poules, teams), [poules, teams]);
  const ranking = useMemo(() => rankTeams(tables, advancing, bestNths), [tables, advancing, bestNths]);
  const rankById = useMemo(() => new Map(ranking.map((r) => [r.team.id, r])), [ranking]);
  const trackOf = useMemo(() => pouleTracks(matches), [matches]);

  const hasKO = matches.some((m) => isKnockout(m.phase));
  const groupLeft = matches.some((m) => m.phase === "GROUP_STAGE" && !isPlayed(m));
  const ko = useMemo(
    () =>
      hasKO
        ? matches.filter((m) => isKnockout(m.phase))
        : projectedKnockout(poules, teams, advancing, bestNths, tournament.withConsolation ?? true, knockoutScheduleFor(tournament)),
    [hasKO, matches, poules, teams, advancing, bestNths, tournament]
  );

  const swapped = useMemo(() => swappedFirstRound(ranking, ko), [ranking, ko]);
  // Bal gooien: zichtbaar op elke dia tot de scheidsrechter het ingeeft.
  const ties = useMemo(() => tiebreaksNeeded(tournament).filter((t) => !t.resolved), [tournament]);
  const tiedIds = useMemo(() => new Set(ties.flatMap((t) => t.teams.map((x) => x.id))), [ties]);
  // Hoe meer ploegen in de popup, hoe kleiner de namen: alles moet op één scherm.
  const chipSize = tiedIds.size <= 6 ? "text-[1.6em]" : tiedIds.size <= 12 ? "text-[1.25em]" : "text-[1em]";
  // Popup blijft staan tot de scheidsrechter het bal gooien ingeeft.
  const showTies = ties.length > 0;

  // Welke dia's er zijn hangt af van het moment.
  const trackCount = useMemo(() => new Set(matches.map((m) => m.track).filter((t) => t !== null)).size, [matches]);
  const courtsBusy = matches.some((m) => m.track !== null && m.teamAId !== null && m.teamBId !== null && !isPlayed(m));
  const slides: Slide[] = useMemo(() => {
    // Banen enkel tonen als er nog iets gespeeld wordt; anders is het een dia vol lege kaarten.
    const courtPages = courtsBusy ? Math.max(1, Math.ceil(trackCount / COURTS_PER_SLIDE)) : 0;
    const out: Slide[] = Array.from({ length: courtPages }, (_, page) => ({ kind: "courts" as const, page, pages: courtPages }));
    const pages = Math.ceil(tables.length / POULES_PER_SLIDE);
    if (tables.length && (groupLeft || !hasKO)) for (let p = 0; p < pages; p++) out.push({ kind: "poules", page: p, pages });
    if (ko.length) out.push({ kind: "bracket" });
    if (tables.length && hasKO && !groupLeft) for (let p = 0; p < pages; p++) out.push({ kind: "poules", page: p, pages });
    if (out.length === 0) out.push({ kind: "courts", page: 0, pages: 1 });
    return out;
  }, [tables.length, groupLeft, hasKO, ko.length, trackCount, courtsBusy]);

  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (paused) return;
    const t = setTimeout(() => {
      setIdx((i) => (i + 1) % slides.length);
      setTick((x) => x + 1);
    }, SLIDE_MS);
    return () => clearTimeout(t);
  }, [idx, paused, slides.length, tick]);
  // Bediening met de afstandsbediening / het toetsenbord van de laptop aan de tv.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") { setIdx((i) => (i + 1) % slides.length); setTick((x) => x + 1); }
      else if (e.key === "ArrowLeft") { setIdx((i) => (i - 1 + slides.length) % slides.length); setTick((x) => x + 1); }
      else if (e.key === " ") { e.preventDefault(); setPaused((p) => !p); }
      else if (e.key.toLowerCase() === "f") { void document.documentElement.requestFullscreen?.(); }
    };
    globalThis.addEventListener("keydown", onKey);
    return () => globalThis.removeEventListener("keydown", onKey);
  }, [slides.length]);

  // Verandert het aantal dia's door nieuwe scores (bv. de banen-dia valt weg),
  // dan blijft de tv op dezelfde dia staan in plaats van te verspringen.
  const shownKey = useRef<string | null>(null);
  useEffect(() => {
    shownKey.current = slides[Math.min(idx, slides.length - 1)] ? slideKey(slides[Math.min(idx, slides.length - 1)]) : null;
    // enkel bij bewust wisselen van dia
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, tick]);
  useEffect(() => {
    if (!shownKey.current) return;
    const i = slides.findIndex((s) => slideKey(s) === shownKey.current);
    if (i >= 0 && i !== idx) setIdx(i);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slides]);

  const slide = slides[Math.min(idx, slides.length - 1)];
  const clock = fmtTime(now);
  const liveCount = matches.filter((m) => matchStatus(m, now) === "live").length;
  const pageNote = (sl: { page: number; pages: number }) => (sl.pages > 1 ? ` ${sl.page + 1}/${sl.pages}` : "");
  const title =
    slide.kind === "courts" ? `Op de banen${pageNote(slide)}`
    : slide.kind === "poules" ? `Standen${pageNote(slide)}`
    : "Finales";

  return (
    <div style={LIGHT_THEME} className="fixed inset-0 flex flex-col overflow-hidden bg-paper text-ink [font-size:clamp(13px,1.1vw,27px)]">
      {/* Kop: één smalle balk, de dia krijgt de ruimte. */}
      <header className="flex items-center gap-[0.9em] border-b border-rule bg-surface px-[1.6em] py-[0.4em]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.jpg" alt="De Flosj" className="h-[2em] w-[2em] shrink-0 rounded-[0.45em] object-cover" />
        <h1 className="text-[1.6em] font-bold tracking-[-0.02em]">{title}</h1>
        <span className="text-[1em] text-ink-2">{name} {year}</span>
        <div className="ml-auto flex items-center gap-[1.2em]">
          {liveCount > 0 && (
            <span className="inline-flex items-center gap-[0.5em] rounded-full bg-pink-soft px-[0.8em] py-[0.2em] text-[1em] font-semibold text-pink-ink">
              <span className="t-live-dot" /> {liveCount} bezig
            </span>
          )}
          {slides.length > 1 && (
            <div className="flex gap-[0.35em]" aria-hidden="true">
              {slides.map((_, i) => (
                <span key={i} className={`h-[0.45em] rounded-full transition-all duration-300 ${i === idx ? "w-[1.4em] bg-pink" : "w-[0.45em] bg-rule"}`} />
              ))}
            </div>
          )}
          <span className="font-mono text-[1.6em] font-semibold tabular-nums">{clock}</span>
        </div>
      </header>

      {/* Dia */}
      <main key={`${idx}-${tick}`} className="t-rise min-h-0 flex-1 px-[1.6em] py-[1em]">
        {slide.kind === "courts" && <Courts matches={matches} nameOf={nameOf} pouleOf={pouleOf} now={now} page={slide.page} />}
        {slide.kind === "poules" && (
          <div className="grid h-full grid-cols-2 grid-rows-3 gap-[0.8em]">
            {tables.slice(slide.page * POULES_PER_SLIDE, (slide.page + 1) * POULES_PER_SLIDE).map(({ poule, rows }) => (
              <section key={poule.id} className="flex min-h-0 flex-col overflow-hidden rounded-[1.1em] border border-rule bg-surface shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                <div className="flex items-baseline justify-between gap-[0.6em] border-b border-rule px-[1.2em] pb-[0.3em] pt-[0.4em]">
                  <h2 className="text-[1.3em] font-semibold">Poule {pouleLetter(poule)}</h2>
                  {trackOf.get(poule.id) && <span className="text-[1.1em] text-ink-2">baan {trackOf.get(poule.id)}</span>}
                </div>
                <div className="flex flex-1 flex-col justify-around py-[0.15em]">
                  <div className="grid grid-cols-[0.35em_1.4em_minmax(0,1fr)_2em_4.4em_3.4em_3em_2.6em] items-center gap-[0.45em] pr-[1em] text-[1.25em] text-ink-2" aria-hidden="true">
                    <span /><span /><span />
                    <span className="text-right text-[0.6em] font-medium">G</span>
                    <span className="text-right text-[0.6em] font-medium">Gescoord</span>
                    <span className="text-right text-[0.6em] font-medium">Tegen</span>
                    <span className="text-right text-[0.6em] font-medium">+/-</span>
                    <span className="text-right text-[0.6em] font-medium">Pnt</span>
                  </div>
                  {[...rows].sort(comparePouleRank).map((t, i) => {
                    const r = rankById.get(t.id);
                    const bar = i < advancing ? "bg-pink" : r?.kind === "nth" ? "bg-ink/40" : "bg-transparent";
                    return (
                      <div key={t.id} className="grid grid-cols-[0.35em_1.4em_minmax(0,1fr)_2em_4.4em_3.4em_3em_2.6em] items-center gap-[0.45em] pr-[1em] text-[1.25em] tabular-nums">
                        <span className={`h-[1.2em] rounded-r ${bar}`} />
                        <span className="font-semibold text-ink-2">{i + 1}</span>
                        <span className={`flex min-w-0 items-center gap-[0.4em] ${i < advancing ? "font-semibold" : ""}`}>
                          <span className="truncate">{t.name}</span>
                          {tiedIds.has(t.id) && (
                            <span className="shrink-0 rounded-full border border-pink/50 bg-pink-soft px-[0.55em] text-[0.6em] font-semibold leading-[1.6] text-pink-ink">bal gooien</span>
                          )}
                        </span>
                        <span className="text-right text-ink-2">{t.played}</span>
                        <span className="text-right text-ink-2">{t.goalsFor}</span>
                        <span className="text-right text-ink-2">{t.goalsAgainst}</span>
                        <span className="text-right text-ink-2">{t.saldo > 0 ? "+" : ""}{t.saldo}</span>
                        <span className="text-right font-bold">{t.points}</span>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
        {slide.kind === "bracket" && (
          <div className="flex h-full flex-col justify-center">
            <MirroredBracket matches={ko} nameOf={nameOf} year={year} projected={!hasKO} minimal rowEm={5.4} swapped={swapped} />
          </div>
        )}
      </main>

      {/* Bal gooien: popup over het scherm, de rest vervaagd erachter. */}
      {showTies && ties.length > 0 && (
        <div role="alertdialog" aria-labelledby="tie-title" className="absolute inset-0 z-50 flex items-center justify-center bg-ink/25 backdrop-blur-[6px]">
          <div
            className={`t-rise max-h-[90vh] overflow-hidden rounded-[1.6em] border-[0.15em] border-ink bg-surface px-[2.6em] pb-[2.2em] pt-[2em] shadow-[0.5em_0.5em_0_var(--ink)] ${
              ties.length > 2 ? "w-[min(72em,92vw)]" : "w-[min(46em,86vw)]"
            }`}
          >
            <p className="text-[1.2em] font-semibold text-pink-ink">Bal gooien</p>
            <h2 id="tie-title" className="mt-[0.3em] text-[2.6em] font-black leading-[1.05] tracking-[-0.02em]">
              {ties.length === 1 ? `${ties[0].label}: volledig gelijk` : "Volledig gelijke standen"}
            </h2>
            {ties.some((t) => t.kind === "ranking") && (
              <p className="mt-[0.4em] text-[1.25em] text-ink-2">
                {ties.length === 1 ? "Dit bepaalt hun plaats in de knock-out." : "Tussen poules bepaalt dit de plaats in de knock-out."}
              </p>
            )}
            <div className={`mt-[1.2em] grid gap-x-[2em] gap-y-[1em] ${ties.length > 2 ? "grid-cols-2" : "grid-cols-1"}`}>
              {ties.map((t) => (
                <div key={t.key}>
                  {ties.length > 1 && <p className="mb-[0.35em] text-[1.15em] font-bold text-ink-2">{t.label}</p>}
                  <ul className="flex flex-wrap gap-[0.5em]">
                    {t.teams.map((x) => (
                      <li key={x.id} className={`rounded-[0.6em] border-[0.1em] border-ink px-[0.7em] py-[0.3em] font-bold ${chipSize}`}>{x.name}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <p className="mt-[1.4em] text-[1.4em] leading-snug text-ink-2">
              Eén speler per ploeg komt naar de wedstrijdtafel en gooit één bal. Wie het dichtst bij het cochonnet ligt, gaat voor.
            </p>
          </div>
        </div>
      )}

      {/* Voet: legende + tijdbalk */}
      {(slide.kind !== "courts" || paused) && (
      <footer className="flex items-center gap-[1.5em] px-[1.6em] pb-[0.6em] text-[0.95em] text-ink-2">
        {slide.kind === "poules" && (
          <>
            <span className="inline-flex items-center gap-[0.5em]"><span className="h-[1em] w-[0.3em] rounded bg-pink" /> top {advancing} door</span>
            {bestNths > 0 && <span className="inline-flex items-center gap-[0.5em]"><span className="h-[1em] w-[0.3em] rounded bg-ink/40" /> bij de {bestNths} beste {advancing + 1}des</span>}
            {ties.length > 0 && <span><span className="rounded-full border border-pink/50 bg-pink-soft px-[0.55em] font-semibold text-pink-ink">bal gooien</span> = volledig gelijk, beslist met één bal</span>}
          </>
        )}
        {slide.kind === "bracket" && swapped.size > 0 && (
          <span><span className="inline-flex h-[1.4em] w-[1.4em] items-center justify-center rounded-full bg-ink font-bold text-paper">⇄</span> = tegenstander gewisseld, zodat poulegenoten elkaar niet meteen treffen</span>
        )}
        {paused && <span className="font-semibold text-pink-ink">Gepauzeerd (spatie)</span>}
      </footer>
      )}
      {!paused && (
        <div className="h-[0.3em] bg-rule">
          <div key={`${idx}-${tick}`} className="h-full bg-pink" style={{ animation: `tv-progress ${SLIDE_MS}ms linear both` }} />
        </div>
      )}
      <style>{`@keyframes tv-progress{from{width:0}to{width:100%}}`}</style>
    </div>
  );
}

// ── Op de banen ───────────────────────────────────────────────────────────────

/**
 * Eén rij per baan: wat er nu speelt (groot) en wat daarna komt (klein).
 * Rijen vullen het scherm gelijk op, zodat er geen lege kaarten staan.
 */
function Courts({
  matches, nameOf, pouleOf, now, page,
}: Readonly<{ matches: TournamentMatch[]; nameOf: Map<number, string>; pouleOf: Map<number, string>; now: number; page: number }>) {
  const allTracks = [...new Set(matches.map((m) => m.track).filter((t): t is number => t !== null))].sort((a, b) => a - b);
  const tracks = allTracks.slice(page * COURTS_PER_SLIDE, (page + 1) * COURTS_PER_SLIDE);
  const sorted = [...matches].filter((m) => m.scheduledAt).sort((a, b) => a.scheduledAt!.localeCompare(b.scheduledAt!));
  const name = (id: number | null) => (id ? nameOf.get(id) ?? "?" : "Nog te bepalen");
  const what = (m: TournamentMatch) =>
    m.phase === "GROUP_STAGE" ? (m.pouleId ? `Poule ${pouleOf.get(m.pouleId) ?? ""}` : "Poule") : KO_SHORT[m.phase] ?? "";
  if (tracks.length === 0) {
    return <p className="flex h-full items-center justify-center text-[2em] text-ink-2">Het schema volgt nog.</p>;
  }
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[1.1em] border border-rule bg-surface">
      <div className="grid grid-cols-[6.5em_minmax(0,1.5fr)_minmax(0,1fr)] border-b border-rule text-[0.95em] text-ink-2">
        <span className="px-[1.2em] py-[0.5em]">Baan</span>
        <span className="px-[1.2em] py-[0.5em]">Nu</span>
        <span className="border-l border-rule px-[1.2em] py-[0.5em]">Daarna</span>
      </div>
      <div className="grid min-h-0 flex-1" style={{ gridTemplateRows: `repeat(${tracks.length}, minmax(0, 1fr))` }}>
        {tracks.map((t) => {
          const own = sorted.filter((m) => m.track === t);
          const cur = own.find((m) => matchStatus(m, now) === "live") ?? own.find((m) => matchStatus(m, now) === "next");
          const after = own.filter((m) => m !== cur && matchStatus(m, now) === "next").slice(0, 2);
          const live = !!cur && matchStatus(cur, now) === "live";
          return (
            <div key={t} className="grid min-h-0 grid-cols-[6.5em_minmax(0,1.5fr)_minmax(0,1fr)] border-b border-rule last:border-b-0">
              <div className="flex items-center justify-center">
                <span className="text-[2.2em] font-medium leading-none text-ink-2 tabular-nums">{t}</span>
              </div>

              {/* Nu */}
              {cur ? (
                <div className="flex min-w-0 flex-col justify-center gap-[0.15em] px-[1.2em]">
                  <span className="flex items-center gap-[0.5em] text-[1em] text-ink-2">
                    {live ? <span>bezig</span> : <span className="tabular-nums">{fmtTime(cur.scheduledAt)}</span>}
                    <span>·</span>
                    <span>{what(cur)}</span>
                  </span>
                  <span className="flex min-w-0 items-baseline gap-[0.5em] text-[1.7em] font-medium leading-tight">
                    <span className="truncate">{name(cur.teamAId)}</span>
                    <span className="shrink-0 text-[0.55em] font-normal text-ink-2">tegen</span>
                    <span className="truncate">{name(cur.teamBId)}</span>
                  </span>
                </div>
              ) : (
                <div className="flex items-center px-[1.2em] text-[1.3em] text-ink-2">Geen wedstrijden meer</div>
              )}

              {/* Daarna */}
              <div className="flex min-w-0 flex-col justify-center gap-[0.35em] border-l border-rule px-[1.2em]">
                {after.length === 0 ? (
                  <span className="text-[1.05em] text-ink-2">—</span>
                ) : (
                  after.map((m) => (
                    <span key={m.id} className="flex min-w-0 items-baseline gap-[0.6em] text-[1.1em]">
                      <span className="shrink-0 tabular-nums text-ink-2">{fmtTime(m.scheduledAt)}</span>
                      <span className="truncate">{name(m.teamAId)} <span className="text-ink-2">–</span> {name(m.teamBId)}</span>
                    </span>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
