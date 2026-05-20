import type { Metadata } from "next";
import Link from "next/link";

import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Dorpelingenkoers",
  description: `De dorpelingenkoers van ${siteConfig.name}: 4e editie op zaterdag 6 juni 2026 in Rotselaar.`,
};

const raceDetails = [
  {
    eyebrow: "Dorpelingenkoers · 32 km",
    title: "Voor inwoners & clubleden",
    text: "Exclusief voor inwoners van Rotselaar of leden van lokale wielerclubs. 14 ronden van 2,3 km. Minimum 18 jaar, geen actieve licentie. Ex-renners moeten minstens 5 jaar inactief zijn (laatste wedstrijd vóór 31/12/2020).",
  },
  {
    eyebrow: "FUN-wedstrijd · 46 km",
    title: "Open voor iedereen",
    text: "Open voor alle deelnemers, ook niet-inwoners en Elite 3-licentiehouders. 20 ronden van 2,3 km. Mannen van 45+ rijden in een aparte categorie.",
  },
  {
    eyebrow: "Inschrijving · €25",
    title: "Aan het startpunt",
    text: "Inschrijven en rugnummer ophalen aan 'Het huis' (tegenover Café de Zijbeuk) vanaf 16:30. Betalen kan cash of via Payconiq.",
  },
];

export default function VillageRacePage() {
  return (
    <div>
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="border-b border-rule">
        <div className="mx-auto max-w-5xl px-5 py-14 sm:px-8 sm:py-20">
          <p className="mb-3 text-[0.6875rem] font-semibold uppercase tracking-widest text-pink">
            4e Editie · Zaterdag 6 juni 2026
          </p>
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-ink sm:text-5xl">
            Dorpelingenkoers Rotselaar
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-ink-2">
            Twee koersen op een afgesloten circuit van 2,3 km door het hart van Rotselaar.
            Open voor inwoners, clubleden én iedereen die wil meerijden.
          </p>
        </div>
      </div>

      {/* ── Info cards ─────────────────────────────────────── */}
      <div className="mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="grid gap-4 sm:grid-cols-3">
          {raceDetails.map((detail) => (
            <article
              key={detail.title}
              className="rounded-2xl border border-rule bg-surface px-6 py-5"
            >
              <p className="mb-2 text-[0.625rem] font-semibold uppercase tracking-widest text-pink">
                {detail.eyebrow}
              </p>
              <h3 className="mb-2 text-base font-semibold text-ink">{detail.title}</h3>
              <p className="text-sm leading-relaxed text-ink-2">{detail.text}</p>
            </article>
          ))}
        </div>

        {/* ── Programme ───────────────────────────────────── */}
        <div className="mt-10 rounded-2xl border border-rule bg-surface px-6 py-6 sm:px-8 sm:py-8">
          <p className="mb-2 text-[0.6875rem] font-semibold uppercase tracking-widest text-pink">
            Programma
          </p>
          <h2 className="mb-5 text-xl font-bold tracking-tight text-ink sm:text-2xl">
            Verloop van de koersdag
          </h2>
          <div className="flex flex-col divide-y divide-rule">
            {[
              { time: "16:30", label: "Inschrijving & rugnummers ophalen (Het huis)" },
              { time: "17:15", label: "Opwarmingsronde Dorpelingenkoers" },
              { time: "17:30", label: "Start Dorpelingenkoers (32 km · 14 ronden)" },
              { time: "19:15", label: "Opwarmingsronde FUN-wedstrijd" },
              { time: "19:30", label: "Start FUN-wedstrijd (46 km · 20 ronden)" },
              { time: "21:00", label: "Huldiging aan Café de Zijbeuk" },
            ].map(({ time, label }) => (
              <div key={time} className="flex gap-6 py-4 first:pt-0 last:pb-0">
                <p className="w-12 shrink-0 font-mono text-sm font-medium tabular-nums text-ink-2">
                  {time}
                </p>
                <p className="text-sm font-medium text-ink">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Route ───────────────────────────────────────── */}
        <div className="mt-6 rounded-2xl border border-rule bg-surface px-6 py-6 sm:px-8 sm:py-8">
          <p className="mb-2 text-[0.6875rem] font-semibold uppercase tracking-widest text-pink">
            Parcours · 2,3 km per ronde
          </p>
          <h2 className="mb-3 text-xl font-bold tracking-tight text-ink sm:text-2xl">
            Afgesloten circuit
          </h2>
          <p className="text-sm leading-relaxed text-ink-2">
            Provinciebaan (afslag vóór Hellichstraat) → Dorpsplein → Bergstraat → Vijfde
            Liniestraat → Rodenbachlaan → Provinciebaan.
          </p>
          <p className="mt-3 text-sm text-ink-2">
            Verkeer verboden van 16:30 tot 21:00.
          </p>
        </div>

        {/* ── CTA ────────────────────────────────────────────── */}
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/dorpelingenkoers/inschrijven"
            className="rounded-full bg-pink px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-pink/85 hover:shadow-md hover:shadow-pink/20"
          >
            Inschrijven
          </Link>
        </div>
      </div>
    </div>
  );
}
