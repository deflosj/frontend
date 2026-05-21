"use client";

import { useState } from "react";
import { Sheet, SheetContent } from "@/components/admin/sheet";
import { useDrawer } from "@/components/admin/drawer-provider";
import { ApproveConfirm } from "@/components/admin/dorpelingenkoers/approve-confirm";
import { RejectConfirm } from "@/components/admin/dorpelingenkoers/reject-confirm";
import { DeleteConfirm } from "@/components/admin/dorpelingenkoers/delete-confirm";
import { ChangeCategoryConfirm } from "@/components/admin/dorpelingenkoers/change-category-confirm";
import { Button } from "@/components/ui/button";
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
  onUpdated: (registration: Registration) => void;
  onDeleted: (id: number) => void;
}

export function DetailDrawer({ registration: initialRegistration, onUpdated, onDeleted }: Readonly<Props>) {
  const { openDrawer, closeDrawer } = useDrawer();
  const [open, setOpen] = useState(true);
  const [registration, setRegistration] = useState(initialRegistration);

  function close() {
    setOpen(false);
    closeDrawer();
  }

  function handleUpdated(updated: Registration) {
    setRegistration(updated);
    onUpdated(updated);
  }

  function handleDeleted(id: number) {
    onDeleted(id);
    close();
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

  const targetCategory: Registration["raceCategory"] =
    registration.raceCategory === "DORPELINGENKOERS" ? "FUN_WEDSTRIJD" : "DORPELINGENKOERS";
  let genderLabel = "X";
  if (registration.gender === "M") {
    genderLabel = "Man";
  } else if (registration.gender === "V") {
    genderLabel = "Vrouw";
  }

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) close(); }}>
      <SheetContent title={`${registration.firstName} ${registration.lastName}`} description="Volledige inschrijvingsgegevens" width="min(560px, 100vw)">
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

          {/* Status badge */}
          <span style={{
            display: "inline-flex", alignSelf: "flex-start",
            padding: "0.25rem 0.75rem", borderRadius: 999,
            fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
            background: statusBg[registration.status], color: statusColors[registration.status],
          }}>
            {REGISTRATION_STATUS_LABELS[registration.status]}
          </span>

          {/* Wedstrijd */}
          <div>
            <p style={{ fontSize: "0.63rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--ink-2)", marginBottom: "0.75rem" }}>
              Wedstrijd
            </p>
            <Row label="Type" value={RACE_CATEGORY_LABELS[registration.raceCategory]} />
            <Row label="Tijdstempel" value={fmtDateTime(registration.timestamp)} />
          </div>

          {/* Persoonsgegevens */}
          <div>
            <p style={{ fontSize: "0.63rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--ink-2)", marginBottom: "0.75rem" }}>
              Persoonsgegevens
            </p>
            <Row label="Voornaam" value={registration.firstName} />
            <Row label="Achternaam" value={registration.lastName} />
            <Row label="Geboortedatum" value={fmtDate(registration.dateOfBirth)} />
            <Row label="Geslacht" value={genderLabel} />
          </div>

          {/* Contact */}
          <div>
            <p style={{ fontSize: "0.63rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--ink-2)", marginBottom: "0.75rem" }}>
              Contact &amp; adres
            </p>
            <Row label="Adres" value={registration.address} />
            <Row label="E-mail" value={<a href={`mailto:${registration.email}`} style={{ color: "var(--accent)", textDecoration: "underline" }}>{registration.email}</a>} />
            <Row label="Telefoon" value={registration.phone} />
          </div>

          {/* Overige */}
          <div>
            <p style={{ fontSize: "0.63rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--ink-2)", marginBottom: "0.75rem" }}>
              Overige
            </p>
            <Row label="Rijksregisternr." value={registration.nationalRegisterNumber} />
            <Row label="Wielerclub" value={registration.wielerclub ?? "—"} />
          </div>

        </div>

        <div className="flex w-full mt-8 gap-3">
          {registration.status === "PENDING" && (
            <>
              <Button
                className="btn-sm btn-sm--success"
                onClick={() => openDrawer(<ApproveConfirm registration={registration} onUpdated={handleUpdated} />)}
              >
                Goedkeuren
              </Button>
              <Button
                className="btn-sm btn-sm--danger"
                onClick={() => openDrawer(<RejectConfirm registration={registration} onUpdated={handleUpdated} />)}
              >
                Afwijzen
              </Button>
            </>
          )}
          <Button
            className="btn-sm btn-sm--ghost"
            onClick={() =>
              openDrawer(
                <ChangeCategoryConfirm
                  registration={registration}
                  targetCategory={targetCategory}
                  onUpdated={handleUpdated}
                />,
              )
            }
          >
            {registration.raceCategory === "DORPELINGENKOERS" ? "Naar fun wedstrijd" : "Naar dorpelingenkoers"}
          </Button>
          <Button
            className="btn-sm btn-sm--danger"
            onClick={() => openDrawer(<DeleteConfirm registration={registration} onDeleted={handleDeleted} />)}
          >
            Verwijderen
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
