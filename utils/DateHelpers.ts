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
  if (!task.startAt) return false;
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