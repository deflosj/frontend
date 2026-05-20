// ── Types ─────────────────────────────────────────────────────────────────────

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