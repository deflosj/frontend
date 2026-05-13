import type { Metadata } from "next";
import Link from "next/link";

import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Dorpelingenkoers",
  description: `De dorpelingenkoers van ${siteConfig.name}: uitleg en praktische info.`,
};

const raceDetails = [
  {
    eyebrow: "Deelnemers",
    title: "Voor wie",
    text: "Voor inwoners, supporters en deelnemers die de lokale koers willen meemaken. Geen profs, wel veel sfeer.",
  },
  {
    eyebrow: "Beleving",
    title: "Sfeer",
    text: "Gezellig, toegankelijk en ingebed in de buurt. Supporters langs de kant, deelnemers op de fiets.",
  },
  {
    eyebrow: "Logistiek",
    title: "Praktische aanpak",
    text: "Duidelijke informatie over vertrek, timing, route en contactpunten zodat alles vlot verloopt.",
  },
];

export default function VillageRacePage() {
  return (
    <div>
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="border-b border-rule">
        <div className="mx-auto max-w-5xl px-5 py-14 sm:px-8 sm:py-20">
          <p className="mb-3 text-[0.6875rem] font-semibold uppercase tracking-widest text-pink">
            Dorpelingenkoers
          </p>
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-ink sm:text-5xl">
            De koers van het dorp
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-ink-2">
            Elk jaar brengt De Flosj een fietskoers voor het hele dorp. Open voor iedereen,
            geliefd door iedereen.
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

        {/* ── Programme highlight ─────────────────────────── */}
        <div className="mt-10 rounded-2xl border border-rule bg-surface px-6 py-6 sm:px-8 sm:py-8">
          <p className="mb-2 text-[0.6875rem] font-semibold uppercase tracking-widest text-pink">
            Programma
          </p>
          <h2 className="mb-5 text-xl font-bold tracking-tight text-ink sm:text-2xl">
            Hoe verloopt de koersdag?
          </h2>
          <div className="flex flex-col divide-y divide-rule">
            {[
              { time: "14:00", label: "Deelnemers aanmelden" },
              { time: "15:00", label: "Start dorpelingenkoers" },
              { time: "17:00", label: "Aankomst en huldiging" },
              { time: "17:30", label: "Receptie voor deelnemers" },
            ].map(({ time, label }) => (
              <div key={time} className="flex gap-6 py-4 first:pt-0 last:pb-0">
                <p className="w-12 shrink-0 font-mono text-sm font-medium tabular-nums text-muted">
                  {time}
                </p>
                <p className="text-sm font-medium text-ink">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── CTA ────────────────────────────────────────────── */}
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/contact"
            className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-paper transition-colors hover:bg-ink/80"
          >
            Inschrijven of info aanvragen
          </Link>
          <Link
            href="/toernooi"
            className="rounded-full border border-rule px-5 py-2.5 text-sm font-semibold text-ink-2 transition-colors hover:border-ink/20 hover:text-ink"
          >
            Bekijk ook het toernooi
          </Link>
        </div>
      </div>
    </div>
  );
}
