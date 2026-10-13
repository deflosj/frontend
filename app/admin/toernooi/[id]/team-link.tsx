"use client";

import { useState } from "react";
import { Check, Link2, Mail } from "lucide-react";

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
    return <span className="text-[13px] text-ink-2">—</span>;
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

  const copyLabel = state === "copied" ? "Link gekopieerd" : "Teamlink kopiëren";
  let mailLabel = team.email ? `Teamlink mailen naar ${team.email}` : "Geen e-mailadres bekend";
  if (state === "sending") mailLabel = "Bezig met versturen…";
  if (state === "sent") mailLabel = "Teamlink verstuurd";

  return (
    <div className="flex items-center gap-1.5">
      <button type="button" className="tb-btn tb-btn--ghost tb-btn--icon" onClick={copy} aria-label={copyLabel} title={copyLabel}>
        {state === "copied" ? <Check size={15} className="text-[var(--ok-fg)]" /> : <Link2 size={15} />}
      </button>
      <button
        type="button"
        className="tb-btn tb-btn--ghost tb-btn--icon"
        onClick={sendMail}
        disabled={!team.email || state === "sending"}
        aria-label={mailLabel}
        title={mailLabel}
      >
        {state === "sent" ? <Check size={15} className="text-[var(--ok-fg)]" /> : <Mail size={15} />}
      </button>
      {state === "failed" && <span className="text-xs text-[var(--err-fg)]" role="alert">Mislukt</span>}
    </div>
  );
}
