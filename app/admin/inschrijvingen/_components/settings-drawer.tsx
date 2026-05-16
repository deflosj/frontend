"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";
import type { RegistrationSettings } from "@/lib/registration-types";
import { Sheet, SheetContent } from "@/components/admin/sheet";
import { useDrawer } from "@/components/admin/drawer-provider";

interface Props {
  settings: RegistrationSettings;
  onSaved: (s: RegistrationSettings) => void;
}

export function SettingsDrawer({ settings, onSaved }: Readonly<Props>) {
  const { closeDrawer } = useDrawer();
  const [open, setOpen] = useState(true);
  const [isOpen, setIsOpen] = useState(settings.isOpen);
  const [dorpLimit, setDorpLimit] = useState(
    settings.dorpelingenkoersLimit !== null ? String(settings.dorpelingenkoersLimit) : ""
  );
  const [funLimit, setFunLimit] = useState(
    settings.funWedstrijdLimit !== null ? String(settings.funWedstrijdLimit) : ""
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function close() {
    setOpen(false);
    closeDrawer();
  }

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const result = await apiFetch<RegistrationSettings>("/registrations/settings", {
        method: "PATCH",
        body: JSON.stringify({
          isOpen,
          dorpelingenkoersLimit: dorpLimit === "" ? null : Number.parseInt(dorpLimit, 10),
          funWedstrijdLimit: funLimit === "" ? null : Number.parseInt(funLimit, 10),
        }),
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
      <SheetContent title="Instellingen inschrijvingen">
        <form className="admin-form" onSubmit={handleSubmit}>
          {error && <div className="form-error">{error}</div>}

          {/* Open / Gesloten toggle */}
          <div className="form-field">
            <label style={{ display: "flex", alignItems: "center", gap: "0.6rem", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={isOpen}
                onChange={(e) => setIsOpen(e.target.checked)}
                disabled={saving}
                style={{ width: "1rem", height: "1rem", accentColor: "var(--accent)", cursor: "pointer" }}
              />
              <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--text)" }}>
                Inschrijvingen zijn open
              </span>
            </label>
            <p style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "0.25rem" }}>
              Zet dit uit om alle nieuwe inschrijvingen te blokkeren.
            </p>
          </div>

          {/* Limieten */}
          <div className="form-field">
            <label htmlFor="s-dorp-limit">
              Limiet dorpelingenkoers
            </label>
            <input
              id="s-dorp-limit"
              type="number"
              min="1"
              value={dorpLimit}
              placeholder="Onbeperkt (leeg laten)"
              disabled={saving}
              onChange={(e) => setDorpLimit(e.target.value)}
            />
            <p style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "0.25rem" }}>
              Laat leeg voor geen limiet.
            </p>
          </div>

          <div className="form-field">
            <label htmlFor="s-fun-limit">
              Limiet fun wedstrijd
            </label>
            <input
              id="s-fun-limit"
              type="number"
              min="1"
              value={funLimit}
              placeholder="Onbeperkt (leeg laten)"
              disabled={saving}
              onChange={(e) => setFunLimit(e.target.value)}
            />
            <p style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "0.25rem" }}>
              Laat leeg voor geen limiet.
            </p>
          </div>

          <div className="admin-drawer__actions">
            <button
              type="submit"
              className="btn-sm btn-sm--primary"
              disabled={saving}
            >
              {saving ? "Opslaan…" : "Opslaan"}
            </button>
            <button type="button" className="btn-sm btn-sm--ghost" onClick={close}>
              Annuleren
            </button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
