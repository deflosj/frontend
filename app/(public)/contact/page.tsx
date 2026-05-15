import type { Metadata } from "next";
import Link from "next/link";

import { ContactForm } from "@/components/contact-form";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Contact",
  description: `Contacteer ${siteConfig.name} voor vragen over toernooi, koers of vereniging.`,
};

function IconMail() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <rect x="2" y="4.5" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2 7l7 5 7-5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function IconPhone() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d="M5.5 2.5h2a1 1 0 0 1 1 1v2.5a1 1 0 0 1-.65.94L6.7 7.5C7.6 9.55 8.45 10.4 10.5 11.3l.56-1.15a1 1 0 0 1 .94-.65H14.5a1 1 0 0 1 1 1v2A1.5 1.5 0 0 1 14 15C8.48 15 3 9.52 3 4a1.5 1.5 0 0 1 1.5-1.5h1Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconPin() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d="M9 1.5A5 5 0 0 1 14 6.5c0 3.75-5 10-5 10S4 10.25 4 6.5A5 5 0 0 1 9 1.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="9" cy="6.5" r="2" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

const contactDetails = [
  {
    label: "E-mail",
    value: siteConfig.email,
    href: `mailto:${siteConfig.email}`,
    description: "We antwoorden binnen de 2 werkdagen.",
    Icon: IconMail,
  },
  {
    label: "Telefoon",
    value: siteConfig.phone,
    href: `tel:${siteConfig.phone}`,
    description: "Bereikbaar op weekdagen van 9u tot 18u.",
    Icon: IconPhone,
  },
  {
    label: "Locatie",
    value: siteConfig.location,
    href: "https://maps.google.com/?q=Rotselaar",
    description: "Alle evenementen vinden plaats in Rotselaar.",
    Icon: IconPin,
  },
];

export default function ContactPage() {
  return (
    <div className="lg:grid lg:grid-cols-[420px_1fr]">
      {/* ── Left — info panel ──────────────────────────────── */}
      <div className="flex items-center border-b border-rule bg-surface px-8 py-16 lg:min-h-[calc(100vh-61px)] lg:border-b-0 lg:border-r lg:px-14">
        <div className="w-full max-w-85">
          <p className="mb-4 text-[0.6875rem] font-semibold uppercase tracking-widest text-pink">
            Contact
          </p>
          <h1 className="mb-5 text-3xl font-bold tracking-tight text-ink sm:text-[2.5rem] sm:leading-[1.1]">
            Neem contact op
          </h1>
          <p className="mb-14 text-base leading-relaxed text-ink-2">
            Vragen over het toernooi, de dorpelingenkoers of de vereniging?
            We horen graag van je.
          </p>

          <div className="flex flex-col gap-6">
            {contactDetails.map(({ label, value, href, description, Icon }) => (
              <Link
                key={label}
                href={href}
                target={href.startsWith("http") ? "_blank" : undefined}
                rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                className="group flex items-start gap-4"
              >
                {/* icon */}
                <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-rule bg-paper text-muted transition-all duration-200 group-hover:border-pink/25 group-hover:bg-pink-soft group-hover:text-pink">
                  <Icon />
                </span>

                {/* text */}
                <div className="transition-transform duration-200 group-hover:translate-x-0.5">
                  <p className="mb-0.5 text-[0.625rem] font-semibold uppercase tracking-widest text-muted">
                    {label}
                  </p>
                  <p className="text-sm font-medium text-ink group-hover:text-pink">
                    {value}
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted">{description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right — form panel ─────────────────────────────── */}
      <div className="flex items-center justify-center px-8 py-16 lg:min-h-[calc(100vh-61px)] lg:px-16">
        <div className="w-full max-w-lg">
          <p className="mb-3 text-[0.6875rem] font-semibold uppercase tracking-widest text-pink">
            Stuur een bericht
          </p>
          <h2 className="mb-12 text-2xl font-bold tracking-tight text-ink">
            We zijn er voor je
          </h2>
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
