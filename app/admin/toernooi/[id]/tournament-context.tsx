"use client";

import { createContext, useContext } from "react";
import type { ActiveTournament } from "@/lib/tournament-types";

interface TournamentContextValue {
  tournament: ActiveTournament;
  /** Vervangt het toernooi in de gedeelde state (na een PATCH of POST). */
  setTournament: (t: ActiveTournament) => void;
  /** Haalt het toernooi opnieuw op bij de backend. */
  reload: () => Promise<void>;
}

const TournamentContext = createContext<TournamentContextValue | null>(null);

export const TournamentProvider = TournamentContext.Provider;

/** Het toernooi dat de layout van /admin/toernooi/[id] geladen heeft. */
export function useTournament(): TournamentContextValue {
  const ctx = useContext(TournamentContext);
  if (!ctx) throw new Error("useTournament moet binnen /admin/toernooi/[id] gebruikt worden.");
  return ctx;
}
