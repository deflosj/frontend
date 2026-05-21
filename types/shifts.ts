// ── Legacy task types (kept for backward compat) ──────────────────────────────

export type Shift = "SETUP" | "DURING" | "BREAKDOWN";
export type TaskStatus = "OPEN" | "IN_PROGRESS" | "DONE";
export type RSVPStatus = "NO_RESPONSE" | "YES" | "NO";

export interface TaskAssignee {
  id: number;
  name: string;
  email: string | null;
  userId: number | null;
}

export interface Task {
  id: number;
  eventId: number;
  title: string;
  description: string | null;
  shift: Shift;
  maxHelpers: number | null;
  assignees: TaskAssignee[];
  startAt: string | null;
  endAt: string | null;
  status: TaskStatus;
}

export interface Attendee {
  id: number;
  name: string;
  email: string | null;
  status: RSVPStatus;
  user: { id: number; username: string; email: string } | null;
}

export interface TaskFormData {
  title: string;
  description: string;
  shift: Shift;
  startTime: string;
  endTime: string;
  maxHelpers: number | null;
  status: TaskStatus;
}

// ── Shift group / slot types ───────────────────────────────────────────────────

export type SlotStatus = "OPEN" | "ALMOST_FULL" | "FULL" | "CLOSED";

export interface ShiftRegistration {
  id: number;
  slotId: number;
  userId: number | null;
  name: string;
  email: string | null;
  createdAt: string;
}

export interface ShiftSlot {
  id: number;
  groupId: number;
  title: string | null;
  startAt: string;
  endAt: string;
  maxPersons: number | null;
  isUnlimited: boolean;
  description: string | null;
  location: string | null;
  requiredRole: string | null;
  isLocked: boolean;
  isClosed: boolean;
  notes: string | null;
  registrations: ShiftRegistration[];
}

export interface ShiftGroup {
  id: number;
  eventId: number;
  name: string;
  description: string | null;
  color: string;
  icon: string | null;
  sortOrder: number;
  slots: ShiftSlot[];
}

export interface ShiftGroupFormData {
  name: string;
  description: string;
  color: string;
  icon: string;
}

export interface SlotFormData {
  title: string;
  startTime: string;
  endTime: string;
  maxPersons: number | null;
  isUnlimited: boolean;
  description: string;
  location: string;
  requiredRole: string;
  notes: string;
}
