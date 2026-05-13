import type { Metadata } from "next";

import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Over ons",
  description: `Meer over ${siteConfig.name}: missie, sfeer en organisatie.`,
};

export default function AboutPage() {
  return (
    <div>
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="border-b border-rule">
        <div className="mx-auto max-w-5xl px-5 py-14 sm:px-8 sm:py-20">
          <p className="mb-3 text-[0.6875rem] font-semibold uppercase tracking-widest text-pink">
            Over ons
          </p>
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-ink sm:text-5xl">
            Een vereniging uit Rotselaar
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-ink-2">
            De Flosj is een actieve vzw gedragen door vrijwilligers. Wij brengen sport en
            gemeenschap samen in evenementen waar iedereen welkom is.
          </p>
        </div>
      </div>

      {/* ── Content ────────────────────────────────────────── */}
      <div className="mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            {
              title: "Waar we voor staan",
              body: "De Flosj kiest voor duidelijke informatie, warme sfeer en een directe aanpak. De site voelt vertrouwd voor leden en bezoekers, terwijl de structuur klaar is voor verdere groei.",
            },
            {
              title: "Hoe we werken",
              body: "Content groepeert zich rond de belangrijkste acties: meedoen, het toernooi volgen, de dorpskoers ontdekken en contact opnemen met de organisatie.",
            },
            {
              title: "Wat later kan groeien",
              body: "Nieuws, ledeninformatie en beheerde content kunnen later rechtstreeks uit het backend komen zonder dat de publieke structuur opnieuw moet worden uitgevonden.",
            },
            {
              title: "Waarom dit nu nuttig is",
              body: "De site is bruikbaar als eerste release en vormt tegelijk een stabiele basis voor data, authenticatie en beheerde inhoud.",
            },
          ].map(({ title, body }) => (
            <article
              key={title}
              className="rounded-2xl border border-rule bg-surface px-6 py-5"
            >
              <h3 className="mb-2 text-base font-semibold text-ink">{title}</h3>
              <p className="text-sm leading-relaxed text-ink-2">{body}</p>
            </article>
          ))}
        </div>

        {/* ── Contact nudge ───────────────────────────────── */}
        <div className="mt-10 rounded-2xl border border-rule bg-surface px-6 py-6">
          <p className="mb-1 text-[0.6875rem] font-semibold uppercase tracking-widest text-pink">
            Contact
          </p>
          <p className="mb-3 text-sm leading-relaxed text-ink-2">
            Vragen over De Flosj, het toernooi of de dorpelingenkoers?
          </p>
          <div className="flex flex-col gap-1">
            <a
              href={`mailto:${siteConfig.email}`}
              className="text-sm font-medium text-ink hover:text-pink transition-colors"
            >
              {siteConfig.email}
            </a>
            <a
              href={`tel:${siteConfig.phone}`}
              className="text-sm font-medium text-ink hover:text-pink transition-colors"
            >
              {siteConfig.phone}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
