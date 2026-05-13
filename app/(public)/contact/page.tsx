import type { Metadata } from "next";
import Link from "next/link";

import { ContactForm } from "@/components/contact-form";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Contact",
  description: `Contacteer ${siteConfig.name} voor vragen over toernooi, koers of vereniging.`,
};

const contactDetails = [
  {
    label: "E-mail",
    value: siteConfig.email,
    href: `mailto:${siteConfig.email}`,
    description: "We antwoorden binnen de 2 werkdagen.",
  },
  {
    label: "Telefoon",
    value: siteConfig.phone,
    href: `tel:${siteConfig.phone}`,
    description: "Bereikbaar op weekdagen van 9u tot 18u.",
  },
  {
    label: "Locatie",
    value: siteConfig.location,
    href: "https://maps.google.com/?q=Rotselaar",
    description: "Alle evenementen vinden plaats in Rotselaar.",
  },
];

export default function ContactPage() {
  return (
    <div>
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="border-b border-rule">
        <div className="mx-auto max-w-5xl px-5 py-14 sm:px-8 sm:py-20">
          <p className="mb-3 text-[0.6875rem] font-semibold uppercase tracking-widest text-pink">
            Contact
          </p>
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-ink sm:text-5xl">
            Neem contact op
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-ink-2">
            Vragen over het toernooi, de dorpelingenkoers of de vereniging? We horen graag van je.
          </p>
        </div>
      </div>

      {/* ── Main grid ──────────────────────────────────────── */}
      <div className="mx-auto max-w-5xl px-5 py-14 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr]">
          {/* Left – contact info */}
          <div>
            <h2 className="mb-5 text-base font-semibold text-ink">Contactgegevens</h2>

            <div className="flex flex-col gap-3">
              {contactDetails.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  target={item.href.startsWith("http") ? "_blank" : undefined}
                  rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="group rounded-2xl border border-rule bg-surface px-5 py-4 transition-colors hover:border-pink/30 hover:bg-pink-soft"
                >
                  <p className="mb-0.5 text-[0.625rem] font-semibold uppercase tracking-widest text-muted">
                    {item.label}
                  </p>
                  <p className="font-semibold text-ink group-hover:underline">{item.value}</p>
                  <p className="mt-1 text-xs text-muted">{item.description}</p>
                </Link>
              ))}
            </div>
          </div>

          {/* Right – form */}
          <div>
            <h2 className="mb-5 text-base font-semibold text-ink">Stuur een bericht</h2>
            <ContactForm />
          </div>
        </div>
      </div>
    </div>
  );
}
