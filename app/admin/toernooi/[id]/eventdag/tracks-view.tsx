"use client";

import { useMemo } from "react";
import { ChevronRight } from "lucide-react";
import { useTournament } from "../tournament-context";
import { hhmm, isPlayed, matchesByTrack } from "./scoreboard-view";

/** Overzicht van alle banen: wat er nu speelt en hoe ver elke baan zit. */
export function TracksView({ onOpenTrack }: Readonly<{ onOpenTrack: (t: number) => void }>) {
  const { tournament } = useTournament();
  const byTrack = useMemo(() => matchesByTrack(tournament.matches), [tournament.matches]);
  const name = (id: number | null) => tournament.teams.find((t) => t.id === id)?.name ?? "?";

  if (byTrack.size === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-rule px-4 py-8 text-center text-sm text-ink-2">
        Nog geen wedstrijden ingepland.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2 pb-6">
      {[...byTrack.entries()].map(([track, list]) => {
        const done = list.filter(isPlayed).length;
        const current = list.find((m) => !isPlayed(m));
        return (
          <li key={track}>
            <button
              type="button"
              onClick={() => onOpenTrack(track)}
              className="flex w-full items-center gap-3.5 rounded-2xl border border-rule bg-surface px-4 py-3.5 text-left transition-colors hover:bg-paper"
            >
              <span className={`flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl ${current ? "bg-ink text-paper" : "bg-[var(--ok-bg)] text-[var(--ok-fg)]"}`}>
                <span className="text-[9px] font-semibold uppercase tracking-wider opacity-70">Baan</span>
                <span className="font-mono text-lg font-semibold leading-none">{track}</span>
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                {current ? (
                  <span className="truncate text-sm font-semibold">{name(current.teamAId)} – {name(current.teamBId)}</span>
                ) : (
                  <span className="text-sm font-semibold text-[var(--ok-fg)]">Klaar</span>
                )}
                <span className="flex items-center gap-2 text-xs text-ink-2">
                  {current && <span className="font-mono">{hhmm(current.scheduledAt)}</span>}
                  <span className="h-1 flex-1 overflow-hidden rounded-full bg-rule">
                    <span className="block h-full rounded-full bg-pink" style={{ width: `${(done / list.length) * 100}%` }} />
                  </span>
                  <span className="font-mono">{done}/{list.length}</span>
                </span>
              </span>
              <ChevronRight size={18} className="shrink-0 text-ink-2" aria-hidden />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
