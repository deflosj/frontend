"use client";

import { useRef, useState } from "react";

import { apiFetch } from "@/lib/api";
import { PaymentSelect, paymentBody, paymentValue } from "./payment-select";
import type { ActiveTournament, TournamentTeam } from "@/lib/tournament-types";
import { TeamLinkActions, portalUrl } from "./team-link";
import { IconPlus, IconTrash } from "@/components/ui/icons";
import { QrModal } from "@/components/ui/qr-modal";

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
};

/** Plaatshouders tijdelijk verborgen — zet op true om ze terug te tonen. */
const SHOW_PLACEHOLDERS = false;

/** Volgend vrij nummer voor plaatshouders: Team 1, Team 2, … */
function nextPlaceholderNumber(teams: TournamentTeam[]): number {
  let highest = teams.length;
  for (const t of teams) {
    const m = /^team\s+(\d+)$/i.exec(t.name.trim());
    if (m) highest = Math.max(highest, Number.parseInt(m[1], 10));
  }
  return highest + 1;
}

interface Props {
  tournament: ActiveTournament;
  onUpdate: (t: ActiveTournament) => void;
}

export function AanmeldingTab({ tournament, onUpdate }: Readonly<Props>) {
  const nameRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [captain, setCaptain] = useState("");
  // Blijft staan tussen aanmeldingen door — aan de balie betaalt bijna
  // iedereen meteen, dus dit hoef je zelden om te zetten.
  const [payment, setPayment] = useState<string>("CASH");
  const [email, setEmail] = useState("");
  const [showPlayers, setShowPlayers] = useState(false);
  const [players, setPlayers] = useState(["", "", "", ""]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [justAdded, setJustAdded] = useState<TournamentTeam | null>(null);

  const [deadline, setDeadline] = useState(
    tournament.teamEditDeadline ? tournament.teamEditDeadline.slice(0, 16) : ""
  );
  const [deadlineBusy, setDeadlineBusy] = useState(false);
  const [deadlineSaved, setDeadlineSaved] = useState(false);

  const [bulkCount, setBulkCount] = useState("4");
  const [bulkBusy, setBulkBusy] = useState(false);
  const [showQr, setShowQr] = useState(false);

  // Hoogste id eerst = laatst aangemaakt bovenaan.
  const sorted = [...tournament.teams].sort((a, b) => b.id - a.id);
  const paidCount = tournament.teams.filter((t) => t.isPaid).length;
  const cashCount = tournament.teams.filter((t) => t.paymentMethod === "CASH").length;
  const payconiqCount = tournament.teams.filter((t) => t.paymentMethod === "PAYCONIQ").length;

  function resetForm() {
    setName("");
    setCaptain("");
    setEmail("");
    setPlayers(["", "", "", ""]);
    nameRef.current?.focus();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    const clash = tournament.teams.some(
      (t) => t.name.trim().toLowerCase() === trimmed.toLowerCase()
    );
    if (clash) {
      setError(`Er is al een team dat "${trimmed}" heet.`);
      return;
    }

    setError("");
    setSaving(true);
    try {
      const created = await apiFetch<TournamentTeam>(`tournaments/${tournament.id}/teams`, {
        method: "POST",
        body: JSON.stringify({
          name: trimmed,
          captainName: captain.trim(),
          email: email.trim() || null,
          speler1: showPlayers ? players[0].trim() : "",
          speler2: showPlayers ? players[1].trim() : "",
          speler3: showPlayers ? players[2].trim() : "",
          speler4: showPlayers ? players[3].trim() : "",
          // Aanmelden is niet hetzelfde als aanwezig zijn: het vinkje
          // "Aanwezig" is voor de check-in op de toernooidag zelf.
          isPresent: false,
          ...paymentBody(payment),
          pouleId: null,
        }),
      });
      onUpdate({ ...tournament, teams: [...tournament.teams, created] });
      setJustAdded(created);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Aanmelden mislukt.");
    } finally {
      setSaving(false);
    }
  }

  async function addPlaceholders() {
    const count = Math.min(Math.max(Number.parseInt(bulkCount, 10) || 0, 1), 32);
    setError("");
    setBulkBusy(true);
    const created: TournamentTeam[] = [];
    try {
      let n = nextPlaceholderNumber(tournament.teams);
      for (let i = 0; i < count; i++) {
        const team = await apiFetch<TournamentTeam>(`tournaments/${tournament.id}/teams`, {
          method: "POST",
          body: JSON.stringify({
            name: `Team ${n}`,
            captainName: "",
            speler1: "", speler2: "", speler3: "", speler4: "",
            isPresent: false,
            isPaid: false,
            pouleId: null,
          }),
        });
        created.push(team);
        n += 1;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Niet alle plaatshouders zijn aangemaakt.");
    } finally {
      if (created.length) {
        onUpdate({ ...tournament, teams: [...tournament.teams, ...created] });
      }
      setBulkBusy(false);
    }
  }

  async function saveDeadline() {
    setDeadlineBusy(true);
    setDeadlineSaved(false);
    try {
      const updated = await apiFetch<ActiveTournament>(`tournaments/${tournament.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          teamEditDeadline: deadline ? new Date(deadline).toISOString() : null,
        }),
      });
      onUpdate({ ...tournament, teamEditDeadline: updated.teamEditDeadline ?? null });
      setDeadlineSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Deadline opslaan mislukt.");
    } finally {
      setDeadlineBusy(false);
    }
  }

  async function updatePayment(team: TournamentTeam, value: string) {
    try {
      const updated = await apiFetch<TournamentTeam>(
        `tournaments/${tournament.id}/teams/${team.id}`,
        { method: "PATCH", body: JSON.stringify(paymentBody(value)) }
      );
      onUpdate({
        ...tournament,
        teams: tournament.teams.map((t) => (t.id === updated.id ? updated : t)),
      });
    } catch {
      /* stil — de balie mag hier niet op vastlopen */
    }
  }

  async function removeTeam(team: TournamentTeam) {
    try {
      await apiFetch(`tournaments/${tournament.id}/teams/${team.id}`, { method: "DELETE" });
      onUpdate({ ...tournament, teams: tournament.teams.filter((t) => t.id !== team.id) });
    } catch {
      /* stil */
    }
  }

  return (
    <>
      {/* ── Aanmeldformulier ────────────────────────────────── */}
      <div className="admin-table-wrapper" style={{ marginBottom: "1.5rem" }}>
        <div className="admin-table-header">
          <h2>Aanmelding</h2>
          <span style={{ fontSize: "0.8rem", color: "var(--ink-2)" }}>
            {tournament.teams.length} aangemeld · {paidCount} betaald ({cashCount} cash, {payconiqCount} Payconiq)
            {" · "}
            <button type="button" onClick={() => setShowQr(true)} style={{ color: "var(--pink, #e6007e)", fontWeight: 600 }}>
              QR zelf-inschrijving
            </button>
          </span>
        </div>
        {showQr && (
          <QrModal
            title="Scan & schrijf je team in"
            subtitle={`${tournament.name} ${tournament.year}`}
            url={`${globalThis.location.origin}/team-aanmelden`}
            filename="deflosj-team-aanmelden"
            onClose={() => setShowQr(false)}
          />
        )}

        <form onSubmit={handleSubmit} style={{ padding: "1.25rem" }}>
          {error && <div className="form-error" style={{ marginBottom: "0.75rem" }}>{error}</div>}

          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "flex-end" }}>
            <div className="form-field" style={{ flex: "2 1 220px", minWidth: 0 }}>
              <label htmlFor="a-name">Teamnaam</label>
              {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
              <input
                id="a-name" ref={nameRef} type="text" required autoFocus
                autoComplete="off" disabled={saving} style={fieldInput}
                value={name} onChange={(e) => { setName(e.target.value); setError(""); }}
              />
            </div>
            <div className="form-field" style={{ flex: "2 1 200px", minWidth: 0 }}>
              <label htmlFor="a-captain">Kapitein</label>
              <input
                id="a-captain" type="text" autoComplete="off" disabled={saving} style={fieldInput}
                value={captain} onChange={(e) => setCaptain(e.target.value)}
              />
            </div>
            <div className="form-field" style={{ flex: "2 1 200px", minWidth: 0 }}>
              <label htmlFor="a-email">E-mail kapitein</label>
              <input
                id="a-email" type="email" autoComplete="off" disabled={saving} style={fieldInput}
                value={email} onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="form-field" style={{ flex: "0 0 auto", justifyContent: "flex-end" }}>
              <label htmlFor="a-payment">Betaling</label>
              <PaymentSelect id="a-payment" value={payment} onChange={setPayment} disabled={saving} />
            </div>
            <button
              type="submit" className="btn-sm btn-sm--primary"
              disabled={saving || !name.trim()}
              style={{ flex: "0 0 auto", padding: "0.6rem 1.1rem" }}
            >
              {saving ? "Bezig…" : "Aanmelden ⏎"}
            </button>
          </div>

          {/* Spelers — enkel als het team ze meteen geeft */}
          <button
            type="button"
            onClick={() => setShowPlayers((v) => !v)}
            style={{
              marginTop: "0.9rem", background: "none", border: "none", padding: 0,
              fontFamily: "inherit", fontSize: "0.8rem", color: "var(--ink-2)", cursor: "pointer",
            }}
          >
            {showPlayers ? "− Spelers verbergen" : "+ Spelers toevoegen (optioneel)"}
          </button>

          {showPlayers && (
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: "0.75rem", marginTop: "0.75rem",
            }}>
              {players.map((value, i) => (
                <div className="form-field" key={`speler-${i + 1}`}>
                  <label htmlFor={`a-sp${i + 1}`}>Speler {i + 1}</label>
                  <input
                    id={`a-sp${i + 1}`} type="text" autoComplete="off" disabled={saving}
                    style={fieldInput} value={value}
                    onChange={(e) =>
                      setPlayers((prev) => prev.map((p, j) => (j === i ? e.target.value : p)))
                    }
                  />
                </div>
              ))}
            </div>
          )}

          {justAdded && !error && (
            <div style={{
              marginTop: "0.9rem", padding: "0.75rem 0.9rem", borderRadius: "10px",
              background: "var(--bg-alt)", border: "1px solid var(--border)",
              display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap",
            }}>
              <span style={{ fontSize: "0.8rem", color: "var(--ink-2)" }}>
                ✓ <strong>{justAdded.name}</strong> aangemeld.
                {justAdded.token ? " Geef deze link mee:" : " Typ de volgende teamnaam."}
              </span>
              {justAdded.token && (
                <>
                  <code className="mono" style={{ fontSize: "0.75rem", wordBreak: "break-all" }}>
                    {portalUrl(justAdded.token)}
                  </code>
                  <TeamLinkActions tournamentId={tournament.id} team={justAdded} />
                </>
              )}
            </div>
          )}
        </form>
      </div>

      {/* ── Deadline voor zelf aanpassen ────────────────────── */}
      <div className="admin-table-wrapper" style={{ marginBottom: "1.5rem" }}>
        <div className="admin-table-header">
          <h2>Teams mogen zichzelf aanpassen tot</h2>
        </div>
        <div style={{ padding: "1.25rem", display: "flex", gap: "0.75rem", alignItems: "flex-end", flexWrap: "wrap" }}>
          <div className="form-field" style={{ flex: "0 0 240px" }}>
            <label htmlFor="a-deadline">Deadline</label>
            <input
              id="a-deadline" type="datetime-local" disabled={deadlineBusy} style={fieldInput}
              value={deadline}
              onChange={(e) => { setDeadline(e.target.value); setDeadlineSaved(false); }}
            />
          </div>
          <button
            type="button" className="btn-sm btn-sm--primary" disabled={deadlineBusy}
            onClick={saveDeadline} style={{ padding: "0.6rem 1rem" }}
          >
            {deadlineBusy ? "Opslaan…" : "Opslaan"}
          </button>
          {deadlineSaved && (
            <span style={{ fontSize: "0.8rem", color: "var(--ink-2)" }}>✓ Bewaard</span>
          )}
          <p style={{ margin: 0, flex: "1 1 240px", fontSize: "0.8rem", color: "var(--ink-2)" }}>
            Na dit moment kunnen teams hun naam, spelers en logo niet meer wijzigen via hun
            eigen link. Leeg laten = geen deadline.
          </p>
        </div>
      </div>

      {/* ── Plaatshouders ───────────────────────────────────── */}
      {SHOW_PLACEHOLDERS && (
      <div className="admin-table-wrapper" style={{ marginBottom: "1.5rem" }}>
        <div className="admin-table-header">
          <h2>Plaatshouders</h2>
        </div>
        <div style={{ padding: "1.25rem", display: "flex", gap: "0.75rem", alignItems: "flex-end", flexWrap: "wrap" }}>
          <div className="form-field" style={{ flex: "0 0 90px" }}>
            <label htmlFor="a-bulk">Aantal</label>
            <input
              id="a-bulk" type="number" min={1} max={32} disabled={bulkBusy}
              style={fieldInput} value={bulkCount}
              onChange={(e) => setBulkCount(e.target.value)}
            />
          </div>
          <button
            type="button" className="btn-sm btn-sm--ghost" disabled={bulkBusy}
            onClick={addPlaceholders}
            style={{ display: "flex", alignItems: "center", gap: "0.3rem", padding: "0.6rem 1rem" }}
          >
            <IconPlus /> {bulkBusy ? "Bezig…" : "Plaatshouders toevoegen"}
          </button>
          <p style={{ margin: 0, flex: "1 1 240px", fontSize: "0.8rem", color: "var(--ink-2)" }}>
            Maakt lege teams (<span className="mono">Team {nextPlaceholderNumber(tournament.teams)}</span>,
            …) zodat je het schema al kan genereren. Hernoem ze zodra het echte team zich aanmeldt.
          </p>
        </div>
      </div>
      )}

      {/* ── Aangemelde teams ────────────────────────────────── */}
      <div className="admin-table-wrapper">
        <div className="admin-table-header">
          <h2>Aangemeld ({tournament.teams.length})</h2>
        </div>

        {sorted.length === 0 ? (
          <p className="admin-empty">Nog niemand aangemeld.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Team</th><th>Kapitein</th><th>Betaald</th><th>Teamlink</th><th>Acties</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((team) => (
                <tr key={team.id}>
                  <td><strong>{team.name}</strong></td>
                  <td>
                    {team.captainName || <span style={{ color: "var(--ink-2)" }}>—</span>}
                    {team.phone && (
                      <div style={{ fontSize: "0.75rem" }}>
                        <a href={`tel:${team.phone}`} style={{ color: "var(--ink-2)" }}>{team.phone}</a>
                      </div>
                    )}
                  </td>
                  <td>
                    <PaymentSelect value={paymentValue(team)} onChange={(v) => updatePayment(team, v)} />
                  </td>
                  <td>
                    <TeamLinkActions tournamentId={tournament.id} team={team} />
                  </td>
                  <td>
                    <div className="row-actions">
                      <button
                        type="button" className="btn-sm btn-sm--danger"
                        onClick={() => removeTeam(team)}
                        style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}
                      >
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
    </>
  );
}
