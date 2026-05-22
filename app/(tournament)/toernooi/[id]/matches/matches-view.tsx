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
import { MatchBlock } from "../_shared";

interface Props {
  matches: TournamentMatch[];
  teams: TournamentTeam[];
  poules: TournamentPoule[];
}

type Status = "ALL" | "UPCOMING" | "PLAYED";

export function MatchesView({ matches, teams, poules }: Readonly<Props>) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<Status>("ALL");
  const [phase, setPhase] = useState<Phase | "ALL">("ALL");
  const [pouleId, setPouleId] = useState<string>("");

  const phases = PHASE_ORDER.filter((p) => matches.some((m) => m.phase === p));
  const groupPoules = poules.filter((p) => p.phase === "GROUP");
  const showPouleSelect = (phase === "ALL" || phase === "GROUP") && groupPoules.length > 1;

  const filtered = useMemo(() => {
    return matches
      .filter((m) => {
        if (phase !== "ALL" && m.phase !== phase) return false;
        if (pouleId && m.pouleId !== Number(pouleId)) return false;
        if (status === "PLAYED" && m.scoreA === null) return false;
        if (status === "UPCOMING" && m.scoreA !== null) return false;
        if (search.trim()) {
          const q = search.trim().toLowerCase();
          const nameA = teams.find((t) => t.id === m.teamAId)?.name ?? "";
          const nameB = teams.find((t) => t.id === m.teamBId)?.name ?? "";
          if (!nameA.toLowerCase().includes(q) && !nameB.toLowerCase().includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(a.time ?? 0).getTime() - new Date(b.time ?? 0).getTime());
  }, [matches, phase, pouleId, status, search, teams]);

  const grouped = useMemo(() => {
    if (phase !== "ALL") {
      return [{ key: phase, label: PHASE_LABELS[phase as Phase], items: filtered }];
    }
    return PHASE_ORDER.filter((p) => filtered.some((m) => m.phase === p)).map((p) => ({
      key: p,
      label: PHASE_LABELS[p],
      items: filtered.filter((m) => m.phase === p),
    }));
  }, [filtered, phase]);

  const handlePhaseClick = (p: Phase | "ALL") => {
    setPhase(p);
    if (p !== "GROUP" && p !== "ALL") setPouleId("");
  };

  const allPhases: { key: Phase | "ALL"; label: string }[] = [
    { key: "ALL", label: "Alle" },
    ...phases.map((p) => ({ key: p, label: PHASE_LABELS[p] })),
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* Search — most important, always on top */}
      <input
        type="search"
        placeholder="Zoek op team..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="h-11 w-full rounded-xl border border-rule bg-surface px-4 text-sm text-ink placeholder:text-ink-2 focus:outline-none focus:ring-2 focus:ring-pink/30"
      />

      {/* Status pills + poule select on one row */}
      <div className="flex items-center gap-2">
        <div className="flex gap-1">
          {(["ALL", "UPCOMING", "PLAYED"] as Status[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                status === s ? "bg-pink text-white" : "bg-paper text-ink-2 hover:text-ink"
              }`}
            >
              {s === "ALL" ? "Alle" : s === "UPCOMING" ? "Te spelen" : "Gespeeld"}
            </button>
          ))}
        </div>

        {showPouleSelect && (
          <select
            value={pouleId}
            onChange={(e) => setPouleId(e.target.value)}
            className="ml-auto shrink-0 rounded-lg border border-rule bg-surface px-2.5 py-1.5 text-xs font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-pink/30"
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

      {/* Phase tabs — only when knockout has started */}
      {phases.length > 1 && (
        <div className="-mx-5 flex overflow-x-auto border-b border-rule px-5 sm:-mx-8 sm:px-8">
          {allPhases.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => handlePhaseClick(key)}
              className={`relative shrink-0 px-3 py-2.5 text-sm font-semibold transition-colors ${
                phase === key ? "text-ink" : "text-ink/35 hover:text-ink/60"
              }`}
            >
              {label}
              <span
                className={`absolute bottom-0 left-1 right-1 h-0.5 rounded-full bg-pink transition-opacity ${
                  phase === key ? "opacity-100" : "opacity-0"
                }`}
              />
            </button>
          ))}
        </div>
      )}

      {/* Match count */}
      <p className="text-xs text-ink-2">
        <span className="font-semibold text-ink">{filtered.length}</span> wedstrijden
      </p>

      {/* Results */}
      {filtered.length === 0 ? (
        <p className="text-sm text-ink-2">Geen wedstrijden gevonden.</p>
      ) : (
        <div className="flex flex-col gap-8">
          {grouped.map(({ key, label, items }) => (
            <div key={key}>
              {grouped.length > 1 && (
                <h3 className="mb-3 text-sm font-bold uppercase tracking-widest text-ink-2">
                  {label}
                </h3>
              )}
              <div className="flex flex-col gap-2 sm:grid sm:grid-cols-2 lg:grid-cols-3">
                {items.map((m) => {
                  const showPouleName = !pouleId && (phase === "ALL" || phase === "GROUP");
                  return (
                    <MatchBlock
                      key={m.id}
                      match={m}
                      teams={teams}
                      pouleName={showPouleName ? poules.find((pl) => pl.id === m.pouleId)?.name : undefined}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
