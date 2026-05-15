"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import type { TournamentListItem } from "@/lib/tournament-types";

// ── Helpers ───────────────────────────────────────────────────────────────────

const TEAM_PRESETS  = [32, 40, 48] as const;
const POULE_PRESETS = [3, 4, 5]    as const;

function isValidKnockoutSize(n: number): boolean {
  if (n === 0) return true;
  return (n & (n - 1)) === 0;
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("nl-BE");
}

function activateLabel(loading: boolean): string {
  if (loading) return "…";
  return "Activeren";
}

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

// ── Small components ──────────────────────────────────────────────────────────

function StatusBadge({ isActive }: Readonly<{ isActive: boolean }>) {
  if (isActive) return <span className="badge badge--pink">Actief</span>;
  return <span className="badge badge--gray">Inactief</span>;
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function IconPlus() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
function IconEdit() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M11 2l3 3-8 8H3v-3l8-8Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}
function IconTrash() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2 4h12M5 4V2.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 .5.5V4M6 7v5M10 7v5M3 4l1 9a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1l1-9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconCheck() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2 8l4.5 4.5L14 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconX() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

// ── Shared preset chip style ──────────────────────────────────────────────────

function presetStyle(active: boolean): React.CSSProperties {
  return {
    padding: "0.35rem 0.75rem",
    borderRadius: "8px",
    border: active ? "none" : "1px solid var(--border)",
    background: active ? "var(--accent)" : "var(--bg-alt)",
    color: active ? "#fff" : "var(--text-2)",
    fontSize: "0.8rem",
    fontWeight: 500,
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "all 120ms ease",
  };
}

const customInputStyle: React.CSSProperties = {
  width: "72px",
  padding: "0.35rem 0.6rem",
  borderRadius: "8px",
  background: "var(--bg)",
  color: "var(--text)",
  fontSize: "0.8rem",
  fontFamily: "inherit",
  outline: "none",
};

// ── Create drawer (3-step wizard) ─────────────────────────────────────────────

type Step = 1 | 2 | 3;

function CreateDrawer({
  onClose,
  onSaved,
}: Readonly<{ onClose: () => void; onSaved: (t: TournamentListItem) => void }>) {
  const dialogRef = useDialogModal();
  const [step, setStep] = useState<Step>(1);

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

  const effectiveTeams  = customTeams ? Number.parseInt(customTeams, 10) : totalTeams;
  const effectivePoule  = customPoule ? Number.parseInt(customPoule, 10) : teamsPerPoule;
  const poulesCount     = effectivePoule > 0 ? Math.floor(effectiveTeams / effectivePoule) : 0;
  const autoAdvance     = poulesCount * advancePerPoule;
  const totalAdvancing  = autoAdvance + bestRunnersUp;
  const knockoutValid   = isValidKnockoutSize(totalAdvancing);

  const noCustomTeams = customTeams === "";
  const noCustomPoule = customPoule === "";

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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Aanmaken mislukt.");
      setSaving(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="admin-drawer"
      style={{ width: "min(540px, 100vw)" }}
      aria-label="Nieuw toernooi aanmaken"
    >
      {/* Header */}
      <div className="admin-drawer__header">
        <div>
          <h2 style={{ margin: 0 }}>Nieuw toernooi</h2>
          <p style={{ margin: "0.15rem 0 0", fontSize: "0.75rem", color: "var(--muted)" }}>
            Stap {step} van 3
          </p>
        </div>
        <button type="button" className="admin-drawer__close" onClick={onClose} aria-label="Sluiten">
          <IconX />
        </button>
      </div>

      {/* Progress bar */}
      <div style={{ display: "flex", gap: "0.4rem", marginBottom: "1.5rem" }}>
        {([1, 2, 3] as const).map((s) => (
          <div
            key={s}
            style={{
              flex: 1, height: 3, borderRadius: 99,
              background: s <= step ? "var(--accent)" : "var(--border)",
              transition: "background 200ms",
            }}
          />
        ))}
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <form className="admin-form" onSubmit={(e) => { e.preventDefault(); setStep(2); }}>
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
          <div className="admin-drawer__actions">
            <button type="submit" className="btn-sm btn-sm--primary" disabled={!name.trim()}>
              Volgende →
            </button>
            <button type="button" className="btn-sm btn-sm--ghost" onClick={onClose}>Annuleren</button>
          </div>
        </form>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <div className="admin-form">
          <div className="form-field">
            <p style={{ margin: "0 0 0.4rem", fontSize: "0.8rem", fontWeight: 500, color: "var(--text-2)" }}>
              Totaal aantal teams
            </p>
            <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", alignItems: "center" }}>
              {TEAM_PRESETS.map((n) => (
                <button key={n} type="button"
                  style={presetStyle(totalTeams === n && noCustomTeams)}
                  onClick={() => { setTotalTeams(n); setCustomTeams(""); }}>
                  {n}
                </button>
              ))}
              <input type="number" placeholder="Eigen" aria-label="Eigen aantal teams"
                value={customTeams} min="4" max="256"
                onChange={(e) => setCustomTeams(e.target.value)}
                style={{ ...customInputStyle, border: `1px solid ${customTeams ? "var(--accent)" : "var(--border)"}` }} />
            </div>
          </div>

          <div className="form-field">
            <p style={{ margin: "0 0 0.4rem", fontSize: "0.8rem", fontWeight: 500, color: "var(--text-2)" }}>
              Teams per poule
            </p>
            <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", alignItems: "center" }}>
              {POULE_PRESETS.map((n) => (
                <button key={n} type="button"
                  style={presetStyle(teamsPerPoule === n && noCustomPoule)}
                  onClick={() => { setTeamsPerPoule(n); setCustomPoule(""); }}>
                  {n}
                </button>
              ))}
              <input type="number" placeholder="Eigen" aria-label="Eigen teams per poule"
                value={customPoule} min="2" max="8"
                onChange={(e) => setCustomPoule(e.target.value)}
                style={{ ...customInputStyle, border: `1px solid ${customPoule ? "var(--accent)" : "var(--border)"}` }} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
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
            <div style={{
              padding: "0.9rem 1rem", borderRadius: "var(--radius-lg)",
              background: "var(--bg-alt)", border: "1px solid var(--border)",
              fontSize: "0.82rem", color: "var(--text-2)", lineHeight: 1.8,
            }}>
              <strong style={{ color: "var(--text)", display: "block", marginBottom: "0.2rem" }}>Samenvatting</strong>
              {poulesCount} poules van {effectivePoule} teams<br />
              {autoAdvance} teams automatisch door (top {advancePerPoule} per poule)
              {bestRunnersUp > 0 && (
                <> + {bestRunnersUp} beste {advancePerPoule + 1}de{bestRunnersUp === 1 ? "" : "s"}</>
              )}<br />
              <strong style={{ color: knockoutValid ? "var(--text)" : "#b37400" }}>
                Knockout: {totalAdvancing} teams {knockoutValid ? "✓" : "⚠ geen macht van 2"}
              </strong>
            </div>
          )}

          <div className="admin-drawer__actions">
            <button type="button" className="btn-sm btn-sm--primary" onClick={() => setStep(3)}>
              Volgende →
            </button>
            <button type="button" className="btn-sm btn-sm--ghost" onClick={() => setStep(1)}>
              ← Terug
            </button>
          </div>
        </div>
      )}

      {/* Step 3 */}
      {step === 3 && (
        <div className="admin-form">
          {error && <div className="form-error">{error}</div>}
          <div style={{
            padding: "1rem 1.1rem", borderRadius: "var(--radius-lg)",
            border: "1px solid var(--border)", background: "var(--bg-alt)",
            fontSize: "0.875rem", lineHeight: 1.85,
          }}>
            <p style={{ margin: "0 0 0.5rem", fontWeight: 600, fontSize: "1rem", color: "var(--text)" }}>
              {name} — {year}
            </p>
            <ul style={{ margin: 0, paddingLeft: "1.2rem", color: "var(--text-2)" }}>
              <li>{effectiveTeams} teams</li>
              <li>{poulesCount} poules van {effectivePoule}</li>
              <li>Top {advancePerPoule} per poule gaan automatisch door</li>
              {bestRunnersUp > 0 && (
                <li>+ {bestRunnersUp} beste {advancePerPoule + 1}de{bestRunnersUp === 1 ? "" : "s"}</li>
              )}
              <li>
                <strong style={{ color: knockoutValid ? "inherit" : "#b37400" }}>
                  Knockout: {totalAdvancing} teams {knockoutValid ? "" : "(geen macht van 2!)"}
                </strong>
              </li>
            </ul>
          </div>
          <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--muted)" }}>
            Teams en wedstrijden voeg je toe via de beheerpagina na het aanmaken.
          </p>
          <div className="admin-drawer__actions">
            <button type="button" className="btn-sm btn-sm--primary" onClick={handleCreate} disabled={saving}>
              {saving ? "Aanmaken…" : "Toernooi aanmaken"}
            </button>
            <button type="button" className="btn-sm btn-sm--ghost" onClick={() => setStep(2)}>← Terug</button>
          </div>
        </div>
      )}
    </dialog>
  );
}

// ── Edit drawer ───────────────────────────────────────────────────────────────

function EditDrawer({
  tournament,
  onClose,
  onSaved,
}: Readonly<{
  tournament: TournamentListItem;
  onClose: () => void;
  onSaved: (t: TournamentListItem) => void;
}>) {
  const dialogRef = useDialogModal();
  const [name, setName]     = useState(tournament.name);
  const [year, setYear]     = useState(String(tournament.year));
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    setError(""); setSaving(true);
    try {
      const result = await apiFetch<TournamentListItem>(`/tournaments/${tournament.id}`, {
        method: "PATCH",
        body: JSON.stringify({ name: name.trim(), year: Number.parseInt(year, 10) }),
      });
      onSaved(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Opslaan mislukt.");
    } finally { setSaving(false); }
  }

  return (
    <dialog ref={dialogRef} onClose={onClose}
      className="admin-drawer" aria-label="Toernooi bewerken">
      <div className="admin-drawer__header">
        <h2>Toernooi bewerken</h2>
        <button type="button" className="admin-drawer__close" onClick={onClose} aria-label="Sluiten">
          <IconX />
        </button>
      </div>
      <form className="admin-form" onSubmit={handleSubmit}>
        {error && <div className="form-error">{error}</div>}
        <div className="form-field">
          <label htmlFor="e-name">Naam</label>
          <input id="e-name" type="text" value={name} required disabled={saving}
            onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="form-field">
          <label htmlFor="e-year">Jaar</label>
          <input id="e-year" type="number" value={year} min="2000" max="2100" required
            disabled={saving} onChange={(e) => setYear(e.target.value)} />
        </div>
        <div className="admin-drawer__actions">
          <button type="submit" className="btn-sm btn-sm--primary" disabled={saving || !name.trim()}>
            {saving ? "Opslaan…" : "Opslaan"}
          </button>
          <button type="button" className="btn-sm btn-sm--ghost" onClick={onClose}>Annuleren</button>
        </div>
      </form>
    </dialog>
  );
}

// ── Delete confirm ────────────────────────────────────────────────────────────

function DeleteConfirm({
  tournament,
  onConfirm,
  onCancel,
  loading,
}: Readonly<{
  tournament: TournamentListItem;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}>) {
  const dialogRef = useDialogModal();

  return (
    <dialog ref={dialogRef} onClose={onCancel}
      className="admin-confirm" aria-label="Verwijderen bevestigen">
      <h2 style={{ margin: "0 0 0.5rem", fontSize: "1.1rem", fontWeight: 500, color: "var(--text)" }}>
        Toernooi verwijderen?
      </h2>
      <p style={{ margin: "0 0 1.5rem", fontSize: "0.875rem", color: "var(--muted)", lineHeight: 1.6 }}>
        <strong style={{ color: "var(--text)" }}>{tournament.name}</strong> ({tournament.year}) wordt
        permanent verwijderd.
      </p>
      <div style={{ display: "flex", gap: "0.75rem" }}>
        <button className="btn-sm btn-sm--danger" onClick={onConfirm} disabled={loading}>
          {loading ? "Verwijderen…" : "Verwijderen"}
        </button>
        <button className="btn-sm btn-sm--ghost" onClick={onCancel}>Annuleren</button>
      </div>
    </dialog>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminTournooisPage() {
  const [tournaments, setTournaments] = useState<TournamentListItem[]>([]);
  const [loading, setLoading]         = useState(true);
  const [showCreate, setShowCreate]   = useState(false);
  const [editTarget, setEditTarget]   = useState<TournamentListItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TournamentListItem | null>(null);
  const [deleting, setDeleting]       = useState(false);
  const [activating, setActivating]   = useState<number | null>(null);

  useEffect(() => {
    apiFetch<TournamentListItem[]>("/tournaments")
      .then(setTournaments)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function handleSaved(t: TournamentListItem) {
    setTournaments((prev) => {
      const exists = prev.find((x) => x.id === t.id);
      return exists ? prev.map((x) => (x.id === t.id ? t : x)) : [t, ...prev];
    });
    setShowCreate(false);
    setEditTarget(null);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiFetch(`/tournaments/${deleteTarget.id}`, { method: "DELETE" });
      setTournaments((prev) => prev.filter((t) => t.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch { /* keep dialog open */ } finally { setDeleting(false); }
  }

  async function handleActivate(t: TournamentListItem) {
    setActivating(t.id);
    try {
      const updated = await apiFetch<TournamentListItem>(`/tournaments/${t.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: true }),
      });
      setTournaments((prev) =>
        prev.map((x) => (x.id === updated.id ? updated : { ...x, isActive: false }))
      );
    } catch { /* ignore */ } finally { setActivating(null); }
  }

  const sorted = [...tournaments].sort((a, b) => b.year - a.year);

  return (
    <>
      <div
        className="admin-page-header"
        style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem" }}
      >
        <div>
          <h1>Toernooien</h1>
          <p>Beheer alle edities van het De Flosj petanquetoernooi.</p>
        </div>
        <button
          type="button" className="btn-sm btn-sm--primary"
          style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexShrink: 0, marginTop: "0.3rem" }}
          onClick={() => setShowCreate(true)}
        >
          <IconPlus /> Nieuw toernooi
        </button>
      </div>

      <div className="admin-table-wrapper">
        <div className="admin-table-header">
          <h2>Alle toernooien ({loading ? "…" : tournaments.length})</h2>
        </div>

        {loading && <p className="admin-empty">Laden…</p>}
        {!loading && sorted.length === 0 && (
          <p className="admin-empty">Nog geen toernooien. Klik op &quot;Nieuw toernooi&quot; om te beginnen.</p>
        )}
        {!loading && sorted.length > 0 && (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Naam</th><th>Jaar</th><th>Status</th><th>Aangemaakt</th><th>Acties</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((t) => (
                <tr key={t.id}>
                  <td><strong>{t.name}</strong></td>
                  <td><span className="mono">{t.year}</span></td>
                  <td><StatusBadge isActive={t.isActive} /></td>
                  <td>{fmt(t.createdAt)}</td>
                  <td>
                    <div className="row-actions">
                      <Link href={`/admin/toernooi/${t.id}`} className="btn-sm btn-sm--primary"
                        style={{ display: "inline-flex", alignItems: "center" }}>
                        Beheren →
                      </Link>
                      {t.isActive === false && (
                        <button
                          type="button" className="btn-sm btn-sm--success"
                          disabled={activating === t.id}
                          onClick={() => handleActivate(t)}
                          style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}
                        >
                          <IconCheck />
                          {activateLabel(activating === t.id)}
                        </button>
                      )}
                      <button type="button" className="btn-sm btn-sm--ghost"
                        onClick={() => setEditTarget(t)}
                        style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                        <IconEdit /> Bewerken
                      </button>
                      <button type="button" className="btn-sm btn-sm--danger"
                        onClick={() => setDeleteTarget(t)}
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

      {showCreate  && <CreateDrawer onClose={() => setShowCreate(false)} onSaved={handleSaved} />}
      {editTarget  && <EditDrawer tournament={editTarget} onClose={() => setEditTarget(null)} onSaved={handleSaved} />}
      {deleteTarget && (
        <DeleteConfirm
          tournament={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}
    </>
  );
}
