"use client";

import { ArrowLeft, CalendarDays, FileText, House, LayoutGrid, Menu, Trophy, Users, X } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { ThemeDropdown } from "@/components/layout/theme-dropdown";
import { siteConfig } from "@/lib/site-config";

const TABS = [
  { label: "Overzicht", segment: "", icon: House },
  { label: "Standen", segment: "poules", icon: LayoutGrid },
  { label: "Wedstrijden", segment: "matches", icon: CalendarDays },
  { label: "Finale", segment: "brackets", icon: Trophy },
  { label: "Teams", segment: "teams", icon: Users },
  { label: "Reglement", segment: "rules", icon: FileText },
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
  /** Enkel op de eventdag zelf (zie isTournamentLive). */
  isLive: boolean;
}

/**
 * Schil van het toernooiplatform. Het toernooi staat los van de vzw-site:
 * eigen merk (naam + jaar), eigen navigatie, en links een vaste knop terug
 * naar de hoofdsite (op gsm en laptop).
 */
export function TournamentHeader({ id, name, year, isLive }: Readonly<Props>) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Menu sluit bij navigatie — anders blijft het paneel openstaan op de
  // volgende pagina.
  useEffect(() => setOpen(false), [pathname]);

  const liveBadge = isLive ? (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-pink/15 px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-widest text-pink">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-pink" />
      {"Live"}
    </span>
  ) : null;

  return (
    <header className="sticky top-0 z-40 border-b border-rule bg-paper/85 backdrop-blur-[14px] backdrop-saturate-150">
      <div className="mx-auto flex h-[60px] max-w-6xl items-stretch gap-3 px-5 sm:px-8">
        {/* ── Terug naar de vzw-site ─────────────────────────── */}
        <Link
          href="/"
          title={`Terug naar ${siteConfig.name}`}
          aria-label={`Terug naar ${siteConfig.name}`}
          className="-ml-2 flex shrink-0 items-center gap-1.5 self-center rounded-full px-2 py-1.5 text-[0.8125rem] font-medium text-ink-2 transition-colors hover:bg-ink/5 hover:text-ink"
        >
          <ArrowLeft size={16} strokeWidth={1.75} aria-hidden />
          <span className="hidden lg:inline">{siteConfig.name}</span>
        </Link>
        <span aria-hidden className="my-4 w-px shrink-0 bg-rule" />

        {/* ── Merk van het toernooi ──────────────────────────── */}
        <Link
          href={hrefFor(id, "")}
          className="group flex min-w-0 shrink items-center gap-2.5"
          aria-label={`${name} ${year}`}
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-pink/20 bg-pink-soft text-pink transition-colors group-hover:border-pink/40">
            <Trophy size={15} strokeWidth={1.75} aria-hidden />
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
                className={`relative flex shrink-0 items-center gap-1.5 px-2.5 text-[0.8125rem] lg:px-3 font-semibold transition-colors ${
                  active ? "text-ink" : "text-ink/35 hover:text-ink/70"
                }`}
              >
                <Icon size={15} strokeWidth={1.75} aria-hidden className="hidden lg:block" />
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
            {open ? <X size={16} strokeWidth={1.75} aria-hidden /> : <Menu size={16} strokeWidth={1.75} aria-hidden />}
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
                  <Icon size={15} strokeWidth={1.75} aria-hidden />
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-2 border-t border-rule pt-2">
            <div className="flex items-center gap-3 rounded-xl px-1.5 text-sm font-medium text-ink-2">
              <ThemeDropdown />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
