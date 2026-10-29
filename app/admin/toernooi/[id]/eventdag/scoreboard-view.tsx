"use client";

import { fmtTime } from "@/utils/DateHelpers";
import { useEffect, useMemo, useState } from "react";
import { Delete, Lock, Pencil, X } from "lucide-react";
import { apiFetch } from "@/lib/api";
import type { TournamentMatch } from "@/lib/tournament-types";
import { PHASE_LABELS } from "@/lib/tournament-types";
import { useTournament } from "../tournament-context";

/** Reglement art. 10 en 12: op tijd gespeeld, geen puntenlimiet. Twee cijfers
 *  is ruim genoeg. */
const MAX_DIGITS = 2;

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

/** Per baan: de match die nu aan de beurt is om in te geven, wat erna komt,
 *  wat overgeslagen is en wat al gespeeld is. Scores gaan per baan om de
 *  beurt; verder kan enkel via bewust overslaan. */
export function trackQueue(list: TournamentMatch[]) {
  const queue = list.filter((m) => !isPlayed(m) && !m.skipped);
  return {
    current: queue[0] ?? null,
    next: queue[1] ?? null,
    skipped: list.filter((m) => !isPlayed(m) && m.skipped),
    played: list.filter(isPlayed),
  };
}

type Sheet = { matchId: number; a: string; b: string; focus: "a" | "b"; edit: boolean };

export function ScoreboardView({
  myTracks,
  onMyTracksChange,
  focusTrack,
  onClearFocus,
}: Readonly<{
  myTracks: number[];
  onMyTracksChange: (t: number[]) => void;
  /** Vanuit "Banen" één baan openen, los van de eigen keuze. */
  focusTrack: number | null;
  onClearFocus: () => void;
}>) {
  const { tournament, setTournament, reload } = useTournament();
  const byTrack = useMemo(() => matchesByTrack(tournament.matches), [tournament.matches]);
  const allTracks = useMemo(() => {
    const n = tournament.trackCount ?? 0;
    const set = new Set<number>([...byTrack.keys()]);
    for (let i = 1; i <= n; i++) set.add(i);
    return [...set].sort((a, b) => a - b);
  }, [byTrack, tournament.trackCount]);

  const mine = myTracks.filter((t) => allTracks.includes(t));
  const shown = focusTrack !== null ? [focusTrack] : mine.length ? mine : allTracks;

  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [flash, setFlash] = useState("");

  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(""), 3200);
    return () => clearTimeout(t);
  }, [flash]);

  if (byTrack.size === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-rule px-4 py-8 text-center text-sm text-ink-2">
        Nog geen wedstrijden ingepland. Genereer ze eerst bij Poules &amp; schema.
      </p>
    );
  }

  const name = (id: number | null) => tournament.teams.find((t) => t.id === id)?.name ?? "?";
  const label = (m: TournamentMatch) =>
    m.phase === "GROUP_STAGE" ? tournament.poules.find((p) => p.id === m.pouleId)?.name ?? "Poule" : PHASE_LABELS[m.phase];

  const queues = shown.map((t) => ({ track: t, list: byTrack.get(t) ?? [], ...trackQueue(byTrack.get(t) ?? []) }));
  const skipped = queues.flatMap((q) => q.skipped);
  const played = queues
    .flatMap((q) => q.played)
    .sort((a, b) => (b.scheduledAt ?? "").localeCompare(a.scheduledAt ?? "") || (b.track ?? 0) - (a.track ?? 0));

  const merge = (updated: TournamentMatch) =>
    setTournament({ ...tournament, matches: tournament.matches.map((m) => (m.id === updated.id ? { ...m, ...updated } : m)) });

  function toggleMine(t: number) {
    onMyTracksChange(mine.includes(t) ? mine.filter((x) => x !== t) : [...mine, t]);
  }

  function open(m: TournamentMatch) {
    setError("");
    setSheet({
      matchId: m.id,
      a: m.scoreA !== null ? String(m.scoreA) : "",
      b: m.scoreB !== null ? String(m.scoreB) : "",
      focus: "a",
      edit: isPlayed(m),
    });
  }

  async function skip(m: TournamentMatch) {
    setBusy(true);
    try {
      merge(await apiFetch<TournamentMatch>(`tournaments/${tournament.id}/matches/${m.id}/skip`, {
        method: "POST",
        body: JSON.stringify({ skipped: true }),
      }));
      setFlash(`Overgeslagen: ${name(m.teamAId)} – ${name(m.teamBId)}. Staat bij "nog in te geven".`);
    } catch (e) {
      setFlash(e instanceof Error ? e.message : "Overslaan mislukt.");
    } finally {
      setBusy(false);
    }
  }

  const sheetMatch = sheet ? tournament.matches.find((m) => m.id === sheet.matchId) ?? null : null;

  return (
    <div className="flex flex-col gap-5 pb-6">
      {/* ── Mijn banen ───────────────────────────────────────── */}
      <section aria-label="Mijn banen" className="flex flex-col gap-2">
        <p className="text-xs font-semibold text-ink-2">
          Mijn banen <span className="font-normal">· onthouden op deze gsm</span>
        </p>
        <div className="grid grid-cols-6 gap-1.5">
          {allTracks.map((t) => {
            const on = mine.includes(t);
            return (
              <button
                key={t}
                type="button"
                onClick={() => toggleMine(t)}
                aria-pressed={on}
                aria-label={`Baan ${t}`}
                className={`h-11 rounded-xl border font-mono text-lg font-semibold transition-colors ${
                  on ? "border-ink bg-ink text-paper" : "border-rule bg-surface text-ink-2"
                }`}
              >
                {t}
              </button>
            );
          })}
        </div>
        {!mine.length && focusTrack === null && (
          <p className="text-xs text-ink-2">Je ziet nu alle banen. Tik jouw banen aan om enkel die te zien.</p>
        )}
        {focusTrack !== null && (
          <button type="button" onClick={onClearFocus} className="self-start text-[13px] font-semibold text-ink underline underline-offset-4">
            Enkel baan {focusTrack} · terug naar {mine.length ? "mijn banen" : "alle banen"}
          </button>
        )}
      </section>

      {/* ── Nu aan de beurt ──────────────────────────────────── */}
      <section aria-labelledby="nu-titel" className="flex flex-col gap-2.5">
        <h2 id="nu-titel" className="text-[13px] font-semibold text-ink-2">Nu op {mine.length && focusTrack === null ? "jouw banen" : "de banen"}</h2>
        {queues.map(({ track, list, current, next, played: done }) => (
          <div key={track} className="flex flex-col gap-3 rounded-2xl border border-rule bg-surface p-3.5">
            <div className="flex items-center gap-3">
              <span className={`flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl ${current ? "bg-ink text-paper" : "bg-[var(--ok-bg)] text-[var(--ok-fg)]"}`}>
                <span className="text-[9px] font-semibold uppercase tracking-wider opacity-70">Baan</span>
                <span className="font-mono text-lg font-semibold leading-none">{track}</span>
              </span>
              {current ? (
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-xs text-ink-2">
                    {label(current)} · gepland {hhmm(current.scheduledAt)} · {done.length}/{list.length} gespeeld
                  </span>
                  <span className="text-base font-semibold leading-snug">
                    {name(current.teamAId)} <span className="font-normal text-ink-2">–</span> {name(current.teamBId)}
                  </span>
                </span>
              ) : (
                <span className="text-sm font-semibold text-[var(--ok-fg)]">
                  {list.length ? "Alles ingegeven op deze baan" : "Geen wedstrijden op deze baan"}
                </span>
              )}
            </div>
            {current && (
              <>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => open(current)}
                    disabled={busy}
                    className="h-[52px] flex-1 rounded-xl bg-ink text-[15px] font-semibold text-paper disabled:opacity-40"
                  >
                    Eindscore ingeven
                  </button>
                  <button
                    type="button"
                    onClick={() => skip(current)}
                    disabled={busy}
                    className="h-[52px] rounded-xl border border-rule bg-surface px-3.5 text-sm font-semibold text-ink-2 disabled:opacity-40"
                  >
                    Overslaan
                  </button>
                </div>
                <p className="flex items-center gap-1.5 text-xs text-ink-2">
                  <Lock size={12} aria-hidden className="shrink-0" />
                  {next
                    ? `Daarna ${hhmm(next.scheduledAt)}: ${name(next.teamAId)} – ${name(next.teamBId)} · pas na deze match`
                    : "Laatste match op deze baan"}
                </p>
              </>
            )}
          </div>
        ))}
      </section>

      {/* ── Overgeslagen ─────────────────────────────────────── */}
      {skipped.length > 0 && (
        <section aria-labelledby="skip-titel" className="flex flex-col gap-2">
          <h2 id="skip-titel" className="text-[13px] font-semibold text-pink-ink">Overgeslagen · nog in te geven</h2>
          <ul className="overflow-hidden rounded-2xl border border-pink/35 bg-pink-soft">
            {skipped.map((m) => (
              <li key={m.id} className="flex items-center gap-2.5 border-t border-pink/25 px-3 py-2.5 text-pink-ink first:border-t-0">
                <span className="w-14 shrink-0 font-mono text-xs">B{m.track} {hhmm(m.scheduledAt)}</span>
                <span className="min-w-0 flex-1 text-sm leading-snug">{name(m.teamAId)} – {name(m.teamBId)}</span>
                <button type="button" onClick={() => open(m)} className="h-10 shrink-0 rounded-lg bg-ink px-3 text-[13px] font-semibold text-paper">
                  Ingeven
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── Gespeeld: altijd aanpasbaar ──────────────────────── */}
      {played.length > 0 && (
        <section aria-labelledby="done-titel" className="flex flex-col gap-2">
          <h2 id="done-titel" className="text-[13px] font-semibold text-ink-2">Gespeeld · tik om aan te passen</h2>
          <ul className="overflow-hidden rounded-2xl border border-rule bg-surface">
            {played.map((m) => (
              <li key={m.id} className="border-t border-rule first:border-t-0">
                <button type="button" onClick={() => open(m)} className="flex w-full items-center gap-2.5 px-3.5 py-3 text-left hover:bg-paper">
                  <span className="w-14 shrink-0 font-mono text-xs text-ink-2">B{m.track} {hhmm(m.scheduledAt)}</span>
                  <span className="min-w-0 flex-1 text-sm leading-snug">
                    {name(m.teamAId)} – {name(m.teamBId)}
                    {m.forfeitTeamId ? <span className="text-ink-2"> · forfait</span> : null}
                  </span>
                  <span className="font-mono text-base font-semibold tabular-nums">{m.scoreA}–{m.scoreB}</span>
                  <Pencil size={14} aria-hidden className="shrink-0 text-ink-2" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {sheet && sheetMatch && (
        <ScoreSheet
          key={sheet.matchId}
          sheet={sheet}
          match={sheetMatch}
          meta={`Baan ${sheetMatch.track} · ${label(sheetMatch)} · ${hhmm(sheetMatch.scheduledAt)}`}
          nameA={name(sheetMatch.teamAId)}
          nameB={name(sheetMatch.teamBId)}
          forfeitName={sheetMatch.forfeitTeamId ? name(sheetMatch.forfeitTeamId) : null}
          busy={busy}
          error={error}
          onChange={setSheet}
          onClose={() => setSheet(null)}
          onSave={async (a, b) => {
            const isKo = sheetMatch.phase !== "GROUP_STAGE";
            if (isKo && a === b) { setError("In de knock-out kan het niet gelijk eindigen."); return; }
            setBusy(true); setError("");
            try {
              merge(await apiFetch<TournamentMatch>(`tournaments/${tournament.id}/matches/${sheetMatch.id}/score`, {
                method: "POST",
                body: JSON.stringify({ scoreA: a, scoreB: b }),
              }));
              setFlash(`${sheet.edit ? "Aangepast" : "Opgeslagen"}: ${name(sheetMatch.teamAId)} ${a}–${b} ${name(sheetMatch.teamBId)}`);
              setSheet(null);
              void reload(); // stand en knock-out worden serverside bijgewerkt
            } catch (e) {
              setError(e instanceof Error ? e.message : "Opslaan mislukt.");
            } finally {
              setBusy(false);
            }
          }}
          onForfeit={async (teamId) => {
            const other = teamId === sheetMatch.teamAId ? sheetMatch.teamBId : sheetMatch.teamAId;
            const extra = sheetMatch.phase !== "GROUP_STAGE" ? " Ze liggen uit het toernooi." : " Na twee forfaits ligt een ploeg uit het toernooi.";
            if (!globalThis.confirm(`Forfait voor ${name(teamId)}? ${name(other)} wint 5–0.${extra}`)) return;
            setBusy(true); setError("");
            try {
              await apiFetch<TournamentMatch>(`tournaments/${tournament.id}/matches/${sheetMatch.id}/forfeit`, {
                method: "POST",
                body: JSON.stringify({ teamId }),
              });
              setFlash(`Forfait voor ${name(teamId)} opgeslagen`);
              setSheet(null);
              await reload();
            } catch (e) {
              setError(e instanceof Error ? e.message : "Forfait opslaan mislukt.");
            } finally {
              setBusy(false);
            }
          }}
          onClearForfeit={async () => {
            setBusy(true); setError("");
            try {
              await apiFetch<TournamentMatch>(`tournaments/${tournament.id}/matches/${sheetMatch.id}/forfeit`, { method: "DELETE" });
              setFlash("Forfait ongedaan gemaakt");
              setSheet(null);
              await reload();
            } catch (e) {
              setError(e instanceof Error ? e.message : "Forfait ongedaan maken mislukt.");
            } finally {
              setBusy(false);
            }
          }}
        />
      )}

      {flash && (
        <div role="status" className="t-rise fixed inset-x-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-30 mx-auto max-w-[600px] rounded-2xl bg-ink px-4 py-3 text-sm text-paper shadow-lg lg:bottom-6">
          ✓ {flash}
        </div>
      )}
    </div>
  );
}

/** Onderblad om een eindscore in te geven: twee vakken en een groot cijferklavier. */
function ScoreSheet({
  sheet,
  match,
  meta,
  nameA,
  nameB,
  forfeitName,
  busy,
  error,
  onChange,
  onClose,
  onSave,
  onForfeit,
  onClearForfeit,
}: Readonly<{
  sheet: Sheet;
  match: TournamentMatch;
  meta: string;
  nameA: string;
  nameB: string;
  forfeitName: string | null;
  busy: boolean;
  error: string;
  onChange: (s: Sheet) => void;
  onClose: () => void;
  onSave: (a: number, b: number) => void;
  onForfeit: (teamId: number | null) => void;
  onClearForfeit: () => void;
}>) {
  const [forfeitOpen, setForfeitOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const press = (k: string) => {
    const f = sheet.focus;
    if (k === "del") return onChange({ ...sheet, [f]: sheet[f].slice(0, -1) });
    if (k === "swap") return onChange({ ...sheet, focus: f === "a" ? "b" : "a" });
    const v = (sheet[f] + k).replace(/^0(?=\d)/, "").slice(0, MAX_DIGITS);
    onChange({ ...sheet, [f]: v });
  };
  const ok = sheet.a !== "" && sheet.b !== "";

  const box = (side: "a" | "b", teamName: string) => {
    const on = sheet.focus === side;
    return (
      <button
        type="button"
        onClick={() => onChange({ ...sheet, focus: side })}
        aria-pressed={on}
        aria-label={`Score ${teamName}`}
        className={`flex min-h-[116px] min-w-0 flex-col items-center justify-between gap-1.5 rounded-2xl px-2 py-3 text-center transition-colors ${
          on ? "border-2 border-pink bg-pink-soft text-pink-ink" : "border border-rule bg-surface text-ink"
        }`}
      >
        <span className="line-clamp-2 text-sm font-semibold leading-tight">{teamName}</span>
        <span className="font-mono text-[52px] font-semibold leading-none tabular-nums">{sheet[side] || "–"}</span>
      </button>
    );
  };

  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "swap", "0", "del"];

  return (
    <>
      <button type="button" aria-label="Sluiten" onClick={onClose} className="t-scrim fixed inset-0 z-40 cursor-default bg-ink/45" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Eindscore ingeven"
        className="t-info fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[92vh] max-w-[560px] flex-col gap-3.5 overflow-y-auto rounded-t-3xl bg-surface px-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-2 shadow-2xl"
      >
        <div className="flex justify-center"><span className="h-1.5 w-10 rounded-full bg-rule" /></div>
        <div className="flex items-center gap-2">
          <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-ink-2">{meta}</span>
          {sheet.edit && <span className="rounded-full bg-pink-soft px-2 py-0.5 text-[11px] font-bold text-pink-ink">AANPASSEN</span>}
          <button type="button" onClick={onClose} aria-label="Sluiten" className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-ink/5">
            <X size={18} />
          </button>
        </div>

        {forfeitName && (
          <div className="flex items-center gap-2 rounded-xl bg-[var(--err-bg)] px-3 py-2 text-[13px] text-[var(--err-fg)]">
            <span className="flex-1">Forfait voor {forfeitName}{match.forfeitAuto ? " (automatisch na twee forfaits)" : ""}.</span>
            {!match.forfeitAuto && (
              <button type="button" disabled={busy} onClick={onClearForfeit} className="font-semibold underline underline-offset-2 disabled:opacity-40">
                Ongedaan maken
              </button>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2.5">
          {box("a", nameA)}
          {box("b", nameB)}
        </div>

        <div className="grid grid-cols-3 gap-2">
          {keys.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => press(k)}
              aria-label={k === "del" ? "Wissen" : k === "swap" ? "Naar het andere team" : k}
              className={`flex h-[52px] items-center justify-center rounded-xl border border-rule bg-paper font-semibold active:bg-ink/10 ${
                k === "del" || k === "swap" ? "text-ink-2" : "text-[22px] text-ink"
              }`}
            >
              {k === "del" ? <Delete size={20} aria-hidden /> : k === "swap" ? <span className="text-lg">⇄</span> : k}
            </button>
          ))}
        </div>

        {error && <p role="alert" className="rounded-xl bg-[var(--err-bg)] px-3.5 py-2.5 text-[13px] text-[var(--err-fg)]">{error}</p>}

        <button
          type="button"
          onClick={() => ok && onSave(Number(sheet.a), Number(sheet.b))}
          disabled={!ok || busy}
          className="h-14 rounded-2xl bg-ink text-base font-semibold text-paper transition-opacity disabled:opacity-40"
        >
          {busy ? "Opslaan…" : ok ? `${sheet.edit ? "Aanpassing" : "Uitslag"} ${sheet.a}–${sheet.b} opslaan` : "Geef beide scores in"}
        </button>

        <button
          type="button"
          onClick={() => setForfeitOpen((v) => !v)}
          aria-expanded={forfeitOpen}
          className="self-center text-[13px] font-semibold text-ink-2 underline underline-offset-4"
        >
          Forfait ingeven
        </button>
        {forfeitOpen && (
          <div className="flex flex-col gap-2">
            <p className="text-center text-xs text-ink-2">
              Niet (tijdig) aanwezig, of vanaf de 2de match geen vier spelers: die ploeg verliest 0–5.
            </p>
            <div className="flex gap-2">
              {[match.teamAId, match.teamBId].map((id, i) => (
                <button
                  key={id ?? i}
                  type="button"
                  disabled={busy}
                  onClick={() => onForfeit(id)}
                  className="min-h-11 flex-1 rounded-xl bg-[var(--err-bg)] px-3 py-2 text-sm font-semibold text-[var(--err-fg)] disabled:opacity-40"
                >
                  {i === 0 ? nameA : nameB} geeft forfait
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
