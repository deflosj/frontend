export type RaceCategory = "DORPELINGENKOERS" | "FUN_WEDSTRIJD";
export type RegistrationStatus = "PENDING" | "APPROVED" | "REJECTED";

export const RACE_CATEGORY_LABELS: Record<RaceCategory, string> = {
  DORPELINGENKOERS: "Dorpelingenkoers",
  FUN_WEDSTRIJD: "Fun wedstrijd",
};

export const REGISTRATION_STATUS_LABELS: Record<RegistrationStatus, string> = {
  PENDING: "In afwachting",
  APPROVED: "Goedgekeurd",
  REJECTED: "Afgekeurd",
};

export interface Registration {
  id: number;
  timestamp: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: "M" | "V" | "X";
  address: string;
  nationalRegisterNumber: string;
  email: string;
  phone: string;
  wielerclub: string | null;
  raceCategory: RaceCategory;
  status: RegistrationStatus;
}

export interface RegistrationSettings {
  dorpelingenkoersLimit: number | null;
  funWedstrijdLimit: number | null;
  isOpen: boolean;
}
