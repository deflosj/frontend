import Link from "next/link";
import Image from "next/image";

import { siteConfig } from "@/lib/site-config";
import { IconFacebook, IconInstagram } from "@/components/icons";

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
              src="/logo_transparant.png"
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
