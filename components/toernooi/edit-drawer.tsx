"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";
import type { TournamentListItem, TournamentStatus } from "@/lib/tournament-types";
import { Sheet, SheetContent } from "@/components/admin/sheet";
import { useDrawer } from "@/components/admin/drawer-provider";

interface Props {
  tournament: TournamentListItem;
  onSaved: (t: TournamentListItem) => void;
}

export function EditDrawer({ tournament, onSaved }: Readonly<Props>) {
  const { closeDrawer } = useDrawer();
  const [open, setOpen] = useState(true);
  const [name,   setName]   = useState(tournament.name);
  const [year,   setYear]   = useState(String(tournament.year));
  const [status, setStatus] = useState<TournamentStatus>(tournament.status);
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  function close() {
    setOpen(false);
    closeDrawer();
  }

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const result = await apiFetch<TournamentListItem>(`tournaments/${tournament.id}`, {
        method: "PUT",
        body: JSON.stringify({ name: name.trim(), year: Number.parseInt(year, 10), status }),
      });
      onSaved(result);
      close();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Opslaan mislukt.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) close(); }}>
      <SheetContent title="Toernooi bewerken">
        <form className="admin-form" onSubmit={handleSubmit}>
          {error && <div className="form-error">{error}</div>}
          <div className="form-field">
            <label htmlFor="e-name">Naam</label>
            <input id="e-name" type="text" value={name} required autoFocus disabled={saving}
              onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="form-field">
            <label htmlFor="e-year">Jaar</label>
            <input id="e-year" type="number" value={year} min="2000" max="2100" required
              disabled={saving} onChange={(e) => setYear(e.target.value)} />
          </div>
          <div className="form-field">
            <label htmlFor="e-status">Status</label>
            <select id="e-status" value={status} disabled={saving}
              onChange={(e) => setStatus(e.target.value as TournamentStatus)}>
              <option value="UPCOMING">Gepland</option>
              <option value="ONGOING">Actief</option>
              <option value="COMPLETED">Afgelopen</option>
            </select>
          </div>
          <div className="admin-drawer__actions">
            <button type="submit" className="btn-sm btn-sm--primary" disabled={saving || !name.trim()}>
              {saving ? "Opslaan…" : "Opslaan"}
            </button>
            <button type="button" className="btn-sm btn-sm--ghost" onClick={close}>Annuleren</button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
