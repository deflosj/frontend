"use client";

import type {
  RaceCategory,
  Registration,
  RegistrationStatus,
} from "@/lib/registration-types";
import { RACE_CATEGORY_LABELS } from "@/lib/registration-types";
import { type ColumnDef } from "@/components/admin/data-table";
import { DetailDrawer } from "@/components/admin/dorpelingenkoers/detail-drawer";
import { ApproveConfirm } from "@/components/admin/dorpelingenkoers/approve-confirm";
import { RejectConfirm } from "@/components/admin/dorpelingenkoers/reject-confirm";
import { DeleteConfirm } from "@/components/admin/dorpelingenkoers/delete-confirm";
import { Button } from "@/components/ui/button";

// ── Cell components (module scope — required by S6478) ────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("nl-BE");
}

export function StatusBadge({ status }: Readonly<{ status: RegistrationStatus }>) {
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
  return <span className="mono">{fmtDate(timestamp)}</span>;
}

function NameCell({ firstName, lastName }: Readonly<{ firstName: string; lastName: string }>) {
  return <strong>{firstName} {lastName}</strong>;
}

function DobCell({ dateOfBirth }: Readonly<{ dateOfBirth: string }>) {
  return <span className="mono">{fmtDate(dateOfBirth)}</span>;
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
      <Button className="btn-sm btn-sm--ghost" onClick={onView}>
        Bekijken
      </Button>
      {r.status === "PENDING" && (
        <>
          <Button className="btn-sm btn-sm--success" onClick={onApprove}>
            Goedkeuren
          </Button>
          <Button className="btn-sm btn-sm--danger" onClick={onReject}>
            Afwijzen
          </Button>
        </>
      )}
      <Button className="btn-sm btn-sm--danger" onClick={onDelete}>
        Verwijderen
      </Button>
    </div>
  );
}

// ── Column definitions ────────────────────────────────────────────────────────

export const ALL_COLUMN_KEYS = [
  "timestamp", "name", "dob", "gender", "email", "phone", "category", "status",
] as const;

export type AllColumnKey = typeof ALL_COLUMN_KEYS[number];

export const COLUMN_LABELS: Record<AllColumnKey, string> = {
  timestamp: "Tijdstempel",
  name:      "Naam",
  dob:       "Geboortedatum",
  gender:    "Geslacht",
  email:     "E-mail",
  phone:     "Telefoon",
  category:  "Wedstrijd",
  status:    "Status",
};

export const STATIC_COLUMNS: ColumnDef<Registration>[] = [
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

export function makeActionColumn(
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
