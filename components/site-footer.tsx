import Link from "next/link";

import { siteConfig } from "@/lib/site-config";

export function SiteFooter() {
  return (
    <footer className="border-t border-gray-100 bg-gray-900">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-1 text-base font-bold text-white">{siteConfig.name}</p>
            <p className="max-w-xs text-sm leading-relaxed text-gray-400">
              {siteConfig.description}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            <Link
              href={`mailto:${siteConfig.email}`}
              className="text-sm text-gray-400 transition-colors hover:text-white"
            >
              {siteConfig.email}
            </Link>
            <Link
              href={`tel:${siteConfig.phone}`}
              className="text-sm text-gray-400 transition-colors hover:text-white"
            >
              {siteConfig.phone}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
