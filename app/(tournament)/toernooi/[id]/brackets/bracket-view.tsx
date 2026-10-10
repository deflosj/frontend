"use client";

import { useMemo, useState } from "react";

import { KO_ROUNDS, bracketSize, feederLabels, isKnockout, knockoutScheduleFor, posNumber, projectedKnockout, useAutoRefresh } from "@/lib/tournament-live";
import type { Phase, TournamentMatch, TournamentPoule, TournamentTeam } from "@/lib/tournament-types";
import { fmtTime } from "@/utils/DateHelpers";
import { IconTrophy } from "@/components/ui/icons/IconTrophy";
import { PageHead } from "../_shared";
import { IconArrow, Segmented, TeamSearch, useAnimKey, usePersisted } from "../_filters";
import { FollowStar, StarMark, useFollowed } from "../_follow";
import { ForwardBracket, MirroredBracket } from "./ko-bracket";

interface Props {
  matches: TournamentMatch[];
  teams: TournamentTeam[];
  poules: TournamentPoule[];
  advancingPerPoule: number;
  bestNths: number;
  /** Instellingen van het toernooi voor de uren van de voorlopige bracket. */
  ko?: {
    trackCount?: number;
    knockoutPauseMinutes?: number;
    knockoutSlotMinutes?: number | null;
    finalsSlotMinutes?: number;
    roundBreakMinutes?: number;
    withConsolation?: boolean;
  };
  year: number;
  isActive: boolean;
}

interface Slot {
  m: TournamentMatch | undefined;
  pos: string;
  a: string;
  b: string;
  winner: number | null;
}

const winnerOf = (m: TournamentMatch | undefined): number | null => {
  if (!m) return null;
  if (m.winnerId) return m.winnerId;
  if (m.scoreA === null || m.scoreB === null || m.scoreA === m.scoreB) return null;
  return m.scoreA > m.scoreB ? m.teamAId : m.teamBId;
};

export function BracketView({ matches: allMatches, teams, poules, advancingPerPoule, bestNths, ko, year, isActive }: Readonly<Props>) {
  useAutoRefresh(isActive);
  const [q, setQ] = useState("");
  const [teamId, setTeamId] = useState<number | null>(null);
  const [mode, setMode] = usePersisted<"bracket" | "list">("finales", "mode", "bracket");
  const followed = useFollowed();

  // Nog geen knock-out gegenereerd? Dan tonen we de bracket "als de poules nu stoppen".
  const projected = !allMatches.some((m) => isKnockout(m.phase) && m.phase !== ("TIEBREAK" as Phase));
  const matches = useMemo(
    () =>
      projected
        ? projectedKnockout(poules, teams, advancingPerPoule, bestNths, ko?.withConsolation ?? true, knockoutScheduleFor({ matches: allMatches, ...ko }))
        : allMatches,
    [projected, poules, teams, advancingPerPoule, bestNths, allMatches, ko]
  );

  const size = bracketSize(matches);
  const nameOf = useMemo(() => new Map(teams.map((t) => [t.id, t.name])), [teams]);
  const byPos = useMemo(() => new Map(matches.filter((m) => m.bracketPos).map((m) => [m.bracketPos!, m])), [matches]);

  // Rondes die bestaan, groot → klein. Aantal plekken volgt uit de bracketgrootte.
  const rounds = KO_ROUNDS.filter((r) => matches.some((m) => m.phase === r.phase)).map((r) => {
    const own = matches.filter((m) => m.phase === r.phase);
    const n = r.phase === "FINAL" ? 1 : Math.max(...own.map((m) => posNumber(m.bracketPos)), own.length);
    return { ...r, n };
  });

  const slot = (pos: string): Slot => {
    const m = byPos.get(pos);
    const [fa, fb] = feederLabels(pos, size);
    return {
      m,
      pos,
      a: m?.teamAId ? nameOf.get(m.teamAId) ?? "?" : fa,
      b: m?.teamBId ? nameOf.get(m.teamBId) ?? "?" : fb,
      winner: winnerOf(m),
    };
  };
  const posFor = (prefix: string, i: number) => (prefix === "F" ? "F1" : `${prefix}${i}`);

  const final = byPos.get("F1");
  const champId = winnerOf(final);
  const anyTeams = matches.some((m) => m.teamAId || m.teamBId);
  const tiebreaks = matches.filter((m) => m.phase === ("TIEBREAK" as Phase));

  const animKey = useAnimKey([teamId]);
  const mKey = useAnimKey([teamId]);

  // Parcours van het gevolgde team
  const path = useMemo(() => {
    if (!teamId) return [];
    const out: { label: string; round: string; m: TournamentMatch; won: boolean; verdict: string }[] = [];
    for (const r of rounds) {
      for (let i = 1; i <= r.n; i++) {
        const s = slot(posFor(r.prefix, i));
        if (!s.m || (s.m.teamAId !== teamId && s.m.teamBId !== teamId)) continue;
        const won = s.winner === teamId;
        const opp = s.m.teamAId === teamId ? s.b : s.a;
        const score = s.m.scoreA === null ? "" : s.m.teamAId === teamId ? ` (${s.m.scoreA}–${s.m.scoreB})` : ` (${s.m.scoreB}–${s.m.scoreA})`;
        const playedM = s.winner !== null;
        out.push({
          label: `${r.short}: ${playedM ? (won ? "wint van" : "verliest van") : "tegen"} ${opp}${score}`,
          round: r.phase === "FINAL" ? "Finale" : r.label.replace(/s$/, "").replace("finale", "finale"),
          m: s.m,
          won,
          verdict: r.phase === "FINAL" ? (playedM ? (won ? `Winnaar ${year}` : "Verliezend finalist") : "Speelt de finale") : playedM ? (won ? "Door naar de volgende ronde" : "Uitgeschakeld") : "Nog te spelen",
        });
      }
    }
    const cf = byPos.get("CF1");
    if (cf && (cf.teamAId === teamId || cf.teamBId === teamId)) {
      const w = winnerOf(cf);
      out.push({ label: `Kleine finale${w ? `: ${w === teamId ? "3de" : "4de"} plaats` : ""}`, round: "Kleine finale", m: cf, won: w === teamId, verdict: w ? (w === teamId ? "3de plaats" : "4de plaats") : "Nog te spelen" });
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId, matches, teams]);

  const koTeamIds = new Set(matches.filter((m) => m.phase === rounds[0]?.phase).flatMap((m) => [m.teamAId, m.teamBId]).filter(Boolean));
  const teamOptions = teams
    .filter((t) => koTeamIds.has(t.id))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((t) => ({ id: t.id, name: t.name }));
  const pick = (id: number) => {
    setTeamId(id);
    setQ("");
  };

  const sideCls = (id: number | null, s: Slot) => {
    if (!id) return "font-medium italic text-ink-2";
    if (id === teamId) return "font-extrabold text-pink-ink";
    if (followed.has(id)) return s.winner && s.winner !== id ? "font-semibold text-pink-ink/60" : "font-bold text-pink-ink";
    if (s.winner && s.winner !== id) return "font-medium text-ink-2";
    return "font-semibold";
  };

  const renderCard = ({ s, big = false, dashed = false, key }: { s: Slot; big?: boolean; dashed?: boolean; key?: number | string }) => {
    const mine = !!teamId && (s.m?.teamAId === teamId || s.m?.teamBId === teamId);
    const row = (id: number | null, name: string, score: number | null | undefined) => (
      <button
        type="button"
        disabled={!id}
        onClick={() => id && pick(id)}
        className="group flex min-h-[30px] w-full items-center gap-2 text-left disabled:cursor-default md:min-h-[22px]"
      >
        <span className={`min-w-0 flex-1 truncate ${big ? "text-[0.95rem]" : "text-[0.9375rem] md:text-[0.8125rem]"} ${sideCls(id, s)} ${id ? "group-hover:underline group-hover:underline-offset-2" : ""}`}>{followed.has(id) && <StarMark />}{name}</span>
        <span className={`min-w-5 text-right font-bold tabular-nums ${big ? "text-base" : "text-base md:text-[0.8125rem]"} ${s.winner && s.winner !== id ? "font-medium text-ink-2" : ""}`}>
          {score ?? ""}
        </span>
      </button>
    );
    return (
      <div
        key={key}
        className={`t-press relative z-[2] flex w-full flex-col gap-0.5 rounded-2xl border px-3 py-2 md:rounded-xl ${dashed ? "border-dashed" : ""} ${
          mine ? "border-pink bg-pink-soft shadow-[inset_0_0_0_1px_var(--pink)]" : big ? "border-ink bg-surface shadow-lg" : "border-rule bg-surface"
        } ${teamId && !mine ? "opacity-35" : ""}`}
      >
        {!big && s.m && (
          <div className="flex gap-1 text-[0.65rem] font-semibold text-ink-2">
            <span>{s.pos.replace(/^R(32|16)-/, "#")}</span>
            {s.m.scheduledAt && <>·<span>{fmtTime(s.m.scheduledAt)}</span></>}
            {s.m.track !== null && <>·<span>baan {s.m.track}</span></>}
          </div>
        )}
        {row(s.m?.teamAId ?? null, s.a, s.m?.scoreA)}
        {row(s.m?.teamBId ?? null, s.b, s.m?.scoreB)}
      </div>
    );
  };


  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHead title="Knock-out" subtitle={`${size} teams · ${rounds.map((r) => r.short).join(" → ")}`} />
        {champId ? (
          <div className="t-pop flex items-center gap-3 rounded-full bg-pink-soft py-2 pl-2 pr-4" style={{ animationDelay: "300ms" }}>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-pink text-[#16161a]"><IconTrophy /></span>
            <span className="flex flex-col leading-tight">
              <span className="text-[0.7rem] font-bold text-pink-ink">Winnaar {year}</span>
              <span className="text-[0.95rem] font-extrabold">{nameOf.get(champId)}</span>
            </span>
          </div>
        ) : null}
      </div>

      {projected && (
        <div className="flex items-start gap-3 rounded-2xl border border-dashed border-pink bg-pink-soft/40 px-4 py-3.5 text-sm leading-relaxed">
          <span className="mt-1.5 shrink-0"><span className="t-live-dot" /></span>
          <span>
            <strong>Voorlopige bracket.</strong> Zo ziet de knock-out eruit als de poules nu zouden stoppen.
            Na elke poulematch kan het nog schuiven. Definitief na de laatste poulematch.
          </span>
        </div>
      )}

      <section aria-label="Zoek een team" className="flex flex-col gap-2.5 md:flex-row md:items-start">
        <div className="min-w-0 flex-1">
          <TeamSearch
            options={teamOptions}
            selected={teamId ? { id: teamId, name: nameOf.get(teamId) ?? "" } : null}
            onSelect={(id) => (id === null ? setTeamId(null) : pick(id))}
            query={q}
            onQuery={setQ}
            selectedAction={teamId ? <FollowStar teamId={teamId} name={nameOf.get(teamId) ?? ""} followed={followed} /> : null}
            disabled={!anyTeams}
            placeholder={anyTeams ? "Zoek een team in de bracket…" : "Beschikbaar na de loting"}
          />
        </div>
        <Segmented label="Weergave" value={mode} onChange={setMode} options={[{ key: "bracket", label: "Bracket" }, { key: "list", label: "Lijst" }]} />
      </section>

      {teamId && path.length > 0 && (
        <div key={`p${teamId}`} className="t-rise hidden flex-wrap items-center gap-2 text-[0.8125rem] md:flex">
          {path.map((p, i) => (
            <span key={i} className="contents">
              <span className={`inline-flex h-[30px] items-center rounded-full px-3 font-semibold ${p.won ? "bg-pink-soft text-pink-ink" : "bg-ink/10"}`}>{p.label}</span>
              {i < path.length - 1 && <span className="text-ink-2"><IconArrow /></span>}
            </span>
          ))}
          {champId === teamId && <span className="inline-flex h-[30px] items-center rounded-full bg-pink px-3 font-extrabold text-[#16161a]">Winnaar {year}</span>}
        </div>
      )}

      {/* ── Bracket op laptop: langs twee kanten naar de finale ─ */}
      {mode === "bracket" && (
        // Breder dan de gewone inhoud, zodat 32 namen naast elkaar passen.
        <div className="relative left-1/2 hidden w-[min(calc(100vw-48px),1680px)] -translate-x-1/2 overflow-x-auto pb-2 pt-12 md:block">
          <div key={animKey} className="min-w-[1180px] text-[clamp(13px,1.05vw,16px)]">
            <MirroredBracket
              matches={matches}
              nameOf={nameOf}
              year={year}
              teamId={teamId}
              isFollowed={followed.has}
              onPick={pick}
              projected={projected}
            />
          </div>
        </div>
      )}

      {/* ── Bracket op gsm: één richting, vanaf een gekozen ronde ─ */}
      {mode === "bracket" && (
        <div className="md:hidden">
          <ForwardBracket
            matches={matches}
            nameOf={nameOf}
            year={year}
            teamId={teamId}
            isFollowed={followed.has}
            onPick={pick}
            projected={projected}
          />
        </div>
      )}

      {/* ── Lijst: alle rondes onder elkaar, zoals bij wedstrijden ─ */}
      {mode === "list" && (
        <div className={`flex flex-col gap-7 ${teamId ? "hidden md:flex" : ""}`}>
          {rounds.map((r, ri) => {
            const own = matches.filter((m) => m.phase === r.phase && m.scheduledAt).map((m) => m.scheduledAt!).sort();
            const t = own.length ? `${fmtTime(own[0])}${own.at(-1) !== own[0] ? `–${fmtTime(own.at(-1)!)}` : ""}` : "";
            const slots = Array.from({ length: r.n }, (_, k) => slot(posFor(r.prefix, k + 1)));
            const cf = r.phase === "FINAL" && byPos.get("CF1") ? slot("CF1") : null;
            return (
              <section key={r.phase} className="t-rise flex flex-col gap-2.5" style={{ animationDelay: `${Math.min(ri, 5) * 50}ms` }}>
                <div className="flex items-baseline gap-2">
                  <h2 className="text-base font-extrabold">{r.phase === "FINAL" ? "Finale" : r.label}</h2>
                  {t && <span className="text-[0.8125rem] text-ink-2">{t}</span>}
                </div>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {slots.map((sl) => renderCard({ key: sl.pos, s: sl, big: r.phase === "FINAL" }))}
                </div>
                {cf && (
                  <>
                    <h3 className="pt-2 text-sm font-bold text-ink-2">Kleine finale</h3>
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{renderCard({ key: "CF1", s: cf, dashed: true })}</div>
                  </>
                )}
              </section>
            );
          })}
        </div>
      )}

      {/* ── Gsm, lijst, gekozen team: het parcours ─────────── */}
      {mode === "list" && teamId && (
        <div className="md:hidden">
          <div key={mKey} className="flex flex-col">
            <h2 className="mb-2.5 text-[1.05rem] font-extrabold">Parcours</h2>
            {path.length === 0 && (
              <p className="rounded-2xl border border-dashed border-rule px-4 py-6 text-center text-sm text-ink-2">Dit team speelt geen knock-out.</p>
            )}
            {path.map((p, i) => {
              const last = i === path.length - 1;
              const s: Slot = {
                m: p.m,
                pos: p.m.bracketPos ?? "",
                a: p.m.teamAId ? nameOf.get(p.m.teamAId) ?? "?" : "?",
                b: p.m.teamBId ? nameOf.get(p.m.teamBId) ?? "?" : "?",
                winner: winnerOf(p.m),
              };
              const gold = p.verdict.startsWith("Winnaar");
              return (
                <div key={i} className="t-rise flex gap-3" style={{ animationDelay: `${i * 70}ms` }}>
                  <div className="flex w-5 shrink-0 flex-col items-center">
                    <span className={`mt-4 h-3.5 w-3.5 shrink-0 rounded-full border-[3px] ${p.won || p.verdict === "Nog te spelen" || p.verdict === "Speelt de finale" ? "border-pink" : "border-rule"} ${gold ? "bg-pink" : "bg-surface"}`} />
                    {!last && <span className="mt-1 w-0.5 flex-1 bg-pink" />}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5 pb-3.5">
                    <span className="pt-3 text-xs font-bold text-ink-2">
                      {p.round}
                      {p.m.scheduledAt ? ` · ${fmtTime(p.m.scheduledAt)}` : ""}
                      {p.m.track !== null ? ` · baan ${p.m.track}` : ""}
                    </span>
                    {renderCard({ s: s })}
                    <span className="text-[0.8125rem] font-bold text-pink-ink">{p.verdict}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tiebreaks.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-ink-2">Tiebreak</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {tiebreaks.map((m) => (
              renderCard({ key: m.id, s: { m, pos: "", a: m.teamAId ? nameOf.get(m.teamAId) ?? "?" : "?", b: m.teamBId ? nameOf.get(m.teamBId) ?? "?" : "?", winner: winnerOf(m) } })
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
