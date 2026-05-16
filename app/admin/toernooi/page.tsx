"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import type { TournamentListItem } from "@/lib/tournament-types";
import { DataTable, type ColumnDef } from "@/components/admin/data-table";
import { TableToolbar, type ColumnDisplay } from "@/components/admin/table-toolbar";
import { useDrawer } from "@/components/admin/drawer-provider";
import { IconCheck, IconEdit, IconTrash } from "@/components/icons";
import { CreateDrawer } from "../../../components/toernooi/create-drawer";
import { EditDrawer } from "../../../components/toernooi/edit-drawer";
import { DeleteConfirm } from "../../../components/toernooi/delete-confirm";

// ── CSV export ────────────────────────────────────────────────────────────────

function exportCsv(rows: TournamentListItem[]) {
  const headers = ["ID", "Naam", "Jaar", "Status", "Aangemaakt"];
  const escape = (v: string) => `"${v.replaceAll('"', '""')}"`;
  const lines = [
    headers.join(";"),
    ...rows.map((t) =>
      [
        t.id,
        escape(t.name),
        t.year,
        t.status,
        new Date(t.createdAt).toLocaleDateString("nl-BE"),
      ].join(";")
    ),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `toernooien_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Cell components ───────────────────────────────────────────────────────────

function StatusCell({ status }: Readonly<{ status: string }>) {
  if (status === "ONGOING")   return <span className="badge badge--pink">Actief</span>;
  if (status === "COMPLETED") return <span className="badge badge--blue">Afgelopen</span>;
  return <span className="badge badge--gray">Gepland</span>;
}

interface ActionCellProps {
  tournament: TournamentListItem;
  activating: number | null;
  onActivate: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function ActionCell({
  tournament: t,
  activating,
  onActivate,
  onEdit,
  onDelete,
}: Readonly<ActionCellProps>) {
  return (
    <div className="row-actions">
      <Link
        href={`/admin/toernooi/${t.id}`}
        className="btn-sm btn-sm--primary"
        style={{ display: "inline-flex", alignItems: "center" }}
      >
        Beheren →
      </Link>
      {t.status === "UPCOMING" && (
        <button
          type="button"
          className="btn-sm btn-sm--success"
          disabled={activating === t.id}
          onClick={onActivate}
          style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}
        >
          <IconCheck />
          {activating === t.id ? "…" : "Activeren"}
        </button>
      )}
      <button
        type="button"
        className="btn-sm btn-sm--ghost"
        onClick={onEdit}
        style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}
      >
        <IconEdit /> Bewerken
      </button>
      <button
        type="button"
        className="btn-sm btn-sm--danger"
        onClick={onDelete}
        style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}
      >
        <IconTrash /> Verwijderen
      </button>
    </div>
  );
}

// ── Column factory ────────────────────────────────────────────────────────────

function makeActionColumn(
  activating: number | null,
  onActivate: (t: TournamentListItem) => void,
  openDrawer: (content: React.ReactNode) => void,
  onSaved: (t: TournamentListItem) => void,
  onDeleted: (id: number) => void,
): ColumnDef<TournamentListItem> {
  return {
    key: "actions",
    header: "Acties",
    cell: (t) => (
      <ActionCell
        tournament={t}
        activating={activating}
        onActivate={() => onActivate(t)}
        onEdit={() => openDrawer(<EditDrawer tournament={t} onSaved={onSaved} />)}
        onDelete={() => openDrawer(<DeleteConfirm tournament={t} onDeleted={onDeleted} />)}
      />
    ),
  };
}

// ── All columns (static definition) ──────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("nl-BE");
}

const ALL_COLUMNS: ColumnDef<TournamentListItem>[] = [
  {
    key: "name",
    header: "Naam",
    sortable: true,
    sortValue: (t) => t.name,
    cell: (t) => <strong>{t.name}</strong>,
  },
  {
    key: "year",
    header: "Jaar",
    sortable: true,
    sortValue: (t) => t.year,
    cell: (t) => <span className="mono">{t.year}</span>,
  },
  {
    key: "status",
    header: "Status",
    cell: (t) => <StatusCell status={t.status} />,
  },
  {
    key: "created",
    header: "Aangemaakt",
    sortable: true,
    sortValue: (t) => t.createdAt,
    cell: (t) => fmtDate(t.createdAt),
  },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminTournooisPage() {
  const { openDrawer } = useDrawer();
  const [tournaments, setTournaments] = useState<TournamentListItem[]>([]);
  const [loading, setLoading]         = useState(true);
  const [activating, setActivating]   = useState<number | null>(null);

  // Search + filter state
  const [search, setSearch] = useState("");

  // Column visibility
  const [visibleKeys, setVisibleKeys] = useState(
    () => new Set(ALL_COLUMNS.map((c) => c.key)),
  );

  useEffect(() => {
    apiFetch<TournamentListItem[]>("/tournaments")
      .then(setTournaments)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function handleSaved(t: TournamentListItem) {
    setTournaments((prev) => {
      const exists = prev.find((x) => x.id === t.id);
      return exists ? prev.map((x) => (x.id === t.id ? t : x)) : [t, ...prev];
    });
  }

  function handleDeleted(id: number) {
    setTournaments((prev) => prev.filter((t) => t.id !== id));
  }

  async function handleActivate(t: TournamentListItem) {
    setActivating(t.id);
    try {
      const updated = await apiFetch<TournamentListItem>(`/tournaments/${t.id}/activate`, {
        method: "POST",
      });
      setTournaments((prev) =>
        prev.map((x) =>
          x.id === updated.id
            ? updated
            : { ...x, isActive: false, status: "COMPLETED" as const }
        )
      );
    } catch { /* ignore */ } finally {
      setActivating(null);
    }
  }

  function toggleColumn(key: string) {
    setVisibleKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const actionColumn = makeActionColumn(
    activating, handleActivate, openDrawer, handleSaved, handleDeleted,
  );

  // Filter
  const q = search.toLowerCase();
  const filtered = [...tournaments]
    .sort((a, b) => b.year - a.year)
    .filter((t) =>
      !q || t.name.toLowerCase().includes(q) || String(t.year).includes(q)
    );

  // Visible columns (always show actions)
  const visibleStaticCols = ALL_COLUMNS.filter((c) => visibleKeys.has(c.key));
  const columns = [...visibleStaticCols, actionColumn];

  const columnDisplay: ColumnDisplay[] = [
    ...ALL_COLUMNS.map((c) => ({ key: c.key, label: c.header, visible: visibleKeys.has(c.key) })),
    { key: "actions", label: "Acties", visible: true, fixed: true },
  ];

  return (
    <>
      <div className="admin-page-header">
        <h1>Toernooien</h1>
        <p>Beheer alle edities van het De Flosj petanquetoernooi.</p>
      </div>

      <DataTable
        toolbar={
          <TableToolbar
            search={search}
            onSearch={setSearch}
            searchPlaceholder="Zoek op naam of jaar…"
            columns={columnDisplay}
            onColumnToggle={toggleColumn}
            onAdd={() => openDrawer(<CreateDrawer onSaved={handleSaved} />)}
            addLabel="Nieuw toernooi"
            resultCount={filtered.length}
            totalCount={tournaments.length}
            menuItems={[
              {
                key: "export-csv",
                label: "Exporteer CSV",
                icon: (
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M8 2v8M5 7l3 3 3-3M2 11v1a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ),
                onClick: () => exportCsv(filtered),
              },
              {
                key: "help",
                label: "Help & documentatie",
                separator: true,
                icon: (
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.4" />
                    <path d="M6.5 6a1.5 1.5 0 0 1 3 0c0 1-1.5 1.5-1.5 2.5M8 11.5v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                  </svg>
                ),
                onClick: () => window.open("#", "_blank", "noopener,noreferrer"),
              },
            ]}
          />
        }
        title={`Alle toernooien (${loading ? "…" : tournaments.length})`}
        data={filtered}
        columns={columns}
        loading={loading}
        emptyText='Nog geen toernooien. Klik op "Nieuw toernooi" om te beginnen.'
      />
    </>
  );
}
