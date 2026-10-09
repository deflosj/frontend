"use client";

import { useMemo, useState } from "react";

import {
  KO_SHORT,
  bracketSize,
  compareStanding,
  feederLabels,
  isKnockout,
  matchStatus,
  pouleLetter,
  useAutoRefresh,
  useNow,
  type MatchStatus,
} from "@/lib/tournament-live";
import type { TournamentMatch, TournamentPoule, TournamentTeam } from "@/lib/tournament-types";
import { fmtTime } from "@/utils/DateHelpers";
import { PageHead } from "../_shared";
import {
  Chip,
  Count,
  FilterButton,
  FilterPanel,
  FilterPills,
  FilterSection,
  Segmented,
  TeamSearch,
  useAnimKey,
  type ActiveFilter,
} from "../_filters";

interface Props {
  matches: TournamentMatch[];
  teams: TournamentTeam[];
  poules: TournamentPoule[];
  isActive: boolean;
}

type PhaseFilter = "all" | "G" | "KO";
type StatusFilter = "all" | MatchStatus;

interface Row {
  m: TournamentMatch;
  status: MatchStatus;
  ko: boolean;
  slot: string;
  label: string;
  a: string;
  b: string;
  pouleLabel: string;
}

const STATUS_LABEL: Record<MatchStatus, string> = { live: "Bezig", next: "Nog te spelen", done: "Gespeeld" };

export function MatchesView({ matches, teams, poules, isActive }: Readonly<Props>) {
  const now = useNow();
  useAutoRefresh(isActive);

  const [q, setQ] = useState("");
  const [teamId, setTeamId] = useState<number | null>(null);
  const [phase, setPhase] = useState<PhaseFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [track, setTrack] = useState(0);
  const [pouleId, setPouleId] = useState(0);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [open, setOpen] = useState(false);

  const teamById = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams]);
  const pouleById = useMemo(() => new Map(poules.map((p) => [p.id, p])), [poules]);
  const groupPoules = poules.filter((p) => p.phase === "GROUP_STAGE");
  const size = bracketSize(matches);

  const rows: Row[] = useMemo(
    () =>
      [...matches]
        .sort(
          (x, y) =>
            new Date(x.scheduledAt ?? 0).getTime() - new Date(y.scheduledAt ?? 0).getTime() ||
            (x.track ?? 0) - (y.track ?? 0)
        )
        .map((m) => {
          const ko = isKnockout(m.phase);
          const [fa, fb] = feederLabels(m.bracketPos, size);
          const poule = m.pouleId ? pouleById.get(m.pouleId) : undefined;
          const pouleLabel = poule ? `Poule ${pouleLetter(poule)}` : "";
          const pos = m.bracketPos?.replace(/^R(32|16)-/, "#") ?? "";
          return {
            m,
            status: matchStatus(m, now),
            ko,
            slot: m.scheduledAt ?? "",
            label: ko ? `${KO_SHORT[m.phase] ?? ""}${pos && m.phase !== "FINAL" && m.phase !== "CONSOLATION_FINAL" ? ` · ${pos}` : ""}` : pouleLabel,
            a: m.teamAId ? teamById.get(m.teamAId)?.name ?? "?" : fa,
            b: m.teamBId ? teamById.get(m.teamBId)?.name ?? "?" : fb,
            pouleLabel,
          };
        }),
    [matches, now, teamById, pouleById, size]
  );

  const tracks = useMemo(
    () => [...new Set(matches.map((m) => m.track).filter((t): t is number => t !== null))].sort((a, b) => a - b),
    [matches]
  );

  const query = q.trim().toLowerCase();
  const passBase = (r: Row) => {
    if (phase === "G" && r.ko) return false;
    if (phase === "KO" && !r.ko) return false;
    if (track && r.m.track !== track) return false;
    if (pouleId && r.m.pouleId !== pouleId) return false;
    if (teamId && r.m.teamAId !== teamId && r.m.teamBId !== teamId) return false;
    if (!teamId && query) {
      const hit = (id: number | null, n: string) => id !== null && n.toLowerCase().includes(query);
      if (!hit(r.m.teamAId, r.a) && !hit(r.m.teamBId, r.b)) return false;
    }
    return true;
  };
  const pass = (r: Row) => passBase(r) && (status === "all" || r.status === status);
  const visible = rows.filter(pass);

  const counts = { all: 0, live: 0, next: 0, done: 0 };
  for (const r of rows) if (passBase(r)) { counts.all++; counts[r.status]++; }

  // Tijdsloten (rooster en lijst)
  const slots = [...new Set(rows.map((r) => r.slot))];
  const slotGroups = slots
    .map((slot) => {
      const inSlot = rows.filter((r) => r.slot === slot);
      return { slot, inSlot, vis: inSlot.filter(pass), live: inSlot.some((r) => r.status === "live") };
    })
    .filter((g) => g.vis.length > 0);

  // Nu op de banen
  const live = rows.filter((r) => r.status === "live");
  const nextOnTrack = (r: Row) =>
    rows.find((x) => x.m.track === r.m.track && x.slot > r.slot && x.status === "next");

  // Jouw team
  const team = teamId ? teamById.get(teamId) : undefined;
  const teamInfo = (() => {
    if (!team) return null;
    const mine = rows.filter((r) => r.m.teamAId === team.id || r.m.teamBId === team.id);
    const nx = mine.find((r) => r.status !== "done");
    const pouleRows = teams.filter((t) => t.pouleId === team.pouleId).sort(compareStanding);
    const place = pouleRows.findIndex((t) => t.id === team.id) + 1;
    const poule = team.pouleId ? pouleById.get(team.pouleId) : undefined;
    return {
      nextMain: nx ? `${nx.status === "live" ? "Nu bezig" : fmtTime(nx.m.scheduledAt)} · Baan ${nx.m.track ?? "?"}` : "Geen wedstrijden meer gepland",
      nextSub: nx ? `tegen ${nx.m.teamAId === team.id ? nx.b : nx.a}` : "Bekijk de bracket voor het vervolg",
      poule: poule ? pouleLetter(poule) : "–",
      place: place ? `${place}${place === 1 ? "ste" : "de"} van ${pouleRows.length}` : "–",
      record: `${team.played} gespeeld · ${team.won} W · ${team.drawn} GL · ${team.lost} V`,
      saldo: `${team.saldo > 0 ? "+" : ""}${team.saldo}`,
      points: `${team.points} punten · ${team.goalsFor} voor, ${team.goalsAgainst} tegen`,
    };
  })();

  // Actieve filters
  const active: ActiveFilter[] = [];
  if (phase !== "all") active.push({ label: phase === "G" ? "Poulefase" : "Knock-out", onRemove: () => setPhase("all") });
  if (status !== "all") active.push({ label: STATUS_LABEL[status], onRemove: () => setStatus("all") });
  if (track) active.push({ label: `Baan ${track}`, onRemove: () => setTrack(0) });
  if (pouleId) {
    const p = pouleById.get(pouleId);
    active.push({ label: p ? `Poule ${pouleLetter(p)}` : "Poule", onRemove: () => setPouleId(0) });
  }
  const clearFilters = () => {
    setPhase("all");
    setStatus("all");
    setTrack(0);
    setPouleId(0);
  };

  const animKey = useAnimKey([phase, status, track, pouleId, teamId, view]);
  const teamOptions = useMemo(
    () =>
      [...teams]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((t) => {
          const p = t.pouleId ? pouleById.get(t.pouleId) : undefined;
          return { id: t.id, name: t.name, meta: p ? `Poule ${pouleLetter(p)}` : undefined };
        }),
    [teams, pouleById]
  );
  const pick = (id: number | null) => {
    if (id === null) return;
    setTeamId(id);
    setQ("");
  };

  const hasKO = rows.some((r) => r.ko);
  const gridCols = `76px repeat(${tracks.length}, minmax(140px, 1fr))`;

  return (
    <div className="flex flex-col gap-6">
      <PageHead
        title="Wedstrijden"
        subtitle={`${matches.length} wedstrijden · ${teams.length} teams${tracks.length ? ` · ${tracks.length} banen` : ""}`}
      />

      {live.length > 0 && !teamId && (
        <section aria-labelledby="nu-op-de-banen" className="flex flex-col gap-3">
          <div className="flex items-baseline gap-3">
            <h2 id="nu-op-de-banen" className="text-[0.95rem] font-bold">Nu op de banen</h2>
            <span className="text-xs text-ink-2">tik een team om het te volgen</span>
          </div>
          <div className="-mx-5 flex gap-2 overflow-x-auto px-5 [scrollbar-width:none] sm:-mx-8 sm:px-8 md:mx-0 md:grid md:grid-cols-[repeat(auto-fill,minmax(170px,1fr))] md:overflow-visible md:px-0">
            {live.map((r, i) => {
              const nx = nextOnTrack(r);
              return (
                <div
                  key={r.m.id}
                  className="t-rise flex w-[200px] shrink-0 flex-col gap-1.5 rounded-2xl border border-rule bg-surface px-3.5 py-3 md:w-auto"
                  style={{ animationDelay: `${i * 45}ms` }}
                >
                  <div className="flex items-center gap-1.5 text-[0.6875rem] font-semibold text-ink-2">
                    <span className="font-extrabold text-ink">Baan {r.m.track}</span>·<span>{r.label}</span>
                    <span className="ml-auto inline-flex items-center gap-1.5 font-bold text-pink-ink"><span className="t-live-dot" />bezig</span>
                  </div>
                  <SideButton name={r.a} id={r.m.teamAId} onPick={pick} />
                  <SideButton name={r.b} id={r.m.teamBId} onPick={pick} />
                  {nx && (
                    <p className="border-t border-rule pt-1.5 text-[0.6875rem] text-ink-2">
                      Straks {fmtTime(nx.m.scheduledAt)}: {nx.ko ? nx.label : `${nx.a} – ${nx.b}`}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Zoeken + filters */}
      <section aria-label="Zoeken en filteren" className="sticky top-[60px] z-20 -mx-5 flex flex-col gap-2.5 border-b border-rule bg-paper px-5 py-3 sm:-mx-8 sm:px-8 md:static md:mx-0 md:border-0 md:bg-transparent md:p-0">
        <div className="relative flex items-start gap-2.5">
          <div className="min-w-0 flex-1">
            <TeamSearch options={teamOptions} selected={team ? { id: team.id, name: team.name } : null} onSelect={(id) => (id === null ? setTeamId(null) : pick(id))} query={q} onQuery={setQ} />
          </div>
          <FilterButton count={active.length} open={open} onClick={() => setOpen((o) => !o)} controls="wedstrijd-filters" />
          <div className="hidden md:block">
            <Segmented label="Weergave" value={view} onChange={setView} options={[{ key: "grid", label: "Rooster" }, { key: "list", label: "Lijst" }]} />
          </div>
          <FilterPanel id="wedstrijd-filters" open={open} onClose={() => setOpen(false)} onClear={clearFilters} applyLabel={`Toon ${visible.length} wedstrijden`}>
            {hasKO && (
              <FilterSection title="Fase">
                <Segmented stretch label="Fase" value={phase} onChange={setPhase} options={[{ key: "all", label: "Alles" }, { key: "G", label: "Poulefase" }, { key: "KO", label: "Knock-out" }]} />
              </FilterSection>
            )}
            <FilterSection title="Status">
              <div className="flex flex-wrap gap-1.5">
                {(["all", "live", "next", "done"] as StatusFilter[]).map((k) => (
                  <Chip key={k} on={status === k} onClick={() => setStatus(k)}>
                    {k === "all" ? "Alles" : STATUS_LABEL[k]} <Count n={counts[k]} />
                  </Chip>
                ))}
              </div>
            </FilterSection>
            {tracks.length > 1 && (
              <FilterSection title="Baan">
                <div className="flex flex-wrap gap-1.5">
                  <Chip on={track === 0} onClick={() => setTrack(0)}>Alle</Chip>
                  {tracks.map((t) => (
                    <Chip key={t} square on={track === t} onClick={() => setTrack(t)}>{t}</Chip>
                  ))}
                </div>
              </FilterSection>
            )}
            {groupPoules.length > 1 && (
              <FilterSection title="Poule">
                <div className="grid grid-cols-7 gap-1.5">
                  <Chip square on={pouleId === 0} onClick={() => setPouleId(0)}>Alle</Chip>
                  {groupPoules.map((p) => (
                    <Chip
                      key={p.id}
                      square
                      on={pouleId === p.id}
                      onClick={() => {
                        setPouleId(p.id);
                        if (phase === "KO") setPhase("all");
                      }}
                    >
                      {pouleLetter(p)}
                    </Chip>
                  ))}
                </div>
              </FilterSection>
            )}
          </FilterPanel>
        </div>
        <FilterPills
          filters={active}
          onClear={clearFilters}
          lead={
            <span className="mr-1 shrink-0 text-[0.8125rem] text-ink-2 md:hidden" aria-live="polite">
              <strong className="text-ink">{visible.length}</strong> van {matches.length}
            </span>
          }
        />
      </section>

      {teamInfo && team && (
        <section aria-label="Jouw team" key={team.id} className="grid gap-2 sm:grid-cols-3">
          <InfoCard hot label="Volgende match" main={teamInfo.nextMain} sub={teamInfo.nextSub} />
          <InfoCard label={`Poule ${teamInfo.poule}`} main={teamInfo.place} sub={teamInfo.record} delay={50} />
          <InfoCard label="Saldo" main={teamInfo.saldo} sub={teamInfo.points} delay={100} />
        </section>
      )}

      <p className="hidden text-sm text-ink-2 md:block" aria-live="polite">
        <strong className="text-ink">{visible.length}</strong> van {matches.length} wedstrijden
      </p>

      {visible.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-rule px-6 py-12 text-center">
          <p className="font-bold">Geen wedstrijden met deze filters</p>
          <p className="text-sm text-ink-2">Probeer een andere baan of poule, of wis de filters.</p>
          <button type="button" onClick={() => { clearFilters(); setTeamId(null); setQ(""); }} className="t-press mt-2 h-11 rounded-full border border-rule bg-surface px-5 text-sm font-semibold">
            Alles wissen
          </button>
        </div>
      ) : (
        <>
          {/* Rooster: tijdsloten × banen (enkel vanaf md) */}
          {view === "grid" && (
            <div key={`g${animKey}`} className="hidden overflow-x-auto md:block">
              <div className="flex min-w-[1000px] flex-col gap-2">
                <div className="grid gap-2 py-1 text-[0.6875rem] font-semibold text-ink-2" style={{ gridTemplateColumns: gridCols }}>
                  <span>Tijd</span>
                  {tracks.map((t) => (
                    <span key={t} className={track === t ? "font-extrabold text-ink" : ""}>Baan {t}</span>
                  ))}
                </div>
                {slotGroups.map((g, i) => {
                  const first = g.inSlot[0];
                  const prev = i > 0 ? slotGroups[i - 1].inSlot[0] : null;
                  const header = phase === "all" && hasKO && (!prev || prev.ko !== first.ko) ? (first.ko ? "Knock-out" : "Poulefase") : "";
                  return (
                    <div key={g.slot} className="t-rise flex flex-col gap-2" style={{ animationDelay: `${Math.min(i, 12) * 22}ms` }}>
                      {header && (
                        <div className="flex items-center gap-3 pb-1 pt-3">
                          <span className="text-[0.8125rem] font-extrabold uppercase tracking-wider">{header}</span>
                          <span className="h-px flex-1 bg-rule" />
                        </div>
                      )}
                      <div className="grid items-stretch gap-2" style={{ gridTemplateColumns: gridCols }}>
                        <div className="flex flex-col justify-center tabular-nums">
                          <span className="text-[0.95rem] font-bold">{fmtTime(first.m.scheduledAt)}</span>
                          <span className="text-[0.6875rem] font-semibold text-ink-2">{g.live ? "nu bezig" : first.ko ? KO_SHORT[first.m.phase] : ""}</span>
                        </div>
                        {tracks.map((t) => {
                          const r = g.inSlot.find((x) => x.m.track === t);
                          if (!r) return <div key={t} className="rounded-xl border border-dashed border-rule" />;
                          return <MatchCard key={t} r={r} teamId={teamId} dim={!pass(r)} onPick={pick} />;
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Lijst (altijd op gsm) */}
          <div key={`l${animKey}`} className={`flex flex-col gap-5 ${view === "grid" ? "md:hidden" : ""}`}>
            {slotGroups.map((g, i) => {
              const first = g.inSlot[0];
              return (
                <div key={g.slot} className="t-rise flex flex-col gap-2.5" style={{ animationDelay: `${Math.min(i, 8) * 35}ms` }}>
                  <div className="flex items-baseline gap-2">
                    <span className="text-base font-extrabold tabular-nums">{fmtTime(first.m.scheduledAt) || "Nog niet gepland"}</span>
                    <span className="text-[0.8125rem] text-ink-2">
                      {g.live ? "nu bezig · " : ""}
                      {first.ko ? KO_SHORT[first.m.phase]?.toLowerCase() : "poulefase"}
                    </span>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {g.vis.map((r) => (
                      <MatchCard key={r.m.id} r={r} teamId={teamId} showTrack onPick={pick} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ── Onderdelen ────────────────────────────────────────────────────────────────

function SideButton({ name, id, onPick }: Readonly<{ name: string; id: number | null; onPick: (id: number) => void }>) {
  return (
    <button
      type="button"
      disabled={id === null}
      onClick={() => id !== null && onPick(id)}
      className="t-press flex min-h-[26px] w-full items-center text-left disabled:cursor-default"
    >
      <span className={`min-w-0 flex-1 truncate text-[0.8125rem] font-semibold ${id === null ? "font-medium italic text-ink-2" : "hover:underline hover:underline-offset-2"}`}>{name}</span>
    </button>
  );
}

function MatchCard({
  r,
  teamId,
  dim = false,
  showTrack = false,
  onPick,
}: Readonly<{ r: Row; teamId: number | null; dim?: boolean; showTrack?: boolean; onPick: (id: number) => void }>) {
  const { m } = r;
  const played = m.scoreA !== null && m.scoreB !== null;
  const mine = teamId !== null && (m.teamAId === teamId || m.teamBId === teamId);
  const side = (id: number | null, name: string, score: number | null, other: number | null) => {
    const win = played && (score ?? 0) > (other ?? 0);
    const lose = played && !win;
    return (
      <button
        type="button"
        disabled={id === null}
        onClick={() => id !== null && onPick(id)}
        className="group flex min-h-[30px] w-full items-center gap-2 text-left disabled:cursor-default md:min-h-[22px]"
      >
        <span
          className={`min-w-0 flex-1 truncate text-[0.9375rem] md:text-[0.8125rem] ${
            id === null ? "font-medium italic text-ink-2" : lose ? "font-medium text-ink-2" : "font-semibold"
          } ${id !== null ? "group-hover:underline group-hover:underline-offset-2" : ""} ${id === teamId ? "font-extrabold text-pink-ink" : ""}`}
        >
          {name}
        </span>
        <span className={`min-w-5 text-right text-base font-bold tabular-nums md:text-sm ${lose ? "font-medium text-ink-2" : ""}`}>{played ? score : ""}</span>
      </button>
    );
  };
  return (
    <div
      className={`t-press flex flex-col gap-1 rounded-2xl border px-3.5 py-2.5 md:rounded-xl md:px-3 md:py-2.5 ${
        mine ? "border-pink bg-pink-soft" : r.status === "live" ? "border-pink bg-surface shadow-[inset_0_0_0_1px_var(--pink)]" : "border-rule bg-surface"
      } ${dim ? "opacity-20" : ""}`}
    >
      <div className="flex items-center gap-1.5 text-[0.6875rem] font-semibold text-ink-2">
        {showTrack && m.track !== null && (
          <>
            <span className="font-extrabold text-ink">Baan {m.track}</span>·
          </>
        )}
        <span className="truncate">{r.label}</span>
        {r.status === "live" && (
          <span className="ml-auto inline-flex items-center gap-1.5 font-bold text-pink-ink"><span className="t-live-dot" />bezig</span>
        )}
      </div>
      {side(m.teamAId, r.a, m.scoreA, m.scoreB)}
      {side(m.teamBId, r.b, m.scoreB, m.scoreA)}
    </div>
  );
}

function InfoCard({ label, main, sub, hot = false, delay = 0 }: Readonly<{ label: string; main: string; sub: string; hot?: boolean; delay?: number }>) {
  return (
    <div className={`t-rise flex flex-col gap-1 rounded-2xl border bg-surface px-4 py-3 ${hot ? "border-pink" : "border-rule"}`} style={{ animationDelay: `${delay}ms` }}>
      <span className="text-[0.6875rem] font-semibold text-ink-2">{label}</span>
      <span className="text-[1.05rem] font-extrabold tabular-nums">{main}</span>
      <span className="text-[0.8125rem] text-ink-2">{sub}</span>
    </div>
  );
}
