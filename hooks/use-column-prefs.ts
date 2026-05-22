"use client";

import { useCallback, useMemo, useState } from "react";
import type { ColumnDisplay } from "@/components/admin/table-toolbar";

export interface ColSpec {
  key: string;
  label: string;
  defaultVisible?: boolean;
  fixed?: boolean;
}

function storageKey(tableId: string) {
  return `col-prefs:${tableId}`;
}

function defaultPrefs(specs: ColSpec[]): Record<string, boolean> {
  return Object.fromEntries(
    specs.filter((s) => !s.fixed).map((s) => [s.key, s.defaultVisible ?? true])
  );
}

function readPrefs(tableId: string, specs: ColSpec[]): Record<string, boolean> {
  const defaults = defaultPrefs(specs);
  if (typeof window === "undefined") return defaults;
  try {
    const raw = localStorage.getItem(storageKey(tableId));
    if (raw) {
      const stored = JSON.parse(raw) as Record<string, boolean>;
      // merge: new columns (not yet in storage) fall back to their default
      return { ...defaults, ...stored };
    }
  } catch {
    // ignore parse errors
  }
  return defaults;
}

export function useColumnPrefs(tableId: string, specs: ColSpec[]) {
  const [prefs, setPrefs] = useState<Record<string, boolean>>(() =>
    readPrefs(tableId, specs)
  );

  const toggle = useCallback(
    (key: string) => {
      setPrefs((prev) => {
        const next = { ...prev, [key]: !prev[key] };
        try {
          localStorage.setItem(storageKey(tableId), JSON.stringify(next));
        } catch {
          // ignore storage errors (e.g. private browsing quota)
        }
        return next;
      });
    },
    [tableId]
  );

  const visibleKeys = useMemo(
    () =>
      new Set(
        specs
          .filter((s) => s.fixed || prefs[s.key] !== false)
          .map((s) => s.key)
      ),
    [specs, prefs]
  );

  const columnDisplay: ColumnDisplay[] = useMemo(
    () =>
      specs.map((s) => ({
        key: s.key,
        label: s.label,
        visible: s.fixed ? true : (prefs[s.key] ?? (s.defaultVisible ?? true)),
        fixed: s.fixed,
      })),
    [specs, prefs]
  );

  return { columnDisplay, visibleKeys, toggle };
}
