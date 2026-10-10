"use client";

import { useEffect, useMemo, useState } from "react";

import {
  compareStanding,
  isKnockout,
  isPlayed,
  matchStatus,
  pouleLetter,
  pouleTables,
  pouleTracks,
  knockoutScheduleFor,
  projectedKnockout,
  rankTeams,
  useAutoRefresh,
  useNow,
} from "@/lib/tournament-live";
import type { ActiveTournament, TournamentMatch } from "@/lib/tournament-types";
import { fmtTime } from "@/utils/DateHelpers";
import { MirroredBracket } from "@/app/(tournament)/toernooi/[id]/brackets/ko-bracket";

const SLIDE_MS = 15_000;
const POULES_PER_SLIDE = 6;

type Slide =
  | { kind: "courts" }
  | { kind: "poules"; page: number; pages: number }
  | { kind: "bracket" };


export function TvScreen({ tournament }: Readonly<{ tournament: ActiveTournament }>) {
  // Vaker verversen dan de gewone pagina's: op de tv kijkt niemand op "vernieuwen".
  useAutoRefresh(true, 30_000);
  const now = useNow(10_000);
  const { name, year, teams, poules, matches } = tournament;
  const advancing = tournament.teamsAdvancingPerPoule ?? 2;
  const bestNths = tournament.bestNthsAdvancing ?? 0;

  const nameOf = useMemo(() => new Map(teams.map((t) => [t.id, t.name])), [teams]);
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

  // Welke dia's er zijn hangt af van het moment.
  const slides: Slide[] = useMemo(() => {
    const out: Slide[] = [{ kind: "courts" }];
    const pages = Math.ceil(tables.length / POULES_PER_SLIDE);
    if (tables.length && (groupLeft || !hasKO)) for (let p = 0; p < pages; p++) out.push({ kind: "poules", page: p, pages });
    if (ko.length) out.push({ kind: "bracket" });
    if (tables.length && hasKO && !groupLeft) for (let p = 0; p < pages; p++) out.push({ kind: "poules", page: p, pages });
    return out;
  }, [tables.length, groupLeft, hasKO, ko.length]);

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

  const slide = slides[Math.min(idx, slides.length - 1)];
  const clock = new Date(now).toLocaleTimeString("nl-BE", { hour: "2-digit", minute: "2-digit" });
  const liveCount = matches.filter((m) => matchStatus(m, now) === "live").length;
  const title =
    slide.kind === "courts" ? "Op de banen"
    : slide.kind === "poules" ? `Standen${slide.pages > 1 ? ` ${slide.page + 1}/${slide.pages}` : ""}`
    : hasKO ? "Finales" : "Finales: als het nu stopt";

  return (
    <div className="dark fixed inset-0 flex flex-col overflow-hidden bg-paper text-ink [font-size:clamp(12px,1.05vw,26px)]">
      {/* Kop */}
      <header className="flex items-center gap-[1.5em] border-b border-rule px-[2em] py-[0.9em]">
        <div className="flex min-w-0 flex-col">
          <span className="text-[0.95em] font-medium text-ink-2">{name} {year}</span>
          <h1 className="text-[2.1em] font-semibold leading-tight tracking-[-0.02em]">{title}</h1>
        </div>
        <div className="ml-auto flex items-center gap-[1.4em]">
          {liveCount > 0 && (
            <span className="inline-flex items-center gap-[0.5em] rounded-full bg-pink-soft px-[0.9em] py-[0.35em] text-[1em] font-semibold text-pink-ink">
              <span className="t-live-dot" /> {liveCount} bezig
            </span>
          )}
          <div className="flex gap-[0.4em]" aria-hidden="true">
            {slides.map((_, i) => (
              <span key={i} className={`h-[0.5em] rounded-full transition-all duration-300 ${i === idx ? "w-[1.6em] bg-pink" : "w-[0.5em] bg-rule"}`} />
            ))}
          </div>
          <span className="text-[2.1em] font-semibold tabular-nums">{clock}</span>
        </div>
      </header>

      {/* Dia */}
      <main key={`${idx}-${tick}`} className="t-rise min-h-0 flex-1 px-[2em] py-[1.4em]">
        {slide.kind === "courts" && <Courts matches={matches} nameOf={nameOf} now={now} />}
        {slide.kind === "poules" && (
          <div className="grid h-full grid-cols-3 grid-rows-2 gap-[1em]">
            {tables.slice(slide.page * POULES_PER_SLIDE, (slide.page + 1) * POULES_PER_SLIDE).map(({ poule, rows }) => (
              <section key={poule.id} className="flex min-h-0 flex-col overflow-hidden rounded-[1em] border border-rule bg-surface">
                <div className="flex items-baseline gap-[0.6em] px-[1em] pb-[0.3em] pt-[0.8em]">
                  <h2 className="text-[1.45em] font-semibold">Poule {pouleLetter(poule)}</h2>
                  {trackOf.get(poule.id) && <span className="text-[1em] text-ink-2">baan {trackOf.get(poule.id)}</span>}
                </div>
                <div className="flex flex-1 flex-col justify-around pb-[0.4em]">
                  {[...rows].sort(compareStanding).map((t, i) => {
                    const r = rankById.get(t.id);
                    const bar = i < advancing ? "bg-pink" : r?.kind === "nth" ? "bg-ink/40" : "bg-transparent";
                    return (
                      <div key={t.id} className="grid grid-cols-[0.35em_2em_minmax(0,1fr)_2.2em_3.2em_2.6em] items-center gap-[0.5em] pr-[1em] text-[1.25em] tabular-nums">
                        <span className={`h-[1.2em] rounded-r ${bar}`} />
                        <span className="font-semibold text-ink-2">{i + 1}</span>
                        <span className={`truncate ${i < advancing ? "font-semibold" : ""}`}>{t.name}</span>
                        <span className="text-right text-ink-2">{t.played}</span>
                        <span className="text-right text-ink-2">{t.saldo > 0 ? "+" : ""}{t.saldo}</span>
                        <span className="text-right font-semibold">{t.points}</span>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
        {slide.kind === "bracket" && (
          <div className="flex h-full flex-col justify-center gap-[0.5em]">
            {!hasKO && <p className="text-[1em] text-ink-2">Voorlopig: zo zou de knock-out eruitzien als de poules nu stoppen.</p>}
            <MirroredBracket matches={ko} nameOf={nameOf} year={year} projected={!hasKO} rowEm={4.7} />
          </div>
        )}
      </main>

      {/* Voet: legende + tijdbalk */}
      <footer className="flex items-center gap-[1.5em] px-[2em] pb-[0.9em] text-[0.95em] text-ink-2">
        {slide.kind === "poules" && (
          <>
            <span className="inline-flex items-center gap-[0.5em]"><span className="h-[1em] w-[0.3em] rounded bg-pink" /> top {advancing} door</span>
            {bestNths > 0 && <span className="inline-flex items-center gap-[0.5em]"><span className="h-[1em] w-[0.3em] rounded bg-ink/40" /> bij de {bestNths} beste {advancing + 1}des</span>}
            <span>G = gespeeld · winst 2, gelijk 1</span>
          </>
        )}
        {paused && <span className="font-semibold text-pink-ink">Gepauzeerd (spatie)</span>}
        <span className="ml-auto">← → wisselen · spatie pauze · F volledig scherm</span>
      </footer>
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

function Courts({ matches, nameOf, now }: Readonly<{ matches: TournamentMatch[]; nameOf: Map<number, string>; now: number }>) {
  const tracks = [...new Set(matches.map((m) => m.track).filter((t): t is number => t !== null))].sort((a, b) => a - b);
  const sorted = [...matches].filter((m) => m.scheduledAt).sort((a, b) => a.scheduledAt!.localeCompare(b.scheduledAt!));
  const name = (id: number | null) => (id ? nameOf.get(id) ?? "?" : "Nog te bepalen");
  if (tracks.length === 0) {
    return <p className="flex h-full items-center justify-center text-[2em] text-ink-2">Het schema volgt nog.</p>;
  }
  return (
    <div className="grid h-full gap-[1em]" style={{ gridTemplateColumns: `repeat(${Math.min(tracks.length, 6)}, minmax(0, 1fr))` }}>
      {tracks.map((t) => {
        const own = sorted.filter((m) => m.track === t);
        const cur = own.find((m) => matchStatus(m, now) === "live") ?? own.find((m) => matchStatus(m, now) === "next");
        const after = own.filter((m) => m !== cur && matchStatus(m, now) === "next").slice(0, 2);
        const live = cur && matchStatus(cur, now) === "live";
        return (
          <section key={t} className={`flex min-h-0 flex-col rounded-[1em] border bg-surface ${live ? "border-pink" : "border-rule"}`}>
            <div className="flex items-center justify-between px-[1em] pt-[0.9em]">
              <h2 className="text-[1.6em] font-semibold">Baan {t}</h2>
              {live && <span className="inline-flex items-center gap-[0.4em] text-[1em] font-semibold text-pink-ink"><span className="t-live-dot" /> bezig</span>}
            </div>
            {cur ? (
              <div className="flex flex-1 flex-col justify-center gap-[0.5em] px-[1em]">
                <span className="text-[1em] text-ink-2">{live ? `Sinds ${fmtTime(cur.scheduledAt)}` : `Om ${fmtTime(cur.scheduledAt)}`}</span>
                <span className="text-[1.7em] font-semibold leading-tight">{name(cur.teamAId)}</span>
                <span className="text-[1em] font-medium text-ink-2">tegen</span>
                <span className="text-[1.7em] font-semibold leading-tight">{name(cur.teamBId)}</span>
              </div>
            ) : (
              <p className="flex flex-1 items-center px-[1em] text-[1.3em] text-ink-2">Geen wedstrijden meer</p>
            )}
            {after.length > 0 && (
              <div className="flex flex-col gap-[0.5em] border-t border-rule px-[1em] py-[0.8em]">
                {after.map((m) => (
                  <div key={m.id} className="flex flex-col text-[1.05em] leading-snug">
                    <span className="font-semibold tabular-nums text-ink-2">{fmtTime(m.scheduledAt)}</span>
                    <span className="truncate">{name(m.teamAId)}</span>
                    <span className="truncate">{name(m.teamBId)}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
