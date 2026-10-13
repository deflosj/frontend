"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin/members", label: "Leden" },
  { href: "/admin/uitnodigingen", label: "Uitnodigingen" },
];

/** Gedeelde kop voor de module "Leden & toegang". */
export function MembersTabs() {
  const pathname = usePathname();
  return (
    <nav aria-label="Leden & toegang" className="mb-6 flex gap-7 overflow-x-auto border-b border-rule">
      {TABS.map((t) => {
        const active = pathname === t.href || pathname.startsWith(t.href + "/");
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={`-mb-px inline-flex h-11 items-center whitespace-nowrap border-b-2 px-0.5 text-sm transition-colors ${
              active ? "border-pink font-semibold text-ink" : "border-transparent text-ink-2 hover:text-ink"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
