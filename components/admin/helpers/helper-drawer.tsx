"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { Sheet, SheetContent } from "@/components/admin/sheet";
import { useDrawer } from "@/components/admin/drawer-provider";
import type { CalEvent } from "@/components/admin/events/event-drawer";

export interface Helper {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  note: string | null;
  events: { id: number; title: string; startsAt: string }[];
}

interface Form {
  name: string;
  email: string;
  phone: string;
  note: string;
  eventIds: number[];
}

interface Props {
  editing: Helper | null;
  events: CalEvent[];
  /** Voorgeselecteerd event bij een nieuwe helper (bv. vanuit de eventslijst). */
  defaultEventId?: number | null;
  onSaved: () => void;
}

function eventLabel(ev: { title: string; startsAt: string }) {
  return `${ev.title} · ${new Date(ev.startsAt).toLocaleDateString("nl-BE", { day: "numeric", month: "short", year: "numeric" })}`;
}

export function HelperDrawer({ editing, events, defaultEventId, onSaved }: Readonly<Props>) {
  const { closeDrawer } = useDrawer();
  const [open, setOpen] = useState(true);
  const [form, setForm] = useState<Form>(() =>
    editing
      ? {
          name: editing.name,
          email: editing.email ?? "",
          phone: editing.phone ?? "",
          note: editing.note ?? "",
          eventIds: editing.events.map((e) => e.id),
        }
      : { name: "", email: "", phone: "", note: "", eventIds: defaultEventId ? [defaultEventId] : [] }
  );
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");

  const sortedEvents = [...events].sort((a, b) => b.startsAt.localeCompare(a.startsAt));

  function close() {
    setOpen(false);
    closeDrawer();
  }

  function toggleEvent(id: number) {
    setForm((f) => ({
      ...f,
      eventIds: f.eventIds.includes(id) ? f.eventIds.filter((x) => x !== id) : [...f.eventIds, id],
    }));
  }

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        name: form.name,
        email: form.email || null,
        phone: form.phone || null,
        note: form.note || null,
        eventIds: form.eventIds,
      };
      if (editing) {
        await apiFetch(`helpers/${editing.id}`, { method: "PATCH", body: JSON.stringify(payload) });
      } else {
        await apiFetch("helpers", { method: "POST", body: JSON.stringify(payload) });
      }
      onSaved();
      close();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Opslaan mislukt.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!editing) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setSaving(true);
    setError("");
    try {
      await apiFetch(`helpers/${editing.id}`, { method: "DELETE" });
      onSaved();
      close();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verwijderen mislukt.");
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) close(); }}>
      <SheetContent title={editing ? "Helper bewerken" : "Helper toevoegen"}>
        <form className="admin-form" onSubmit={handleSubmit}>
          {error && <p className="form-error">{error}</p>}

          <div className="form-field">
            <label htmlFor="h-name">Naam *</label>
            <input id="h-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required disabled={saving} autoFocus />
          </div>

          <div className="form-field">
            <span id="h-events-label" style={{ fontSize: "0.8rem", fontWeight: 500 }}>Geholpen bij</span>
            {sortedEvents.length === 0 ? (
              <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--ink-2)" }}>
                Nog geen events. Maak eerst een event aan bij Events.
              </p>
            ) : (
              <div
                role="group"
                aria-labelledby="h-events-label"
                style={{ display: "grid", gap: "0.35rem", maxHeight: "16rem", overflowY: "auto", padding: "0.5rem 0.65rem", border: "1px solid var(--border)", borderRadius: "10px" }}
              >
                {sortedEvents.map((ev) => (
                  <label key={ev.id} className="form-checkbox" style={{ margin: 0 }}>
                    <input type="checkbox" checked={form.eventIds.includes(ev.id)} onChange={() => toggleEvent(ev.id)} disabled={saving} />
                    {" "}{eventLabel(ev)}
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="h-email">E-mail (optioneel)</label>
            <input id="h-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} disabled={saving} />
          </div>

          <div className="form-field">
            <label htmlFor="h-phone">Telefoon (optioneel)</label>
            <input id="h-phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} disabled={saving} />
          </div>

          <div className="form-field">
            <label htmlFor="h-note">Notitie (optioneel)</label>
            <textarea id="h-note" rows={3} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} disabled={saving} />
          </div>

          <div className="admin-drawer__actions">
            <button type="submit" className="btn-sm btn-sm--primary" disabled={saving || !form.name.trim()}>
              {saving ? "Opslaan…" : "Opslaan"}
            </button>
            <button type="button" className="btn-sm btn-sm--ghost" onClick={close} disabled={saving}>
              Annuleren
            </button>
            {editing && (
              <button type="button" className="btn-sm btn-sm--ghost" style={{ marginLeft: "auto", color: "var(--err-fg)" }} onClick={handleDelete} disabled={saving}>
                {confirmDelete ? "Zeker verwijderen?" : "Verwijderen"}
              </button>
            )}
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
