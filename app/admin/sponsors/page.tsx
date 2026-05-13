"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

interface Sponsor {
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

const blank: Form = {
  name: "",
  logoUrl: "",
  websiteUrl: "",
  tier: "STANDARD",
  isActive: true,
  sortOrder: "0",
};

const tierLabels: Record<string, string> = {
  MAIN: "Hoofdsponsor",
  GOLD: "Goud",
  STANDARD: "Standaard",
};

const tierBadge: Record<string, string> = {
  MAIN: "pink",
  GOLD: "yellow",
  STANDARD: "gray",
};

export default function AdminSponsorsPage() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Sponsor | null>(null);
  const [form, setForm] = useState<Form>(blank);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    try {
      setSponsors(await apiFetch<Sponsor[]>("/content/sponsors"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditing(null);
    setForm(blank);
    setError("");
    setOpen(true);
  }

  function openEdit(s: Sponsor) {
    setEditing(s);
    setForm({
      name: s.name,
      logoUrl: s.logoUrl ?? "",
      websiteUrl: s.websiteUrl ?? "",
      tier: s.tier,
      isActive: s.isActive,
      sortOrder: String(s.sortOrder),
    });
    setError("");
    setOpen(true);
  }

  function close() {
    setOpen(false);
    setEditing(null);
  }

  async function handleSave(e: React.FormEvent) {
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
        sortOrder: parseInt(form.sortOrder, 10) || 0,
      };
      if (editing) {
        await apiFetch(`/content/sponsors/${editing.id}`, { method: "PATCH", body: JSON.stringify(payload) });
      } else {
        await apiFetch("/content/sponsors", { method: "POST", body: JSON.stringify(payload) });
      }
      close();
      setLoading(true);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Opslaan mislukt.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="admin-page-header">
        <h1>Sponsors</h1>
        <p>Beheer sponsoren en partners</p>
      </div>

      <div className="admin-table-wrapper">
        <div className="admin-table-header">
          <h2>Sponsors ({sponsors.length})</h2>
          <button className="btn-sm btn-sm--primary" onClick={openCreate} type="button">
            + Nieuwe sponsor
          </button>
        </div>

        {loading ? (
          <p className="admin-empty">Laden…</p>
        ) : sponsors.length === 0 ? (
          <p className="admin-empty">Nog geen sponsors aangemaakt.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Naam</th>
                <th>Niveau</th>
                <th>Website</th>
                <th>Volgorde</th>
                <th>Status</th>
                <th>Acties</th>
              </tr>
            </thead>
            <tbody>
              {sponsors.map((s) => (
                <tr key={s.id}>
                  <td><strong>{s.name}</strong></td>
                  <td>
                    <span className={`badge badge--${tierBadge[s.tier]}`}>
                      {tierLabels[s.tier]}
                    </span>
                  </td>
                  <td>
                    {s.websiteUrl ? (
                      <a
                        href={s.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "var(--accent-strong)" }}
                      >
                        {s.websiteUrl.replace(/^https?:\/\//, "")}
                      </a>
                    ) : "—"}
                  </td>
                  <td><span className="mono">{s.sortOrder}</span></td>
                  <td>
                    <span className={`badge badge--${s.isActive ? "green" : "gray"}`}>
                      {s.isActive ? "Actief" : "Inactief"}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn-sm btn-sm--ghost"
                      onClick={() => openEdit(s)}
                      type="button"
                    >
                      Bewerken
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {open && (
        <div className="admin-drawer-overlay" onClick={close}>
          <div className="admin-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="admin-drawer__header">
              <h2>{editing ? "Sponsor bewerken" : "Nieuwe sponsor"}</h2>
              <button className="admin-drawer__close" onClick={close} type="button">✕</button>
            </div>

            <form className="admin-form" onSubmit={handleSave}>
              {error && <p className="form-error">{error}</p>}

              <div className="form-field">
                <label htmlFor="s-name">Naam *</label>
                <input
                  id="s-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  disabled={saving}
                />
              </div>

              <div className="form-field">
                <label htmlFor="s-tier">Niveau</label>
                <select
                  id="s-tier"
                  value={form.tier}
                  onChange={(e) => setForm({ ...form, tier: e.target.value as Form["tier"] })}
                  disabled={saving}
                >
                  <option value="MAIN">Hoofdsponsor</option>
                  <option value="GOLD">Goud</option>
                  <option value="STANDARD">Standaard</option>
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="s-logo">Logo URL (optioneel)</label>
                <input
                  id="s-logo"
                  value={form.logoUrl}
                  placeholder="https://..."
                  onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
                  disabled={saving}
                />
              </div>

              <div className="form-field">
                <label htmlFor="s-web">Website URL (optioneel)</label>
                <input
                  id="s-web"
                  value={form.websiteUrl}
                  placeholder="https://..."
                  onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })}
                  disabled={saving}
                />
              </div>

              <div className="form-field">
                <label htmlFor="s-order">Volgorde</label>
                <input
                  id="s-order"
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
                  disabled={saving}
                />
              </div>

              <label className="form-checkbox">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  disabled={saving}
                />
                Actief
              </label>

              <div className="admin-drawer__actions">
                <button
                  type="submit"
                  className="btn-sm btn-sm--primary"
                  disabled={saving || !form.name}
                >
                  {saving ? "Opslaan…" : "Opslaan"}
                </button>
                <button
                  type="button"
                  className="btn-sm btn-sm--ghost"
                  onClick={close}
                  disabled={saving}
                >
                  Annuleren
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
