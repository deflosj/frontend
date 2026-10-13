"use client";

import { useEffect, useRef } from "react";

// ── Modal hook ────────────────────────────────────────────────────────────────

/**
 * Opent een native <dialog> als modal zolang de component gemount is.
 * Sluiten via Escape loopt over het `cancel`-event (zie onCancel op de dialog),
 * niet over `close`: in dev mount React StrictMode effecten twee keer, en de
 * close() uit de eerste cleanup vuurde dan een `close`-event dat de dialog
 * meteen weer wegklikte. Daardoor leek "Verwijderen" niets te doen.
 */
export function useDialogModal() {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!el.open) el.showModal();
    return () => { if (el.open) el.close(); };
  }, []);
  return ref;
}

/** Escape op een native dialog: zelf afhandelen i.p.v. de browser te laten sluiten. */
export function escapeTo(fn: () => void) {
  return (e: React.SyntheticEvent<HTMLDialogElement>) => {
    e.preventDefault();
    fn();
  };
}

// ── Shared input style ────────────────────────────────────────────────────────

export const fieldInput: React.CSSProperties = {
  width: "100%",
  padding: "0.6rem 0.875rem",
  border: "1px solid var(--border)",
  borderRadius: "10px",
  background: "var(--bg)",
  color: "var(--text)",
  fontSize: "0.9rem",
  fontFamily: "inherit",
  outline: "none",
  transition: "border-color 120ms ease",
};

export const smallInput: React.CSSProperties = {
  height: 34,
  padding: "0 0.5rem",
  border: "1px solid var(--border)",
  borderRadius: 8,
  background: "var(--surface)",
  color: "var(--text)",
  fontSize: "0.85rem",
  fontFamily: "inherit",
  outline: "none",
  textAlign: "center" as const,
};
