"use client";

import { useState } from "react";

import { apiFetch } from "@/lib/api";
import type { TournamentTeam } from "@/lib/tournament-types";

export function portalUrl(token: string): string {
  const origin = globalThis.window === undefined ? "" : globalThis.location.origin;
  return `${origin}/mijn-team/${token}`;
}

/**
 * Kopieer- en mailknop voor de portaallink van één team. Toont niets zolang de
 * backend nog geen token meestuurt, zodat dit scherm blijft werken vóór de
 * migratie.
 */
export function TeamLinkActions({
  tournamentId,
  team,
}: Readonly<{ tournamentId: number; team: TournamentTeam }>) {
  const [state, setState] = useState<"idle" | "copied" | "sending" | "sent" | "failed">("idle");

  if (!team.token) {
    return <span style={{ color: "var(--ink-2)", fontSize: "0.8rem" }}>—</span>;
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(portalUrl(team.token as string));
      setState("copied");
      setTimeout(() => setState("idle"), 1800);
    } catch {
      setState("failed");
    }
  }

  async function sendMail() {
    setState("sending");
    try {
      await apiFetch(`tournaments/${tournamentId}/teams/${team.id}/send-link`, {
        method: "POST",
        body: JSON.stringify({ email: team.email ?? undefined }),
      });
      setState("sent");
      setTimeout(() => setState("idle"), 2400);
    } catch {
      setState("failed");
    }
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", flexWrap: "wrap" }}>
      <button type="button" className="btn-sm btn-sm--ghost" onClick={copy}>
        {state === "copied" ? "✓ Gekopieerd" : "Kopieer link"}
      </button>
      <button
        type="button"
        className="btn-sm btn-sm--ghost"
        onClick={sendMail}
        disabled={!team.email || state === "sending"}
        title={team.email ?? "Geen e-mailadres bekend"}
      >
        {state === "sending" ? "Bezig…" : state === "sent" ? "✓ Verstuurd" : "Mail"}
      </button>
      {state === "failed" && (
        <span style={{ color: "var(--accent-error, crimson)", fontSize: "0.75rem" }}>
          Mislukt
        </span>
      )}
    </div>
  );
}
