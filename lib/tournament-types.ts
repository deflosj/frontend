export type Phase =
  | "GROUP_STAGE"
  | "ROUND_OF_32"
  | "ROUND_OF_16"
  | "QUARTER_FINAL"
  | "SEMI_FINAL"
  | "CONSOLATION_FINAL"
  | "FINAL"
  | "TIEBREAK";

export const PHASE_LABELS: Record<Phase, string> = {
  GROUP_STAGE: "Groepsfase",
  ROUND_OF_32: "1/16 finales",
  ROUND_OF_16: "1/8 finales",
  QUARTER_FINAL: "Kwartfinales",
  SEMI_FINAL: "Halve finales",
  CONSOLATION_FINAL: "Troostfinale",
  FINAL: "Finale",
  TIEBREAK: "Tiebreaker",
};

export const PHASE_ORDER: Phase[] = [
  "GROUP_STAGE",
  "ROUND_OF_32",
  "ROUND_OF_16",
  "QUARTER_FINAL",
  "SEMI_FINAL",
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
  /** Inschrijvingsgeld betaald aan de balie. Optioneel: de backend kent
   *  dit veld pas zodra de Prisma-migratie erdoor is. */
  isPaid?: boolean;
  paymentMethod?: string | null;
  /** Sleutel van het teamportaal. Komt ALLEEN mee op adminendpoints —
   *  nooit op het publieke `tournaments/:id`. */
  token?: string;
  /** E-mailadres van de kapitein, om de portaallink naartoe te sturen.
   *  Ook alleen op adminendpoints. */
  email?: string | null;
  phone?: string | null;
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
  scheduledAt: string | null;
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
  /** Gewenst aantal teams per poule, ingesteld bij het aanmaken. */
  teamsPerPoule?: number | null;
  /** Platte tekst; de backend bewaart dit als één veld op het toernooi. */
  rules: string | null;
  rulesUpdatedAt?: string | null;
  /** Tot wanneer teams zichzelf mogen aanpassen via hun portaallink.
   *  null = geen deadline ingesteld. */
  teamEditDeadline?: string | null;
  poules: TournamentPoule[];
  teams: TournamentTeam[];
  matches: TournamentMatch[];
}

// ── Teamportaal ───────────────────────────────────────────────────────────────

/** Antwoord van `GET tournaments/teams/portal/:token`. */
export interface TeamPortalData {
  tournament: { id: number; name: string; year: number; isActive: boolean };
  team: TournamentTeam;
  poule: { id: number; name: string } | null;
  /** Enkel de wedstrijden van dit team. */
  matches: TournamentMatch[];
  /** Namen van dit team en zijn tegenstanders, om de wedstrijden te tonen. */
  teams: Pick<TournamentTeam, "id" | "name">[];
  /** false zodra de deadline verstreken is. */
  canEdit: boolean;
  editDeadline: string | null;
}
