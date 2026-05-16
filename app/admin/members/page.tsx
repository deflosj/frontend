"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import { DataTable, type ColumnDef } from "@/components/admin/data-table";
import { TableToolbar } from "@/components/admin/table-toolbar";

// ── Types ─────────────────────────────────────────────────────────────────────

interface MemberProfile {
  id: number;
  firstName: string;
  lastName: string;
  phone: string | null;
  bio: string | null;
  joinedAt: string | null;
  isPublic: boolean;
}

// ── Cell components (module scope — required by S6478) ────────────────────────

function NameCell({ firstName, lastName }: Readonly<{ firstName: string; lastName: string }>) {
  return <strong>{firstName} {lastName}</strong> ;
}

function PhoneCell({ phone }: Readonly<{ phone: string | null }>) {
  return <>{phone ?? "—"}</>;
}

function JoinedCell({ joinedAt }: Readonly<{ joinedAt: string | null }>) {
  if (!joinedAt) return <>—</>;
  return <>{new Date(joinedAt).toLocaleDateString("nl-BE")}</>;
}

function VisibilityBadge({ isPublic }: Readonly<{ isPublic: boolean }>) {
  return isPublic ? (
    <span className="badge badge--green">Openbaar</span>
  ) : (
    <span className="badge badge--gray">Privé</span>
  );
}

// ── Columns ───────────────────────────────────────────────────────────────────

const COLUMNS: ColumnDef<MemberProfile>[] = [
  {
    key: "name",
    header: "Naam",
    sortable: true,
    sortValue: (m) => `${m.lastName} ${m.firstName}`,
    cell: (m) => <NameCell firstName={m.firstName} lastName={m.lastName} />,
  },
  {
    key: "phone",
    header: "Telefoon",
    cell: (m) => <PhoneCell phone={m.phone} />,
  },
  {
    key: "joinedAt",
    header: "Lid sinds",
    sortable: true,
    sortValue: (m) => m.joinedAt ?? "",
    cell: (m) => <JoinedCell joinedAt={m.joinedAt} />,
  },
  {
    key: "isPublic",
    header: "Zichtbaar",
    cell: (m) => <VisibilityBadge isPublic={m.isPublic} />,
  },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminMembersPage() {
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch]           = useState("");
  const [filterVisible, setFilterVisible] = useState("ALL");

  useEffect(() => {
    apiFetch<MemberProfile[]>("/members")
      .then(setMembers)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return members.filter((m) => {
      if (filterVisible === "PUBLIC" && !m.isPublic) return false;
      if (filterVisible === "PRIVATE" && m.isPublic) return false;
      if (q) {
        const name = `${m.firstName} ${m.lastName}`.toLowerCase();
        if (!name.includes(q)) return false;
      }
      return true;
    });
  }, [members, search, filterVisible]);

  return (
    <>
      <div className="admin-page-header">
        <h1>Leden</h1>
        <p>Overzicht van alle ledenprofielen</p>
      </div>

      <DataTable
        toolbar={
          <TableToolbar
            search={search}
            onSearch={setSearch}
            searchPlaceholder="Zoek op naam…"
            filters={[
              {
                key: "visible",
                label: "Zichtbaar",
                value: filterVisible,
                defaultValue: "ALL",
                options: [
                  { value: "ALL",     label: "Alle leden"  },
                  { value: "PUBLIC",  label: "Openbaar"    },
                  { value: "PRIVATE", label: "Privé"       },
                ],
                onChange: setFilterVisible,
              },
            ]}
            resultCount={filtered.length}
            totalCount={members.length}
          />
        }
        title={`Leden (${loading ? "…" : members.length})`}
        data={filtered}
        columns={COLUMNS}
        loading={loading}
        emptyText="Geen ledenprofielen gevonden."
      />
    </>
  );
}
