import Link from "next/link";
import Image from "next/image";

import { siteConfig } from "@/lib/site-config";

function IconFacebook() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1Zm1.75 4.5h-1.1c-.38 0-.4.16-.4.42V7H9.75l-.22 1.5H8.25V13h-1.75V8.5H5.5V7h1V5.83C6.5 4.6 7.26 4 8.4 4c.53 0 1.35.08 1.35.08V5.5Z" />
    </svg>
  );
}

function IconInstagram() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="1.5" y="1.5" width="13" height="13" rx="4" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="8" cy="8" r="2.75" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="11.75" cy="4.25" r="0.75" fill="currentColor" />
    </svg>
  );
}

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#16161a] dark:bg-[#0a0a0c]">
      <div className="mx-auto max-w-5xl px-5 sm:px-8">

        {/* ── Main row ───────────────────────────────────────── */}
        <div className="flex flex-col gap-6 py-8 sm:flex-row sm:items-center sm:justify-between">

          {/* Brand */}
          <Link
            href="/"
            className="group flex items-center gap-2.5"
            aria-label={siteConfig.name}
          >
            <Image
              src="/logo.jpg"
              alt={siteConfig.name}
              width={28}
              height={28}
              className="transition-opacity duration-200 group-hover:opacity-80"
            />
            <span className="text-sm font-semibold text-white transition-colors duration-200 group-hover:text-white/80">
              {siteConfig.name}
            </span>
          </Link>

          {/* Nav + socials */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">

            <nav className="flex flex-wrap items-center gap-x-5 gap-y-2" aria-label="Footer navigatie">
              {siteConfig.navigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm text-white transition-colors duration-150 hover:text-white/60"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Separator */}
            <div className="hidden h-4 w-px bg-white/20 sm:block" aria-hidden="true" />

            {/* Social icons */}
            <div className="flex items-center gap-2">
              {/* Facebook — hover: brand blue */}
              <a
                href={siteConfig.socials.facebook}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/20 text-white transition-all duration-200 hover:border-[#1877F2]/50 hover:bg-[#1877F2]/15 hover:text-[#1877F2]"
              >
                <IconFacebook />
              </a>

              {/* Instagram — hover: brand magenta */}
              <a
                href={siteConfig.socials.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/20 text-white transition-all duration-200 hover:border-[#E1306C]/50 hover:bg-[#E1306C]/15 hover:text-[#E1306C]"
              >
                <IconInstagram />
              </a>
            </div>

          </div>
        </div>

        {/* ── Bottom bar ─────────────────────────────────────── */}
        <div className="flex flex-col gap-1.5 border-t border-white/10 py-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-white/40">
            © {year} {siteConfig.name} — {siteConfig.location}
          </p>
          <a
            href={`mailto:${siteConfig.email}`}
            className="text-xs text-white/40 transition-colors duration-150 hover:text-white"
          >
            {siteConfig.email}
          </a>
        </div>

      </div>
    </footer>
  );
}
