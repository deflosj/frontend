"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";
import type { TournamentListItem } from "@/lib/tournament-types";
import { StepDrawer } from "@/components/admin/step-drawer";
import { useDrawer } from "@/components/admin/drawer-provider";

// ── Constants ─────────────────────────────────────────────────────────────────

const TEAM_PRESETS  = [32, 40, 48] as const;
const POULE_PRESETS = [3, 4, 5]    as const;
const STEPS = ["Gegevens", "Structuur", "Bevestigen"];

function isValidKnockoutSize(n: number) {
  return n === 0 || (n & (n - 1)) === 0;
}

function presetCls(active: boolean) {
  return active ? "btn-sm btn-sm--primary" : "btn-sm btn-sm--ghost";
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  onSaved: (t: TournamentListItem) => void;
}

export function CreateDrawer({ onSaved }: Readonly<Props>) {
  const { closeDrawer } = useDrawer();
  const [open, setOpen] = useState(true);
  const [step, setStep] = useState(1);

  const [name, setName] = useState("");
  const [year, setYear] = useState(String(new Date().getFullYear()));

  const [totalTeams,      setTotalTeams]      = useState(48);
  const [customTeams,     setCustomTeams]     = useState("");
  const [teamsPerPoule,   setTeamsPerPoule]   = useState(4);
  const [customPoule,     setCustomPoule]     = useState("");
  const [advancePerPoule, setAdvancePerPoule] = useState(2);
  const [bestRunnersUp,   setBestRunnersUp]   = useState(8);

  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  const effectiveTeams = customTeams ? Number.parseInt(customTeams, 10) : totalTeams;
  const effectivePoule = customPoule ? Number.parseInt(customPoule, 10) : teamsPerPoule;
  const poulesCount    = effectivePoule > 0 ? Math.floor(effectiveTeams / effectivePoule) : 0;
  const autoAdvance    = poulesCount * advancePerPoule;
  const totalAdvancing = autoAdvance + bestRunnersUp;
  const knockoutValid  = isValidKnockoutSize(totalAdvancing);

  function close() {
    setOpen(false);
    closeDrawer();
  }

  async function handleCreate() {
    setSaving(true);
    setError("");
    try {
      const result = await apiFetch<TournamentListItem>("/tournaments", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          year: Number.parseInt(year, 10),
          totalTeams: effectiveTeams,
          teamsPerPoule: effectivePoule,
          advancePerPoule,
          bestRunnersUp,
        }),
      });
      onSaved(result);
      close();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Aanmaken mislukt.");
      setSaving(false);
    }
  }

  // ── Step footers ─────────────────────────────────────────────────────────────

  const footer1 = (
    <>
      <button type="button" className="btn-sm btn-sm--ghost" onClick={close}>Annuleren</button>
      <button type="submit" form="step1-form" className="btn-sm btn-sm--primary" disabled={!name.trim()}>
        Volgende →
      </button>
    </>
  );

  const footer2 = (
    <>
      <button type="button" className="btn-sm btn-sm--ghost" onClick={() => setStep(1)}>← Terug</button>
      <button type="button" className="btn-sm btn-sm--primary" onClick={() => setStep(3)}>
        Volgende →
      </button>
    </>
  );

  const footer3 = (
    <>
      <button type="button" className="btn-sm btn-sm--ghost" onClick={() => setStep(2)}>← Terug</button>
      <button type="button" className="btn-sm btn-sm--primary" onClick={handleCreate} disabled={saving}>
        {saving ? "Aanmaken…" : "Toernooi aanmaken"}
      </button>
    </>
  );

  const footerMap: Record<number, React.ReactNode> = { 1: footer1, 2: footer2, 3: footer3 };

  return (
    <StepDrawer
      open={open}
      onOpenChange={(o) => { if (!o) close(); }}
      title="Nieuw toernooi"
      steps={STEPS}
      currentStep={step}
      footer={footerMap[step]}
      error={step === 3 ? error : undefined}
    >
      {/* Step 1 — naam & jaar */}
      {step === 1 && (
        <form id="step1-form" className="contents" onSubmit={(e) => { e.preventDefault(); setStep(2); }}>
          <div className="form-field">
            <label htmlFor="c-name">Naam</label>
            <input id="c-name" type="text" value={name} autoFocus required
              placeholder="bv. De Flosj Toernooi 2025"
              onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="form-field">
            <label htmlFor="c-year">Jaar</label>
            <input id="c-year" type="number" value={year} min="2000" max="2100" required
              onChange={(e) => setYear(e.target.value)} />
          </div>
        </form>
      )}

      {/* Step 2 — structuur */}
      {step === 2 && (
        <>
          <div className="form-field">
            <p className="form-field__label">Totaal aantal teams</p>
            <div className="preset-row">
              {TEAM_PRESETS.map((n) => (
                <button key={n} type="button"
                  className={presetCls(totalTeams === n && customTeams === "")}
                  onClick={() => { setTotalTeams(n); setCustomTeams(""); }}>
                  {n}
                </button>
              ))}
              <input type="number" placeholder="Eigen" aria-label="Eigen aantal teams"
                value={customTeams} min="4" max="256"
                onChange={(e) => setCustomTeams(e.target.value)}
                className="preset-input" />
            </div>
          </div>

          <div className="form-field">
            <p className="form-field__label">Teams per poule</p>
            <div className="preset-row">
              {POULE_PRESETS.map((n) => (
                <button key={n} type="button"
                  className={presetCls(teamsPerPoule === n && customPoule === "")}
                  onClick={() => { setTeamsPerPoule(n); setCustomPoule(""); }}>
                  {n}
                </button>
              ))}
              <input type="number" placeholder="Eigen" aria-label="Eigen teams per poule"
                value={customPoule} min="2" max="8"
                onChange={(e) => setCustomPoule(e.target.value)}
                className="preset-input" />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-field">
              <label htmlFor="advance">Doorgaan per poule</label>
              <input id="advance" type="number" value={advancePerPoule}
                min="1" max={Math.max(1, effectivePoule - 1)}
                onChange={(e) => setAdvancePerPoule(Number(e.target.value))} />
            </div>
            <div className="form-field">
              <label htmlFor="runners">Beste derdes / n-des</label>
              <input id="runners" type="number" value={bestRunnersUp}
                min="0" max={poulesCount}
                onChange={(e) => setBestRunnersUp(Number(e.target.value))} />
            </div>
          </div>

          {poulesCount > 0 && (
            <div className="admin-summary">
              <strong className="admin-summary__title">Samenvatting</strong>
              {poulesCount} poules van {effectivePoule} teams<br />
              {autoAdvance} teams automatisch door (top {advancePerPoule} per poule)
              {bestRunnersUp > 0 && (
                <> + {bestRunnersUp} beste {advancePerPoule + 1}de{bestRunnersUp === 1 ? "" : "s"}</>
              )}<br />
              <strong data-warn={!knockoutValid}>
                Knockout: {totalAdvancing} teams {knockoutValid ? "✓" : "⚠ geen macht van 2"}
              </strong>
            </div>
          )}
        </>
      )}

      {/* Step 3 — bevestigen */}
      {step === 3 && (
        <>
          <div className="admin-summary">
            <p className="admin-summary__title" style={{ fontSize: "1rem" }}>{name} — {year}</p>
            <ul className="admin-summary__list">
              <li>{effectiveTeams} teams</li>
              <li>{poulesCount} poules van {effectivePoule}</li>
              <li>Top {advancePerPoule} per poule gaan automatisch door</li>
              {bestRunnersUp > 0 && (
                <li>+ {bestRunnersUp} beste {advancePerPoule + 1}de{bestRunnersUp === 1 ? "" : "s"}</li>
              )}
              <li data-warn={!knockoutValid}>
                Knockout: {totalAdvancing} teams {knockoutValid ? "" : "(geen macht van 2!)"}
              </li>
            </ul>
          </div>
          <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--muted)" }}>
            Teams en wedstrijden voeg je toe via de beheerpagina na het aanmaken.
          </p>
        </>
      )}
    </StepDrawer>
  );
}
