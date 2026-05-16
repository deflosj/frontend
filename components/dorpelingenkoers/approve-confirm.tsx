"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { apiFetch } from "@/lib/api";
import type { Registration } from "@/lib/registration-types";
import { useDrawer } from "@/components/admin/drawer-provider";

interface Props {
  registration: Registration;
  onUpdated: (r: Registration) => void;
}

export function ApproveConfirm({ registration: r, onUpdated }: Readonly<Props>) {
  const { closeDrawer } = useDrawer();
  const [open, setOpen] = useState(true);
  const [loading, setLoading] = useState(false);

  function close() {
    setOpen(false);
    closeDrawer();
  }

  async function handleApprove() {
    setLoading(true);
    try {
      const updated = await apiFetch<Registration>(`/registrations/${r.id}/approve`, { method: "PATCH" });
      onUpdated(updated);
      close();
    } catch {
      setLoading(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={(o) => { if (!o) close(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="admin-sheet-overlay" />
        <Dialog.Content className="admin-confirm" aria-label="Inschrijving goedkeuren">
          <Dialog.Title className="admin-confirm__title">Inschrijving goedkeuren?</Dialog.Title>
          <Dialog.Description className="admin-confirm__desc">
            <strong>{r.firstName} {r.lastName}</strong> wordt goedgekeurd en ontvangt een bevestigingsmail.
          </Dialog.Description>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              type="button"
              className="btn-sm btn-sm--success"
              onClick={handleApprove}
              disabled={loading}
            >
              {loading ? "Bezig…" : "Goedkeuren"}
            </button>
            <button type="button" className="btn-sm btn-sm--ghost" onClick={close}>
              Annuleren
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
