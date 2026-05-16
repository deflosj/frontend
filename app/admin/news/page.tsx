"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { apiFetch } from "@/lib/api";
import { DataTable, type ColumnDef } from "@/components/admin/data-table";
import { TableToolbar } from "@/components/admin/table-toolbar";

// ── Types ─────────────────────────────────────────────────────────────────────

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

// ── Cell components (module scope — required by S6478) ────────────────────────

function TitleCell({ title }: Readonly<{ title: string }>) {
  return <strong>{title}</strong>;
}

function SlugCell({ slug }: Readonly<{ slug: string }>) {
  return <span className="mono">{slug}</span>;
}

function PublishBadge({ publishedAt }: Readonly<{ publishedAt: string | null }>) {
  return publishedAt ? (
    <span className="badge badge--green">Gepubliceerd</span>
  ) : (
    <span className="badge badge--yellow">Concept</span>
  );
}

function DateCell({ iso }: Readonly<{ iso: string | null }>) {
  if (!iso) return <>—</>;
  return <>{new Date(iso).toLocaleDateString("nl-BE")}</>;
}

function EditButton({ onClick }: Readonly<{ onClick: () => void }>) {
  return (
    <button type="button" className="btn-sm btn-sm--ghost" onClick={onClick}>
      Bewerken
    </button>
  );
}

// ── Column factory ────────────────────────────────────────────────────────────

function makeColumns(onEdit: (post: NewsPost) => void): ColumnDef<NewsPost>[] {
  return [
    {
      key: "title",
      header: "Titel",
      sortable: true,
      sortValue: (p) => p.title,
      cell: (p) => <TitleCell title={p.title} />,
    },
    {
      key: "slug",
      header: "Slug",
      cell: (p) => <SlugCell slug={p.slug} />,
    },
    {
      key: "status",
      header: "Status",
      cell: (p) => <PublishBadge publishedAt={p.publishedAt} />,
    },
    {
      key: "publishedAt",
      header: "Gepubliceerd",
      sortable: true,
      sortValue: (p) => p.publishedAt ?? "",
      cell: (p) => <DateCell iso={p.publishedAt} />,
    },
    {
      key: "actions",
      header: "Acties",
      cell: (p) => <EditButton onClick={() => onEdit(p)} />,
    },
  ];
}

// ── useDialog hook — syncs open state with native <dialog> ────────────────────

function useDialog(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open) { el.showModal(); } else { el.close(); }
  }, [open]);
  // Sync when dialog is closed via Escape key
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.addEventListener("close", onClose);
    return () => el.removeEventListener("close", onClose);
  }, [onClose]);
  return ref;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminNewsPage() {
  const [posts, setPosts]     = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen]       = useState(false);
  const [editing, setEditing] = useState<NewsPost | null>(null);
  const [form, setForm]       = useState<Form>(blank);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");

  const [search, setSearch]         = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");

  const close = () => setOpen(false);
  const dialogRef = useDialog(open, close);

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

  async function handleSave(e: React.SyntheticEvent) {
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

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return posts.filter((p) => {
      if (filterStatus === "PUBLISHED" && !p.publishedAt) return false;
      if (filterStatus === "DRAFT" && p.publishedAt) return false;
      if (q && !p.title.toLowerCase().includes(q) && !p.slug.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [posts, search, filterStatus]);

  const columns = makeColumns(openEdit);

  return (
    <>
      <div className="admin-page-header">
        <h1>Nieuws</h1>
        <p>Beheer nieuwsartikelen voor de website</p>
      </div>

      <DataTable
        toolbar={
          <TableToolbar
            search={search}
            onSearch={setSearch}
            searchPlaceholder="Zoek op titel of slug…"
            filters={[
              {
                key: "status",
                label: "Status",
                value: filterStatus,
                defaultValue: "ALL",
                options: [
                  { value: "ALL",       label: "Alle artikelen" },
                  { value: "PUBLISHED", label: "Gepubliceerd"    },
                  { value: "DRAFT",     label: "Concept"        },
                ],
                onChange: setFilterStatus,
              },
            ]}
            onAdd={openCreate}
            addLabel="Nieuw artikel"
            resultCount={filtered.length}
            totalCount={posts.length}
          />
        }
        title={`Artikelen (${loading ? "…" : posts.length})`}
        data={filtered}
        columns={columns}
        loading={loading}
        emptyText="Nog geen artikelen aangemaakt."
      />

      <dialog ref={dialogRef} className="admin-drawer">
        <div className="admin-drawer__header">
          <h2>{editing ? "Artikel bewerken" : "Nieuw artikel"}</h2>
          <button className="admin-drawer__close" onClick={close} type="button">✕</button>
        </div>

        <form className="admin-form" onSubmit={handleSave}>
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
      </dialog>
    </>
  );
}
