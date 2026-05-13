import type { Metadata } from "next";
import Link from "next/link";

import { TournamentListItem } from "@/lib/tournament-types";

export const metadata: Metadata = {
  title: "Toernooi",
  description:
    "Alle edities van het De Flosj petanquetoernooi — live standen, wedstrijden en archieven per jaar.",
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
    <div>
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="border-b border-rule">
        <div className="mx-auto max-w-5xl px-5 py-14 sm:px-8 sm:py-20">
          <p className="mb-3 text-[0.6875rem] font-semibold uppercase tracking-widest text-pink">
            Portaal
          </p>
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-ink sm:text-5xl">
            Toernooi
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-ink-2">
            Alle edities van het De Flosj petanquetoernooi. Bekijk live standen, het volledige
            schema en de finale — of blader door de archieven van vorige jaren.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-5 py-12 sm:px-8">
        {tournaments.length === 0 && (
          <p className="text-sm text-muted">Er zijn nog geen toernooien aangemaakt.</p>
        )}

        {/* ── Actief toernooi ──────────────────────────────── */}
        {active && (
          <div className="mb-12">
            <p className="mb-4 text-[0.6875rem] font-semibold uppercase tracking-widest text-pink">
              Huidig seizoen
            </p>
            <Link
              href={`/toernooi/${active.id}`}
              className="group block rounded-2xl border border-pink/30 bg-pink-soft p-8 transition-colors hover:border-pink/50"
            >
              <div className="mb-4 flex items-center gap-3">
                <span className="rounded-full bg-pink px-3 py-1 text-xs font-bold uppercase tracking-widest text-white">
                  Actief
                </span>
                <span className="text-sm text-pink-ink">{active.year}</span>
              </div>
              <h2 className="mb-2 text-2xl font-bold text-ink group-hover:underline sm:text-3xl">
                {active.name}
              </h2>
              <p className="text-sm text-ink-2">
                Bekijk live standen, wedstrijden, de finale en het volledige deelnemersveld.
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                {(["standen", "wedstrijden", "finale", "teams", "reglement"] as const).map(
                  (tab) => (
                    <span
                      key={tab}
                      className="rounded-full border border-pink/20 bg-surface px-3 py-1 text-xs font-semibold capitalize text-pink-ink"
                    >
                      {tab}
                    </span>
                  )
                )}
              </div>
            </Link>
          </div>
        )}

        {/* ── Vorige jaren ─────────────────────────────────── */}
        {past.length > 0 && (
          <div>
            <p className="mb-4 text-[0.6875rem] font-semibold uppercase tracking-widest text-pink">
              Archief
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {past.map((t) => (
                <Link
                  key={t.id}
                  href={`/toernooi/${t.id}`}
                  className="group flex flex-col rounded-2xl border border-rule bg-surface p-6 transition-colors hover:border-pink/20 hover:bg-pink-soft"
                >
                  <span className="mb-2 text-[0.625rem] font-semibold uppercase tracking-widest text-muted">
                    {t.year}
                  </span>
                  <h3 className="mb-1 font-semibold text-ink group-hover:underline">{t.name}</h3>
                  <span className="mt-auto pt-4 text-xs font-semibold text-muted group-hover:text-pink-ink">
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
