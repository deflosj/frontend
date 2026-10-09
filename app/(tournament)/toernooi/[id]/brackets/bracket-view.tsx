"use client";

import { useMemo, useState } from "react";

import { KO_ROUNDS, bracketSize, feederLabels, posNumber, useAutoRefresh } from "@/lib/tournament-live";
import type { Phase, TournamentMatch, TournamentTeam } from "@/lib/tournament-types";
import { fmtTime } from "@/utils/DateHelpers";
import { IconTrophy } from "@/components/ui/icons/IconTrophy";
import { PageHead } from "../_shared";
import { IconArrow, TeamSearch, useAnimKey } from "../_filters";

interface Props {
  matches: TournamentMatch[];
  teams: TournamentTeam[];
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

export function BracketView({ matches, teams, year, isActive }: Readonly<Props>) {
  useAutoRefresh(isActive);
  const [q, setQ] = useState("");
  const [teamId, setTeamId] = useState<number | null>(null);

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

  // Desktop: vanaf welke ronde
  const [fromIdx, setFromIdx] = useState(0);
  const vis = rounds.slice(Math.min(fromIdx, Math.max(rounds.length - 1, 0)));
  const N = vis[0]?.n ?? 1;
  const rowH = N >= 16 ? 78 : N >= 8 ? 120 : N >= 4 ? 170 : 220;

  // Gsm: één ronde tegelijk
  const [mRound, setMRound] = useState(0);
  const [dir, setDir] = useState<"r" | "l">("r");
  const animKey = useAnimKey([fromIdx, teamId]);
  const mKey = useAnimKey([mRound, teamId]);

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
        <span className={`min-w-0 flex-1 truncate ${big ? "text-[0.95rem]" : "text-[0.9375rem] md:text-[0.8125rem]"} ${sideCls(id, s)} ${id ? "group-hover:underline group-hover:underline-offset-2" : ""}`}>{name}</span>
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

  const mr = rounds[Math.min(mRound, rounds.length - 1)];
  const nextR = rounds[Math.min(mRound, rounds.length - 1) + 1];

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

      {!anyTeams && (
        <div className="flex items-start gap-3 rounded-2xl border border-rule bg-surface px-4 py-3.5 text-sm leading-relaxed">
          <span>
            <strong>De loting volgt na de laatste poulematch.</strong> Tot dan zie je welke plaats uit de ranking tegen welke speelt:
            1 tegen {size}, 2 tegen {size - 1}, …
          </span>
        </div>
      )}

      <section aria-label="Volg een team" className="flex flex-col gap-2.5 md:flex-row md:items-start">
        <div className="min-w-0 flex-1">
          <TeamSearch
            options={teamOptions}
            selected={teamId ? { id: teamId, name: nameOf.get(teamId) ?? "" } : null}
            onSelect={(id) => (id === null ? setTeamId(null) : pick(id))}
            query={q}
            onQuery={setQ}
            selectedPrefix="Volgt"
            disabled={!anyTeams}
            placeholder={anyTeams ? "Volg een team door de bracket…" : "Beschikbaar na de loting"}
          />
        </div>
        {rounds.length > 2 && (
          <div role="group" aria-label="Vanaf ronde" className="hidden h-11 items-center gap-0.5 rounded-xl bg-ink/5 p-[3px] md:inline-flex">
            {rounds.slice(0, Math.max(1, rounds.length - 2)).map((r, i) => (
              <button
                key={r.phase}
                type="button"
                aria-pressed={fromIdx === i}
                onClick={() => setFromIdx(i)}
                className={`t-press h-[38px] rounded-[9px] px-4 text-[0.8125rem] font-semibold ${fromIdx === i ? "bg-surface text-ink shadow-sm" : "text-ink-2 hover:text-ink"}`}
              >
                Vanaf {r.short}
              </button>
            ))}
          </div>
        )}
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

      {/* ── Laptop: volledige boom ─────────────────────────── */}
      <div className="hidden overflow-x-auto pb-2 md:block">
        <div
          key={animKey}
          className="grid min-w-[980px] gap-x-8"
          style={{ gridTemplateColumns: `repeat(${vis.length}, minmax(180px, 1fr))`, gridTemplateRows: `auto repeat(${N}, ${rowH}px)` }}
        >
          {vis.map((r, ci) => {
            const own = matches.filter((m) => m.phase === r.phase && m.scheduledAt).map((m) => m.scheduledAt!).sort();
            const t = own.length ? `${fmtTime(own[0])}${own.at(-1) !== own[0] ? `–${fmtTime(own.at(-1)!)}` : ""}` : "";
            return (
              <div key={r.phase} className="t-col-in flex flex-col gap-0.5 pb-3" style={{ gridColumn: ci + 1, gridRow: 1, animationDelay: `${ci * 70}ms` }}>
                <span className="text-sm font-extrabold">{r.label}</span>
                <span className="text-xs text-ink-2">{t}</span>
              </div>
            );
          })}
          {vis.flatMap((r, ci) => {
            const span = N / r.n;
            const isFinal = r.phase === "FINAL";
            return Array.from({ length: r.n }, (_, k) => {
              const i = k + 1;
              const s = slot(posFor(r.prefix, i));
              const mine = !!teamId && (s.m?.teamAId === teamId || s.m?.teamBId === teamId);
              const cls = [
                "t-bcell t-col-in",
                ci < vis.length - 1 ? `c-out ${i % 2 === 1 ? "top" : "bot"}` : "",
                ci > 0 ? "c-in" : "",
                mine && s.winner === teamId && !isFinal ? "out-hot" : "",
                mine && ci > 0 ? "in-hot" : "",
              ].join(" ");
              const cf = isFinal ? slot("CF1") : null;
              return (
                <div key={s.pos} className={cls} style={{ gridColumn: ci + 1, gridRow: `${2 + (i - 1) * span} / span ${span}`, animationDelay: `${ci * 70}ms` }}>
                  {isFinal && (
                    <span className="absolute inset-x-0 bottom-[calc(50%+52px)] text-center text-[0.68rem] font-extrabold uppercase tracking-wider text-pink-ink">
                      Finale{s.m?.scheduledAt ? ` · ${fmtTime(s.m.scheduledAt)}` : ""}
                    </span>
                  )}
                  {renderCard({ s, big: isFinal })}
                  {cf?.m && (
                    <div className="absolute inset-x-0 top-[calc(50%+64px)] flex flex-col gap-2">
                      <span className="text-center text-[0.68rem] font-extrabold uppercase tracking-wider text-ink-2">
                        Kleine finale{cf.m.scheduledAt ? ` · ${fmtTime(cf.m.scheduledAt)}` : ""}
                      </span>
                      {renderCard({ s: cf, dashed: true })}
                    </div>
                  )}
                </div>
              );
            });
          })}
        </div>
      </div>

      {/* ── Gsm: één ronde tegelijk, of het parcours van je team ─ */}
      <div className="md:hidden">
        {!teamId ? (
          <>
            <div role="group" aria-label="Ronde" className="-mx-5 mb-4 flex gap-1.5 overflow-x-auto px-5 [scrollbar-width:none] sm:-mx-8 sm:px-8">
              {rounds.map((r, i) => (
                <button
                  key={r.phase}
                  type="button"
                  aria-pressed={mRound === i}
                  onClick={() => {
                    setDir(i >= mRound ? "r" : "l");
                    setMRound(i);
                  }}
                  className={`t-press inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold ${mRound === i ? "border-ink bg-ink text-paper" : "border-rule bg-surface"}`}
                >
                  {r.short}
                  {r.phase !== "FINAL" && <span className="font-medium opacity-65">{r.n}</span>}
                </button>
              ))}
            </div>
            {mr && (
              <div key={mKey} className="flex flex-col gap-3.5">
                <h2 className="text-[1.05rem] font-extrabold">{mr.phase === "FINAL" ? "Finales" : mr.label}</h2>
                {mr.phase === "FINAL" ? (
                  <div className={`${dir === "r" ? "t-in-r" : "t-in-l"} flex flex-col gap-3`}>
                    {renderCard({ s: slot("F1"), big: true })}
                    {byPos.get("CF1") && (
                      <>
                        <span className="text-xs font-bold uppercase tracking-wider text-ink-2">Kleine finale</span>
                        {renderCard({ s: slot("CF1"), dashed: true })}
                      </>
                    )}
                  </div>
                ) : (
                  Array.from({ length: Math.ceil(mr.n / 2) }, (_, k) => {
                    const i = k * 2 + 1;
                    const a = slot(posFor(mr.prefix, i));
                    const b = i + 1 <= mr.n ? slot(posFor(mr.prefix, i + 1)) : null;
                    const nextName = nextR ? (nextR.phase === "FINAL" ? "de finale" : `${nextR.label.replace(/s$/, "").toLowerCase()} ${k + 1}`) : "";
                    return (
                      <div key={i} className={`${dir === "r" ? "t-in-r" : "t-in-l"} flex flex-col gap-1.5`} style={{ animationDelay: `${Math.min(k, 6) * 45}ms` }}>
                        <div className="flex items-stretch gap-2.5">
                          <div className="flex min-w-0 flex-1 flex-col gap-2">
                            {renderCard({ s: a })}
                            {b && renderCard({ s: b })}
                          </div>
                          {b && <div className="my-[30px] w-3.5 rounded-r-lg border-2 border-l-0 border-rule" />}
                        </div>
                        {nextR && (
                          <span className="flex items-center gap-1.5 pl-0.5 text-xs font-semibold text-ink-2">
                            <IconArrow />
                            {mr.phase === "SEMI_FINAL" ? "Winnaars naar de finale, verliezers naar de kleine finale" : `Winnaars spelen de ${nextName}`}
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
                {nextR && (
                  <button
                    type="button"
                    onClick={() => {
                      setDir("r");
                      setMRound(mRound + 1);
                    }}
                    className="t-press mt-1 flex h-[52px] items-center justify-center gap-2 rounded-2xl border border-rule bg-surface text-sm font-semibold"
                  >
                    Verder naar {nextR.phase === "FINAL" ? "de finale" : nextR.label.toLowerCase()} <IconArrow />
                  </button>
                )}
              </div>
            )}
          </>
        ) : (
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
        )}
      </div>

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
