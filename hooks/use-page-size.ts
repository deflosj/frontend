"use client";

import { useCallback, useState } from "react";

function storageKey(tableId: string) {
  return `page-size:${tableId}`;
}

function readPageSize(tableId: string, defaultSize: number): number {
  if (typeof window === "undefined") return defaultSize;
  try {
    const raw = localStorage.getItem(storageKey(tableId));
    if (raw) {
      const parsed = Number(raw);
      if (Number.isFinite(parsed) && parsed > 0) return parsed;
    }
  } catch {
    // ignore
  }
  return defaultSize;
}

export function usePageSize(tableId: string, defaultSize = 25): [number, (size: number) => void] {
  const [pageSize, setPageSize] = useState(() => readPageSize(tableId, defaultSize));

  const save = useCallback(
    (size: number) => {
      setPageSize(size);
      try {
        localStorage.setItem(storageKey(tableId), String(size));
      } catch {
        // ignore storage errors
      }
    },
    [tableId]
  );

  return [pageSize, save];
}
