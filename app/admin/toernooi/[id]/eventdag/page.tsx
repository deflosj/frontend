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
  const [track, setTrack] = useState<number | null>(null);
  // Scheidsrechters kunnen niet naar het toernooibeheer: geen terugknop.
  const [canManage, setCanManage] = useState(false);
  useEffect(() => {
    const role = getTokenPayload()?.role;
    setCanManage(role === "ADMIN" || role === "SUPERADMIN");
  }, []);

  function openTrack(t: number) {
    setTrack(t);
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
      {view === "scores" && <ScoreboardView track={track} onTrackChange={setTrack} />}
      {view === "banen" && <TracksView onOpenTrack={openTrack} />}
    </div>
  );
}
