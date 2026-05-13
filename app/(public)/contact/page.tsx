import type { Metadata } from "next";
import Link from "next/link";

import { ContactForm } from "@/components/contact-form";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  description: `Contacteer ${siteConfig.name} voor vragen over toernooi, koers of vereniging.`,
  title: "Contact",
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
    <div className="bg-white">
      {/* ── Header ───────────────────────────────────────────── */}
      <div className="border-b border-gray-200">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-amber-500">
            Contact
          </p>
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Neem contact op
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-gray-500">
            Vragen over het toernooi, de dorpelingenkoers of de vereniging? We horen graag van je.
          </p>
        </div>
      </div>

      {/* ── Main grid ────────────────────────────────────────── */}
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr]">
          {/* Left – contact info */}
          <div>
            <h2 className="mb-6 text-lg font-semibold text-gray-900">Contactgegevens</h2>

            <div className="flex flex-col gap-3">
              {contactDetails.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  target={item.href.startsWith("http") ? "_blank" : undefined}
                  rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="group rounded-2xl border border-gray-100 bg-gray-50 px-5 py-4 transition-colors hover:border-amber-200 hover:bg-amber-50"
                >
                  <p className="mb-0.5 text-xs font-semibold uppercase tracking-widest text-gray-400">
                    {item.label}
                  </p>
                  <p className="font-semibold text-gray-900 group-hover:underline">{item.value}</p>
                  <p className="mt-1 text-xs text-gray-400">{item.description}</p>
                </Link>
              ))}
            </div>
          </div>

          {/* Right – form */}
          <div>
            <h2 className="mb-6 text-lg font-semibold text-gray-900">Stuur een bericht</h2>
            <ContactForm />
          </div>
        </div>
      </div>
    </div>
  );
}
