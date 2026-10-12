"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";
import type { ActiveTournament, TournamentMatch, TournamentTeam } from "@/lib/tournament-types";
import { PHASE_LABELS, PHASE_ORDER } from "@/lib/tournament-types";
import Link from "next/link";
import { Clock } from "lucide-react";
import { Notice, Panel } from "@/components/admin/ui";
import { smallInput } from "../shared";

// ── Match row (inline editing) ────────────────────────────────────────────────

/** De backend geeft een ISO-tijdstip terug; aan de wedstrijdtafel wil je
 *  gewoon "15:00" zien en typen. */
function toTimeField(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function matchStatusColor(m: TournamentMatch): string {
  if (m.scoreA !== null && m.scoreB !== null) return "var(--ok-fg)";
  if (m.scoreA !== null || m.scoreB !== null) return "var(--warn-fg)";
  return "var(--border)";
}

function MatchRow({
  tournamentId,
  match,
  teams,
  onSaved,
  phaseLabel,
}: Readonly<{
  tournamentId: number;
  match: TournamentMatch;
  teams: TournamentTeam[];
  onSaved: (m: TournamentMatch) => void;
  /** Alleen gezet in het knockoutblok, dat een fasekolom extra heeft. */
  phaseLabel?: string;
}>) {
  const [scoreA, setScoreA]   = useState(match.scoreA !== null ? String(match.scoreA) : "");
  const [scoreB, setScoreB]   = useState(match.scoreB !== null ? String(match.scoreB) : "");
  const [time, setTime]       = useState(toTimeField(match.scheduledAt));
  const [track, setTrack]     = useState(match.track !== null ? String(match.track) : "");
  const [teamAId, setTeamAId] = useState(match.teamAId !== null ? String(match.teamAId) : "");
  const [teamBId, setTeamBId] = useState(match.teamBId !== null ? String(match.teamBId) : "");
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");

  const toStr = (v: number | null) => (v !== null ? String(v) : "");
  const isDirty =
    scoreA !== toStr(match.scoreA) ||
    scoreB !== toStr(match.scoreB) ||
    time   !== toTimeField(match.scheduledAt) ||
    track  !== toStr(match.track) ||
    teamAId !== toStr(match.teamAId) ||
    teamBId !== toStr(match.teamBId);

  const isComplete = match.scoreA !== null && match.scoreB !== null;
  const statusColor = matchStatusColor(match);

  async function save() {
    setSaving(true); setError("");
    try {
      const body: Record<string, unknown> = { time: time || null, track: track ? Number.parseInt(track, 10) : null };
      if (scoreA !== "") body.scoreA = Number.parseInt(scoreA, 10);
      if (scoreB !== "") body.scoreB = Number.parseInt(scoreB, 10);
      if (teamAId) body.teamAId = Number.parseInt(teamAId, 10);
      if (teamBId) body.teamBId = Number.parseInt(teamBId, 10);
      const updated = await apiFetch<TournamentMatch>(
        `tournaments/${tournamentId}/matches/${match.id}`,
        { method: "PATCH", body: JSON.stringify(body) }
      );
      onSaved(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fout");
    } finally { setSaving(false); }
  }

  const selectStyle: React.CSSProperties = { ...smallInput, width: "100%", minWidth: 150, textAlign: "left" as const };

  return (
    <tr style={{ background: isComplete ? "color-mix(in srgb, var(--ok-fg) 8%, transparent)" : undefined }}>
      <td style={{ width: 4, padding: 0, background: statusColor }} aria-hidden="true" />
      {phaseLabel !== undefined && (
        <td style={{ whiteSpace: "nowrap", fontSize: "0.8rem", color: "var(--ink-2)" }}>{phaseLabel}</td>
      )}
      <td>
        <select value={teamAId} onChange={(e) => setTeamAId(e.target.value)} style={selectStyle} aria-label="Team A">
          <option value="">—</option>
          {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </td>
      <td style={{ textAlign: "center", width: 60 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "4px", justifyContent: "center" }}>
          <input type="number" value={scoreA} min="0" max="99" aria-label="Score A"
            onChange={(e) => setScoreA(e.target.value)}
            style={{ ...smallInput, width: 48 }} />
          <span style={{ color: "var(--ink-2)", fontWeight: 600 }}>–</span>
          <input type="number" value={scoreB} min="0" max="99" aria-label="Score B"
            onChange={(e) => setScoreB(e.target.value)}
            style={{ ...smallInput, width: 48 }} />
        </div>
      </td>
      <td>
        <select value={teamBId} onChange={(e) => setTeamBId(e.target.value)} style={selectStyle} aria-label="Team B">
          <option value="">—</option>
          {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </td>
      <td style={{ width: 70 }}>
        <input type="text" value={time} placeholder="15:00" aria-label="Tijd"
          onChange={(e) => setTime(e.target.value)}
          style={{ ...smallInput, width: 64 }} />
      </td>
      <td style={{ width: 60 }}>
        <input type="number" value={track} placeholder="1" min="1" aria-label="Baan"
          onChange={(e) => setTrack(e.target.value)}
          style={{ ...smallInput, width: 52 }} />
      </td>
      <td style={{ width: 110 }}>
        {error && <span style={{ color: "var(--err-fg)", fontSize: "0.7rem", display: "block" }}>{error}</span>}
        {isDirty || saving ? (
          <button type="button" className="btn-sm btn-sm--primary" onClick={save} disabled={saving}>
            {saving ? "…" : "Opslaan"}
          </button>
        ) : isComplete ? (
          <span className="inline-flex items-center gap-1 whitespace-nowrap text-[13px] font-semibold text-[var(--ok-fg)]">✓ Gespeeld</span>
        ) : (
          <span className="text-[13px] text-ink-2">Open</span>
        )}
      </td>
    </tr>
  );
}

// ── Vertraging ────────────────────────────────────────────────────────────────

function DelayControl({ tournamentId }: Readonly<{ tournamentId: number }>) {
  const [minutes, setMinutes] = useState("");
  const [applying, setApplying] = useState(false);
  const [done, setDone] = useState(false);

  async function apply() {
    const min = Number.parseInt(minutes, 10);
    if (Number.isNaN(min) || min === 0) return;
    setApplying(true);
    try {
      await apiFetch(`tournaments/${tournamentId}/delay`, {
        method: "POST", body: JSON.stringify({ minutes: min }),
      });
      setDone(true);
      setMinutes("");
      setTimeout(() => setDone(false), 3000);
    } catch { /* ignore */ } finally { setApplying(false); }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-rule bg-surface py-1.5 pl-3 pr-1.5">
      <Clock size={15} className="text-ink-2" aria-hidden />
      <label htmlFor="delay-min" className="text-[13px] font-medium text-ink-2">Vertraging</label>
      <input
        id="delay-min" type="number" value={minutes} min="-120" max="120" placeholder="min"
        onChange={(e) => setMinutes(e.target.value)}
        style={{ ...smallInput, width: 64 }}
      />
      <button type="button" className="btn-sm btn-sm--ghost" onClick={apply} disabled={applying || !minutes}>
        {applying ? "Bezig…" : "Komende matchen verschuiven"}
      </button>
      {done && <span className="pr-2 text-[13px] font-medium text-[var(--ok-fg)]">✓ Toegepast</span>}
    </div>
  );
}

// ── Stand ─────────────────────────────────────────────────────────────────────

function StandingsTable({ teams }: Readonly<{ teams: TournamentTeam[] }>) {
  const sorted = [...teams].sort((a, b) => {
    if (b.points !== a.points)       return b.points - a.points;
    if (b.goalsFor !== a.goalsFor)   return b.goalsFor - a.goalsFor;
    if (a.goalsAgainst !== b.goalsAgainst) return a.goalsAgainst - b.goalsAgainst;
    return b.won - a.won;
  });

  return (
    <div className="overflow-x-auto">
      <table className="admin-table">
        <thead>
          <tr>
            <th style={{ width: 32 }}>#</th><th>Team</th>
            <th style={{ textAlign: "right" }}>Sp</th><th style={{ textAlign: "right" }}>W</th><th style={{ textAlign: "right" }}>G</th><th style={{ textAlign: "right" }}>V</th>
            <th style={{ textAlign: "right" }}>VP</th><th style={{ textAlign: "right" }}>TP</th><th style={{ textAlign: "right" }}>+/-</th><th style={{ textAlign: "right" }}>Pts</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((t, i) => (
            <tr key={t.id}>
              <td>
                <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full font-mono text-xs ${
                  i < 2 ? "bg-pink-soft font-bold text-pink-ink" : "text-ink-2"
                }`}>{i + 1}</span>
              </td>
              <td>
                <strong>{t.name}</strong>
                {t.isPresent === false && <span className="badge badge--gray ml-2">Afwezig</span>}
              </td>
              <td className="mono text-right">{t.played}</td>
              <td className="mono text-right">{t.won}</td>
              <td className="mono text-right">{t.drawn}</td>
              <td className="mono text-right">{t.lost}</td>
              <td className="mono text-right">{t.goalsFor}</td>
              <td className="mono text-right">{t.goalsAgainst}</td>
              <td className="mono text-right" style={{ color: t.saldo >= 0 ? "var(--ok-fg)" : "var(--err-fg)" }}>
                {t.saldo >= 0 ? "+" : ""}{t.saldo}
              </td>
              <td className="text-right"><strong className="mono">{t.points}</strong></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Wedstrijdtabel ────────────────────────────────────────────────────────────

const isPlayed = (m: TournamentMatch) => m.scoreA !== null && m.scoreB !== null;

function MatchTable({
  tournament, matches, onSaved, withPhase = false,
}: Readonly<{
  tournament: ActiveTournament;
  matches: TournamentMatch[];
  onSaved: (m: TournamentMatch) => void;
  withPhase?: boolean;
}>) {
  return (
    <div className="overflow-x-auto">
      <table className="admin-table">
        <thead>
          <tr>
            <th style={{ width: 4, padding: 0 }} aria-hidden="true" />
            {withPhase && <th>Fase</th>}
            <th>Team A</th>
            <th style={{ textAlign: "center" }}>Score</th>
            <th>Team B</th>
            <th>Tijd</th>
            <th>Baan</th>
            <th><span className="sr-only">Status</span></th>
          </tr>
        </thead>
        <tbody>
          {matches.map((m) => (
            <MatchRow
              key={m.id}
              tournamentId={tournament.id}
              match={m}
              teams={tournament.teams}
              onSaved={onSaved}
              phaseLabel={withPhase ? PHASE_LABELS[m.phase] : undefined}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Pagina ────────────────────────────────────────────────────────────────────

const KO = "ko";

export function ScoresView({
  tournament,
  onUpdate,
}: Readonly<{
  tournament: ActiveTournament;
  onUpdate: (t: ActiveTournament) => void;
}>) {
  const [focus, setFocus] = useState<string>("all");
  const [onlyOpen, setOnlyOpen] = useState(false);

  function handleMatchSaved(updated: TournamentMatch) {
    onUpdate({
      ...tournament,
      matches: tournament.matches.map((m) => (m.id === updated.id ? updated : m)),
    });
  }

  const groupPoules = tournament.poules.filter((p) => p.phase === "GROUP_STAGE");
  const koMatches = tournament.matches
    .filter((m) => m.phase !== "GROUP_STAGE")
    .sort((a, b) => PHASE_ORDER.indexOf(a.phase) - PHASE_ORDER.indexOf(b.phase) ||
      (a.bracketPos ?? "").localeCompare(b.bracketPos ?? ""));
  const filterOpen = (ms: TournamentMatch[]) => (onlyOpen ? ms.filter((m) => !isPlayed(m)) : ms);

  if (groupPoules.length === 0) {
    return (
      <div className="flex flex-col gap-5">
        <Notice tone="info">
          Nog geen poules of wedstrijden. Loot de poules en genereer de wedstrijden via{" "}
          <Link href={`/admin/toernooi/${tournament.id}/schema`} className="font-semibold text-ink underline">Poules &amp; schema</Link>.
        </Notice>
      </div>
    );
  }

  const allGroup = tournament.matches.filter((m) => m.phase === "GROUP_STAGE");

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="group" aria-label="Toon" className="flex flex-wrap gap-2">
          <button type="button" className="chip" aria-pressed={focus === "all"} onClick={() => setFocus("all")}>
            Alles <span className="chip__n">{allGroup.filter(isPlayed).length}/{allGroup.length}</span>
          </button>
          {groupPoules.map((p) => (
            <button key={p.id} type="button" className="chip" aria-pressed={focus === String(p.id)} onClick={() => setFocus(String(p.id))}>
              {p.name.replace(/^Poule\s+/i, "")}
            </button>
          ))}
          {koMatches.length > 0 && (
            <button type="button" className="chip" aria-pressed={focus === KO} onClick={() => setFocus(KO)}>
              Knock-out <span className="chip__n">{koMatches.filter(isPlayed).length}/{koMatches.length}</span>
            </button>
          )}
          <span className="mx-1 w-px self-stretch bg-rule" aria-hidden />
          <button type="button" className="chip" aria-pressed={onlyOpen} onClick={() => setOnlyOpen((v) => !v)}>
            Enkel open
          </button>
        </div>
        <DelayControl tournamentId={tournament.id} />
      </div>

      {focus !== KO && groupPoules
        .filter((p) => focus === "all" || String(p.id) === focus)
        .map((poule) => {
          const pouleTeams = tournament.teams.filter((t) => t.pouleId === poule.id);
          const pouleMatches = tournament.matches.filter((m) => m.pouleId === poule.id);
          const shown = filterOpen(pouleMatches);
          const played = pouleMatches.filter(isPlayed).length;
          const tracks = [...new Set(pouleMatches.map((m) => m.track).filter((t) => t !== null))];
          if (onlyOpen && shown.length === 0) return null;
          return (
            <Panel
              key={poule.id}
              id={`poule-${poule.id}`}
              title={poule.name}
              description={`${played} van ${pouleMatches.length} gespeeld${tracks.length ? ` · baan ${tracks.join(", ")}` : ""}`}
              flush
            >
              {pouleTeams.length > 0 && <StandingsTable teams={pouleTeams} />}
              {shown.length > 0 && (
                <div className="border-t border-rule">
                  <MatchTable tournament={tournament} matches={shown} onSaved={handleMatchSaved} />
                </div>
              )}
            </Panel>
          );
        })}

      {(focus === "all" || focus === KO) && koMatches.length > 0 && filterOpen(koMatches).length > 0 && (
        <Panel
          id="ko"
          title="Knock-out"
          description={`${koMatches.filter(isPlayed).length} van ${koMatches.length} gespeeld · winnaars schuiven automatisch door`}
          flush
        >
          <MatchTable tournament={tournament} matches={filterOpen(koMatches)} onSaved={handleMatchSaved} withPhase />
        </Panel>
      )}

      {onlyOpen && allGroup.every(isPlayed) && koMatches.every(isPlayed) && (
        <Notice tone="ok">Alle wedstrijden hebben een score.</Notice>
      )}
    </div>
  );
}
