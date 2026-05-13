import Link from "next/link";

import { siteConfig } from "@/lib/site-config";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-rule bg-surface">
      <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          {/* Brand */}
          <div>
            <div className="mb-3 flex items-center gap-3">
              <span className="relative flex h-7 w-7 shrink-0 rounded-lg bg-pink" aria-hidden="true">
                <span className="absolute inset-1.5 rounded-[3px] bg-surface" />
              </span>
              <span className="text-sm font-semibold text-ink">{siteConfig.name}</span>
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-muted">
              Sport, sfeer en gemeenschap in Rotselaar. Elk jaar opnieuw.
            </p>
          </div>

          {/* Nav + contact */}
          <div className="flex flex-col gap-6 sm:flex-row sm:gap-12">
            <div>
              <p className="mb-3 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-muted">
                Navigatie
              </p>
              <ul className="flex flex-col gap-2">
                {siteConfig.navigation.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-sm text-ink-2 transition-colors hover:text-ink"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="mb-3 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-muted">
                Contact
              </p>
              <ul className="flex flex-col gap-2">
                <li>
                  <Link
                    href={`mailto:${siteConfig.email}`}
                    className="text-sm text-ink-2 transition-colors hover:text-ink"
                  >
                    {siteConfig.email}
                  </Link>
                </li>
                <li>
                  <Link
                    href={`tel:${siteConfig.phone}`}
                    className="text-sm text-ink-2 transition-colors hover:text-ink"
                  >
                    {siteConfig.phone}
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-rule pt-6 flex items-center justify-between gap-4">
          <p className="text-xs text-muted">
            © {year} {siteConfig.name} — {siteConfig.location}
          </p>
          <p className="text-xs text-muted">Vzw</p>
        </div>
      </div>
    </footer>
  );
}
