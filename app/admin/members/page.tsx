"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import { DataTable, type ColumnDef } from "@/components/admin/data-table";
import { TableToolbar } from "@/components/admin/table-toolbar";

// ── Types ─────────────────────────────────────────────────────────────────────

type UserRole = "MEMBER" | "CAPTAIN" | "REFEREE" | "ADMIN" | "SUPERADMIN";

interface AdminUser {
  id: number;
  email: string;
  username: string;
  role: UserRole;
  avatarUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const ROLE_LABELS: Record<UserRole, string> = {
  MEMBER: "Lid",
  CAPTAIN: "Kapitein",
  REFEREE: "Scheidsrechter",
  ADMIN: "Beheerder",
  SUPERADMIN: "Hoofdbeheerder",
};

// ── Cell components (module scope — required by S6478) ────────────────────────

function UsernameCell({ username }: Readonly<{ username: string }>) {
  return <strong>{username}</strong>;
}

function EmailCell({ email }: Readonly<{ email: string }>) {
  return <>{email}</>;
}

function RoleBadge({ role }: Readonly<{ role: UserRole }>) {
  if (role === "SUPERADMIN") return <span className="badge badge--red">{ROLE_LABELS[role]}</span>;
  if (role === "ADMIN") return <span className="badge badge--yellow">{ROLE_LABELS[role]}</span>;
  if (role === "REFEREE") return <span className="badge badge--blue">{ROLE_LABELS[role]}</span>;
  if (role === "CAPTAIN") return <span className="badge badge--pink">{ROLE_LABELS[role]}</span>;
  return <span className="badge badge--gray">{ROLE_LABELS[role]}</span>;
}

function ActiveBadge({ isActive }: Readonly<{ isActive: boolean }>) {
  return isActive ? (
    <span className="badge badge--green">Actief</span>
  ) : (
    <span className="badge badge--gray">Inactief</span>
  );
}

function DateCell({ iso }: Readonly<{ iso: string }>) {
  return <>{new Date(iso).toLocaleDateString("nl-BE")}</>;
}

// ── Columns ───────────────────────────────────────────────────────────────────

const COLUMNS: ColumnDef<AdminUser>[] = [
  {
    key: "username",
    header: "Gebruiker",
    sortable: true,
    sortValue: (u) => u.username.toLowerCase(),
    cell: (u) => <UsernameCell username={u.username} />,
  },
  {
    key: "email",
    header: "E-mail",
    sortable: true,
    sortValue: (u) => u.email.toLowerCase(),
    cell: (u) => <EmailCell email={u.email} />,
  },
  {
    key: "role",
    header: "Rol",
    sortable: true,
    sortValue: (u) => u.role,
    cell: (u) => <RoleBadge role={u.role} />,
  },
  {
    key: "isActive",
    header: "Status",
    sortable: true,
    sortValue: (u) => (u.isActive ? 1 : 0),
    cell: (u) => <ActiveBadge isActive={u.isActive} />,
  },
  {
    key: "createdAt",
    header: "Aangemaakt",
    sortable: true,
    sortValue: (u) => u.createdAt,
    cell: (u) => <DateCell iso={u.createdAt} />,
  },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminMembersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");

  useEffect(() => {
    apiFetch<AdminUser[]>("members/all")
      .then(setUsers)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return users.filter((u) => {
      if (filterRole !== "ALL" && u.role !== filterRole) return false;
      if (filterStatus === "ACTIVE" && !u.isActive) return false;
      if (filterStatus === "INACTIVE" && u.isActive) return false;
      if (q) {
        const inUsername = u.username.toLowerCase().includes(q);
        const inEmail = u.email.toLowerCase().includes(q);
        if (!inUsername && !inEmail) return false;
      }
      return true;
    });
  }, [users, search, filterRole, filterStatus]);

  return (
    <>
      <div className="admin-page-header">
        <h1>Leden</h1>
        <p>Overzicht van alle gebruikersaccounts</p>
      </div>

      <DataTable
        toolbar={
          <TableToolbar
            search={search}
            onSearch={setSearch}
            searchPlaceholder="Zoek op gebruikersnaam of e-mail…"
            filters={[
              {
                key: "role",
                label: "Rol",
                value: filterRole,
                defaultValue: "ALL",
                options: [
                  { value: "ALL", label: "Alle rollen" },
                  { value: "MEMBER", label: ROLE_LABELS.MEMBER },
                  { value: "CAPTAIN", label: ROLE_LABELS.CAPTAIN },
                  { value: "REFEREE", label: ROLE_LABELS.REFEREE },
                  { value: "ADMIN", label: ROLE_LABELS.ADMIN },
                  { value: "SUPERADMIN", label: ROLE_LABELS.SUPERADMIN },
                ],
                onChange: setFilterRole,
              },
              {
                key: "status",
                label: "Status",
                value: filterStatus,
                defaultValue: "ALL",
                options: [
                  { value: "ALL", label: "Alle statussen" },
                  { value: "ACTIVE", label: "Actief" },
                  { value: "INACTIVE", label: "Inactief" },
                ],
                onChange: setFilterStatus,
              },
            ]}
            resultCount={filtered.length}
            totalCount={users.length}
          />
        }
        title={`Leden (${loading ? "…" : users.length})`}
        data={filtered}
        columns={COLUMNS}
        loading={loading}
        emptyText="Geen gebruikers gevonden."
      />
    </>
  );
}
