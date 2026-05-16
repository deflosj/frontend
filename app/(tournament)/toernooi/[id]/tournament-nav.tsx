"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { label: "Overzicht", segment: "" },
  { label: "Standen", segment: "poules" },
  { label: "Wedstrijden", segment: "matches" },
  { label: "Finale", segment: "brackets" },
  { label: "Teams", segment: "teams" },
  { label: "Reglement", segment: "rules" },
];

export function TournamentNav({ id }: Readonly<{ id: string }>) {
  const pathname = usePathname();

  return (
    <nav className="flex overflow-x-auto" aria-label="Toernooi navigatie">
      {TABS.map(({ label, segment }) => {
        const href = segment ? `/toernooi/${id}/${segment}` : `/toernooi/${id}`;
        const isActive = segment
          ? pathname === href || pathname.startsWith(`${href}/`)
          : pathname === `/toernooi/${id}`;

        return (
          <Link
            key={segment || "overview"}
            href={href}
            className={`relative shrink-0 px-4 py-3 text-sm font-semibold transition-colors ${
              isActive ? "text-ink" : "text-ink/35 hover:text-ink/70"
            }`}
          >
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
  );
}
