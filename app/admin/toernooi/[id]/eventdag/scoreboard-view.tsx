"use client";

import { fmtTime } from "@/utils/DateHelpers";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Flag, Minus } from "lucide-react";
import { apiFetch } from "@/lib/api";
import type { TournamentMatch } from "@/lib/tournament-types";
import { PHASE_LABELS } from "@/lib/tournament-types";
import { useTournament } from "../tournament-context";

/** Reglement art. 10 en 12: op tijd gespeeld, geen puntenlimiet. Enkel een
 *  bovengrens tegen een vinger die blijft tikken. */
const MAX_SCORE = 99;

export const isPlayed = (m: TournamentMatch) => m.scoreA !== null && m.scoreB !== null;

export const hhmm = (iso: string | null) =>
  iso ? fmtTime(iso) : "—";

/** Speelbare wedstrijden (beide teams gekend) per baan, op volgorde van tijd. */
export function matchesByTrack(matches: TournamentMatch[]): Map<number, TournamentMatch[]> {
  const map = new Map<number, TournamentMatch[]>();
  for (const m of matches) {
    if (m.track === null || m.teamAId === null || m.teamBId === null) continue;
    map.set(m.track, [...(map.get(m.track) ?? []), m]);
  }
  for (const list of map.values()) list.sort((a, b) => (a.scheduledAt ?? "").localeCompare(b.scheduledAt ?? ""));
  return new Map([...map.entries()].sort(([a], [b]) => a - b));
}

export function ScoreboardView({
  track,
  onTrackChange,
}: Readonly<{ track: number | null; onTrackChange: (t: number) => void }>) {
  const { tournament, setTournament, reload } = useTournament();
  const byTrack = useMemo(() => matchesByTrack(tournament.matches), [tournament.matches]);
  const tracks = [...byTrack.keys()];

  // Standaard: de eerste baan met nog een open wedstrijd.
  const activeTrack = track ?? tracks.find((t) => byTrack.get(t)!.some((m) => !isPlayed(m))) ?? tracks[0] ?? null;
  const list = activeTrack !== null ? byTrack.get(activeTrack) ?? [] : [];
  const current = list.find((m) => !isPlayed(m)) ?? null;
  const upcoming = current ? list.filter((m) => !isPlayed(m) && m.id !== current.id).slice(0, 2) : [];
  const doneOnTrack = list.filter(isPlayed).length;

  const [score, setScore] = useState<[number, number]>([0, 0]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [flash, setFlash] = useState("");
  const [forfeitOpen, setForfeitOpen] = useState(false);

  // Nieuwe wedstrijd op het bord: tellers op 0.
  useEffect(() => { setScore([0, 0]); setError(""); setForfeitOpen(false); }, [current?.id]);

  if (tracks.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-rule px-4 py-8 text-center text-sm text-ink-2">
        Nog geen wedstrijden ingepland. Genereer ze eerst bij Poules &amp; schema.
      </p>
    );
  }

  const name = (id: number | null) => tournament.teams.find((t) => t.id === id)?.name ?? "?";
  const idx = activeTrack !== null ? tracks.indexOf(activeTrack) : 0;
  const step = (d: number) => onTrackChange(tracks[(idx + d + tracks.length) % tracks.length]);

  const isKo = current !== null && current.phase !== "GROUP_STAGE";
  const bump = (side: 0 | 1, d: number) => {
    setScore((s) => {
      const next: [number, number] = [...s];
      next[side] = Math.max(0, Math.min(MAX_SCORE, next[side] + d));
      return next;
    });
  };

  /** Reglement art. 20: wie niet (tijdig) komt of te weinig spelers heeft, verliest 0–5. */
  async function forfeit(teamId: number | null) {
    if (!current || teamId === null) return;
    const other = teamId === current.teamAId ? current.teamBId : current.teamAId;
    const extra = isKo ? " Ze liggen uit het toernooi." : " Na twee forfaits ligt een ploeg uit het toernooi.";
    if (!globalThis.confirm(`Forfait voor ${name(teamId)}? ${name(other)} wint 5–0.${extra}`)) return;
    setSaving(true); setError("");
    try {
      await apiFetch<TournamentMatch>(`tournaments/${tournament.id}/matches/${current.id}/forfeit`, {
        method: "POST",
        body: JSON.stringify({ teamId }),
      });
      setFlash(`Forfait voor ${name(teamId)} opgeslagen`);
      setTimeout(() => setFlash(""), 3500);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Forfait opslaan mislukt.");
    } finally {
      setSaving(false);
    }
  }

  async function save() {
    if (!current) return;
    if (isKo && score[0] === score[1]) { setError("In de knock-out kan het niet gelijk eindigen."); return; }
    setSaving(true); setError("");
    try {
      const updated = await apiFetch<TournamentMatch>(`tournaments/${tournament.id}/matches/${current.id}/score`, {
        method: "POST",
        body: JSON.stringify({ scoreA: score[0], scoreB: score[1] }),
      });
      setTournament({ ...tournament, matches: tournament.matches.map((m) => (m.id === updated.id ? { ...m, ...updated } : m)) });
      setFlash(`${name(current.teamAId)} ${score[0]}–${score[1]} ${name(current.teamBId)} opgeslagen`);
      setTimeout(() => setFlash(""), 3500);
      void reload(); // stand en knock-out worden serverside bijgewerkt
    } catch (e) {
      setError(e instanceof Error ? e.message : "Opslaan mislukt.");
    } finally {
      setSaving(false);
    }
  }

  const side = (i: 0 | 1, teamId: number | null) => {
    const lead = score[i] > score[1 - i];
    return (
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <button
          type="button"
          onClick={() => bump(i, 1)}
          disabled={!current || saving || score[i] >= MAX_SCORE}
          aria-label={`Punt erbij voor ${name(teamId)}, nu ${score[i]}`}
          className={`flex min-h-[220px] flex-col items-center justify-between gap-2 rounded-2xl border px-3 pb-4 pt-5 text-center transition-colors active:scale-[0.98] disabled:cursor-default ${
            lead ? "border-pink bg-pink-soft text-pink-ink" : "border-rule bg-surface text-ink"
          }`}
        >
          <span className="line-clamp-2 text-[15px] font-semibold leading-tight">{name(teamId)}</span>
          <span className="font-mono text-[80px] font-semibold leading-none tabular-nums tracking-tighter">{score[i]}</span>
          <span className="text-xs opacity-70">tik voor +1</span>
        </button>
        <button
          type="button"
          onClick={() => bump(i, -1)}
          disabled={!current || saving || score[i] === 0}
          aria-label={`Punt eraf voor ${name(teamId)}`}
          className="flex h-11 items-center justify-center gap-1.5 rounded-xl border border-rule bg-paper text-sm font-semibold text-ink-2 disabled:opacity-40"
        >
          <Minus size={15} /> 1
        </button>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4 pb-6">
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => step(-1)} aria-label="Vorige baan"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-rule bg-surface">
          <ChevronLeft size={20} />
        </button>
        <div className="flex-1 text-center">
          <p className="font-mono text-2xl font-semibold">Baan {activeTrack}</p>
          <p className="text-xs text-ink-2">{doneOnTrack} van {list.length} gespeeld</p>
        </div>
        <button type="button" onClick={() => step(1)} aria-label="Volgende baan"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-rule bg-surface">
          <ChevronRight size={20} />
        </button>
      </div>

      {current ? (
        <>
          <p className="text-center text-[13px] text-ink-2">
            {current.phase === "GROUP_STAGE"
              ? tournament.poules.find((p) => p.id === current.pouleId)?.name ?? "Poule"
              : PHASE_LABELS[current.phase]}
            {" · "}gepland om <span className="font-mono">{hhmm(current.scheduledAt)}</span>
          </p>

          <div className="flex gap-3">
            {side(0, current.teamAId)}
            {side(1, current.teamBId)}
          </div>

          {error && <p role="alert" className="rounded-xl bg-[var(--err-bg)] px-3.5 py-2.5 text-[13px] text-[var(--err-fg)]">{error}</p>}

          <button
            type="button"
            onClick={save}
            disabled={saving || (score[0] === 0 && score[1] === 0)}
            className="h-14 rounded-2xl bg-ink text-base font-semibold text-paper transition-opacity disabled:opacity-40"
          >
            {saving ? "Opslaan…" : `Uitslag ${score[0]}–${score[1]} opslaan`}
          </button>
          <p className="-mt-2 text-center text-xs text-ink-2">
            {isKo
              ? "Na 20 minuten wordt de lopende mène uitgespeeld; bij gelijkstand nog één extra mène."
              : "Na 15 minuten stopt de wedstrijd: tel de ballen zoals ze liggen."}
          </p>

          <div className="rounded-2xl border border-dashed border-rule p-3">
            <button
              type="button"
              onClick={() => setForfeitOpen((v) => !v)}
              aria-expanded={forfeitOpen}
              className="flex w-full items-center justify-center gap-2 text-sm font-semibold text-ink-2"
            >
              <Flag size={15} aria-hidden /> Forfait
            </button>
            {forfeitOpen && (
              <div className="mt-3 flex flex-col gap-2">
                <p className="text-center text-xs text-ink-2">
                  Niet (tijdig) aanwezig, of vanaf de 2de match geen vier spelers: die ploeg verliest 0–5.
                </p>
                <div className="flex gap-2">
                  {[current.teamAId, current.teamBId].map((id) => (
                    <button
                      key={id}
                      type="button"
                      disabled={saving}
                      onClick={() => forfeit(id)}
                      className="min-h-11 flex-1 rounded-xl bg-[var(--err-bg)] px-3 py-2 text-sm font-semibold text-[var(--err-fg)] disabled:opacity-40"
                    >
                      {name(id)} geeft forfait
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {upcoming.length > 0 && (
            <section aria-labelledby="next-title" className="mt-2">
              <h2 id="next-title" className="mb-2 text-[13px] font-semibold text-ink-2">Daarna op baan {activeTrack}</h2>
              <ul className="overflow-hidden rounded-2xl border border-rule bg-surface">
                {upcoming.map((m) => (
                  <li key={m.id} className="flex items-center gap-3 border-t border-rule px-4 py-3 text-sm first:border-t-0">
                    <span className="w-12 shrink-0 font-mono text-ink-2">{hhmm(m.scheduledAt)}</span>
                    <span className="min-w-0 flex-1 truncate">{name(m.teamAId)} <span className="text-ink-2">–</span> {name(m.teamBId)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      ) : (
        <p className="rounded-2xl bg-[var(--ok-bg)] px-4 py-8 text-center text-sm font-medium text-[var(--ok-fg)]">
          Alle wedstrijden op baan {activeTrack} zijn gespeeld.
        </p>
      )}

      {flash && (
        <div role="status" className="t-rise fixed inset-x-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-30 mx-auto max-w-[600px] rounded-2xl bg-ink px-4 py-3 text-sm text-paper shadow-lg lg:bottom-6">
          ✓ {flash}
        </div>
      )}
    </div>
  );
}
