"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

interface CalEvent {
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

const blank: Form = {
  title: "",
  description: "",
  location: "",
  startsAt: "",
  endsAt: "",
  isPublished: false,
};

function toDatetimeLocal(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toISOString().slice(0, 16);
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CalEvent | null>(null);
  const [form, setForm] = useState<Form>(blank);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    try {
      setEvents(await apiFetch<CalEvent[]>("/content/events"));
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

  function openEdit(ev: CalEvent) {
    setEditing(ev);
    setForm({
      title: ev.title,
      description: ev.description ?? "",
      location: ev.location ?? "",
      startsAt: toDatetimeLocal(ev.startsAt),
      endsAt: toDatetimeLocal(ev.endsAt),
      isPublished: ev.isPublished,
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
        title: form.title,
        description: form.description || null,
        location: form.location || null,
        startsAt: form.startsAt,
        endsAt: form.endsAt || null,
        isPublished: form.isPublished,
      };
      if (editing) {
        await apiFetch(`/content/events/${editing.id}`, { method: "PATCH", body: JSON.stringify(payload) });
      } else {
        await apiFetch("/content/events", { method: "POST", body: JSON.stringify(payload) });
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
        <h1>Events</h1>
        <p>Beheer evenementen voor de website</p>
      </div>

      <div className="admin-table-wrapper">
        <div className="admin-table-header">
          <h2>Events ({events.length})</h2>
          <button className="btn-sm btn-sm--primary" onClick={openCreate} type="button">
            + Nieuw event
          </button>
        </div>

        {loading ? (
          <p className="admin-empty">Laden…</p>
        ) : events.length === 0 ? (
          <p className="admin-empty">Nog geen events aangemaakt.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Titel</th>
                <th>Locatie</th>
                <th>Startdatum</th>
                <th>Status</th>
                <th>Acties</th>
              </tr>
            </thead>
            <tbody>
              {events.map((ev) => (
                <tr key={ev.id}>
                  <td><strong>{ev.title}</strong></td>
                  <td>{ev.location ?? "—"}</td>
                  <td>{new Date(ev.startsAt).toLocaleDateString("nl-BE")}</td>
                  <td>
                    <span className={`badge badge--${ev.isPublished ? "green" : "yellow"}`}>
                      {ev.isPublished ? "Gepubliceerd" : "Concept"}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn-sm btn-sm--ghost"
                      onClick={() => openEdit(ev)}
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
              <h2>{editing ? "Event bewerken" : "Nieuw event"}</h2>
              <button className="admin-drawer__close" onClick={close} type="button">✕</button>
            </div>

            <form className="admin-form" onSubmit={handleSave}>
              {error && <p className="form-error">{error}</p>}

              <div className="form-field">
                <label htmlFor="e-title">Titel *</label>
                <input
                  id="e-title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                  disabled={saving}
                />
              </div>

              <div className="form-field">
                <label htmlFor="e-loc">Locatie (optioneel)</label>
                <input
                  id="e-loc"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  disabled={saving}
                />
              </div>

              <div className="form-field">
                <label htmlFor="e-desc">Omschrijving (optioneel)</label>
                <textarea
                  id="e-desc"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  disabled={saving}
                />
              </div>

              <div className="form-field">
                <label htmlFor="e-start">Startdatum &amp; tijd *</label>
                <input
                  id="e-start"
                  type="datetime-local"
                  value={form.startsAt}
                  onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
                  required
                  disabled={saving}
                />
              </div>

              <div className="form-field">
                <label htmlFor="e-end">Einddatum &amp; tijd (optioneel)</label>
                <input
                  id="e-end"
                  type="datetime-local"
                  value={form.endsAt}
                  onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
                  disabled={saving}
                />
              </div>

              <label className="form-checkbox">
                <input
                  type="checkbox"
                  checked={form.isPublished}
                  onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
                  disabled={saving}
                />
                Gepubliceerd
              </label>

              <div className="admin-drawer__actions">
                <button
                  type="submit"
                  className="btn-sm btn-sm--primary"
                  disabled={saving || !form.title || !form.startsAt}
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
