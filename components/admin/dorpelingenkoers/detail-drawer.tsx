"use client";

import { useState } from "react";
import { Sheet, SheetContent } from "@/components/admin/sheet";
import { useDrawer } from "@/components/admin/drawer-provider";
import type { Registration } from "@/lib/registration-types";
import { RACE_CATEGORY_LABELS, REGISTRATION_STATUS_LABELS } from "@/lib/registration-types";

// ── Row ───────────────────────────────────────────────────────────────────────

function Row({ label, value }: Readonly<{ label: string; value: React.ReactNode }>) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "10rem 1fr", gap: "0.5rem", padding: "0.6rem 0", borderBottom: "1px solid var(--border)" }}>
      <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--ink-2)", textTransform: "uppercase", letterSpacing: "0.08em", paddingTop: "0.1rem" }}>
        {label}
      </span>
      <span style={{ fontSize: "0.875rem", color: "var(--text)", wordBreak: "break-word" }}>
        {value}
      </span>
    </div>
  );
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("nl-BE");
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString("nl-BE", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  registration: Registration;
}

export function DetailDrawer({ registration: r }: Readonly<Props>) {
  const { closeDrawer } = useDrawer();
  const [open, setOpen] = useState(true);

  function close() {
    setOpen(false);
    closeDrawer();
  }

  const statusColors: Record<string, string> = {
    PENDING:  "#7a4d00",
    APPROVED: "#1e7e34",
    REJECTED: "#c5221f",
  };
  const statusBg: Record<string, string> = {
    PENDING:  "#fff3cc",
    APPROVED: "#e6f4ea",
    REJECTED: "#fce8e6",
  };

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) close(); }}>
      <SheetContent title={`${r.firstName} ${r.lastName}`} description="Volledige inschrijvingsgegevens" width="min(560px, 100vw)">
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

          {/* Status badge */}
          <span style={{
            display: "inline-flex", alignSelf: "flex-start",
            padding: "0.25rem 0.75rem", borderRadius: 999,
            fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
            background: statusBg[r.status], color: statusColors[r.status],
          }}>
            {REGISTRATION_STATUS_LABELS[r.status]}
          </span>

          {/* Wedstrijd */}
          <div>
            <p style={{ fontSize: "0.63rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--ink-2)", marginBottom: "0.75rem" }}>
              Wedstrijd
            </p>
            <Row label="Type" value={RACE_CATEGORY_LABELS[r.raceCategory]} />
            <Row label="Tijdstempel" value={fmtDateTime(r.timestamp)} />
          </div>

          {/* Persoonsgegevens */}
          <div>
            <p style={{ fontSize: "0.63rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--ink-2)", marginBottom: "0.75rem" }}>
              Persoonsgegevens
            </p>
            <Row label="Voornaam" value={r.firstName} />
            <Row label="Achternaam" value={r.lastName} />
            <Row label="Geboortedatum" value={fmtDate(r.dateOfBirth)} />
            <Row label="Geslacht" value={r.gender === "M" ? "Man" : r.gender === "V" ? "Vrouw" : "X"} />
          </div>

          {/* Contact */}
          <div>
            <p style={{ fontSize: "0.63rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--ink-2)", marginBottom: "0.75rem" }}>
              Contact &amp; adres
            </p>
            <Row label="Adres" value={r.address} />
            <Row label="E-mail" value={<a href={`mailto:${r.email}`} style={{ color: "var(--accent)", textDecoration: "underline" }}>{r.email}</a>} />
            <Row label="Telefoon" value={r.phone} />
          </div>

          {/* Overige */}
          <div>
            <p style={{ fontSize: "0.63rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--ink-2)", marginBottom: "0.75rem" }}>
              Overige
            </p>
            <Row label="Rijksregisternr." value={r.nationalRegisterNumber} />
            <Row label="Wielerclub" value={r.wielerclub ?? "—"} />
          </div>

        </div>

        <div className="admin-drawer__actions" style={{ marginTop: "2rem" }}>
          <button type="button" className="btn-sm btn-sm--ghost" onClick={close}>Sluiten</button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
