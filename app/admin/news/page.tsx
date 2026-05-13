"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

interface NewsPost {
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

const blank: Form = { title: "", slug: "", body: "", coverUrl: "", isPublished: false };

export default function AdminNewsPage() {
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<NewsPost | null>(null);
  const [form, setForm] = useState<Form>(blank);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    try {
      setPosts(await apiFetch<NewsPost[]>("/content/news"));
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

  function openEdit(post: NewsPost) {
    setEditing(post);
    setForm({
      title: post.title,
      slug: post.slug,
      body: post.body,
      coverUrl: post.coverUrl ?? "",
      isPublished: post.publishedAt !== null,
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
        slug: form.slug || undefined,
        body: form.body,
        coverUrl: form.coverUrl || null,
        isPublished: form.isPublished,
      };
      if (editing) {
        await apiFetch(`/content/news/${editing.id}`, { method: "PATCH", body: JSON.stringify(payload) });
      } else {
        await apiFetch("/content/news", { method: "POST", body: JSON.stringify(payload) });
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
        <h1>Nieuws</h1>
        <p>Beheer nieuwsartikelen voor de website</p>
      </div>

      <div className="admin-table-wrapper">
        <div className="admin-table-header">
          <h2>Artikelen ({posts.length})</h2>
          <button className="btn-sm btn-sm--primary" onClick={openCreate} type="button">
            + Nieuw artikel
          </button>
        </div>

        {loading ? (
          <p className="admin-empty">Laden…</p>
        ) : posts.length === 0 ? (
          <p className="admin-empty">Nog geen artikelen aangemaakt.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Titel</th>
                <th>Slug</th>
                <th>Status</th>
                <th>Gepubliceerd</th>
                <th>Acties</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.id}>
                  <td><strong>{post.title}</strong></td>
                  <td><span className="mono">{post.slug}</span></td>
                  <td>
                    <span className={`badge badge--${post.publishedAt ? "green" : "yellow"}`}>
                      {post.publishedAt ? "Gepubliceerd" : "Concept"}
                    </span>
                  </td>
                  <td>
                    {post.publishedAt
                      ? new Date(post.publishedAt).toLocaleDateString("nl-BE")
                      : "—"}
                  </td>
                  <td>
                    <button
                      className="btn-sm btn-sm--ghost"
                      onClick={() => openEdit(post)}
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
              <h2>{editing ? "Artikel bewerken" : "Nieuw artikel"}</h2>
              <button className="admin-drawer__close" onClick={close} type="button">✕</button>
            </div>

            <form className="admin-form" onSubmit={handleSave}>
              {error && <p className="form-error">{error}</p>}

              <div className="form-field">
                <label htmlFor="n-title">Titel *</label>
                <input
                  id="n-title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                  disabled={saving}
                />
              </div>

              <div className="form-field">
                <label htmlFor="n-slug">Slug (optioneel — auto-gegenereerd)</label>
                <input
                  id="n-slug"
                  value={form.slug}
                  placeholder="mijn-artikel-titel"
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  disabled={saving}
                />
              </div>

              <div className="form-field">
                <label htmlFor="n-cover">Cover URL (optioneel)</label>
                <input
                  id="n-cover"
                  value={form.coverUrl}
                  placeholder="https://..."
                  onChange={(e) => setForm({ ...form, coverUrl: e.target.value })}
                  disabled={saving}
                />
              </div>

              <div className="form-field">
                <label htmlFor="n-body">Inhoud *</label>
                <textarea
                  id="n-body"
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  required
                  disabled={saving}
                  style={{ minHeight: 180 }}
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
                  disabled={saving || !form.title || !form.body}
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
