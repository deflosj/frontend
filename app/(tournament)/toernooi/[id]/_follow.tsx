"use client";

import { useParams } from "next/navigation";
import { useCallback, useMemo, useSyncExternalStore } from "react";

/**
 * Ploegen volgen: bezoekers zetten een ster bij ploegen die ze kennen en zien
 * die dan terug in wedstrijden, standen, bracket en het overzicht.
 * Geen account: de lijst staat in localStorage van dit toestel, per toernooi.
 */

const EVENT = "deflosj:follow";
const keyFor = (tournamentId: string) => `deflosj:follow:${tournamentId}`;
const EMPTY = "[]";

function read(key: string): string {
  try {
    return globalThis.localStorage?.getItem(key) ?? EMPTY;
  } catch {
    return EMPTY;
  }
}

function subscribe(cb: () => void) {
  globalThis.addEventListener?.("storage", cb);
  globalThis.addEventListener?.(EVENT, cb);
  return () => {
    globalThis.removeEventListener?.("storage", cb);
    globalThis.removeEventListener?.(EVENT, cb);
  };
}

function parse(raw: string): number[] {
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.filter((x): x is number => Number.isInteger(x)) : [];
  } catch {
    return [];
  }
}

export interface Followed {
  ids: number[];
  set: Set<number>;
  has: (id: number | null | undefined) => boolean;
  toggle: (id: number) => void;
}

export function useFollowed(): Followed {
  const params = useParams<{ id?: string }>();
  const key = keyFor(String(params?.id ?? "x"));
  // Snapshot = de ruwe string, zodat React enkel her-rendert als er echt iets wijzigt.
  const raw = useSyncExternalStore(subscribe, () => read(key), () => EMPTY);
  const ids = useMemo(() => parse(raw), [raw]);
  const set = useMemo(() => new Set(ids), [ids]);

  const toggle = useCallback(
    (id: number) => {
      const cur = parse(read(key));
      const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
      try {
        globalThis.localStorage?.setItem(key, JSON.stringify(next));
      } catch {
        /* privé-venster of opslag geblokkeerd: dan volgt er niets */
      }
      globalThis.dispatchEvent?.(new Event(EVENT));
    },
    [key]
  );

  return { ids, set, has: (id) => id != null && set.has(id), toggle };
}

export function IconStar({ filled = false, size = 18 }: Readonly<{ filled?: boolean; size?: number }>) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
      <path d="m12 3.5 2.6 5.3 5.9.9-4.25 4.1 1 5.85L12 16.9l-5.25 2.75 1-5.85L3.5 9.7l5.9-.9Z" />
    </svg>
  );
}

/** Sterknop: volgen / niet meer volgen. */
export function FollowStar({
  teamId,
  name,
  followed,
  size = "md",
  className = "",
}: Readonly<{ teamId: number; name: string; followed: Followed; size?: "sm" | "md"; className?: string }>) {
  const on = followed.has(teamId);
  const box = size === "sm" ? "h-9 w-9" : "h-11 w-11 md:h-9 md:w-9";
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={on ? `${name} niet meer volgen` : `${name} volgen`}
      title={on ? "Niet meer volgen" : "Volg deze ploeg"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        followed.toggle(teamId);
      }}
      className={`t-press flex ${box} shrink-0 items-center justify-center rounded-lg transition-colors ${
        on ? "text-pink hover:bg-pink/10" : "text-ink-2 hover:bg-ink/5 hover:text-ink"
      } ${className}`}
    >
      <span key={on ? "on" : "off"} className={`inline-flex ${on ? "t-pop" : ""}`}>
        <IconStar filled={on} size={size === "sm" ? 16 : 18} />
      </span>
    </button>
  );
}

/** Klein sterretje naast een naam, puur ter markering. */
export function StarMark() {
  return (
    <span className="mr-1 inline-flex translate-y-[1px] text-pink" aria-label="gevolgd" role="img">
      <IconStar filled size={11} />
    </span>
  );
}

/** Knop met tekst, voor de teampagina. */
export function FollowButton({ teamId, name }: Readonly<{ teamId: number; name: string }>) {
  const followed = useFollowed();
  const on = followed.has(teamId);
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={on ? `${name} niet meer volgen` : `${name} volgen`}
      onClick={() => followed.toggle(teamId)}
      className={`t-press inline-flex h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-bold transition-colors ${
        on ? "border-pink bg-pink-soft text-pink-ink" : "border-rule bg-surface text-ink hover:border-ink-2"
      }`}
    >
      <span key={on ? "on" : "off"} className={`inline-flex ${on ? "t-pop text-pink" : ""}`}>
        <IconStar filled={on} size={16} />
      </span>
      {on ? "Je volgt deze ploeg" : "Volg deze ploeg"}
    </button>
  );
}
