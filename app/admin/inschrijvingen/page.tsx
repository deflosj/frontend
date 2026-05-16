"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import type {
  RaceCategory,
  Registration,
  RegistrationSettings,
  RegistrationStatus,
} from "@/lib/registration-types";
import {
  RACE_CATEGORY_LABELS,
  REGISTRATION_STATUS_LABELS,
} from "@/lib/registration-types";
import { DataTable, type ColumnDef } from "@/components/admin/data-table";
import { TableToolbar, type ColumnDisplay } from "@/components/admin/table-toolbar";
import { useDrawer } from "@/components/admin/drawer-provider";
import { DetailDrawer } from "./_components/detail-drawer";
import { ApproveConfirm } from "./_components/approve-confirm";
import { RejectConfirm } from "./_components/reject-confirm";
import { DeleteConfirm } from "./_components/delete-confirm";
import { SettingsDrawer } from "./_components/settings-drawer";

// ── CSV export ────────────────────────────────────────────────────────────────

function exportCsv(rows: Registration[]) {
  const headers = [
    "ID", "Tijdstempel", "Voornaam", "Achternaam", "Geboortedatum",
    "Geslacht", "Adres", "Rijkregisternummer", "E-mail", "Telefoonnummer",
    "Wielerclub", "Wedstrijd", "Status",
  ];
  const escape = (v: string) => `"${v.replaceAll('"', '""')}"`;
  const lines = [
    headers.join(";"),
    ...rows.map((r) =>
      [
        r.id,
        new Date(r.timestamp).toLocaleString("nl-BE"),
        escape(r.firstName),
        escape(r.lastName),
        r.dateOfBirth,
        r.gender,
        escape(r.address),
        escape(r.nationalRegisterNumber),
        escape(r.email),
        escape(r.phone),
        escape(r.wielerclub ?? ""),
        RACE_CATEGORY_LABELS[r.raceCategory],
        REGISTRATION_STATUS_LABELS[r.status],
      ].join(";")
    ),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `inschrijvingen_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Stat helpers ──────────────────────────────────────────────────────────────

function LimitBar({ count, limit }: Readonly<{ count: number; limit: number | null }>) {
  if (limit === null) {
    return (
      <p className="admin-stat__value">
        {count} <span style={{ fontSize: "1rem", color: "var(--muted)" }}>/ ∞</span>
      </p>
    );
  }
  const pct = Math.min(100, Math.round((count / limit) * 100));
  let barColor = "var(--accent)";
  if (pct >= 100) barColor = "#c5221f";
  else if (pct >= 80) barColor = "#b37400";
  return (
    <>
      <p className="admin-stat__value">
        {count}{" "}
        <span style={{ fontSize: "1rem", color: "var(--muted)" }}>/ {limit}</span>
      </p>
      <div style={{ marginTop: "0.5rem", height: "4px", borderRadius: 99, background: "var(--border)" }}>
        <div style={{ height: "100%", width: `${pct}%`, borderRadius: 99, background: barColor, transition: "width 300ms" }} />
      </div>
    </>
  );
}

// ── Cell components (module scope — required by S6478) ────────────────────────

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("nl-BE");
}

function StatusBadge({ status }: Readonly<{ status: RegistrationStatus }>) {
  if (status === "APPROVED") return <span className="badge badge--green">Goedgekeurd</span>;
  if (status === "REJECTED") return <span className="badge badge--red">Afgekeurd</span>;
  return <span className="badge badge--yellow">In afwachting</span>;
}

function CategoryBadge({ category }: Readonly<{ category: RaceCategory }>) {
  return (
    <span className={`badge ${category === "DORPELINGENKOERS" ? "badge--pink" : "badge--blue"}`}>
      {RACE_CATEGORY_LABELS[category]}
    </span>
  );
}

function TimestampCell({ timestamp }: Readonly<{ timestamp: string }>) {
  return <span className="mono">{fmt(timestamp)}</span>;
}

function NameCell({ firstName, lastName }: Readonly<{ firstName: string; lastName: string }>) {
  return <strong>{firstName} {lastName}</strong>;
}

function DobCell({ dateOfBirth }: Readonly<{ dateOfBirth: string }>) {
  return <span className="mono">{fmt(dateOfBirth)}</span>;
}

function EmailCell({ email }: Readonly<{ email: string }>) {
  return (
    <a href={`mailto:${email}`} style={{ color: "var(--accent)" }}>
      {email}
    </a>
  );
}

interface ActionCellProps {
  registration: Registration;
  onView: () => void;
  onApprove: () => void;
  onReject: () => void;
  onDelete: () => void;
}

function ActionCell({
  registration: r,
  onView,
  onApprove,
  onReject,
  onDelete,
}: Readonly<ActionCellProps>) {
  return (
    <div className="row-actions">
      <button type="button" className="btn-sm btn-sm--ghost" onClick={onView}>
        Bekijken
      </button>
      {r.status === "PENDING" && (
        <>
          <button type="button" className="btn-sm btn-sm--success" onClick={onApprove}>
            Goedkeuren
          </button>
          <button type="button" className="btn-sm btn-sm--danger" onClick={onReject}>
            Afwijzen
          </button>
        </>
      )}
      <button type="button" className="btn-sm btn-sm--danger" onClick={onDelete}>
        Verwijderen
      </button>
    </div>
  );
}

// ── Column definitions ────────────────────────────────────────────────────────

const ALL_COLUMN_KEYS = [
  "timestamp", "name", "dob", "gender", "email", "phone", "category", "status",
] as const;

type AllColumnKey = typeof ALL_COLUMN_KEYS[number];

const COLUMN_LABELS: Record<AllColumnKey, string> = {
  timestamp: "Tijdstempel",
  name:      "Naam",
  dob:       "Geboortedatum",
  gender:    "Geslacht",
  email:     "E-mail",
  phone:     "Telefoon",
  category:  "Wedstrijd",
  status:    "Status",
};

const STATIC_COLUMNS: ColumnDef<Registration>[] = [
  {
    key: "timestamp",
    header: COLUMN_LABELS.timestamp,
    sortable: true,
    sortValue: (r) => r.timestamp,
    cell: (r) => <TimestampCell timestamp={r.timestamp} />,
  },
  {
    key: "name",
    header: COLUMN_LABELS.name,
    sortable: true,
    sortValue: (r) => `${r.lastName} ${r.firstName}`,
    cell: (r) => <NameCell firstName={r.firstName} lastName={r.lastName} />,
  },
  {
    key: "dob",
    header: COLUMN_LABELS.dob,
    sortable: true,
    sortValue: (r) => r.dateOfBirth,
    cell: (r) => <DobCell dateOfBirth={r.dateOfBirth} />,
  },
  {
    key: "gender",
    header: COLUMN_LABELS.gender,
    cell: (r) => r.gender,
  },
  {
    key: "email",
    header: COLUMN_LABELS.email,
    cell: (r) => <EmailCell email={r.email} />,
  },
  {
    key: "phone",
    header: COLUMN_LABELS.phone,
    cell: (r) => r.phone,
  },
  {
    key: "category",
    header: COLUMN_LABELS.category,
    cell: (r) => <CategoryBadge category={r.raceCategory} />,
  },
  {
    key: "status",
    header: COLUMN_LABELS.status,
    cell: (r) => <StatusBadge status={r.status} />,
  },
];

function makeActionColumn(
  openDrawer: (content: React.ReactNode) => void,
  onUpdated: (r: Registration) => void,
  onDeleted: (id: number) => void,
): ColumnDef<Registration> {
  return {
    key: "actions",
    header: "",
    cell: (r) => (
      <ActionCell
        registration={r}
        onView={() => openDrawer(<DetailDrawer registration={r} />)}
        onApprove={() => openDrawer(<ApproveConfirm registration={r} onUpdated={onUpdated} />)}
        onReject={() => openDrawer(<RejectConfirm registration={r} onUpdated={onUpdated} />)}
        onDelete={() => openDrawer(<DeleteConfirm registration={r} onDeleted={onDeleted} />)}
      />
    ),
  };
}

// ── Page ──────────────────────────────────────────────────────────────────────

const DEFAULT_SETTINGS: RegistrationSettings = {
  isOpen: true,
  dorpelingenkoersLimit: null,
  funWedstrijdLimit: null,
};

export default function InschrijvingenPage() {
  const { openDrawer } = useDrawer();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [settings, setSettings] = useState<RegistrationSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  const [search, setSearch]               = useState("");
  const [filterCategory, setFilterCategory] = useState<RaceCategory | "ALL">("ALL");
  const [filterStatus, setFilterStatus]     = useState<RegistrationStatus | "ALL">("ALL");
  const [visibleKeys, setVisibleKeys] = useState(() => new Set<string>(ALL_COLUMN_KEYS));

  // ── Fetch ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    Promise.allSettled([
      apiFetch<Registration[]>("/registrations"),
      apiFetch<RegistrationSettings>("/registrations/settings"),
    ]).then(([regs, s]) => {
      if (regs.status === "fulfilled") setRegistrations(regs.value);
      else setFetchError(regs.reason instanceof Error ? regs.reason.message : "Laden mislukt.");
      if (s.status === "fulfilled") setSettings(s.value);
      setLoading(false);
    });
  }, []);

  // ── Stats ──────────────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const total     = registrations.length;
    const approved  = registrations.filter((r) => r.status === "APPROVED").length;
    const pending   = registrations.filter((r) => r.status === "PENDING").length;
    const rejected  = registrations.filter((r) => r.status === "REJECTED").length;
    const dorpCount = registrations.filter((r) => r.raceCategory === "DORPELINGENKOERS").length;
    const funCount  = registrations.filter((r) => r.raceCategory === "FUN_WEDSTRIJD").length;
    return { total, approved, pending, rejected, dorpCount, funCount };
  }, [registrations]);

  // ── Filtered data ──────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return registrations.filter((r) => {
      if (filterCategory !== "ALL" && r.raceCategory !== filterCategory) return false;
      if (filterStatus !== "ALL" && r.status !== filterStatus) return false;
      if (q) {
        const fullName = `${r.firstName} ${r.lastName}`.toLowerCase();
        if (!fullName.includes(q) && !r.email.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [registrations, filterCategory, filterStatus, search]);

  // ── Callbacks ──────────────────────────────────────────────────────────────

  const handleUpdated = useCallback((updated: Registration) => {
    setRegistrations((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  }, []);

  const handleDeleted = useCallback((id: number) => {
    setRegistrations((prev) => prev.filter((r) => r.id !== id));
  }, []);

  function toggleColumn(key: string) {
    setVisibleKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  // ── Compose columns ────────────────────────────────────────────────────────

  const actionColumn = makeActionColumn(openDrawer, handleUpdated, handleDeleted);
  const columns = [
    ...STATIC_COLUMNS.filter((c) => visibleKeys.has(c.key)),
    actionColumn,
  ];

  const columnDisplay: ColumnDisplay[] = [
    ...ALL_COLUMN_KEYS.map((k) => ({
      key: k,
      label: COLUMN_LABELS[k],
      visible: visibleKeys.has(k),
    })),
    { key: "actions", label: "Acties", visible: true, fixed: true },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="admin-page-header">
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem" }}>
          <div>
            <h1>Inschrijvingen</h1>
            <p>Beheer inschrijvingen voor de dorpelingenkoers en fun wedstrijd.</p>
          </div>
        </div>

        {fetchError && (
          <div
            style={{
              marginTop: "1rem",
              padding: "0.65rem 1rem",
              borderRadius: "10px",
              background: "#fdecea",
              color: "#c5221f",
              fontSize: "0.875rem",
              fontWeight: 500,
            }}
          >
            Kon inschrijvingen niet laden: <strong>{fetchError}</strong>
          </div>
        )}

        {!settings.isOpen && (
          <div
            style={{
              marginTop: "1rem",
              padding: "0.65rem 1rem",
              borderRadius: "10px",
              background: "#fff3cc",
              color: "#7a4d00",
              fontSize: "0.875rem",
              fontWeight: 500,
            }}
          >
            Inschrijvingen zijn momenteel <strong>gesloten</strong>. Nieuwe aanmeldingen worden geweigerd.
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="admin-stats" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
        <div className="admin-stat">
          <p className="admin-stat__label">Totaal</p>
          <p className="admin-stat__value">{stats.total}</p>
        </div>
        <div className="admin-stat">
          <p className="admin-stat__label">Goedgekeurd</p>
          <p className="admin-stat__value" style={{ color: "#1e7e34" }}>{stats.approved}</p>
        </div>
        <div className="admin-stat">
          <p className="admin-stat__label">In afwachting</p>
          <p className="admin-stat__value" style={{ color: "#7a4d00" }}>{stats.pending}</p>
        </div>
        <div className="admin-stat">
          <p className="admin-stat__label">Afgekeurd</p>
          <p className="admin-stat__value" style={{ color: "#c5221f" }}>{stats.rejected}</p>
        </div>
        <div className="admin-stat">
          <p className="admin-stat__label">Dorpelingenkoers</p>
          <LimitBar count={stats.dorpCount} limit={settings.dorpelingenkoersLimit} />
        </div>
        <div className="admin-stat">
          <p className="admin-stat__label">Fun wedstrijd</p>
          <LimitBar count={stats.funCount} limit={settings.funWedstrijdLimit} />
        </div>
      </div>

      {/* Table with toolbar */}
      <DataTable
        toolbar={
          <TableToolbar
            search={search}
            onSearch={setSearch}
            searchPlaceholder="Zoek op naam of e-mail…"
            filters={[
              {
                key: "category",
                label: "Wedstrijd",
                value: filterCategory,
                defaultValue: "ALL",
                options: [
                  { value: "ALL", label: "Alle wedstrijden" },
                  { value: "DORPELINGENKOERS", label: "Dorpelingenkoers" },
                  { value: "FUN_WEDSTRIJD", label: "Fun wedstrijd" },
                ],
                onChange: (v) => setFilterCategory(v as RaceCategory | "ALL"),
              },
              {
                key: "status",
                label: "Status",
                value: filterStatus,
                defaultValue: "ALL",
                options: [
                  { value: "ALL", label: "Alle statussen" },
                  { value: "PENDING", label: "In afwachting" },
                  { value: "APPROVED", label: "Goedgekeurd" },
                  { value: "REJECTED", label: "Afgekeurd" },
                ],
                onChange: (v) => setFilterStatus(v as RegistrationStatus | "ALL"),
              },
            ]}
            columns={columnDisplay}
            onColumnToggle={toggleColumn}
            resultCount={filtered.length}
            totalCount={registrations.length}
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
                key: "settings",
                label: "Instellingen",
                separator: true,
                icon: (
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.4" />
                    <path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M2.9 2.9l1.1 1.1M12 12l1.1 1.1M13.1 2.9L12 4M4 12l-1.1 1.1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                  </svg>
                ),
                onClick: () => openDrawer(<SettingsDrawer settings={settings} onSaved={setSettings} />),
              },
              {
                key: "help",
                label: "Help & documentatie",
                icon: (
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.4" />
                    <path d="M6.5 6a1.5 1.5 0 0 1 3 0c0 1-1.5 1.5-1.5 2.5M8 11.5v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                  </svg>
                ),
                onClick: () => window.open("https://deflosj.be/admin/help", "_blank", "noopener,noreferrer"),
              },
            ]}
          />
        }
        title="Inschrijvingen"
        data={filtered}
        columns={columns}
        loading={loading}
        emptyText="Geen inschrijvingen gevonden."
      />
    </>
  );
}
