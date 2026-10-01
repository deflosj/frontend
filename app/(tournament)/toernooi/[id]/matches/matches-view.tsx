"use client";

import { useMemo, useState } from "react";

import {
  PHASE_LABELS,
  PHASE_ORDER,
  Phase,
  TournamentMatch,
  TournamentPoule,
  TournamentTeam,
} from "@/lib/tournament-types";
import { MatchBlock, PageHead, SectionHead, TabStrip } from "../_shared";

interface Props {
  matches: TournamentMatch[];
  teams: TournamentTeam[];
  poules: TournamentPoule[];
}

type Filter = "ALL" | "GROUP" | "KNOCKOUT" | "UPCOMING";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "ALL", label: "Alle" },
  { key: "GROUP", label: "Poulefase" },
  { key: "KNOCKOUT", label: "Knockout" },
  { key: "UPCOMING", label: "Enkel te spelen" },
];

export function MatchesView({ matches, teams, poules }: Readonly<Props>) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("ALL");
  const [pouleId, setPouleId] = useState<string>("");

  const groupPoules = poules.filter((p) => p.phase === "GROUP_STAGE");
  const showPouleSelect = (filter === "ALL" || filter === "GROUP") && groupPoules.length > 1;

  const trackCount = new Set(matches.map((m) => m.track).filter((t) => t !== null)).size;

  const filtered = useMemo(() => {
    return matches
      .filter((m) => {
        if (filter === "GROUP" && m.phase !== "GROUP_STAGE") return false;
        if (filter === "KNOCKOUT" && m.phase === "GROUP_STAGE") return false;
        if (filter === "UPCOMING" && m.scoreA !== null) return false;
        if (pouleId && m.pouleId !== Number(pouleId)) return false;
        if (search.trim()) {
          const q = search.trim().toLowerCase();
          const nameA = teams.find((t) => t.id === m.teamAId)?.name ?? "";
          const nameB = teams.find((t) => t.id === m.teamBId)?.name ?? "";
          if (!nameA.toLowerCase().includes(q) && !nameB.toLowerCase().includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(a.scheduledAt ?? 0).getTime() - new Date(b.scheduledAt ?? 0).getTime());
  }, [matches, filter, pouleId, search, teams]);

  const grouped = useMemo(
    () =>
      PHASE_ORDER.filter((p) => filtered.some((m) => m.phase === p)).map((p) => ({
        key: p,
        label: PHASE_LABELS[p],
        items: filtered.filter((m) => m.phase === p),
      })),
    [filtered]
  );

  const label = (phase: Phase, mPouleId: number | null) =>
    phase === "GROUP_STAGE"
      ? poules.find((p) => p.id === mPouleId)?.name
      : PHASE_LABELS[phase];

  return (
    <div className="flex flex-col gap-6">
      <PageHead
        title="Wedstrijden"
        subtitle={
          trackCount > 0
            ? `${matches.length} wedstrijden over ${trackCount} ${trackCount === 1 ? "baan" : "banen"}`
            : `${matches.length} wedstrijden`
        }
      />

      {/* Zoeken + poulefilter */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          placeholder="Zoek op team..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-11 min-w-0 flex-1 rounded-xl border border-rule bg-surface px-4 text-sm text-ink placeholder:text-ink-2 focus:outline-none focus:ring-2 focus:ring-pink/30"
        />
        {showPouleSelect && (
          <select
            value={pouleId}
            onChange={(e) => setPouleId(e.target.value)}
            className="h-11 shrink-0 rounded-xl border border-rule bg-surface px-3 text-sm font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-pink/30"
          >
            <option value="">Alle poules</option>
            {groupPoules.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <TabStrip
        tabs={FILTERS}
        active={filter}
        onSelect={(key) => {
          const next = key as Filter;
          setFilter(next);
          if (next === "KNOCKOUT") setPouleId("");
        }}
      />

      <p className="text-xs text-ink-2">
        <span className="font-semibold text-ink">{filtered.length}</span> wedstrijden
      </p>

      {filtered.length === 0 ? (
        <p className="text-sm text-ink-2">Geen wedstrijden gevonden.</p>
      ) : (
        <div className="flex flex-col gap-8">
          {grouped.map(({ key, label: phaseLabel, items }) => (
            <div key={key}>
              {grouped.length > 1 && <SectionHead title={phaseLabel} />}
              <div className="grid gap-3 sm:grid-cols-2">
                {items.map((m) => (
                  <MatchBlock
                    key={m.id}
                    match={m}
                    teams={teams}
                    label={label(m.phase, m.pouleId)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
