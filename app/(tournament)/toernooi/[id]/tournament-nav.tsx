"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ThemeDropdown } from "@/components/layout/theme-dropdown";

import { IconCalendar } from "@/components/ui/icons/IconCalendar";
import { IconDocument } from "@/components/ui/icons/IconDocument";
import { IconGrid } from "@/components/ui/icons/IconGrid";
import { IconTrophy } from "@/components/ui/icons/IconTrophy";
import { IconUsers } from "@/components/ui/icons/IconUsers";

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

const DESKTOP_TABS = [
  { label: "Overzicht", segment: "", icon: IconHome },
  { label: "Standen", segment: "poules", icon: IconGrid },
  { label: "Wedstrijden", segment: "matches", icon: IconCalendar },
  { label: "Finale", segment: "brackets", icon: IconTrophy },
  { label: "Teams", segment: "teams", icon: IconUsers },
  { label: "Reglement", segment: "rules", icon: IconDocument },
];

const MOBILE_TABS = [
  { label: "Standen", segment: "poules", icon: IconGrid },
  { label: "Wedstrijden", segment: "matches", icon: IconCalendar },
  { label: "Finale", segment: "brackets", icon: IconTrophy },
  { label: "Teams", segment: "teams", icon: IconUsers },
];

function checkIsActive(id: string, segment: string, pathname: string) {
  const href = segment ? `/toernooi/${id}/${segment}` : `/toernooi/${id}`;
  return segment
    ? pathname === href || pathname.startsWith(`${href}/`)
    : pathname === `/toernooi/${id}`;
}

export function TournamentNav({ id, className }: Readonly<{ id: string; className?: string }>) {
  const pathname = usePathname();

  return (
    <>
      {/* ── Desktop top nav (md+) ── */}
      <nav
        className={`hidden md:flex justify-center self-stretch overflow-x-auto ${className ?? ""}`}
        aria-label="Toernooi navigatie"
      >
        {DESKTOP_TABS.map(({ label, segment, icon: Icon }) => {
          const href = segment ? `/toernooi/${id}/${segment}` : `/toernooi/${id}`;
          const isActive = checkIsActive(id, segment, pathname);

          return (
            <Link
              key={segment || "overview"}
              href={href}
              className={`relative flex shrink-0 items-center gap-1.5 self-stretch px-3 text-sm font-semibold transition-colors ${
                isActive ? "text-ink" : "text-ink/35 hover:text-ink/70"
              }`}
            >
              <Icon />
              {label}
              <span
                className={`absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-pink transition-opacity ${
                  isActive ? "opacity-100" : "opacity-0"
                }`}
              />
            </Link>
          );
        })}
      </nav>

      {/* ── Mobile bottom tab bar (< md) ── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 flex md:hidden border-t border-rule bg-paper"
        aria-label="Toernooi navigatie"
      >
        {MOBILE_TABS.map(({ label, segment, icon: Icon }) => {
          const href = `/toernooi/${id}/${segment}`;
          const isActive = checkIsActive(id, segment, pathname);

          return (
            <Link
              key={segment}
              href={href}
              aria-label={label}
              className={`relative flex flex-1 flex-col items-center justify-center py-3 transition-colors ${
                isActive ? "text-pink" : "text-ink/35"
              }`}
              style={{ minHeight: 56 }}
            >
              <Icon />
              {isActive && (
                <span className="mt-1.5 h-1 w-1 rounded-full bg-pink" />
              )}
            </Link>
          );
        })}

        {/* Theme toggle as 5th item */}
        <div className="flex flex-1 items-center justify-center" style={{ minHeight: 56 }}>
          <ThemeDropdown upward />
        </div>
      </nav>
    </>
  );
}
