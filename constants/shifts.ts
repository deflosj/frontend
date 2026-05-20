import { Shift, TaskStatus, RSVPStatus } from "@/types/shifts";

export const SHIFTS: Shift[] = ["SETUP", "DURING", "BREAKDOWN"];

export const SHIFT_COLORS: Record<Shift, { bar: string; bg: string; border: string }> = {
  SETUP:     { bar: "#3b82f6", bg: "#eff6ff", border: "#bfdbfe" },
  DURING:    { bar: "#22c55e", bg: "#f0fdf4", border: "#bbf7d0" },
  BREAKDOWN: { bar: "#f59e0b", bg: "#fffbeb", border: "#fde68a" },
};

export const SHIFT_LABELS: Record<Shift, string> = {
  SETUP: "Opbouw",
  DURING: "Tijdens",
  BREAKDOWN: "Afbouw",
};
export const STATUS_META: Record<TaskStatus, { label: string; badge: string }> = {
  OPEN:        { label: "Open",     badge: "badge--gray"   },
  IN_PROGRESS: { label: "Bezig",    badge: "badge--yellow" },
  DONE:        { label: "Afgerond", badge: "badge--green"  },
};

export const RSVP_CLASS: Record<RSVPStatus, string> = {
  NO_RESPONSE: "badge--gray",
  YES:         "badge--green",
  NO:          "badge--red",
};

export const RSVP_LABEL: Record<RSVPStatus, string> = {
  NO_RESPONSE: "Geen reactie",
  YES:         "Aanwezig",
  NO:          "Afwezig",
};