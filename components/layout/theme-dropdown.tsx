'use client';

import { Theme, useTheme } from "@/hooks/use-theme";
import { useState, useRef, useEffect } from "react";
import { IconSun, IconMoon, IconMonitor, IconCheck } from "../ui/icons";

const THEME_OPTIONS: { key: Theme; label: string; Icon: () => React.ReactElement }[] = [
  { key: "light",  label: "Licht",   Icon: IconSun     },
  { key: "dark",   label: "Donker",  Icon: IconMoon    },
  { key: "system", label: "Systeem", Icon: IconMonitor },
];

export function ThemeDropdown({ upward = false }: Readonly<{ upward?: boolean }>) {
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
        <div className={`animate-dropdown absolute left-1/2 -translate-x-1/2 z-50 w-44 overflow-hidden rounded-xl border border-rule bg-paper shadow-lg shadow-ink/8 ${upward ? "bottom-full mb-2" : "top-full mt-2"}`}>
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