"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import { DataTable, type ColumnDef } from "@/components/admin/data-table";
import { TableToolbar } from "@/components/admin/table-toolbar";
import { useDrawer } from "@/components/admin/drawer-provider";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ContactMessage {
  id: number;
  name: string;
  email: string;
  subject: string | null;
  body: string;
  status: "UNREAD" | "READ" | "ARCHIVED";
  createdAt: string;
  readAt: string | null;
}

const STATUS_LABELS: Record<string, string> = { UNREAD: "Ongelezen", READ: "Gelezen", ARCHIVED: "Gearchiveerd" };
const STATUS_BADGE:  Record<string, string> = { UNREAD: "pink",      READ: "green",   ARCHIVED: "gray"          };

// ── Detail drawer ─────────────────────────────────────────────────────────────

function MessageDetail({ message }: Readonly<{ message: ContactMessage }>) {
  return (
    <div>
      <dl style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "0.5rem 1rem", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
        <dt style={{ color: "var(--muted)", fontWeight: 500 }}>Van</dt>
        <dd style={{ margin: 0 }}>{message.name}</dd>
        <dt style={{ color: "var(--muted)", fontWeight: 500 }}>E-mail</dt>
        <dd style={{ margin: 0 }}>
          <a href={`mailto:${message.email}`} style={{ color: "var(--accent)" }}>{message.email}</a>
        </dd>
        {message.subject && (
          <>
            <dt style={{ color: "var(--muted)", fontWeight: 500 }}>Onderwerp</dt>
            <dd style={{ margin: 0 }}>{message.subject}</dd>
          </>
        )}
        <dt style={{ color: "var(--muted)", fontWeight: 500 }}>Datum</dt>
        <dd style={{ margin: 0 }}>{new Date(message.createdAt).toLocaleString("nl-BE")}</dd>
        <dt style={{ color: "var(--muted)", fontWeight: 500 }}>Status</dt>
        <dd style={{ margin: 0 }}>
          <span className={`badge badge--${STATUS_BADGE[message.status]}`}>{STATUS_LABELS[message.status]}</span>
        </dd>
      </dl>
      <div
        style={{
          padding: "1rem",
          borderRadius: "10px",
          background: "var(--bg-alt)",
          border: "1px solid var(--border)",
          fontSize: "0.875rem",
          color: "var(--text-2)",
          whiteSpace: "pre-wrap",
          lineHeight: 1.7,
        }}
      >
        {message.body}
      </div>
    </div>
  );
}

// ── Cell components (module scope — required by S6478) ────────────────────────

function NameCell({ name }: Readonly<{ name: string }>) {
  return <strong>{name}</strong>;
}

function SubjectCell({ subject }: Readonly<{ subject: string | null }>) {
  return <>{subject ?? <span style={{ color: "var(--muted)" }}>—</span>}</>;
}

function StatusBadge({ status }: Readonly<{ status: string }>) {
  return (
    <span className={`badge badge--${STATUS_BADGE[status] ?? "gray"}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

function DateCell({ iso }: Readonly<{ iso: string }>) {
  return <span className="mono">{new Date(iso).toLocaleDateString("nl-BE")}</span>;
}

interface ActionCellProps {
  message: ContactMessage;
  busy: number | null;
  onView: () => void;
  onMarkRead: () => void;
  onArchive: () => void;
}

function ActionCell({ message: m, busy, onView, onMarkRead, onArchive }: Readonly<ActionCellProps>) {
  return (
    <div className="row-actions">
      <button type="button" className="btn-sm btn-sm--ghost" onClick={onView}>
        Bekijken
      </button>
      {m.status === "UNREAD" && (
        <button type="button" className="btn-sm btn-sm--success" onClick={onMarkRead} disabled={busy === m.id}>
          Gelezen
        </button>
      )}
      {m.status !== "ARCHIVED" && (
        <button type="button" className="btn-sm btn-sm--ghost" onClick={onArchive} disabled={busy === m.id}>
          Archiveer
        </button>
      )}
    </div>
  );
}

// ── Column factory ────────────────────────────────────────────────────────────

function makeColumns(
  busy: number | null,
  onView: (m: ContactMessage) => void,
  onMarkRead: (id: number) => void,
  onArchive: (id: number) => void,
): ColumnDef<ContactMessage>[] {
  return [
    {
      key: "name",
      header: "Naam",
      sortable: true,
      sortValue: (m) => m.name,
      cell: (m) => <NameCell name={m.name} />,
    },
    {
      key: "email",
      header: "E-mail",
      cell: (m) => m.email,
    },
    {
      key: "subject",
      header: "Onderwerp",
      cell: (m) => <SubjectCell subject={m.subject} />,
    },
    {
      key: "status",
      header: "Status",
      cell: (m) => <StatusBadge status={m.status} />,
    },
    {
      key: "createdAt",
      header: "Datum",
      sortable: true,
      sortValue: (m) => m.createdAt,
      cell: (m) => <DateCell iso={m.createdAt} />,
    },
    {
      key: "actions",
      header: "",
      cell: (m) => (
        <ActionCell
          message={m}
          busy={busy}
          onView={() => onView(m)}
          onMarkRead={() => onMarkRead(m.id)}
          onArchive={() => onArchive(m.id)}
        />
      ),
    },
  ];
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminMessagesPage() {
  const { openDrawer } = useDrawer();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading]   = useState(true);
  const [busy, setBusy]         = useState<number | null>(null);

  const [search, setSearch]           = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");

  useEffect(() => {
    apiFetch<ContactMessage[]>("/contact/messages")
      .then(setMessages)
      .finally(() => setLoading(false));
  }, []);

  async function markRead(id: number) {
    setBusy(id);
    try {
      await apiFetch(`/contact/messages/${id}/read`, { method: "PATCH" });
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, status: "READ" as const, readAt: new Date().toISOString() } : m))
      );
    } finally {
      setBusy(null);
    }
  }

  async function archive(id: number) {
    setBusy(id);
    try {
      await apiFetch(`/contact/messages/${id}/archive`, { method: "PATCH" });
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, status: "ARCHIVED" as const } : m))
      );
    } finally {
      setBusy(null);
    }
  }

  function viewMessage(m: ContactMessage) {
    openDrawer(
      <div>
        <div className="admin-drawer__header" style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 500 }}>
            {m.subject ?? "Bericht"}
          </h2>
        </div>
        <MessageDetail message={m} />
      </div>
    );
    if (m.status === "UNREAD") {
      markRead(m.id).catch(() => {});
    }
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return messages.filter((m) => {
      if (filterStatus !== "ALL" && m.status !== filterStatus) return false;
      if (q) {
        const text = `${m.name} ${m.email} ${m.subject ?? ""}`.toLowerCase();
        if (!text.includes(q)) return false;
      }
      return true;
    });
  }, [messages, search, filterStatus]);

  const unread = messages.filter((m) => m.status === "UNREAD").length;

  const columns = makeColumns(busy, viewMessage, markRead, archive);

  return (
    <>
      <div className="admin-page-header">
        <h1>Berichten</h1>
        <p>
          Contactberichten van bezoekers
          {unread > 0 && (
            <span style={{ marginLeft: "0.5rem" }}>
              <span className="badge badge--pink">{unread} ongelezen</span>
            </span>
          )}
        </p>
      </div>

      <DataTable
        toolbar={
          <TableToolbar
            search={search}
            onSearch={setSearch}
            searchPlaceholder="Zoek op naam, e-mail of onderwerp…"
            filters={[
              {
                key: "status",
                label: "Status",
                value: filterStatus,
                defaultValue: "ALL",
                options: [
                  { value: "ALL",      label: "Alle berichten"  },
                  { value: "UNREAD",   label: "Ongelezen"       },
                  { value: "READ",     label: "Gelezen"         },
                  { value: "ARCHIVED", label: "Gearchiveerd"    },
                ],
                onChange: setFilterStatus,
              },
            ]}
            resultCount={filtered.length}
            totalCount={messages.length}
          />
        }
        title={`Berichten (${loading ? "…" : messages.length})`}
        data={filtered}
        columns={columns}
        loading={loading}
        emptyText="Geen berichten ontvangen."
      />
    </>
  );
}
