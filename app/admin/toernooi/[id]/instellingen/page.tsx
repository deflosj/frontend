"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";
import type { ActiveTournament } from "@/lib/tournament-types";
import { IconSave } from "@/components/ui/icons";
import { useTournament } from "../tournament-context";
import { ReglementEditor } from "./reglement-editor";

function Card({ title, children, note }: Readonly<{ title: string; children: React.ReactNode; note?: string }>) {
  return (
    <section className="admin-table-wrapper">
      <div className="admin-table-header"><h2>{title}</h2></div>
      <div style={{ padding: "1.25rem 1.4rem" }}>
        {children}
        {note && <p className="mt-3 text-[13px] text-ink-2">{note}</p>}
      </div>
    </section>
  );
}

function BasicsForm() {
  const { tournament, setTournament } = useTournament();
  const [name, setName] = useState(tournament.name);
  const [year, setYear] = useState(String(tournament.year));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setSaving(true); setSaved(false);
    try {
      const updated = await apiFetch<ActiveTournament>(`tournaments/${tournament.id}`, {
        method: "PATCH",
        body: JSON.stringify({ name: name.trim(), year: Number.parseInt(year, 10) }),
      });
      setTournament({ ...tournament, name: updated.name, year: updated.year });
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Opslaan mislukt.");
    } finally { setSaving(false); }
  }

  return (
    <Card title="Basisgegevens">
      <form className="admin-form" onSubmit={save}>
        {error && <div className="form-error">{error}</div>}
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "1rem" }}>
          <div className="form-field">
            <label htmlFor="st-name">Naam</label>
            <input id="st-name" type="text" value={name} required disabled={saving}
              onChange={(e) => { setName(e.target.value); setSaved(false); }} />
          </div>
          <div className="form-field">
            <label htmlFor="st-year">Jaar</label>
            <input id="st-year" type="number" value={year} min="2000" max="2100" required disabled={saving}
              style={{ width: "96px" }} onChange={(e) => { setYear(e.target.value); setSaved(false); }} />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button type="submit" className="btn-sm btn-sm--primary" disabled={saving}>
            <IconSave /> {saving ? "Opslaan…" : "Opslaan"}
          </button>
          {saved && <span className="text-[13px] text-ink-2">✓ Opgeslagen</span>}
        </div>
      </form>
    </Card>
  );
}

function DeadlineForm() {
  const { tournament, setTournament } = useTournament();
  const [deadline, setDeadline] = useState(tournament.teamEditDeadline ? tournament.teamEditDeadline.slice(0, 16) : "");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setBusy(true); setSaved(false); setError("");
    try {
      const updated = await apiFetch<ActiveTournament>(`tournaments/${tournament.id}`, {
        method: "PATCH",
        body: JSON.stringify({ teamEditDeadline: deadline ? new Date(deadline).toISOString() : null }),
      });
      setTournament({ ...tournament, teamEditDeadline: updated.teamEditDeadline ?? null });
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Deadline opslaan mislukt.");
    } finally { setBusy(false); }
  }

  return (
    <Card
      title="Teams mogen zichzelf aanpassen tot"
      note="Na dit moment kunnen teams hun naam, spelers en logo niet meer wijzigen via hun eigen link. Leeg laten = geen deadline."
    >
      {error && <div className="form-error" style={{ marginBottom: "0.75rem" }}>{error}</div>}
      <div className="flex flex-wrap items-end gap-3">
        <div className="form-field" style={{ flex: "0 0 240px" }}>
          <label htmlFor="st-deadline">Deadline</label>
          <input id="st-deadline" type="datetime-local" disabled={busy} value={deadline}
            onChange={(e) => { setDeadline(e.target.value); setSaved(false); }} />
        </div>
        <button type="button" className="btn-sm btn-sm--primary" disabled={busy} onClick={save}>
          {busy ? "Opslaan…" : "Opslaan"}
        </button>
        {saved && <span className="text-[13px] text-ink-2">✓ Bewaard</span>}
      </div>
    </Card>
  );
}

export default function TournamentSettingsPage() {
  const { tournament, setTournament } = useTournament();
  return (
    <div className="flex flex-col gap-6" style={{ maxWidth: 720 }}>
      <BasicsForm />
      <DeadlineForm />
      <ReglementEditor tournament={tournament} onUpdate={setTournament} />
      <p className="text-[13px] text-ink-2">
        Poulegrootte, doorstroming naar de knock-out en matchduren stel je in bij <strong>Poules &amp; schema</strong>,
        omdat ze samen met het loten en genereren horen.
      </p>
    </div>
  );
}
