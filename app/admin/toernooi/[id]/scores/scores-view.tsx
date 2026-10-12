"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";
import type { ActiveTournament, TournamentMatch, TournamentTeam } from "@/lib/tournament-types";
import { PHASE_LABELS, PHASE_ORDER } from "@/lib/tournament-types";
import { IconClock, IconSave } from "@/components/ui/icons";
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

  const selectStyle: React.CSSProperties = { ...smallInput, width: "100%", textAlign: "left" as const };

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
      <td style={{ width: 80 }}>
        {error && <span style={{ color: "var(--err-fg)", fontSize: "0.7rem", display: "block" }}>{error}</span>}
        <button type="button" className="btn-sm btn-sm--primary" onClick={save}
          disabled={saving || !isDirty}
          style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
          <IconSave />
          {saving ? "…" : "Opslaan"}
        </button>
      </td>
    </tr>
  );
}

// ── Delay section ─────────────────────────────────────────────────────────────

function DelaySection({ tournamentId }: Readonly<{ tournamentId: number }>) {
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
    <div style={{
      display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap",
      padding: "0.8rem 1rem", borderRadius: "var(--radius-lg)",
      background: "var(--bg-alt)", border: "1px solid var(--border)", marginBottom: "1.5rem",
    }}>
      <IconClock />
      <span style={{ fontSize: "0.875rem", color: "var(--text-2)", fontWeight: 500 }}>Vertraging:</span>
      <input
        type="number" value={minutes} min="-120" max="120" placeholder="min"
        aria-label="Vertraging in minuten"
        onChange={(e) => setMinutes(e.target.value)}
        style={{ ...smallInput, width: "64px" }}
      />
      <button type="button" className="btn-sm btn-sm--primary" onClick={apply}
        disabled={applying || !minutes}>
        {applying ? "Bezig…" : "Toepassen op komende matchen"}
      </button>
      {done && <span style={{ fontSize: "0.8rem", color: "var(--ok-fg)", fontWeight: 500 }}>✓ Toegepast</span>}
    </div>
  );
}

// ── Standings table ───────────────────────────────────────────────────────────

function StandingsTable({ teams }: Readonly<{ teams: TournamentTeam[] }>) {
  const sorted = [...teams].sort((a, b) => {
    if (b.points !== a.points)       return b.points - a.points;
    if (b.goalsFor !== a.goalsFor)   return b.goalsFor - a.goalsFor;
    if (a.goalsAgainst !== b.goalsAgainst) return a.goalsAgainst - b.goalsAgainst;
    return b.won - a.won;
  });

  return (
    <table className="admin-table" style={{ marginBottom: "0.5rem" }}>
      <thead>
        <tr>
          <th>#</th><th>Team</th><th>Sp</th><th>W</th><th>G</th><th>V</th>
          <th>VP</th><th>TP</th><th>+/-</th><th>Pts</th>
        </tr>
      </thead>
      <tbody>
        {sorted.map((t, i) => (
          <tr key={t.id}>
            <td style={{ color: "var(--ink-2)", fontSize: "0.75rem" }}>{i + 1}</td>
            <td>
              <strong>{t.name}</strong>
              {t.isPresent === false && (
                <span className="badge badge--gray" style={{ marginLeft: "0.5rem" }}>Afwezig</span>
              )}
            </td>
            <td className="mono">{t.played}</td>
            <td className="mono">{t.won}</td>
            <td className="mono">{t.drawn}</td>
            <td className="mono">{t.lost}</td>
            <td className="mono">{t.goalsFor}</td>
            <td className="mono">{t.goalsAgainst}</td>
            <td className="mono" style={{ color: t.saldo >= 0 ? "var(--ok-fg)" : "var(--err-fg)" }}>
              {t.saldo >= 0 ? "+" : ""}{t.saldo}
            </td>
            <td><strong className="mono">{t.points}</strong></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}


// ── Tab: Schema ───────────────────────────────────────────────────────────────

export function ScoresView({
  tournament,
  onUpdate,
}: Readonly<{
  tournament: ActiveTournament;
  onUpdate: (t: ActiveTournament) => void;
}>) {
  function handleMatchSaved(updated: TournamentMatch) {
    onUpdate({
      ...tournament,
      matches: tournament.matches.map((m) => (m.id === updated.id ? updated : m)),
    });
  }

  const groupPoules = tournament.poules.filter((p) => p.phase === "GROUP_STAGE");

  return (
    <div>
      <DelaySection tournamentId={tournament.id} />

      {groupPoules.length === 0 && (
        <p className="admin-empty">
          Nog geen poules of wedstrijden. Loot de poules en genereer de wedstrijden via &quot;Poules &amp; schema&quot;.
        </p>
      )}

      {groupPoules.map((poule) => {
        const pouleTeams   = tournament.teams.filter((t) => t.pouleId === poule.id);
        const pouleMatches = tournament.matches.filter((m) => m.pouleId === poule.id);
        return (
          <div key={poule.id} style={{ marginBottom: "2rem" }}>
            <h3 style={{
              margin: "0 0 0.75rem",
              fontSize: "0.875rem",
              fontWeight: 600,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "var(--accent)",
            }}>
              {poule.name}
            </h3>

            {pouleTeams.length > 0 && <StandingsTable teams={pouleTeams} />}

            {pouleMatches.length > 0 && (
              <div className="admin-table-wrapper" style={{ marginTop: "0.75rem" }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th style={{ width: 4, padding: 0 }} aria-hidden="true" />
                      <th>Team A</th>
                      <th style={{ textAlign: "center" }}>Score</th>
                      <th>Team B</th>
                      <th>Tijd</th>
                      <th>Baan</th>
                      <th>Opslaan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pouleMatches.map((m) => (
                      <MatchRow
                        key={m.id}
                        tournamentId={tournament.id}
                        match={m}
                        teams={tournament.teams}
                        onSaved={handleMatchSaved}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}

      <KnockoutSection
        tournament={tournament}
        onMatchSaved={handleMatchSaved}
      />
    </div>
  );
}

/** De knockoutwedstrijden hangen aan geen enkele poule, dus ze vielen tot nu
 *  toe buiten dit scherm. Winnaars schuiven serverside door; de selects blijven
 *  staan om een rechtzetting te doen. */
function KnockoutSection({
  tournament,
  onMatchSaved,
}: Readonly<{
  tournament: ActiveTournament;
  onMatchSaved: (m: TournamentMatch) => void;
}>) {
  const koMatches = tournament.matches
    .filter((m) => m.phase !== "GROUP_STAGE")
    .sort((a, b) => PHASE_ORDER.indexOf(a.phase) - PHASE_ORDER.indexOf(b.phase) ||
      (a.bracketPos ?? "").localeCompare(b.bracketPos ?? ""));

  if (koMatches.length === 0) return null;

  return (
    <div style={{ marginBottom: "2rem" }}>
      <h3 style={{
        margin: "0 0 0.75rem",
        fontSize: "0.875rem",
        fontWeight: 600,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        color: "var(--accent)",
      }}>
        Knockout
      </h3>
      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th style={{ width: 4, padding: 0 }} aria-hidden="true" />
              <th>Fase</th>
              <th>Team A</th>
              <th style={{ textAlign: "center" }}>Score</th>
              <th>Team B</th>
              <th>Tijd</th>
              <th>Baan</th>
              <th>Opslaan</th>
            </tr>
          </thead>
          <tbody>
            {koMatches.map((m) => (
              <MatchRow
                key={m.id}
                tournamentId={tournament.id}
                match={m}
                teams={tournament.teams}
                onSaved={onMatchSaved}
                phaseLabel={PHASE_LABELS[m.phase]}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
