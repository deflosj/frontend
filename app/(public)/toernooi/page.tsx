import type { Metadata } from "next";
import Link from "next/link";

import { TournamentListItem } from "@/lib/tournament-types";

export const metadata: Metadata = {
  title: "Toernooi",
  description: "Alle edities van het De Flosj petanquetoernooi — live standen, wedstrijden en archieven per jaar.",
};

async function getTournaments(): Promise<TournamentListItem[]> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";
  try {
    const res = await fetch(`${base}/tournaments`, { cache: "no-store" });
    if (!res.ok) return [];
    return res.json() as Promise<TournamentListItem[]>;
  } catch {
    return [];
  }
}

export default async function TournamentPortalPage() {
  const tournaments = await getTournaments();
  const active = tournaments.find((t) => t.isActive);
  const past = tournaments.filter((t) => !t.isActive);

  return (
    <div className="bg-white">
      {/* ── Header ───────────────────────────────────────────── */}
      <div className="border-b border-gray-200">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-amber-500">
            Portaal
          </p>
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Toernooi
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-gray-500">
            Alle edities van het De Flosj petanquetoernooi. Bekijk live standen, het volledige
            schema en de finale — of blader door de archieven van vorige jaren.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-12">
        {tournaments.length === 0 && (
          <p className="text-sm text-gray-400">Er zijn nog geen toernooien aangemaakt.</p>
        )}

        {/* ── Actief toernooi ───────────────────────────────── */}
        {active && (
          <div className="mb-12">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-amber-500">
              Huidig seizoen
            </p>
            <Link
              href={`/toernooi/${active.id}`}
              className="group block rounded-2xl border border-amber-200 bg-amber-50 p-8 transition-colors hover:border-amber-300 hover:bg-amber-100"
            >
              <div className="mb-4 flex items-center gap-3">
                <span className="rounded-full bg-amber-500 px-3 py-1 text-xs font-bold uppercase tracking-widest text-white">
                  Actief
                </span>
                <span className="text-sm text-amber-700">{active.year}</span>
              </div>
              <h2 className="mb-2 text-2xl font-bold text-gray-900 group-hover:underline sm:text-3xl">
                {active.name}
              </h2>
              <p className="text-sm text-gray-500">
                Bekijk live standen, wedstrijden, de finale en het volledige deelnemersveld.
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                {(["standen", "wedstrijden", "finale", "teams", "reglement"] as const).map(
                  (tab) => (
                    <span
                      key={tab}
                      className="rounded-full border border-amber-200 bg-white px-3 py-1 text-xs font-semibold capitalize text-amber-700"
                    >
                      {tab}
                    </span>
                  )
                )}
              </div>
            </Link>
          </div>
        )}

        {/* ── Vorige jaren ──────────────────────────────────── */}
        {past.length > 0 && (
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-amber-500">
              Archief
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {past.map((t) => (
                <Link
                  key={t.id}
                  href={`/toernooi/${t.id}`}
                  className="group flex flex-col rounded-2xl border border-gray-100 bg-gray-50 p-6 transition-colors hover:border-gray-200 hover:bg-gray-100"
                >
                  <span className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-400">
                    {t.year}
                  </span>
                  <h3 className="mb-1 font-semibold text-gray-900 group-hover:underline">
                    {t.name}
                  </h3>
                  <span className="mt-auto pt-4 text-xs font-semibold text-gray-400 group-hover:text-gray-600">
                    Bekijk archief →
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
