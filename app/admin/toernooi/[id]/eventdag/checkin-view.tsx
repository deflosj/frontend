"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Search } from "lucide-react";
import { apiFetch } from "@/lib/api";
import type { TournamentTeam } from "@/lib/tournament-types";
import { useTournament } from "../tournament-context";

type Filter = "todo" | "in" | "all";

const playerCount = (t: TournamentTeam) =>
  [t.speler1, t.speler2, t.speler3, t.speler4].filter((s) => s?.trim()).length;

export function CheckInView() {
  const { tournament, setTournament } = useTournament();
  const [filter, setFilter] = useState<Filter>("todo");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [undo, setUndo] = useState<TournamentTeam | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (undoTimer.current) clearTimeout(undoTimer.current); }, []);

  const teams = tournament.teams;
  const present = teams.filter((t) => t.isPresent).length;
  const pouleName = new Map(tournament.poules.map((p) => [p.id, p.name]));
  const q = query.trim().toLowerCase();

  const shown = teams
    .filter((t) => filter === "all" || (filter === "in" ? t.isPresent : !t.isPresent))
    .filter((t) => !q || t.name.toLowerCase().includes(q) || (t.captainName ?? "").toLowerCase().includes(q))
    .sort((a, b) => a.name.localeCompare(b.name, "nl"));

  async function setPresent(team: TournamentTeam, isPresent: boolean) {
    setBusy(team.id); setError("");
    try {
      const updated = await apiFetch<TournamentTeam>(`tournaments/${tournament.id}/teams/${team.id}/checkin`, {
        method: "POST",
        body: JSON.stringify({ isPresent }),
      });
      setTournament({ ...tournament, teams: tournament.teams.map((t) => (t.id === team.id ? { ...t, ...updated } : t)) });
      if (isPresent) {
        setUndo(team);
        if (undoTimer.current) clearTimeout(undoTimer.current);
        undoTimer.current = setTimeout(() => setUndo(null), 5000);
      } else {
        setUndo(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Aanmelden mislukt.");
    } finally {
      setBusy(null);
    }
  }

  const filters: { key: Filter; label: string; n: number }[] = [
    { key: "todo", label: "Nog niet binnen", n: teams.length - present },
    { key: "in", label: "Binnen", n: present },
    { key: "all", label: "Alle", n: teams.length },
  ];

  return (
    <div className="flex flex-col gap-3.5 pb-16">
      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-semibold">Aangemeld</span>
          <span className="font-mono text-sm tabular-nums"><strong>{present}</strong><span className="text-ink-2"> / {teams.length}</span></span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-rule">
          <div className="h-full rounded-full bg-pink transition-[width] duration-300" style={{ width: `${teams.length ? (present / teams.length) * 100 : 0}%` }} />
        </div>
      </div>

      <label className="flex h-12 items-center gap-2.5 rounded-xl border border-rule bg-surface px-3.5 text-ink-2 focus-within:border-pink">
        <Search size={18} aria-hidden />
        <span className="sr-only">Zoek team of kapitein</span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Zoek team of kapitein"
          className="min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-ink-2/70"
        />
      </label>

      <div role="group" aria-label="Toon" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-0.5">
        {filters.map((f) => (
          <button key={f.key} type="button" className="chip shrink-0" style={{ height: 38 }} aria-pressed={filter === f.key} onClick={() => setFilter(f.key)}>
            {f.label} <span className="chip__n">{f.n}</span>
          </button>
        ))}
      </div>

      {error && <p role="alert" className="rounded-xl bg-[var(--err-bg)] px-3.5 py-2.5 text-[13px] text-[var(--err-fg)]">{error}</p>}

      {shown.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-rule px-4 py-8 text-center text-sm text-ink-2">
          {filter === "todo" && !q ? "Iedereen is binnen." : "Geen teams gevonden."}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {shown.map((t) => {
            const n = playerCount(t);
            return (
              <li key={t.id} className="flex items-center gap-3 rounded-2xl border border-rule bg-surface py-3 pl-4 pr-3">
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate text-[15px] font-semibold">{t.name}</span>
                  <span className="truncate text-xs text-ink-2">
                    {t.captainName || "Geen kapitein"}
                    {t.pouleId !== null && ` · ${pouleName.get(t.pouleId) ?? ""}`}
                    {" · "}
                    <span className={n < 4 ? "font-semibold text-[var(--warn-fg)]" : ""}>{n}/4 spelers</span>
                  </span>
                </div>
                {t.isPresent ? (
                  <button
                    type="button"
                    onClick={() => setPresent(t, false)}
                    disabled={busy === t.id}
                    aria-label={`${t.name} afmelden`}
                    className="flex h-11 shrink-0 items-center gap-1.5 rounded-xl bg-[var(--ok-bg)] px-3.5 text-sm font-semibold text-[var(--ok-fg)]"
                  >
                    <Check size={16} strokeWidth={2.5} /> Binnen
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setPresent(t, true)}
                    disabled={busy === t.id}
                    className="h-11 shrink-0 rounded-xl bg-ink px-4 text-sm font-semibold text-paper transition-opacity disabled:opacity-50"
                  >
                    {busy === t.id ? "…" : "Aanmelden"}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {undo && (
        <div
          role="status"
          className="t-rise fixed inset-x-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-30 mx-auto flex max-w-[600px] items-center gap-3 rounded-2xl bg-ink px-4 py-3 text-paper shadow-lg lg:bottom-6"
        >
          <Check size={18} strokeWidth={2.5} className="shrink-0" />
          <span className="min-w-0 flex-1 truncate text-sm"><strong>{undo.name}</strong> is binnen</span>
          <button type="button" onClick={() => setPresent(undo, false)} className="h-9 shrink-0 rounded-lg px-3 text-sm font-semibold underline">
            Ongedaan maken
          </button>
        </div>
      )}
    </div>
  );
}
