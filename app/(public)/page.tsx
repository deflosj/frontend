import Link from "next/link";

import { featureCards, homeHighlights, sponsors, weeklyProgram } from "@/lib/site-content";
import { siteConfig } from "@/lib/site-config";

export default function HomePage() {
  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-20">
          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[1fr_260px] lg:gap-12">
            <div>
              <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-amber-500">
                {siteConfig.name} — {siteConfig.location}
              </p>
              <h1 className="mb-5 text-4xl font-bold leading-[1.06] tracking-tight text-gray-900 sm:text-5xl lg:text-7xl">
                Sfeer, sport<br />en gemeenschap.
              </h1>
              <p className="mb-7 max-w-lg text-base leading-relaxed text-gray-500 sm:text-lg">
                De Flosj brengt elk jaar sport en sfeer naar Rotselaar, van het petanquetornooi
                tot de dorpelingenkoers tot de kermis. Iedereen is welkom.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/toernooi"
                  className="rounded-full bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-700"
                >
                  Bekijk het toernooi
                </Link>
                <Link
                  href="/dorpelingenkoers"
                  className="rounded-full border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50"
                >
                  Dorpelingenkoers
                </Link>
              </div>
            </div>

            {/* Highlights — stacked horizontally on mobile, column on desktop */}
            <div className="grid grid-cols-3 gap-3 lg:grid-cols-1">
              {homeHighlights.map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 lg:px-5 lg:py-4"
                >
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                    {item.label}
                  </p>
                  <p className="mt-1 text-base font-bold text-gray-900 lg:text-xl">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Feature cards ────────────────────────────────────── */}
      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
          <div className="mb-8">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-amber-500">
              Ontdek
            </p>
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Alles wat De Flosj te bieden heeft
            </h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {featureCards.map((card) => (
              <Link
                key={card.title}
                href={card.href}
                className="group flex flex-col rounded-2xl border border-gray-100 bg-gray-50 p-5 transition-colors hover:border-amber-200 hover:bg-amber-50 sm:p-6"
              >
                <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-amber-500">
                  {card.eyebrow}
                </p>
                <h3 className="mb-2 text-base font-semibold leading-snug text-gray-900 sm:text-lg">
                  {card.title}
                </h3>
                <p className="flex-1 text-sm leading-relaxed text-gray-500">{card.description}</p>
                <span className="mt-4 text-sm font-semibold text-gray-900 group-hover:underline">
                  Meer lezen →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Program + Sponsors ───────────────────────────────── */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
          <div className="grid gap-12 lg:grid-cols-2">
            {/* Program */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-amber-500">
                Programma
              </p>
              <h2 className="mb-8 text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
                De dag in een oogopslag
              </h2>

              <ol>
                {weeklyProgram.map((item, i) => (
                  <li key={item.time} className="relative flex gap-4 pb-7 last:pb-0">
                    {i < weeklyProgram.length - 1 && (
                      <div className="absolute left-4.75 top-9 h-full w-px bg-gray-100" />
                    )}
                    <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-xs font-bold tabular-nums text-gray-400">
                      {i + 1}
                    </div>
                    <div className="pt-1.5">
                      <p className="mb-0.5 text-xs font-semibold tracking-widest text-amber-500">
                        {item.time}
                      </p>
                      <h3 className="font-semibold text-gray-900">{item.title}</h3>
                      <p className="mt-0.5 text-sm leading-relaxed text-gray-500">
                        {item.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            {/* Sponsors */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-amber-500">
                Partners
              </p>
              <h2 className="mb-8 text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
                Mogelijk gemaakt door onze sponsors
              </h2>

              <div className="grid grid-cols-2 gap-3">
                {sponsors.map((sponsor) => (
                  <div
                    key={sponsor.name}
                    className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-4"
                  >
                    <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                      {sponsor.category}
                    </p>
                    <p className="mt-1 font-semibold text-gray-900">{sponsor.name}</p>
                  </div>
                ))}
              </div>

              <p className="mt-7 text-sm text-gray-400">
                Wil jij ook partner worden van De Flosj?{" "}
                <Link href="/contact" className="font-medium text-gray-900 hover:underline">
                  Neem contact op →
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
