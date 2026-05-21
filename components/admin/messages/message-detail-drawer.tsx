"use client";

import { useEffect, useState } from "react";
import { Sheet, SheetContent } from "@/components/admin/sheet";
import { useDrawer } from "@/components/admin/drawer-provider";

export interface ContactMessage {
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
const STATUS_BADGE: Record<string, string> = { UNREAD: "pink", READ: "green", ARCHIVED: "gray" };

function MessageDetail({ message }: Readonly<{ message: ContactMessage }>) {
  return (
    <div>
      <dl style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "0.5rem 1rem", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
        <dt style={{ color: "var(--ink-2)", fontWeight: 500 }}>Van</dt>
        <dd style={{ margin: 0 }}>{message.name}</dd>
        <dt style={{ color: "var(--ink-2)", fontWeight: 500 }}>E-mail</dt>
        <dd style={{ margin: 0 }}>
          <a href={`mailto:${message.email}`} style={{ color: "var(--accent)" }}>{message.email}</a>
        </dd>
        {message.subject && (
          <>
            <dt style={{ color: "var(--ink-2)", fontWeight: 500 }}>Onderwerp</dt>
            <dd style={{ margin: 0 }}>{message.subject}</dd>
          </>
        )}
        <dt style={{ color: "var(--ink-2)", fontWeight: 500 }}>Datum</dt>
        <dd style={{ margin: 0 }}>{new Date(message.createdAt).toLocaleString("nl-BE")}</dd>
        <dt style={{ color: "var(--ink-2)", fontWeight: 500 }}>Status</dt>
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

interface Props {
  message: ContactMessage;
  onMarkRead?: (id: number) => Promise<void>;
}

export function MessageDetailDrawer({ message, onMarkRead }: Readonly<Props>) {
  const { closeDrawer } = useDrawer();
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (message.status === "UNREAD" && onMarkRead) {
      onMarkRead(message.id).catch(() => {});
    }
  }, []);

  function close() {
    setOpen(false);
    closeDrawer();
  }

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) close(); }}>
      <SheetContent title={message.subject ?? "Bericht"}>
        <MessageDetail message={message} />
      </SheetContent>
    </Sheet>
  );
}
