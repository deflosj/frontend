import type { Metadata } from "next";
import Link from "next/link";

import { ContactForm } from "@/components/contact-form";
import { siteConfig } from "@/lib/site-config";
import { IconFacebook, IconInstagram, IconMail, IconPin } from "@/components/ui/icons";

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
    Icon: IconMail,
  },
  {
    label: "Locatie",
    value: siteConfig.location,
    href: "https://maps.google.com/?q=Rotselaar",
    description: "Alle evenementen vinden plaats in Rotselaar.",
    Icon: IconPin,
  },
];

const socialLinks = [
  { label: "Facebook", href: siteConfig.socials.facebook, Icon: IconFacebook },
  { label: "Instagram", href: siteConfig.socials.instagram, Icon: IconInstagram },
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
            Vragen over het toernooi, de dorpelingenkoers of de vereniging?
            We horen graag van je.
          </p>
        </div>
      </div>

      {/* ── Content ────────────────────────────────────────── */}
      <div className="mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-[280px_1fr] lg:gap-16">

          {/* ── Left: contact details + social ─────────────── */}
          <div className="flex flex-col gap-3">
            {contactDetails.map(({ label, value, href, description, Icon }) => (
              <Link
                key={label}
                href={href}
                target={href.startsWith("http") ? "_blank" : undefined}
                rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                className="group flex items-start gap-4 rounded-2xl border border-rule bg-surface px-5 py-4 transition-colors duration-200 hover:border-pink/25 hover:bg-pink-soft/20"
              >
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-rule bg-paper text-ink-2 transition-colors duration-200 group-hover:border-pink/25 group-hover:bg-pink-soft group-hover:text-pink">
                  <Icon />
                </span>
                <div>
                  <p className="mb-0.5 text-[0.625rem] font-semibold uppercase tracking-widest text-ink-2">
                    {label}
                  </p>
                  <p className="text-sm font-medium text-ink group-hover:text-pink">
                    {value}
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-ink-2">{description}</p>
                </div>
              </Link>
            ))}

            {/* Social */}
            <div className="mt-2 rounded-2xl border border-rule bg-surface px-5 py-4">
              <p className="mb-3 text-[0.625rem] font-semibold uppercase tracking-widest text-ink-2">
                Volg ons
              </p>
              {/* Social icons */}
              <div className="flex items-center gap-2">
                {/* Facebook — hover: brand blue */}
                <a
                  href={siteConfig.socials.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-ink/20 text-ink transition-all duration-200 hover:border-[#1877F2]/50 hover:bg-[#1877F2]/15 hover:text-[#1877F2]"
                >
                  <IconFacebook />
                </a>

                {/* Instagram — hover: brand magenta */}
                <a
                  href={siteConfig.socials.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-ink/20 text-ink transition-all duration-200 hover:border-[#E1306C]/50 hover:bg-[#E1306C]/15 hover:text-[#E1306C]"
                >
                  <IconInstagram />
                </a>
              </div>
            </div>
          </div>

          {/* ── Right: form ────────────────────────────────── */}
          <div className="rounded-2xl border border-rule bg-surface px-6 py-8 sm:px-8 sm:py-10">
            <ContactForm />
          </div>
        </div>
      </div>
    </div>
  );
}
