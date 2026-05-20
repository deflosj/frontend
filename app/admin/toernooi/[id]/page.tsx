"use client";

import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import type {
  ActiveTournament,
  TournamentMatch,
  TournamentPoule,
  TournamentTeam,
} from "@/lib/tournament-types";
import { IconClock, IconEdit, IconPlus, IconSave, IconTrash, IconX,  } from "@/components/ui/icons";

// ── Default rules text ────────────────────────────────────────────────────────

const DEFAULT_RULES = `De wedstrijd heeft een puur recreatief karakter, dus we rekenen op fairplay van elk team. Bij onenigheid neemt de aangeduide scheidsrechter de definitieve beslissing. Basisregel: De Flosj heeft altijd gelijk!

Elk team ontvangt vier spelersbandjes. Deze moeten tijdens het toernooi gedragen worden en zijn niet uitwisselbaar.

Er wordt verplicht gespeeld in ploegen van vier spelers (uitzondering: eerste poulewedstrijd). Indien een team vanaf de tweede wedstrijd met minder dan vier spelers aantreedt, krijgt het andere team automatisch een forfaitoverwinning (5–0).

Per spelronde moet elk team afwisselend twee verschillende spelers opstellen. Met uitzondering van de eerste poulewedstrijd mag een speler nooit twee spelletjes na elkaar spelen. Speler 1 en 2 blijven aan de ene kant, speler 3 en 4 aan de andere kant van het terrein.

Er wordt gespeeld in poules van 4 ploegen. De eerste twee ploegen in de stand gaan automatisch door naar de volgende ronde. Daarnaast stoten ook de acht beste derdes door naar de 1/16 finales.

Elk team (of een afgevaardigde) moet 15 minuten voor de eerste wedstrijd aanwezig zijn. Niet tijdig aanwezig zijn resulteert in een forfait voor de volgende wedstrijd. Na twee forfaitnederlagen eindigt het toernooi voor het betrokken team.

Voor elke wedstrijd bepaalt een toss welke ploeg mag starten.

Winst: 2 punten | Gelijkspel: 1 punt | Verlies: 0 punten

Bij gelijke stand na de poulefase gelden de volgende criteria in volgorde:
1. Aantal gemaakte ballen
2. Aantal ballen tegen
3. Verschil: gemaakte ballen – ballen tegen
4. Aantal gewonnen wedstrijden
5. Aantal verloren wedstrijden
6. Onderling resultaat
7. Indien nog steeds gelijk: één speler van elk team gooit één bal; wie het dichtst bij het cochonnet ligt, gaat door.

Poulewedstrijden duren 15 minuten en stoppen exact na 15 minuten. Er worden geen ballen meer gegooid zodra het eindsignaal klinkt. Wanneer de 20 minuten verstreken zijn, wordt de lopende mène nog uitgespeeld.

De ploeg met de meeste punten wint. Er is geen puntenlimiet. Per werpbeurt krijgt elk team zes ballen.

Het team dat de toss wint, werpt het cochonnet uit (tussen de 6 m en 9 m om geldig te zijn) en speelt vervolgens de eerste bal. De ploeg met de bal het dichtst bij het cochonnet scoort één punt per beter geplaatste bal dan de beste bal van de tegenstander.

Ballen die volledig over het koord gaan, zijn buiten en tellen niet meer mee.

Wanneer een team niet komt opdagen of met onvoldoende spelers verschijnt, verliest het met 0–5 (forfait).

Door deel te nemen aan dit toernooi geef je toestemming aan De Flosj om foto's te maken en deze te publiceren op sociale media.

── Zuipbeker ──

Bij aanvang van het toernooi wordt elk team gevraagd of het wil deelnemen aan de Zuipbeker. Voor elk deelnemend team wordt het aantal geconsumeerde alcoholische dranken bijgehouden aan de togen van De Flosj met streepjes op een lijst. Per bestelling kunnen maximaal vier streepjes worden genoteerd. Streepjes worden enkel gezet op vertoon van het spelersbandje. Een team kan enkel streepjes laten bijzetten voor het eigen team.

Ook hier geldt: De Flosj heeft altijd gelijk!`;

// ── Types ─────────────────────────────────────────────────────────────────────

type Tab = "overzicht" | "teams" | "schema" | "reglement";

// ── Modal hook ────────────────────────────────────────────────────────────────

function useDialogModal() {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.showModal();
    return () => { if (el.open) el.close(); };
  }, []);
  return ref;
}

// ── Shared input style ────────────────────────────────────────────────────────

const fieldInput: React.CSSProperties = {
  width: "100%",
  padding: "0.6rem 0.875rem",
  border: "1px solid var(--border)",
  borderRadius: "10px",
  background: "var(--bg)",
  color: "var(--text)",
  fontSize: "0.9rem",
  fontFamily: "inherit",
  outline: "none",
  transition: "border-color 120ms ease",
};

const smallInput: React.CSSProperties = {
  padding: "0.35rem 0.5rem",
  border: "1px solid var(--border)",
  borderRadius: "6px",
  background: "var(--bg)",
  color: "var(--text)",
  fontSize: "0.8rem",
  fontFamily: "inherit",
  outline: "none",
  textAlign: "center" as const,
};

// ── Team drawer (add / edit) ──────────────────────────────────────────────────

interface TeamFormData {
  name: string;
  captainName: string;
  speler1: string;
  speler2: string;
  speler3: string;
  speler4: string;
  isPresent: boolean;
  pouleId: string;
}

function TeamDrawer({
  tournamentId,
  poules,
  team,
  onClose,
  onSaved,
}: Readonly<{
  tournamentId: number;
  poules: TournamentPoule[];
  team: TournamentTeam | null;
  onClose: () => void;
  onSaved: (t: TournamentTeam) => void;
}>) {
  const dialogRef = useDialogModal();

  const [form, setForm] = useState<TeamFormData>({
    name:        team?.name        ?? "",
    captainName: team?.captainName ?? "",
    speler1:     team?.speler1     ?? "",
    speler2:     team?.speler2     ?? "",
    speler3:     team?.speler3     ?? "",
    speler4:     team?.speler4     ?? "",
    isPresent:   team?.isPresent   ?? true,
    pouleId:     team?.pouleId != null ? String(team.pouleId) : "",
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  function set(field: keyof TeamFormData, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    setError(""); setSaving(true);
    try {
      const body = {
        name:        form.name.trim(),
        captainName: form.captainName.trim(),
        speler1:     form.speler1.trim(),
        speler2:     form.speler2.trim(),
        speler3:     form.speler3.trim(),
        speler4:     form.speler4.trim(),
        isPresent:   form.isPresent,
        pouleId:     form.pouleId ? Number.parseInt(form.pouleId, 10) : null,
      };
      const result = team
        ? await apiFetch<TournamentTeam>(`tournaments/${tournamentId}/teams/${team.id}`, { method: "PATCH", body: JSON.stringify(body) })
        : await apiFetch<TournamentTeam>(`tournaments/${tournamentId}/teams`, { method: "POST",  body: JSON.stringify(body) });
      onSaved(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Opslaan mislukt.");
    } finally { setSaving(false); }
  }

  const isEdit = team !== null;

  return (
    <dialog ref={dialogRef} onClose={onClose} className="admin-drawer"
      style={{ width: "min(520px, 100vw)" }} aria-label={isEdit ? "Team bewerken" : "Team toevoegen"}>
      <div className="admin-drawer__header">
        <h2>{isEdit ? "Team bewerken" : "Team toevoegen"}</h2>
        <button type="button" className="admin-drawer__close" onClick={onClose} aria-label="Sluiten"><IconX /></button>
      </div>

      <form className="admin-form" onSubmit={handleSubmit}>
        {error && <div className="form-error">{error}</div>}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div className="form-field" style={{ gridColumn: "1 / -1" }}>
            <label htmlFor="t-name">Teamnaam</label>
            <input id="t-name" type="text" required disabled={saving}
              value={form.name} onChange={(e) => set("name", e.target.value)} />
          </div>
          <div className="form-field" style={{ gridColumn: "1 / -1" }}>
            <label htmlFor="t-captain">Kapitein</label>
            <input id="t-captain" type="text" disabled={saving}
              value={form.captainName} onChange={(e) => set("captainName", e.target.value)} />
          </div>
          <div className="form-field">
            <label htmlFor="t-sp1">Speler 1</label>
            <input id="t-sp1" type="text" disabled={saving}
              value={form.speler1} onChange={(e) => set("speler1", e.target.value)} />
          </div>
          <div className="form-field">
            <label htmlFor="t-sp2">Speler 2</label>
            <input id="t-sp2" type="text" disabled={saving}
              value={form.speler2} onChange={(e) => set("speler2", e.target.value)} />
          </div>
          <div className="form-field">
            <label htmlFor="t-sp3">Speler 3</label>
            <input id="t-sp3" type="text" disabled={saving}
              value={form.speler3} onChange={(e) => set("speler3", e.target.value)} />
          </div>
          <div className="form-field">
            <label htmlFor="t-sp4">Speler 4</label>
            <input id="t-sp4" type="text" disabled={saving}
              value={form.speler4} onChange={(e) => set("speler4", e.target.value)} />
          </div>
          <div className="form-field">
            <label htmlFor="t-poule">Poule</label>
            <select id="t-poule" disabled={saving} style={fieldInput}
              value={form.pouleId} onChange={(e) => set("pouleId", e.target.value)}>
              <option value="">— Nog niet toegewezen —</option>
              {poules.filter((p) => p.phase === "GROUP").map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="form-field" style={{ justifyContent: "flex-end" }}>
            <label className="form-checkbox">
              <input type="checkbox" checked={form.isPresent} disabled={saving}
                onChange={(e) => set("isPresent", e.target.checked)} />
              Aanwezig op toernooi
            </label>
          </div>
        </div>

        <div className="admin-drawer__actions">
          <button type="submit" className="btn-sm btn-sm--primary" disabled={saving || !form.name.trim()}>
            {saving ? "Opslaan…" : "Opslaan"}
          </button>
          <button type="button" className="btn-sm btn-sm--ghost" onClick={onClose}>Annuleren</button>
        </div>
      </form>
    </dialog>
  );
}

// ── Match row (inline editing) ────────────────────────────────────────────────

function matchStatusColor(m: TournamentMatch): string {
  if (m.scoreA !== null && m.scoreB !== null) return "#1e7e34";
  if (m.scoreA !== null || m.scoreB !== null) return "#b37400";
  return "var(--border)";
}

function MatchRow({
  match,
  teams,
  onSaved,
}: Readonly<{
  match: TournamentMatch;
  teams: TournamentTeam[];
  onSaved: (m: TournamentMatch) => void;
}>) {
  const [scoreA, setScoreA]   = useState(match.scoreA !== null ? String(match.scoreA) : "");
  const [scoreB, setScoreB]   = useState(match.scoreB !== null ? String(match.scoreB) : "");
  const [time, setTime]       = useState(match.time ?? "");
  const [track, setTrack]     = useState(match.track !== null ? String(match.track) : "");
  const [teamAId, setTeamAId] = useState(match.teamAId !== null ? String(match.teamAId) : "");
  const [teamBId, setTeamBId] = useState(match.teamBId !== null ? String(match.teamBId) : "");
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");

  const toStr = (v: number | null) => (v !== null ? String(v) : "");
  const isDirty =
    scoreA !== toStr(match.scoreA) ||
    scoreB !== toStr(match.scoreB) ||
    time   !== (match.time ?? "") ||
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
      const updated = await apiFetch<TournamentMatch>(`matches/${match.id}`, {
        method: "PATCH", body: JSON.stringify(body),
      });
      onSaved(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fout");
    } finally { setSaving(false); }
  }

  const selectStyle: React.CSSProperties = { ...smallInput, width: "100%", textAlign: "left" as const };

  return (
    <tr style={{ background: isComplete ? "color-mix(in srgb, #1e7e34 6%, transparent)" : undefined }}>
      <td style={{ width: 4, padding: 0, background: statusColor }} aria-hidden="true" />
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
            style={{ ...smallInput, width: 38 }} />
          <span style={{ color: "var(--muted)", fontWeight: 600 }}>–</span>
          <input type="number" value={scoreB} min="0" max="99" aria-label="Score B"
            onChange={(e) => setScoreB(e.target.value)}
            style={{ ...smallInput, width: 38 }} />
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
        {error && <span style={{ color: "#c5221f", fontSize: "0.7rem", display: "block" }}>{error}</span>}
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
      {done && <span style={{ fontSize: "0.8rem", color: "#1e7e34", fontWeight: 500 }}>✓ Toegepast</span>}
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
            <td style={{ color: "var(--muted)", fontSize: "0.75rem" }}>{i + 1}</td>
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
            <td className="mono" style={{ color: t.saldo >= 0 ? "#1e7e34" : "#c5221f" }}>
              {t.saldo >= 0 ? "+" : ""}{t.saldo}
            </td>
            <td><strong className="mono">{t.points}</strong></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ── Tab: Overzicht ────────────────────────────────────────────────────────────

function OverviewTab({
  tournament,
  onUpdate,
}: Readonly<{
  tournament: ActiveTournament;
  onUpdate: (t: ActiveTournament) => void;
}>) {
  const [name, setName]     = useState(tournament.name);
  const [year, setYear]     = useState(String(tournament.year));
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError]     = useState("");

  const teamCount    = tournament.teams.length;
  const presentCount = tournament.teams.filter((t) => t.isPresent).length;
  const matchCount   = tournament.matches.length;
  const doneCount    = tournament.matches.filter((m) => m.scoreA !== null && m.scoreB !== null).length;

  async function saveBasics(e: { preventDefault(): void }) {
    e.preventDefault();
    setError(""); setSaving(true);
    try {
      const updated = await apiFetch<ActiveTournament>(`tournaments/${tournament.id}`, {
        method: "PATCH", body: JSON.stringify({ name: name.trim(), year: Number.parseInt(year, 10) }),
      });
      onUpdate(updated);
    } catch (err) { setError(err instanceof Error ? err.message : "Fout."); }
    finally { setSaving(false); }
  }

  async function generateMatches() {
    setGenError(""); setGenerating(true);
    try {
      const updated = await apiFetch<ActiveTournament>(`tournaments/${tournament.id}/generate-matches`, { method: "POST" });
      onUpdate(updated);
    } catch (err) { setGenError(err instanceof Error ? err.message : "Genereren mislukt."); }
    finally { setGenerating(false); }
  }

  return (
    <div style={{ display: "grid", gap: "1.5rem", maxWidth: "680px" }}>
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem" }}>
        {[
          { label: "Teams",    value: `${presentCount} / ${teamCount} aanwezig` },
          { label: "Poules",   value: tournament.poules.filter((p) => p.phase === "GROUP").length },
          { label: "Matchen",  value: `${doneCount} / ${matchCount} gespeeld` },
          { label: "Status",   value: tournament.isActive ? "Actief" : "Inactief" },
        ].map((s) => (
          <div key={s.label} className="admin-stat">
            <p className="admin-stat__label">{s.label}</p>
            <p className="admin-stat__value" style={{ fontSize: "1.1rem" }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Edit basics */}
      <div className="admin-table-wrapper">
        <div className="admin-table-header"><h2>Basisgegevens</h2></div>
        <div style={{ padding: "1.25rem 1.4rem" }}>
          <form className="admin-form" onSubmit={saveBasics}>
            {error && <div className="form-error">{error}</div>}
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "1rem" }}>
              <div className="form-field">
                <label htmlFor="ov-name">Naam</label>
                <input id="ov-name" type="text" value={name} required disabled={saving}
                  onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="form-field">
                <label htmlFor="ov-year">Jaar</label>
                <input id="ov-year" type="number" value={year} min="2000" max="2100" required
                  disabled={saving} style={{ width: "90px" }}
                  onChange={(e) => setYear(e.target.value)} />
              </div>
            </div>
            <button type="submit" className="btn-sm btn-sm--primary"
              disabled={saving} style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
              <IconSave /> {saving ? "Opslaan…" : "Opslaan"}
            </button>
          </form>
        </div>
      </div>

      {/* Generate matches */}
      <div className="admin-table-wrapper">
        <div className="admin-table-header">
          <h2>Wedstrijden genereren</h2>
        </div>
        <div style={{ padding: "1.25rem 1.4rem" }}>
          {genError && <div className="form-error" style={{ marginBottom: "1rem" }}>{genError}</div>}
          <p style={{ margin: "0 0 1rem", fontSize: "0.875rem", color: "var(--text-2)", lineHeight: 1.6 }}>
            Genereert automatisch alle poulematchen op basis van de teamindelingen.
            Volgorde: poule 1v3, 2v4 → 1v4, 2v3 → 1v2, 3v4.
          </p>
          <button type="button" className="btn-sm btn-sm--primary"
            onClick={generateMatches} disabled={generating || teamCount === 0}>
            {generating ? "Genereren…" : "Genereer wedstrijden"}
          </button>
          {teamCount === 0 && (
            <p style={{ margin: "0.5rem 0 0", fontSize: "0.8rem", color: "var(--muted)" }}>
              Voeg eerst teams toe via het tabblad &quot;Teams&quot;.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Tab: Teams ────────────────────────────────────────────────────────────────

function TeamsTab({
  tournament,
  onUpdate,
}: Readonly<{
  tournament: ActiveTournament;
  onUpdate: (t: ActiveTournament) => void;
}>) {
  const [editTeam, setEditTeam]     = useState<TournamentTeam | null | "new">(null);
  const [deleteTeam, setDeleteTeam] = useState<TournamentTeam | null>(null);
  const [deleting, setDeleting]     = useState(false);

  const groupPoules = tournament.poules.filter((p) => p.phase === "GROUP");
  const pouleMap    = new Map(groupPoules.map((p) => [p.id, p.name]));

  function handleSaved(saved: TournamentTeam) {
    const teams = tournament.teams.find((t) => t.id === saved.id)
      ? tournament.teams.map((t) => (t.id === saved.id ? saved : t))
      : [...tournament.teams, saved];
    onUpdate({ ...tournament, teams });
    setEditTeam(null);
  }

  async function togglePresent(team: TournamentTeam) {
    try {
      const updated = await apiFetch<TournamentTeam>(
        `tournaments/${tournament.id}/teams/${team.id}`,
        { method: "PATCH", body: JSON.stringify({ isPresent: !team.isPresent }) }
      );
      onUpdate({ ...tournament, teams: tournament.teams.map((t) => (t.id === updated.id ? updated : t)) });
    } catch { /* ignore */ }
  }

  async function doDelete() {
    if (!deleteTeam) return;
    setDeleting(true);
    try {
      await apiFetch(`tournaments/${tournament.id}/teams/${deleteTeam.id}`, { method: "DELETE" });
      onUpdate({ ...tournament, teams: tournament.teams.filter((t) => t.id !== deleteTeam.id) });
      setDeleteTeam(null);
    } catch { /* ignore */ } finally { setDeleting(false); }
  }

  return (
    <>
      <div className="admin-table-wrapper">
        <div className="admin-table-header">
          <h2>Teams ({tournament.teams.length})</h2>
          <button type="button" className="btn-sm btn-sm--primary"
            onClick={() => setEditTeam("new")}
            style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <IconPlus /> Team toevoegen
          </button>
        </div>

        {tournament.teams.length === 0 ? (
          <p className="admin-empty">Nog geen teams. Klik op &quot;Team toevoegen&quot; om te beginnen.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Team</th><th>Kapitein</th><th>Poule</th><th>Aanwezig</th><th>Acties</th>
              </tr>
            </thead>
            <tbody>
              {tournament.teams.map((team) => (
                <tr key={team.id}>
                  <td><strong>{team.name}</strong></td>
                  <td>{team.captainName || <span style={{ color: "var(--muted)" }}>—</span>}</td>
                  <td>
                    {team.pouleId ? (
                      <span className="badge badge--blue">{pouleMap.get(team.pouleId) ?? `#${team.pouleId}`}</span>
                    ) : (
                      <span style={{ color: "var(--muted)", fontSize: "0.8rem" }}>Niet toegewezen</span>
                    )}
                  </td>
                  <td>
                    <button type="button"
                      className={`btn-sm ${team.isPresent ? "btn-sm--success" : "btn-sm--ghost"}`}
                      onClick={() => togglePresent(team)}>
                      {team.isPresent ? "✓ Aanwezig" : "Afwezig"}
                    </button>
                  </td>
                  <td>
                    <div className="row-actions">
                      <button type="button" className="btn-sm btn-sm--ghost"
                        onClick={() => setEditTeam(team)}
                        style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                        <IconEdit /> Bewerken
                      </button>
                      <button type="button" className="btn-sm btn-sm--danger"
                        onClick={() => setDeleteTeam(team)}
                        style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                        <IconTrash /> Verwijderen
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editTeam === "new" && (
        <TeamDrawer
          tournamentId={tournament.id}
          poules={tournament.poules}
          team={null}
          onClose={() => setEditTeam(null)}
          onSaved={handleSaved}
        />
      )}
      {editTeam !== null && editTeam !== "new" && (
        <TeamDrawer
          tournamentId={tournament.id}
          poules={tournament.poules}
          team={editTeam}
          onClose={() => setEditTeam(null)}
          onSaved={handleSaved}
        />
      )}

      {deleteTeam && (
        <DeleteTeamConfirm
          team={deleteTeam}
          onConfirm={doDelete}
          onCancel={() => setDeleteTeam(null)}
          loading={deleting}
        />
      )}
    </>
  );
}

function DeleteTeamConfirm({
  team, onConfirm, onCancel, loading,
}: Readonly<{ team: TournamentTeam; onConfirm: () => void; onCancel: () => void; loading: boolean }>) {
  const dialogRef = useDialogModal();
  return (
    <dialog ref={dialogRef} onClose={onCancel} className="admin-confirm" aria-label="Team verwijderen">
      <h2 style={{ margin: "0 0 0.5rem", fontSize: "1.1rem", fontWeight: 500, color: "var(--text)" }}>
        Team verwijderen?
      </h2>
      <p style={{ margin: "0 0 1.5rem", fontSize: "0.875rem", color: "var(--muted)" }}>
        <strong style={{ color: "var(--text)" }}>{team.name}</strong> en alle bijbehorende
        data worden permanent verwijderd.
      </p>
      <div style={{ display: "flex", gap: "0.75rem" }}>
        <button type="button" className="btn-sm btn-sm--danger" onClick={onConfirm} disabled={loading}>
          {loading ? "Verwijderen…" : "Verwijderen"}
        </button>
        <button type="button" className="btn-sm btn-sm--ghost" onClick={onCancel}>Annuleren</button>
      </div>
    </dialog>
  );
}

// ── Tab: Schema ───────────────────────────────────────────────────────────────

function SchemaTab({
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

  const groupPoules = tournament.poules.filter((p) => p.phase === "GROUP");

  return (
    <div>
      <DelaySection tournamentId={tournament.id} />

      {groupPoules.length === 0 && (
        <p className="admin-empty">
          Nog geen poules of wedstrijden. Genereer wedstrijden via het tabblad &quot;Overzicht&quot;.
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
    </div>
  );
}

// ── Tab: Reglement ────────────────────────────────────────────────────────────

function ReglementTab({
  tournament,
  onUpdate,
}: Readonly<{
  tournament: ActiveTournament;
  onUpdate: (t: ActiveTournament) => void;
}>) {
  const [text, setText] = useState(tournament.rules?.description ?? DEFAULT_RULES);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");
  const [saved, setSaved]   = useState(false);

  async function save() {
    setError(""); setSaving(true);
    try {
      const updated = await apiFetch<ActiveTournament>(`tournaments/${tournament.id}`, {
        method: "PATCH", body: JSON.stringify({ rules: { description: text } }),
      });
      onUpdate(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Opslaan mislukt.");
    } finally { setSaving(false); }
  }

  return (
    <div style={{ maxWidth: "720px" }}>
      <div className="admin-table-wrapper">
        <div className="admin-table-header">
          <h2>Reglement</h2>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            {saved && <span style={{ fontSize: "0.8rem", color: "#1e7e34", fontWeight: 500 }}>✓ Opgeslagen</span>}
            {error && <span style={{ fontSize: "0.8rem", color: "#c5221f" }}>{error}</span>}
            <button type="button" className="btn-sm btn-sm--primary"
              onClick={save} disabled={saving}
              style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
              <IconSave /> {saving ? "Opslaan…" : "Opslaan"}
            </button>
          </div>
        </div>
        <div style={{ padding: "1rem 1.4rem" }}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={28}
            aria-label="Reglement tekst"
            style={{
              width: "100%",
              resize: "vertical",
              fontFamily: "var(--font-geist-mono), monospace",
              fontSize: "0.82rem",
              lineHeight: 1.7,
              padding: "0.75rem",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              background: "var(--bg)",
              color: "var(--text)",
              outline: "none",
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ── Tab navigation ────────────────────────────────────────────────────────────

const TAB_LABELS: Record<Tab, string> = {
  overzicht: "Overzicht",
  teams:     "Teams",
  schema:    "Schema",
  reglement: "Reglement",
};

// ── Main page ─────────────────────────────────────────────────────────────────

export default function TournamentDetailPage({
  params,
}: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = use(params);
  const [tournament, setTournament] = useState<ActiveTournament | null>(null);
  const [loading, setLoading]       = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [tab, setTab]               = useState<Tab>("overzicht");

  useEffect(() => {
    apiFetch<ActiveTournament>(`tournaments/${id}`)
      .then(setTournament)
      .catch((e) => setFetchError(e instanceof Error ? e.message : "Niet gevonden."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="admin-empty">Laden…</p>;
  if (fetchError) return <p className="admin-empty" style={{ color: "var(--accent)" }}>{fetchError}</p>;
  if (!tournament) return null;

  return (
    <>
      {/* Back + Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <Link href="/admin/toernooi"
          style={{ fontSize: "0.8rem", color: "var(--muted)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.3rem", marginBottom: "0.75rem" }}>
          ← Alle toernooien
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 500, letterSpacing: "-0.03em", color: "var(--text)" }}>
            {tournament.name}
          </h1>
          <span className="mono" style={{ color: "var(--muted)", fontSize: "0.9rem" }}>{tournament.year}</span>
          {tournament.isActive && <span className="badge badge--pink">Actief</span>}
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: "flex", gap: "0.25rem", borderBottom: "1px solid var(--border)",
        marginBottom: "1.75rem",
      }}>
        {(Object.keys(TAB_LABELS) as Tab[]).map((t) => (
          <button
            key={t} type="button"
            onClick={() => setTab(t)}
            style={{
              padding: "0.55rem 1rem",
              fontSize: "0.875rem",
              fontWeight: tab === t ? 600 : 400,
              color: tab === t ? "var(--accent)" : "var(--text-2)",
              background: "none",
              border: "none",
              borderBottom: tab === t ? "2px solid var(--accent)" : "2px solid transparent",
              cursor: "pointer",
              fontFamily: "inherit",
              marginBottom: "-1px",
              transition: "color 120ms ease",
            }}
          >
            {TAB_LABELS[t]}
            {t === "teams" && (
              <span style={{
                marginLeft: "0.4rem", fontSize: "0.7rem", fontWeight: 600,
                background: "var(--bg-alt)", border: "1px solid var(--border)",
                borderRadius: "99px", padding: "0.1rem 0.4rem", color: "var(--muted)",
              }}>
                {tournament.teams.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "overzicht"  && <OverviewTab  tournament={tournament} onUpdate={setTournament} />}
      {tab === "teams"      && <TeamsTab     tournament={tournament} onUpdate={setTournament} />}
      {tab === "schema"     && <SchemaTab    tournament={tournament} onUpdate={setTournament} />}
      {tab === "reglement"  && <ReglementTab tournament={tournament} onUpdate={setTournament} />}
    </>
  );
}
