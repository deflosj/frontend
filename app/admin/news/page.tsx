"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import { DataTable, type ColumnDef } from "@/components/admin/data-table";
import { TableToolbar } from "@/components/admin/table-toolbar";
import { useDrawer } from "@/components/admin/drawer-provider";
import { NewsDrawer, type NewsPost } from "../../../components/news/news-drawer";

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

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminNewsPage() {
  const { openDrawer } = useDrawer();
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");

  async function load() {
    try {
      setPosts(await apiFetch<NewsPost[]>("/content/news"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function handleSaved() {
    setLoading(true);
    load();
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

  const columns = makeColumns((p) => openDrawer(<NewsDrawer editing={p} onSaved={handleSaved} />));

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
            onAdd={() => openDrawer(<NewsDrawer editing={null} onSaved={handleSaved} />)}
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
    </>
  );
}
