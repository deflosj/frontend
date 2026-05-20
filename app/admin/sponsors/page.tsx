"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import { DataTable, type ColumnDef } from "@/components/admin/data-table";
import { TableToolbar } from "@/components/admin/table-toolbar";
import { useDrawer } from "@/components/admin/drawer-provider";
import { SponsorDrawer, type Sponsor } from "../../../components/admin/sponsors/sponsor-drawer";

// ── Constants ──────────────────────────────────────────────────────────────────

const TIER_LABELS: Record<string, string> = { MAIN: "Hoofdsponsor", GOLD: "Goud", STANDARD: "Standaard" };
const TIER_BADGE: Record<string, string> = { MAIN: "pink", GOLD: "yellow", STANDARD: "gray" };

// ── Cell components (module scope — required by S6478) ────────────────────────

function NameCell({ name }: Readonly<{ name: string }>) {
  return <strong>{name}</strong>;
}

function TierBadge({ tier }: Readonly<{ tier: string }>) {
  return (
    <span className={`badge badge--${TIER_BADGE[tier] ?? "gray"}`}>
      {TIER_LABELS[tier] ?? tier}
    </span>
  );
}

function WebsiteCell({ url }: Readonly<{ url: string | null }>) {
  if (!url) return <>—</>;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent-strong)" }}>
      {url.replace(/^https?:\/\//, "")}
    </a>
  );
}

function SortOrderCell({ order }: Readonly<{ order: number }>) {
  return <span className="mono">{order}</span>;
}

function ActiveBadge({ isActive }: Readonly<{ isActive: boolean }>) {
  return isActive ? (
    <span className="badge badge--green">Actief</span>
  ) : (
    <span className="badge badge--gray">Inactief</span>
  );
}

function EditButton({ onClick }: Readonly<{ onClick: () => void }>) {
  return (
    <button type="button" className="btn-sm btn-sm--ghost" onClick={onClick}>
      Bewerken
    </button>
  );
}

// ── Column factory ────────────────────────────────────────────────────────────

function makeColumns(onEdit: (s: Sponsor) => void): ColumnDef<Sponsor>[] {
  return [
    {
      key: "name",
      header: "Naam",
      sortable: true,
      sortValue: (s) => s.name,
      cell: (s) => <NameCell name={s.name} />,
    },
    {
      key: "tier",
      header: "Niveau",
      sortable: true,
      sortValue: (s) => s.tier,
      cell: (s) => <TierBadge tier={s.tier} />,
    },
    {
      key: "websiteUrl",
      header: "Website",
      cell: (s) => <WebsiteCell url={s.websiteUrl} />,
    },
    {
      key: "sortOrder",
      header: "Volgorde",
      sortable: true,
      sortValue: (s) => s.sortOrder,
      cell: (s) => <SortOrderCell order={s.sortOrder} />,
    },
    {
      key: "status",
      header: "Status",
      cell: (s) => <ActiveBadge isActive={s.isActive} />,
    },
    {
      key: "actions",
      header: "Acties",
      cell: (s) => <EditButton onClick={() => onEdit(s)} />,
    },
  ];
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminSponsorsPage() {
  const { openDrawer } = useDrawer();
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterTier, setFilterTier] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");

  async function load() {
    try {
      setSponsors(await apiFetch<Sponsor[]>("content/sponsors"));
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
    return sponsors.filter((s) => {
      if (filterTier !== "ALL" && s.tier !== filterTier) return false;
      if (filterStatus === "ACTIVE" && !s.isActive) return false;
      if (filterStatus === "INACTIVE" && s.isActive) return false;
      if (q && !s.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [sponsors, search, filterTier, filterStatus]);

  const columns = makeColumns((s) => openDrawer(<SponsorDrawer editing={s} onSaved={handleSaved} />));

  return (
    <>
      <div className="admin-page-header">
        <h1>Sponsors</h1>
        <p>Beheer sponsoren en partners</p>
      </div>

      <DataTable
        toolbar={
          <TableToolbar
            search={search}
            onSearch={setSearch}
            searchPlaceholder="Zoek op naam…"
            filters={[
              {
                key: "tier",
                label: "Niveau",
                value: filterTier,
                defaultValue: "ALL",
                options: [
                  { value: "ALL",      label: "Alle niveaus"  },
                  { value: "MAIN",     label: "Hoofdsponsor"  },
                  { value: "GOLD",     label: "Goud"          },
                  { value: "STANDARD", label: "Standaard"     },
                ],
                onChange: setFilterTier,
              },
              {
                key: "status",
                label: "Status",
                value: filterStatus,
                defaultValue: "ALL",
                options: [
                  { value: "ALL",      label: "Alle statussen" },
                  { value: "ACTIVE",   label: "Actief"         },
                  { value: "INACTIVE", label: "Inactief"       },
                ],
                onChange: setFilterStatus,
              },
            ]}
            onAdd={() => openDrawer(<SponsorDrawer editing={null} onSaved={handleSaved} />)}
            addLabel="Nieuwe sponsor"
            resultCount={filtered.length}
            totalCount={sponsors.length}
          />
        }
        title={`Sponsors (${loading ? "…" : sponsors.length})`}
        data={filtered}
        columns={columns}
        loading={loading}
        emptyText="Nog geen sponsors aangemaakt."
      />
    </>
  );
}
