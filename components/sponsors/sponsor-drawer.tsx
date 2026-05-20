"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { Sheet, SheetContent } from "@/components/admin/sheet";
import { useDrawer } from "@/components/admin/drawer-provider";

export interface Sponsor {
  id: number;
  name: string;
  logoUrl: string | null;
  websiteUrl: string | null;
  tier: "MAIN" | "GOLD" | "STANDARD";
  isActive: boolean;
  sortOrder: number;
}

interface Form {
  name: string;
  logoUrl: string;
  websiteUrl: string;
  tier: "MAIN" | "GOLD" | "STANDARD";
  isActive: boolean;
  sortOrder: string;
}

interface Props {
  editing: Sponsor | null;
  onSaved: () => void;
}

export function SponsorDrawer({ editing, onSaved }: Readonly<Props>) {
  const { closeDrawer } = useDrawer();
  const [open, setOpen] = useState(true);
  const [form, setForm] = useState<Form>(() =>
    editing
      ? {
          name: editing.name,
          logoUrl: editing.logoUrl ?? "",
          websiteUrl: editing.websiteUrl ?? "",
          tier: editing.tier,
          isActive: editing.isActive,
          sortOrder: String(editing.sortOrder),
        }
      : { name: "", logoUrl: "", websiteUrl: "", tier: "STANDARD", isActive: true, sortOrder: "0" }
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function close() {
    setOpen(false);
    closeDrawer();
  }

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        name: form.name,
        logoUrl: form.logoUrl || null,
        websiteUrl: form.websiteUrl || null,
        tier: form.tier,
        isActive: form.isActive,
        sortOrder: Number.parseInt(form.sortOrder, 10) || 0,
      };
      if (editing) {
        await apiFetch(`content/sponsors/${editing.id}`, { method: "PATCH", body: JSON.stringify(payload) });
      } else {
        await apiFetch("content/sponsors", { method: "POST", body: JSON.stringify(payload) });
      }
      onSaved();
      close();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Opslaan mislukt.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) close(); }}>
      <SheetContent title={editing ? "Sponsor bewerken" : "Nieuwe sponsor"}>
        <form className="admin-form" onSubmit={handleSubmit}>
          {error && <p className="form-error">{error}</p>}

          <div className="form-field">
            <label htmlFor="s-name">Naam *</label>
            <input id="s-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required disabled={saving} />
          </div>

          <div className="form-field">
            <label htmlFor="s-tier">Niveau</label>
            <select id="s-tier" value={form.tier} onChange={(e) => setForm({ ...form, tier: e.target.value as Form["tier"] })} disabled={saving}>
              <option value="MAIN">Hoofdsponsor</option>
              <option value="GOLD">Goud</option>
              <option value="STANDARD">Standaard</option>
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="s-logo">Logo URL (optioneel)</label>
            <input id="s-logo" value={form.logoUrl} placeholder="https://..." onChange={(e) => setForm({ ...form, logoUrl: e.target.value })} disabled={saving} />
          </div>

          <div className="form-field">
            <label htmlFor="s-web">Website URL (optioneel)</label>
            <input id="s-web" value={form.websiteUrl} placeholder="https://..." onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })} disabled={saving} />
          </div>

          <div className="form-field">
            <label htmlFor="s-order">Volgorde</label>
            <input id="s-order" type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} disabled={saving} />
          </div>

          <label className="form-checkbox">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} disabled={saving} />
            {" "}Actief
          </label>

          <div className="admin-drawer__actions">
            <button type="submit" className="btn-sm btn-sm--primary" disabled={saving || !form.name}>
              {saving ? "Opslaan…" : "Opslaan"}
            </button>
            <button type="button" className="btn-sm btn-sm--ghost" onClick={close} disabled={saving}>
              Annuleren
            </button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
