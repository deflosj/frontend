"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import type { TournamentListItem } from "@/lib/tournament-types";
import { DataTable, type ColumnDef } from "@/components/admin/data-table";
import { useDrawer } from "@/components/admin/drawer-provider";
import { IconPlus, IconEdit, IconCheck, IconTrash } from "@/components/icons";
import { CreateDrawer } from "./_components/create-drawer";
import { EditDrawer } from "./_components/edit-drawer";
import { DeleteConfirm } from "./_components/delete-confirm";

// ── Module-scope cell components (required by S6478 — no JSX inside parent) ──

function NameCell({ name }: Readonly<{ name: string }>) {
  return <strong>{name}</strong>;
}

function YearCell({ year }: Readonly<{ year: number }>) {
  return <span className="mono">{year}</span>;
}

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

// ── Action column factory (module scope — cell fn is not inside a React component) ─

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

// ── Static columns (at module scope so cell fns are not inside a React component)

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("nl-BE");
}

const STATIC_COLUMNS: ColumnDef<TournamentListItem>[] = [
  { key: "name",    header: "Naam",       cell: (t) => <NameCell   name={t.name}        /> },
  { key: "year",    header: "Jaar",       cell: (t) => <YearCell   year={t.year}         /> },
  { key: "status",  header: "Status",     cell: (t) => <StatusCell status={t.status}     /> },
  { key: "created", header: "Aangemaakt", cell: (t) => fmtDate(t.createdAt)                 },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminTournooisPage() {
  const { openDrawer } = useDrawer();
  const [tournaments, setTournaments] = useState<TournamentListItem[]>([]);
  const [loading, setLoading]         = useState(true);
  const [activating, setActivating]   = useState<number | null>(null);

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
      // Backend marks all others as COMPLETED — reflect that locally too
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

  const actionColumn = makeActionColumn(
    activating, handleActivate, openDrawer, handleSaved, handleDeleted,
  );

  const sorted = [...tournaments].sort((a, b) => b.year - a.year);

  return (
    <>
      <div
        className="admin-page-header"
        style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem" }}
      >
        <div>
          <h1>Toernooien</h1>
          <p>Beheer alle edities van het De Flosj petanquetoernooi.</p>
        </div>
        <button
          type="button"
          className="btn-sm btn-sm--primary"
          style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexShrink: 0, marginTop: "0.3rem" }}
          onClick={() => openDrawer(<CreateDrawer onSaved={handleSaved} />)}
        >
          <IconPlus /> Nieuw toernooi
        </button>
      </div>

      <DataTable
        title={`Alle toernooien (${loading ? "…" : tournaments.length})`}
        data={sorted}
        columns={[...STATIC_COLUMNS, actionColumn]}
        loading={loading}
        emptyText='Nog geen toernooien. Klik op "Nieuw toernooi" om te beginnen.'
      />
    </>
  );
}
