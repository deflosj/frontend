"use client";

import { useMemo } from "react";
import { ChevronRight } from "lucide-react";
import { useTournament } from "../tournament-context";
import { hhmm, isPlayed, matchesByTrack, trackQueue } from "./scoreboard-view";

/** Overzicht van alle banen: wat er nu speelt en hoe ver elke baan zit. */
export function TracksView({ onOpenTrack, myTracks = [] }: Readonly<{ onOpenTrack: (t: number) => void; myTracks?: number[] }>) {
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
      {/* Eigen banen eerst (sort is stabiel). */}
      {[...byTrack.entries()].sort(([a], [b]) => Number(myTracks.includes(b)) - Number(myTracks.includes(a))).map(([track, list]) => {
        const done = list.filter(isPlayed).length;
        const { current, skipped } = trackQueue(list);
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
                  <span className="text-sm font-semibold text-[var(--ok-fg)]">{skipped.length ? "Enkel overgeslagen over" : "Klaar"}</span>
                )}
                {(myTracks.includes(track) || skipped.length > 0) && (
                  <span className="flex flex-wrap gap-1.5">
                    {myTracks.includes(track) && <span className="rounded-full bg-ink/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink">Mijn baan</span>}
                    {skipped.length > 0 && <span className="rounded-full bg-pink-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-pink-ink">{skipped.length} overgeslagen</span>}
                  </span>
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
