import { Task } from "@/types/shifts";

export function fmtTime(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("nl-BE", { hour: "2-digit", minute: "2-digit" });
}

export function isoToTimeInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** Converts an ISO datetime string to a "YYYY-MM-DD" value for a date input (local time). */
export function isoToDateInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Combines a "YYYY-MM-DD" date and "HH:MM" time into a UTC ISO string using local time. */
export function dateTimeToISO(dateStr: string, timeStr: string): string | null {
  if (!dateStr || !timeStr) return null;
  const [y, mo, d] = dateStr.split("-").map(Number);
  const [h, m] = timeStr.split(":").map(Number);
  return new Date(y, mo - 1, d, h, m, 0, 0).toISOString();
}

/** Returns a new "YYYY-MM-DD" string offset by n days. */
export function addDays(dateStr: string, n: number): string {
  const [y, mo, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, mo - 1, d + n);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}

export function timeInputToISO(dayISO: string, time: string): string | null {
  if (!time) return null;
  const base = new Date(dayISO);
  const [h, m] = time.split(":").map(Number);
  base.setHours(h, m, 0, 0);
  return base.toISOString();
}

export function getEventDays(startsAt: string, endsAt: string | null): Date[] {
  const start = new Date(startsAt);
  start.setHours(0, 0, 0, 0);
  const end = endsAt ? new Date(endsAt) : new Date(startsAt);
  end.setHours(0, 0, 0, 0);
  const days: Date[] = [];
  const cur = new Date(start);
  while (cur <= end) {
    days.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

export function taskMatchesDay(task: Task, day: Date): boolean {
  if (!task.startAt) return true; // timeless tasks show on every day
  const taskDay = new Date(task.startAt);
  return (
    taskDay.getFullYear() === day.getFullYear() &&
    taskDay.getMonth() === day.getMonth() &&
    taskDay.getDate() === day.getDate()
  );
}

export function fmtDayTab(date: Date): string {
  return date.toLocaleDateString("nl-BE", { weekday: "short", day: "numeric", month: "short" });
}