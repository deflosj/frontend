export type Phase =
  | "GROUP"
  | "R16"
  | "R8"
  | "QUARTER"
  | "SEMI"
  | "CONSOLATION_FINAL"
  | "FINAL"
  | "TIEBREAK";

export const PHASE_LABELS: Record<Phase, string> = {
  GROUP: "Groepsfase",
  R16: "Ronde van 16",
  R8: "Ronde van 8",
  QUARTER: "Kwartfinales",
  SEMI: "Halve finales",
  CONSOLATION_FINAL: "Troostfinale",
  FINAL: "Finale",
  TIEBREAK: "Tiebreaker",
};

export const PHASE_ORDER: Phase[] = [
  "GROUP",
  "R16",
  "R8",
  "QUARTER",
  "SEMI",
  "CONSOLATION_FINAL",
  "FINAL",
  "TIEBREAK",
];

export interface TournamentTeam {
  id: number;
  name: string;
  captainName: string;
  speler1: string;
  speler2: string;
  speler3: string;
  speler4: string;
  logoUrl: string | null;
  isPresent: boolean;
  pouleId: number | null;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  saldo: number;
  points: number;
}

export interface TournamentPoule {
  id: number;
  name: string;
  description: string | null;
  phase: Phase;
}

export interface TournamentMatch {
  id: number;
  phase: Phase;
  pouleId: number | null;
  teamAId: number | null;
  teamBId: number | null;
  winnerId: number | null;
  scoreA: number | null;
  scoreB: number | null;
  time: string | null;
  track: number | null;
  bracketPos: string | null;
}

export type TournamentStatus = "UPCOMING" | "ONGOING" | "COMPLETED";

export interface TournamentListItem {
  id: number;
  name: string;
  year: number;
  isActive: boolean;
  status: TournamentStatus;
  createdAt: string;
}

export interface ActiveTournament {
  id: number;
  name: string;
  year: number;
  isActive: boolean;
  rules: { description: string } | null;
  poules: TournamentPoule[];
  teams: TournamentTeam[];
  matches: TournamentMatch[];
}
