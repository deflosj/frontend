"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { Sheet, SheetContent } from "@/components/admin/sheet";
import { useDrawer } from "@/components/admin/drawer-provider";

export interface NewsPost {
  id: number;
  title: string;
  slug: string;
  body: string;
  coverUrl: string | null;
  publishedAt: string | null;
  createdAt: string;
}

interface Form {
  title: string;
  slug: string;
  body: string;
  coverUrl: string;
  isPublished: boolean;
}

interface Props {
  editing: NewsPost | null;
  onSaved: () => void;
}

export function NewsDrawer({ editing, onSaved }: Readonly<Props>) {
  const { closeDrawer } = useDrawer();
  const [open, setOpen] = useState(true);
  const [form, setForm] = useState<Form>(() =>
    editing
      ? {
          title: editing.title,
          slug: editing.slug,
          body: editing.body,
          coverUrl: editing.coverUrl ?? "",
          isPublished: editing.publishedAt !== null,
        }
      : { title: "", slug: "", body: "", coverUrl: "", isPublished: false }
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
        slug: form.slug || undefined,
        body: form.body,
        coverUrl: form.coverUrl || null,
        isPublished: form.isPublished,
      };
      if (editing) {
        await apiFetch(`content/news/${editing.id}`, { method: "PATCH", body: JSON.stringify(payload) });
      } else {
        await apiFetch("content/news", { method: "POST", body: JSON.stringify(payload) });
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
      <SheetContent title={editing ? "Artikel bewerken" : "Nieuw artikel"}>
        <form className="admin-form" onSubmit={handleSubmit}>
          {error && <p className="form-error">{error}</p>}

          <div className="form-field">
            <label htmlFor="n-title">Titel *</label>
            <input id="n-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required disabled={saving} />
          </div>

          <div className="form-field">
            <label htmlFor="n-slug">Slug (optioneel — auto-gegenereerd)</label>
            <input id="n-slug" value={form.slug} placeholder="mijn-artikel-titel" onChange={(e) => setForm({ ...form, slug: e.target.value })} disabled={saving} />
          </div>

          <div className="form-field">
            <label htmlFor="n-cover">Cover URL (optioneel)</label>
            <input id="n-cover" value={form.coverUrl} placeholder="https://..." onChange={(e) => setForm({ ...form, coverUrl: e.target.value })} disabled={saving} />
          </div>

          <div className="form-field">
            <label htmlFor="n-body">Inhoud *</label>
            <textarea id="n-body" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} required disabled={saving} style={{ minHeight: 180 }} />
          </div>

          <label className="form-checkbox">
            <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} disabled={saving} />
            {" "}Gepubliceerd
          </label>

          <div className="admin-drawer__actions">
            <button type="submit" className="btn-sm btn-sm--primary" disabled={saving || !form.title || !form.body}>
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
