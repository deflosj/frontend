"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { apiFetch } from "@/lib/api";
import type { CountKey } from "@/components/admin/nav-config";

type Counts = Record<CountKey, number>;

const EMPTY: Counts = { pendingRegistrations: 0, unreadMessages: 0 };

/** Nooit vaker dan dit opnieuw ophalen; de backend heeft een rate limit. */
const MIN_INTERVAL_MS = 60_000;

/** Pagina's waar de tellers net veranderd kunnen zijn (bericht gelezen, inschrijving goedgekeurd). */
const COUNT_PAGES = ["/admin/messages", "/admin/inschrijvingen"];

/**
 * Tellers voor de navigatie (sidebar + mobiele tabbalk).
 * Haalt op bij het laden, als je terugkomt naar het tabblad, en als je een
 * pagina verlaat waar je ze kan veranderd hebben — telkens hoogstens één keer
 * per minuut, behalve na zo'n pagina.
 */
export function useAdminCounts(enabled: boolean): Counts {
  const pathname = usePathname();
  const [counts, setCounts] = useState<Counts>(EMPTY);
  const lastFetch = useRef(0);
  const prevPath = useRef(pathname);

  const load = useCallback(async (force = false) => {
    if (!force && Date.now() - lastFetch.current < MIN_INTERVAL_MS) return;
    lastFetch.current = Date.now();
    const [msgs, regs] = await Promise.allSettled([
      apiFetch<{ status: string }[]>("contact/messages"),
      apiFetch<{ status: string }[]>("registrations"),
    ]);
    setCounts((prev) => ({
      unreadMessages: msgs.status === "fulfilled" ? msgs.value.filter((m) => m.status === "UNREAD").length : prev.unreadMessages,
      pendingRegistrations: regs.status === "fulfilled" ? regs.value.filter((r) => r.status === "PENDING").length : prev.pendingRegistrations,
    }));
  }, []);

  // Eerste keer, en bij terugkeren naar het tabblad.
  useEffect(() => {
    if (!enabled) return;
    void load(true);
    const onVisible = () => { if (document.visibilityState === "visible") void load(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [enabled, load]);

  // Na het verlaten van berichten of inschrijvingen: meteen bijwerken.
  useEffect(() => {
    const left = prevPath.current;
    prevPath.current = pathname;
    if (enabled && left !== pathname && COUNT_PAGES.some((p) => left.startsWith(p))) void load(true);
  }, [enabled, load, pathname]);

  return counts;
}
