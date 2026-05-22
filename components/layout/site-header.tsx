"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

import { siteConfig } from "@/lib/site-config";
import {
  IconUser,
  IconHamburger,
  IconClose,
} from "@/components/ui/icons";
import { ThemeDropdown } from "./theme-dropdown";

// ── Header ────────────────────────────────────────────────────────────────────

const NAV_ALL = [
  ...siteConfig.navigation.map((item) => ({ ...item, icon: false })),
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-40 border-b border-rule bg-paper/85 backdrop-blur-[14px] backdrop-saturate-150">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-3 sm:px-8">

        {/* ── Brand ──────────────────────────────────────────── */}
        <Link
          href="/"
          className="group flex items-center gap-2.5 shrink-0"
          aria-label={siteConfig.name}
          onClick={() => setOpen(false)}
        >
          <Image
            src="/logo_transparant.png"
            alt={siteConfig.name}
            width={28}
            height={28}
            className="rounded-md transition-opacity duration-200 group-hover:opacity-75"
          />
          <span className="text-sm font-semibold text-ink transition-colors duration-150 group-hover:text-ink/70">
            {siteConfig.name}
          </span>
        </Link>

        {/* ── Desktop nav ────────────────────────────────────── */}
        <nav className="hidden items-center gap-0.5 sm:flex" aria-label="Hoofdnavigatie">
          {siteConfig.navigation.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group relative px-3.5 py-2 text-sm font-medium transition-colors duration-150 ${
                  active ? "text-ink" : "text-ink-2 hover:text-ink"
                }`}
              >
                {item.label}
                {/* animated underline — grows left→right on hover, stays on active */}
                <span
                  className={`absolute bottom-0.5 left-3.5 right-3.5 h-[1.5px] origin-left rounded-full bg-pink transition-transform duration-200 ease-out ${
                    active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                  }`}
                />
              </Link>
            );
          })}
        </nav>

        {/* ── Actions ────────────────────────────────────────── */}
        <div className="flex items-center gap-1 shrink-0">
          <div className="hidden sm:flex sm:items-center sm:gap-1"> 
            <ThemeDropdown />

            {/* User / login */}
            <Link
              href="/login"
              aria-label="Inloggen"
              className="flex h-9 w-9 items-center justify-center rounded-full text-ink-2 transition-colors duration-150 hover:bg-ink/5 hover:text-ink"
            >
              <IconUser />
            </Link>
          </div>
          {/* Hamburger */}
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? "Menu sluiten" : "Menu openen"}
            aria-expanded={open}
            className="flex h-9 w-9 items-center justify-center rounded-full text-ink-2 transition-colors duration-150 hover:bg-ink/5 hover:text-ink sm:hidden"
          >
            {open ? <IconClose /> : <IconHamburger />}
          </button>
        </div>
      </div>

      {/* ── Mobile menu ────────────────────────────────────────── */}
      {open && (
        <div className="animate-dropdown border-t border-rule bg-paper px-5 pb-5 sm:hidden">

          {/* Nav links */}
          <nav className="flex flex-col gap-0.5 pt-2" aria-label="Mobiele navigatie">
            {NAV_ALL.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors duration-150 ${
                  isActive(item.href)
                    ? "bg-pink-soft text-pink-ink"
                    : "text-ink-2 hover:bg-ink/5 hover:text-ink"
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
            {/* Login */}
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="mt-0.5 flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-ink-2 transition-colors duration-150 hover:bg-ink/5 hover:text-ink"
            >
              <IconUser />
              Inloggen
            </Link>
            {/* Mobile theme row */}
            <div
              className="mt-0.5 flex items-center gap-3 rounded-xl px-1.5 text-sm font-medium text-ink-2 transition-colors duration-150 hover:bg-ink/5 hover:text-ink"
            >
              <ThemeDropdown />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}