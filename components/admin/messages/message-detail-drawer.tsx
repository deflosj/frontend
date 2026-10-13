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
      <dl className="mb-6 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
        <dt className="font-medium text-ink-2">Van</dt>
        <dd>{message.name}</dd>
        <dt className="font-medium text-ink-2">E-mail</dt>
        <dd>
          <a href={`mailto:${message.email}`} className="text-[var(--accent)] hover:underline">{message.email}</a>
        </dd>
        {message.subject && (
          <>
            <dt className="font-medium text-ink-2">Onderwerp</dt>
            <dd>{message.subject}</dd>
          </>
        )}
        <dt className="font-medium text-ink-2">Datum</dt>
        <dd>{new Date(message.createdAt).toLocaleString("nl-BE")}</dd>
        <dt className="font-medium text-ink-2">Status</dt>
        <dd>
          <span className={`badge badge--${STATUS_BADGE[message.status]}`}>{STATUS_LABELS[message.status]}</span>
        </dd>
      </dl>
      <div className="whitespace-pre-wrap rounded-[10px] border border-rule bg-surface p-4 text-sm leading-relaxed text-ink-2">
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
