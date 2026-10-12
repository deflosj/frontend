"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";
import type { TournamentPoule, TournamentTeam } from "@/lib/tournament-types";
import { IconX } from "@/components/ui/icons";
import { PaymentSelect, paymentBody, paymentValue } from "../payment-select";
import { escapeTo, fieldInput, useDialogModal } from "../shared";

// ── Team drawer (add / edit) ──────────────────────────────────────────────────

interface TeamFormData {
  name: string;
  captainName: string;
  phone: string;
  speler1: string;
  speler2: string;
  speler3: string;
  speler4: string;
  motto: string;
  isPresent: boolean;
  isPaid: boolean;
  payment: string;
  pouleId: string;
}

export function TeamDrawer({
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
    phone:       team?.phone       ?? "",
    speler1:     team?.speler1     ?? "",
    speler2:     team?.speler2     ?? "",
    speler3:     team?.speler3     ?? "",
    speler4:     team?.speler4     ?? "",
    motto:       team?.motto       ?? "",
    // Nieuw team = aangemeld, nog niet aanwezig. "Aanwezig" is de
    // check-in op de toernooidag zelf.
    isPresent:   team?.isPresent   ?? false,
    isPaid:      team?.isPaid      ?? false,
    payment:     team ? paymentValue(team) : "",
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
        phone:       form.phone.trim() || null,
        speler1:     form.speler1.trim(),
        speler2:     form.speler2.trim(),
        speler3:     form.speler3.trim(),
        speler4:     form.speler4.trim(),
        motto:       form.motto.trim(),
        isPresent:   form.isPresent,
        ...paymentBody(form.payment),
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
    <dialog ref={dialogRef} onCancel={escapeTo(onClose)} className="admin-drawer"
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
            <label htmlFor="t-motto">Motto <span style={{ fontWeight: 400, color: "var(--text-2)" }}>(optioneel, max 60 tekens)</span></label>
            <input id="t-motto" type="text" maxLength={60} disabled={saving}
              value={form.motto} onChange={(e) => set("motto", e.target.value)} />
          </div>
          <div className="form-field" style={{ gridColumn: "1 / -1" }}>
            <label htmlFor="t-captain">Kapitein</label>
            <input id="t-captain" type="text" disabled={saving}
              value={form.captainName} onChange={(e) => set("captainName", e.target.value)} />
          </div>
          <div className="form-field" style={{ gridColumn: "1 / -1" }}>
            <label htmlFor="t-phone">Gsm kapitein</label>
            <input id="t-phone" type="tel" disabled={saving}
              value={form.phone} onChange={(e) => set("phone", e.target.value)} />
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
              {poules.filter((p) => p.phase === "GROUP_STAGE").map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="form-field" style={{ justifyContent: "flex-end", gap: "0.4rem" }}>
            <label className="form-checkbox">
              <input type="checkbox" checked={form.isPresent} disabled={saving}
                onChange={(e) => set("isPresent", e.target.checked)} />
              Aanwezig op toernooidag
            </label>
            <label className="form-checkbox" style={{ gap: "0.5rem" }}>
              Inschrijvingsgeld
              <PaymentSelect value={form.payment} onChange={(v) => set("payment", v)} disabled={saving} />
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
