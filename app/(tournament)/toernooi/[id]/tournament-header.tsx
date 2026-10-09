"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { ThemeDropdown } from "@/components/layout/theme-dropdown";
import { IconClose, IconHamburger } from "@/components/ui/icons";
import { IconCalendar } from "@/components/ui/icons/IconCalendar";
import { IconDocument } from "@/components/ui/icons/IconDocument";
import { IconGrid } from "@/components/ui/icons/IconGrid";
import { IconTrophy } from "@/components/ui/icons/IconTrophy";
import { IconUsers } from "@/components/ui/icons/IconUsers";
import { siteConfig } from "@/lib/site-config";

function IconHome() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M2 7.5L8 2l6 5.5V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7.5Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="M6 15v-5h4v5" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

const TABS = [
  { label: "Overzicht", segment: "", icon: IconHome },
  { label: "Standen", segment: "poules", icon: IconGrid },
  { label: "Wedstrijden", segment: "matches", icon: IconCalendar },
  { label: "Finale", segment: "brackets", icon: IconTrophy },
  { label: "Teams", segment: "teams", icon: IconUsers },
  { label: "Reglement", segment: "rules", icon: IconDocument },
];

function hrefFor(id: string, segment: string) {
  return segment ? `/toernooi/${id}/${segment}` : `/toernooi/${id}`;
}

function checkIsActive(id: string, segment: string, pathname: string) {
  const href = hrefFor(id, segment);
  return segment
    ? pathname === href || pathname.startsWith(`${href}/`)
    : pathname === `/toernooi/${id}`;
}

interface Props {
  id: string;
  name: string;
  year: number;
  isActive: boolean;
}

/**
 * Schil van het toernooiplatform. Het toernooi staat los van de vzw-site:
 * eigen merk (naam + jaar), eigen navigatie, en enkel onderin het
 * mobiele menu een weg terug naar de hoofdsite.
 */
export function TournamentHeader({ id, name, year, isActive }: Readonly<Props>) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Menu sluit bij navigatie — anders blijft het paneel openstaan op de
  // volgende pagina.
  useEffect(() => setOpen(false), [pathname]);

  const liveBadge = isActive ? (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-pink/15 px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-widest text-pink">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-pink" />
      {"Live"}
    </span>
  ) : null;

  return (
    <header className="sticky top-0 z-40 border-b border-rule bg-paper/85 backdrop-blur-[14px] backdrop-saturate-150">
      <div className="mx-auto flex h-[60px] max-w-6xl items-stretch gap-3 px-5 sm:px-8">
        {/* ── Merk van het toernooi ──────────────────────────── */}
        <Link
          href={hrefFor(id, "")}
          className="group flex min-w-0 shrink items-center gap-2.5"
          aria-label={`${name} ${year}`}
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-pink/20 bg-pink-soft text-pink transition-colors group-hover:border-pink/40">
            <IconTrophy />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold leading-tight text-ink">
              {name}
            </span>
            <span className="block text-[0.625rem] font-bold uppercase tracking-[0.14em] text-pink">
              {year}
            </span>
          </span>
        </Link>

        {/* ── Tabs — desktop ─────────────────────────────────── */}
        <nav
          className="hidden min-w-0 flex-1 items-stretch justify-center overflow-x-auto md:flex [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label="Toernooi navigatie"
        >
          {TABS.map(({ label, segment, icon: Icon }) => {
            const active = checkIsActive(id, segment, pathname);
            return (
              <Link
                key={segment || "overview"}
                href={hrefFor(id, segment)}
                aria-current={active ? "page" : undefined}
                className={`relative flex shrink-0 items-center gap-1.5 px-3 text-[0.8125rem] font-semibold transition-colors ${
                  active ? "text-ink" : "text-ink/35 hover:text-ink/70"
                }`}
              >
                <Icon />
                {label}
                <span
                  className={`absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-pink transition-opacity ${
                    active ? "opacity-100" : "opacity-0"
                  }`}
                />
              </Link>
            );
          })}
        </nav>

        {/* ── Acties ─────────────────────────────────────────── */}
        <div className="ml-auto flex shrink-0 items-center gap-1.5 md:ml-0">
          {liveBadge}
          <div className="hidden md:block">
            <ThemeDropdown />
          </div>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? "Menu sluiten" : "Menu openen"}
            aria-expanded={open}
            className="flex h-9 w-9 items-center justify-center rounded-full text-ink-2 transition-colors hover:bg-ink/5 hover:text-ink md:hidden"
          >
            {open ? <IconClose /> : <IconHamburger />}
          </button>
        </div>
      </div>

      {/* ── Menu — mobiel ────────────────────────────────────── */}
      {open && (
        <div className="animate-dropdown border-t border-rule bg-paper px-5 pb-5 md:hidden">
          <nav className="flex flex-col gap-0.5 pt-2" aria-label="Toernooi navigatie">
            {TABS.map(({ label, segment, icon: Icon }) => {
              const active = checkIsActive(id, segment, pathname);
              return (
                <Link
                  key={segment || "overview"}
                  href={hrefFor(id, segment)}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                    active
                      ? "bg-pink-soft text-pink-ink"
                      : "text-ink-2 hover:bg-ink/5 hover:text-ink"
                  }`}
                >
                  <Icon />
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-2 border-t border-rule pt-2">
            <div className="flex items-center gap-3 rounded-xl px-1.5 text-sm font-medium text-ink-2">
              <ThemeDropdown />
            </div>
            <Link
              href="/"
              className="mt-0.5 flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-ink-2 transition-colors hover:bg-ink/5 hover:text-ink"
            >
              ← Terug naar {siteConfig.name}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
