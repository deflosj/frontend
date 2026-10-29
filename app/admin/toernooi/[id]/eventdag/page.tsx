"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getTokenPayload } from "@/lib/api";
import { useTournament } from "../tournament-context";
import { CheckInView } from "./checkin-view";
import { ScoreboardView } from "./scoreboard-view";
import { TracksView } from "./tracks-view";

type View = "aanmelden" | "scores" | "banen";

const VIEWS: { key: View; label: string }[] = [
  { key: "aanmelden", label: "Aanmelden" },
  { key: "scores", label: "Scores" },
  { key: "banen", label: "Banen" },
];

/**
 * Eventdag-modus: de schermen die je op de toernooidag op je gsm gebruikt.
 * Grote raakvlakken, één taak per scherm.
 */
export default function EventdayPage() {
  const { tournament } = useTournament();
  const [view, setView] = useState<View>("aanmelden");
  // Vanuit "Banen" één baan openen, los van de eigen keuze.
  const [focusTrack, setFocusTrack] = useState<number | null>(null);
  // Scheidsrechters kunnen niet naar het toernooibeheer: geen terugknop.
  const [canManage, setCanManage] = useState(false);
  useEffect(() => {
    const role = getTokenPayload()?.role;
    setCanManage(role === "ADMIN" || role === "SUPERADMIN");
  }, []);

  // "Mijn banen": elke scheidsrechter kiest op zijn gsm welke banen hij doet.
  // Bewaard per toestel en per toernooi, zodat herladen niets kwijtspeelt.
  const storeKey = `eventdag:${tournament.id}:mijnBanen`;
  const [myTracks, setMyTracksState] = useState<number[]>([]);
  useEffect(() => {
    try {
      const raw = globalThis.localStorage?.getItem(storeKey);
      const saved: unknown = raw ? JSON.parse(raw) : null;
      if (Array.isArray(saved) && saved.length) {
        setMyTracksState(saved.filter((n): n is number => typeof n === "number"));
        setView("scores");
      }
    } catch {
      /* geen opslag beschikbaar: dan gewoon alle banen */
    }
  }, [storeKey]);
  function setMyTracks(next: number[]) {
    const sorted = [...new Set(next)].sort((a, b) => a - b);
    setMyTracksState(sorted);
    setFocusTrack(null);
    try {
      globalThis.localStorage?.setItem(storeKey, JSON.stringify(sorted));
    } catch {
      /* negeren */
    }
  }

  function openTrack(t: number) {
    setFocusTrack(t);
    setView("scores");
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-3.5">
        <div className="flex items-center gap-1">
          {canManage && <Link
            href={`/admin/toernooi/${tournament.id}`}
            aria-label="Terug naar toernooibeheer"
            className="-ml-2.5 flex h-11 w-11 items-center justify-center rounded-xl text-ink hover:bg-ink/5"
          >
            <ChevronLeft size={22} />
          </Link>}
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-xs text-ink-2">
              <span className="t-live-dot" /> Eventdag
            </p>
            <h1 className="truncate text-xl font-semibold tracking-tight">{tournament.name}</h1>
          </div>
        </div>

        <nav aria-label="Eventdag onderdelen" className="flex gap-1 rounded-xl bg-ink/[0.06] p-1">
          {VIEWS.map((v) => (
            <button
              key={v.key}
              type="button"
              onClick={() => setView(v.key)}
              aria-pressed={view === v.key}
              className={`h-10 flex-1 rounded-[9px] text-sm transition-colors ${
                view === v.key ? "bg-surface font-semibold text-ink shadow-sm" : "font-medium text-ink-2 hover:text-ink"
              }`}
            >
              {v.label}
            </button>
          ))}
        </nav>
      </header>

      {view === "aanmelden" && <CheckInView />}
      {view === "scores" && <ScoreboardView myTracks={myTracks} onMyTracksChange={setMyTracks} focusTrack={focusTrack} onClearFocus={() => setFocusTrack(null)} />}
      {view === "banen" && <TracksView onOpenTrack={openTrack} myTracks={myTracks} />}
    </div>
  );
}
