import Link from "next/link";

import { featureCards, homeHighlights, weeklyProgram } from "@/lib/site-content";
import { siteConfig } from "@/lib/site-config";

export default function HomePage() {
  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="border-b border-rule">
        <div className="mx-auto max-w-5xl px-5 py-14 sm:px-8 sm:py-24">
          <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[1fr_220px] lg:gap-16">
            <div>
              <p className="mb-5 text-[0.6875rem] font-semibold uppercase tracking-widest text-pink">
                {siteConfig.name} — {siteConfig.location}
              </p>
              <h1 className="mb-6 text-4xl font-bold leading-[1.06] tracking-tight text-ink sm:text-5xl lg:text-6xl">
                Sfeer, sport<br />en gemeenschap.
              </h1>
              <p className="mb-8 max-w-lg text-base leading-relaxed text-ink-2 sm:text-lg">
                De Flosj brengt elk jaar sport en sfeer naar Rotselaar, van het petanquetornooi
                tot de dorpelingenkoers. Iedereen is welkom.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/toernooi"
                  className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-paper transition-colors hover:bg-ink/80"
                >
                  Bekijk het toernooi
                </Link>
                <Link
                  href="/dorpelingenkoers"
                  className="rounded-full border border-rule px-5 py-2.5 text-sm font-semibold text-ink-2 transition-colors hover:border-ink/20 hover:text-ink"
                >
                  Dorpelingenkoers
                </Link>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 lg:grid-cols-1">
              {homeHighlights.map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-rule bg-surface px-4 py-3 lg:px-5 lg:py-4"
                >
                  <p className="text-[0.6rem] font-semibold uppercase tracking-[0.08em] text-muted sm:text-[0.625rem]">
                    {item.label}
                  </p>
                  <p className="mt-1 text-sm font-bold text-ink lg:text-base">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Feature cards ────────────────────────────────────── */}
      <section className="border-b border-rule">
        <div className="mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-16">
          <div className="mb-8">
            <p className="mb-2 text-[0.6875rem] font-semibold uppercase tracking-widest text-pink">
              Ontdek
            </p>
            <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              Alles wat De Flosj te bieden heeft
            </h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {featureCards.map((card) => (
              <Link
                key={card.title}
                href={card.href}
                className="group flex flex-col rounded-2xl border border-rule bg-surface p-5 transition-colors hover:border-pink/30 hover:bg-pink-soft sm:p-6"
              >
                <p className="mb-2 text-[0.625rem] font-semibold uppercase tracking-[0.08em] text-pink">
                  {card.eyebrow}
                </p>
                <h3 className="mb-2 text-base font-semibold leading-snug text-ink sm:text-lg">
                  {card.title}
                </h3>
                <p className="flex-1 text-sm leading-relaxed text-ink-2">{card.description}</p>
                <span className="mt-4 text-sm font-semibold text-ink group-hover:text-pink-ink">
                  Meer lezen →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Day programme ────────────────────────────────────── */}
      <section className="border-b border-rule">
        <div className="mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-16">
          <div className="mb-8">
            <p className="mb-2 text-[0.6875rem] font-semibold uppercase tracking-widest text-pink">
              Programma
            </p>
            <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              Hoe ziet een dag eruit?
            </h2>
          </div>

          <div className="flex flex-col divide-y divide-rule">
            {weeklyProgram.map((item) => (
              <div key={item.time} className="flex gap-6 py-5 first:pt-0 last:pb-0">
                <p className="w-12 shrink-0 font-mono text-sm font-medium tabular-nums text-muted">
                  {item.time}
                </p>
                <div>
                  <p className="text-sm font-semibold text-ink">{item.title}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-ink-2">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section>
        <div className="mx-auto max-w-5xl px-5 py-14 sm:px-8 sm:py-20">
          <div className="rounded-3xl bg-surface border border-rule px-8 py-10 sm:px-12 sm:py-14 text-center">
            <p className="mb-3 text-[0.6875rem] font-semibold uppercase tracking-widest text-pink">
              Meedoen
            </p>
            <h2 className="mb-4 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              Klaar om deel te nemen?
            </h2>
            <p className="mx-auto mb-8 max-w-md text-base leading-relaxed text-ink-2">
              Schrijf je in voor het tornooi of de dorpelingenkoers. Iedereen is welkom,
              van beginner tot gevorderde.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/toernooi"
                className="rounded-full bg-pink px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-pink/85"
              >
                Inschrijven tornooi
              </Link>
              <Link
                href="/contact"
                className="rounded-full border border-rule px-6 py-3 text-sm font-semibold text-ink-2 transition-colors hover:border-ink/20 hover:text-ink"
              >
                Neem contact op
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
