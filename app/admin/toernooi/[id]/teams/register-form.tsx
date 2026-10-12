"use client";

import { useRef, useState } from "react";

import { apiFetch } from "@/lib/api";
import { PaymentSelect, paymentBody } from "../payment-select";
import type { ActiveTournament, TournamentTeam } from "@/lib/tournament-types";
import { TeamLinkActions, portalUrl } from "../team-link";
import { IconPlus } from "@/components/ui/icons";
import { QrModal } from "@/components/ui/qr-modal";
import { QrCode } from "lucide-react";
import { Notice, Panel } from "@/components/admin/ui";

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

export function RegisterTeamForm({ tournament, onUpdate }: Readonly<Props>) {
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

  const [bulkCount, setBulkCount] = useState("4");
  const [bulkBusy, setBulkBusy] = useState(false);
  const [showQr, setShowQr] = useState(false);

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

  return (
    <>
      {/* ── Aanmeldformulier ────────────────────────────────── */}
      <Panel
        id="register"
        title="Inschrijftafel"
        description={<>{tournament.teams.length} ingeschreven · {paidCount} betaald ({cashCount} cash, {payconiqCount} Payconiq). Enter schrijft in en zet de cursor terug op de teamnaam.</>}
        actions={
          <button type="button" className="btn-sm btn-sm--ghost" onClick={() => setShowQr(true)}>
            <QrCode size={16} strokeWidth={1.75} /> QR zelf-inschrijving
          </button>
        }
      >
        {showQr && (
          <QrModal
            title="Scan & schrijf je team in"
            subtitle={`${tournament.name} ${tournament.year}`}
            url={`${globalThis.location.origin}/team-aanmelden`}
            filename="deflosj-team-aanmelden"
            onClose={() => setShowQr(false)}
          />
        )}

        <form onSubmit={handleSubmit}>
          {error && <Notice tone="err" className="mb-3">{error}</Notice>}

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
              {saving ? "Bezig…" : "Inschrijven ⏎"}
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
            <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl bg-[var(--ok-bg)] px-3.5 py-3">
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
      </Panel>

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

    </>
  );
}
