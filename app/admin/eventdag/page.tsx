"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import type { TournamentListItem } from "@/lib/tournament-types";

/**
 * Vaste ingang voor de eventdag-modus (ook voor scheidsrechters):
 * stuurt door naar het actieve toernooi.
 */
export default function EventdayRedirectPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Toernooi zoeken…");

  useEffect(() => {
    apiFetch<TournamentListItem[]>("tournaments")
      .then((list) => {
        const pick = list.find((t) => t.isActive) ?? list.find((t) => t.status === "ONGOING") ?? list.find((t) => t.status !== "COMPLETED");
        if (pick) router.replace(`/admin/toernooi/${pick.id}/eventdag`);
        else setMessage("Er is geen actief toernooi. Vraag een beheerder om het toernooi op actief te zetten.");
      })
      .catch((e) => setMessage(e instanceof Error ? e.message : "Toernooi laden mislukt."));
  }, [router]);

  return <p className="admin-empty">{message}</p>;
}
