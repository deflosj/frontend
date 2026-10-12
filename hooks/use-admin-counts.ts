"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { apiFetch } from "@/lib/api";
import type { CountKey } from "@/components/admin/nav-config";

type Counts = Record<CountKey, number>;

const EMPTY: Counts = { pendingRegistrations: 0, unreadMessages: 0 };

/**
 * Tellers voor de navigatie (sidebar + mobiele tabbalk).
 * Wordt opnieuw opgehaald bij elke paginawissel, zodat een bericht dat je
 * net las meteen uit de teller verdwijnt.
 */
export function useAdminCounts(enabled: boolean): Counts {
  const pathname = usePathname();
  const [counts, setCounts] = useState<Counts>(EMPTY);

  const load = useCallback(async () => {
    const [msgs, regs] = await Promise.allSettled([
      apiFetch<{ status: string }[]>("contact/messages"),
      apiFetch<{ status: string }[]>("registrations"),
    ]);
    setCounts({
      unreadMessages: msgs.status === "fulfilled" ? msgs.value.filter((m) => m.status === "UNREAD").length : 0,
      pendingRegistrations: regs.status === "fulfilled" ? regs.value.filter((r) => r.status === "PENDING").length : 0,
    });
  }, []);

  useEffect(() => {
    if (enabled) void load();
  }, [enabled, load, pathname]);

  return counts;
}
