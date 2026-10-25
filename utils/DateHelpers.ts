/**
 * Alle datum/tijd-logica van de site. Alles wordt weergegeven en ingevoerd in
 * Belgische tijd (Europe/Brussels), ongeacht waar de code draait: op de server
 * (UTC), in een browser in het buitenland, of op een laptop met een foute klok-
 * zone. Gebruik NOOIT rechtstreeks toLocale*String, getHours(), setHours() of
 * toISOString().slice() voor iets dat een gebruiker ziet of invult — gebruik
 * de helpers hieronder.
 */

export const EVENT_TZ = "Europe/Brussels";
const LOCALE = "nl-BE";

type DateInput = string | number | Date | null | undefined;

function toDate(value: DateInput): Date | null {
  if (value === null || value === undefined || value === "") return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

const pad = (n: number) => String(n).padStart(2, "0");

const partsFmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: EVENT_TZ,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

/** Kalender- en klokwaarden van een tijdstip zoals een Belg ze op de klok ziet. */
export function brusselsParts(value: DateInput) {
  const d = toDate(value) ?? new Date();
  const get = (type: string) => Number(partsFmt.formatToParts(d).find((p) => p.type === type)?.value);
  return { year: get("year"), month: get("month"), day: get("day"), hour: get("hour"), minute: get("minute"), second: get("second") };
}

/** Verschil (ms) tussen Belgische kloktijd en UTC op dat moment (+1u winter, +2u zomer). */
function offsetMs(d: Date): number {
  const p = brusselsParts(d);
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - Math.floor(d.getTime() / 1000) * 1000;
}

/** Belgische kloktijd → echt tijdstip. Zomer/wintertijd wordt correct afgehandeld. */
export function fromBrussels(year: number, month: number, day: number, hour = 0, minute = 0): Date {
  const guess = Date.UTC(year, month - 1, day, hour, minute);
  let t = guess - offsetMs(new Date(guess));
  t = guess - offsetMs(new Date(t)); // tweede pass voor de nacht van de klokwissel
  return new Date(t);
}

// ── Weergave ──────────────────────────────────────────────────────────────

/** "14:30" */
export function fmtTime(value: DateInput): string {
  const d = toDate(value);
  return d ? d.toLocaleTimeString(LOCALE, { hour: "2-digit", minute: "2-digit", timeZone: EVENT_TZ }) : "";
}

/** Standaard "25/10/2026"; geef opties mee voor bv. { weekday: "long", day: "numeric", month: "long" }. */
export function fmtDate(value: DateInput, opts?: Intl.DateTimeFormatOptions): string {
  const d = toDate(value);
  return d ? d.toLocaleDateString(LOCALE, { ...opts, timeZone: EVENT_TZ }) : "";
}

/** Standaard "25/10/2026 14:30:00"; geef opties mee voor een ander formaat. */
export function fmtDateTime(value: DateInput, opts?: Intl.DateTimeFormatOptions): string {
  const d = toDate(value);
  return d ? d.toLocaleString(LOCALE, { ...opts, timeZone: EVENT_TZ }) : "";
}

/** Belgisch uur (0–23), bv. voor "Goeiemorgen". */
export function brusselsHour(value: DateInput = new Date()): number {
  return brusselsParts(value).hour;
}

/** "2026-10-25" in Belgische tijd (bv. voor bestandsnamen of groeperen per dag). */
export function brusselsDayKey(value: DateInput = new Date()): string {
  const p = brusselsParts(value);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

// ── Formuliervelden ───────────────────────────────────────────────────────

/** ISO → waarde voor <input type="datetime-local"> ("2026-10-25T14:30"). */
export function toDatetimeLocal(value: DateInput): string {
  const d = toDate(value);
  if (!d) return "";
  const p = brusselsParts(d);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}`;
}

/** Waarde van <input type="datetime-local"> → ISO (UTC) string, of null. */
export function fromDatetimeLocal(value: string | null | undefined): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value ?? "");
  if (!m) return null;
  return fromBrussels(+m[1], +m[2], +m[3], +m[4], +m[5]).toISOString();
}

/** ISO → "14:30" voor een tijdveld. */
export function toTimeInput(value: DateInput): string {
  const d = toDate(value);
  if (!d) return "";
  const p = brusselsParts(d);
  return `${pad(p.hour)}:${pad(p.minute)}`;
}

/** Vandaag (Belgische tijd) om hh:mm, als datetime-local waarde. */
export function todayAtLocal(hour: number, minute = 0): string {
  const p = brusselsParts(new Date());
  return `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(hour)}:${pad(minute)}`;
}
