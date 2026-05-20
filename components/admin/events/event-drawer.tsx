"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { Sheet, SheetContent } from "@/components/admin/sheet";
import { useDrawer } from "@/components/admin/drawer-provider";

export interface CalEvent {
  id: number;
  title: string;
  description: string | null;
  location: string | null;
  startsAt: string;
  endsAt: string | null;
  isPublished: boolean;
}

interface Form {
  title: string;
  description: string;
  location: string;
  startsAt: string;
  endsAt: string;
  isPublished: boolean;
}

function toDatetimeLocal(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toISOString().slice(0, 16);
}

interface Props {
  editing: CalEvent | null;
  onSaved: () => void;
}

export function EventDrawer({ editing, onSaved }: Readonly<Props>) {
  const { closeDrawer } = useDrawer();
  const [open, setOpen] = useState(true);
  const [form, setForm] = useState<Form>(() =>
    editing
      ? {
          title: editing.title,
          description: editing.description ?? "",
          location: editing.location ?? "",
          startsAt: toDatetimeLocal(editing.startsAt),
          endsAt: toDatetimeLocal(editing.endsAt),
          isPublished: editing.isPublished,
        }
      : { title: "", description: "", location: "", startsAt: "", endsAt: "", isPublished: false }
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
        title: form.title,
        description: form.description || null,
        location: form.location || null,
        startsAt: form.startsAt,
        endsAt: form.endsAt || null,
        isPublished: form.isPublished,
      };
      if (editing) {
        await apiFetch(`content/events/${editing.id}`, { method: "PATCH", body: JSON.stringify(payload) });
      } else {
        await apiFetch("content/events", { method: "POST", body: JSON.stringify(payload) });
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
      <SheetContent title={editing ? "Event bewerken" : "Nieuw event"}>
        <form className="admin-form" onSubmit={handleSubmit}>
          {error && <p className="form-error">{error}</p>}

          <div className="form-field">
            <label htmlFor="e-title">Titel *</label>
            <input id="e-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required disabled={saving} />
          </div>

          <div className="form-field">
            <label htmlFor="e-loc">Locatie (optioneel)</label>
            <input id="e-loc" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} disabled={saving} />
          </div>

          <div className="form-field">
            <label htmlFor="e-desc">Omschrijving (optioneel)</label>
            <textarea id="e-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} disabled={saving} />
          </div>

          <div className="form-field">
            <label htmlFor="e-start">Startdatum &amp; tijd *</label>
            <input id="e-start" type="datetime-local" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} required disabled={saving} />
          </div>

          <div className="form-field">
            <label htmlFor="e-end">Einddatum &amp; tijd (optioneel)</label>
            <input id="e-end" type="datetime-local" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} disabled={saving} />
          </div>

          <label className="form-checkbox">
            <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} disabled={saving} />
            {" "}Gepubliceerd
          </label>

          <div className="admin-drawer__actions">
            <button type="submit" className="btn-sm btn-sm--primary" disabled={saving || !form.title || !form.startsAt}>
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
