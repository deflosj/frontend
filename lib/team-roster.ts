import type { TournamentTeam } from "./tournament-types";

export interface RosterEntry {
  name: string;
  captain: boolean;
}

const words = (s: string) => s.trim().toLowerCase().split(/\s+/).filter(Boolean);

/** Zelfde persoon? Alle woorden van de kortste naam zitten in de langste, in
 *  eender welke volgorde. Zo zijn "Noa" en "Noa Tuyls" dezelfde, en ook
 *  "Wouters Roel" en "Roel wouters". "Jan" en "Janne" niet. */
function samePerson(a: string, b: string): boolean {
  const x = words(a);
  const y = words(b);
  if (!x.length || !y.length) return false;
  const [short, long] = x.length <= y.length ? [x, y] : [y, x];
  return short.every((w) => long.includes(w));
}

/** Hoofdletter vooraan elk woord dat met een kleine letter begint
 *  ("Roel wouters" → "Roel Wouters"). De rest van het woord blijft zoals getypt. */
const tidy = (s: string) => s.trim().replace(/\s+/g, " ").replace(/(^|[\s-])(\p{Ll})/gu, (_, sep: string, c: string) => sep + c.toUpperCase());

/** Spelers van een ploeg, kapitein gemarkeerd en nooit dubbel.
 *  Staat de kapitein ook bij de spelers, dan houden we de langste schrijfwijze
 *  (bij gelijke lengte die van de spelerslijst: voornaam eerst). */
export function rosterOf(team: Pick<TournamentTeam, "captainName" | "speler1" | "speler2" | "speler3" | "speler4">): RosterEntry[] {
  const players = [team.speler1, team.speler2, team.speler3, team.speler4].map((p) => tidy(p ?? "")).filter(Boolean);
  const captain = tidy(team.captainName ?? "");
  const out: RosterEntry[] = players.map((name) => ({ name, captain: false }));
  if (!captain) return out;
  const i = out.findIndex((p) => samePerson(p.name, captain));
  if (i >= 0) {
    out[i] = { name: captain.length > out[i].name.length ? captain : out[i].name, captain: true };
    // Kapitein vooraan
    out.unshift(...out.splice(i, 1));
  } else {
    out.unshift({ name: captain, captain: true });
  }
  return out;
}
