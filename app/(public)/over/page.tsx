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
            De Flosj VZW is opgericht in 2022 met als doel het dorp van Rotselaar terug leven in te blazen. Dit door geregeld evenementen te organiseren die de mensen dichter bij elkaar brengen.
          </p>
        </div>
      </div>
    </div>
  );
}
