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
import { DataTable } from "@/components/admin/data-table";
import { TableToolbar } from "@/components/admin/table-toolbar";
import { useDrawer } from "@/components/admin/drawer-provider";
import { SettingsDrawer } from "@/components/admin/dorpelingenkoers/settings-drawer";
import {
  ALL_COLUMN_KEYS,
  COLUMN_LABELS,
  STATIC_COLUMNS,
  makeActionColumn,
} from "./columns";
import { useColumnPrefs, type ColSpec } from "@/hooks/use-column-prefs";
import { usePageSize } from "@/hooks/use-page-size";

const COL_SPECS: ColSpec[] = [
  ...ALL_COLUMN_KEYS.map((k) => ({ key: k, label: COLUMN_LABELS[k] })),
  { key: "actions", label: "Acties", fixed: true },
];

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
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// ── Stat helpers ──────────────────────────────────────────────────────────────

function LimitBar({ count, limit }: Readonly<{ count: number; limit: number | null }>) {
  if (limit === null) {
    return (
      <p className="admin-stat__value">
        {count} <span style={{ fontSize: "1rem", color: "var(--ink-2)" }}>/ ∞</span>
      </p>
    );
  }
  const pct = Math.min(100, Math.round((count / limit) * 100));
  let barColor = "var(--accent)";
  if (pct >= 100) barColor = "var(--red)";
  else if (pct >= 80) barColor = "var(--orange)";
  return (
    <>
      <p className="admin-stat__value">
        {count}{" "}
        <span style={{ fontSize: "1rem", color: "var(--ink2)" }}>/ {limit}</span>
      </p>
      <div style={{ marginTop: "0.5rem", height: "4px", borderRadius: 99, background: "var(--border)" }}>
        <div style={{ height: "100%", width: `${pct}%`, borderRadius: 99, background: barColor, transition: "width 300ms" }} />
      </div>
    </>
  );
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
  const { columnDisplay, visibleKeys, toggle } = useColumnPrefs("inschrijvingen", COL_SPECS);
  const [pageSize, savePageSize] = usePageSize("inschrijvingen");

  // ── Fetch ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    Promise.allSettled([
      apiFetch<Registration[]>("registrations"),
      apiFetch<RegistrationSettings>("registrations/settings"),
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

  const handleSaved = useCallback((updated: Registration) => {
    setRegistrations((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  }, []);

  const handleDeleted = useCallback((id: number) => {
    setRegistrations((prev) => prev.filter((r) => r.id !== id));
  }, []);

  // ── Compose columns ────────────────────────────────────────────────────────

  const actionColumn = makeActionColumn(openDrawer, handleSaved, handleDeleted);
  const columns = [
    ...STATIC_COLUMNS.filter((c) => visibleKeys.has(c.key)),
    actionColumn,
  ];

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="admin-page-header">
        <div className="flex flex-wrap items-start justify-between gap-4">
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="admin-stat">
          <p className="admin-stat__label">Totaal</p>
          <p className="admin-stat__value">{stats.total}</p>
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
            onColumnToggle={toggle}
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
            ]}
          />
        }
        data={filtered}
        columns={columns}
        loading={loading}
        defaultPageSize={pageSize}
        onPageSizeChange={savePageSize}
        emptyText="Geen inschrijvingen gevonden."
      />
    </>
  );
}
