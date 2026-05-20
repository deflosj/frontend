"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

import { siteConfig } from "@/lib/site-config";
import {
  IconSun,
  IconMoon,
  IconMonitor,
  IconUser,
  IconCheck,
  IconHamburger,
  IconClose,
} from "@/components/ui/icons";

// ── Theme ─────────────────────────────────────────────────────────────────────

type Theme = "light" | "dark" | "system";

const THEME_OPTIONS: { key: Theme; label: string; Icon: () => React.ReactElement }[] = [
  { key: "light",  label: "Licht",   Icon: IconSun     },
  { key: "dark",   label: "Donker",  Icon: IconMoon    },
  { key: "system", label: "Systeem", Icon: IconMonitor },
];

function useTheme() {
  const [theme, setTheme] = useState<Theme>("system");
  useEffect(() => {
    const stored = localStorage.getItem("theme") as Theme | null;
    setTheme(stored === "light" || stored === "dark" ? stored : "system");
  }, []);
  function apply(t: Theme) {
    setTheme(t);
    if (t === "system") {
      localStorage.removeItem("theme");
      document.documentElement.classList.toggle("dark",
        globalThis.matchMedia("(prefers-color-scheme: dark)").matches);
    } else {
      localStorage.setItem("theme", t);
      document.documentElement.classList.toggle("dark", t === "dark");
    }
  }
  return { theme, apply };
}

// ── Theme dropdown ────────────────────────────────────────────────────────────

function ThemeDropdown() {
  const { theme, apply } = useTheme();
  const [isDark, setIsDark] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  function handleApply(t: Theme) {
    apply(t);
    setOpen(false);
    setIsDark(
      t === "system"
        ? globalThis.matchMedia("(prefers-color-scheme: dark)").matches
        : t === "dark"
    );
  }

  const ActiveIcon = isDark ? IconMoon : IconSun;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Thema wijzigen"
        aria-expanded={open}
        className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors duration-150 ${
          open ? "bg-ink/8 text-ink" : "text-ink-2 hover:bg-ink/5 hover:text-ink"
        }`}
      >
        <ActiveIcon />
      </button>

      {open && (
        <div className="animate-dropdown absolute right-0 top-full z-50 mt-2 w-44 overflow-hidden rounded-xl border border-rule bg-paper shadow-lg shadow-ink/8">
          {THEME_OPTIONS.map(({ key, label, Icon }) => {
            const active = theme === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleApply(key)}
                className={`flex w-full items-center gap-3 px-3.5 py-2.5 text-sm transition-colors duration-100 hover:bg-ink/5 ${
                  active ? "text-pink" : "text-ink-2 hover:text-ink"
                }`}
              >
                <Icon />
                <span className="flex-1 text-left">{label}</span>
                {active && <IconCheck />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

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
          <ThemeDropdown />

          {/* User / login */}
          <Link
            href="/login"
            aria-label="Inloggen"
            className="flex h-9 w-9 items-center justify-center rounded-full text-ink-2 transition-colors duration-150 hover:bg-ink/5 hover:text-ink"
          >
            <IconUser />
          </Link>

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
          </nav>

          {/* Divider */}
          <div className="my-3 h-px bg-rule" />

          {/* Mobile theme row */}
          <MobileThemeRow />
        </div>
      )}
    </header>
  );
}

// ── Mobile theme row (isolated so hooks aren't called in a loop) ──────────────

function MobileThemeRow() {
  const { theme, apply } = useTheme();

  return (
    <div className="flex items-center gap-1.5">
      <p className="mr-2 text-[0.625rem] font-semibold uppercase tracking-widest text-ink-2">
        Thema
      </p>
      {THEME_OPTIONS.map(({ key, label, Icon }) => (
        <button
          key={key}
          type="button"
          onClick={() => apply(key)}
          aria-label={label}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors duration-150 ${
            theme === key
              ? "bg-pink-soft text-pink-ink"
              : "text-ink-2 hover:bg-ink/5 hover:text-ink"
          }`}
        >
          <Icon />
          {label}
        </button>
      ))}
    </div>
  );
}
