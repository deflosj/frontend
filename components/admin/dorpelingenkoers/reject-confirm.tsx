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

export function RejectConfirm({ registration: r, onUpdated }: Readonly<Props>) {
  const { closeDrawer } = useDrawer();
  const [open, setOpen] = useState(true);
  const [loading, setLoading] = useState(false);

  function close() {
    setOpen(false);
    closeDrawer();
  }

  async function handleReject() {
    setLoading(true);
    try {
      const updated = await apiFetch<Registration>(`registrations/${r.id}/reject`, { method: "PATCH" });
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
        <Dialog.Content className="admin-confirm" aria-label="Inschrijving afwijzen">
          <Dialog.Title className="admin-confirm__title">Inschrijving afwijzen?</Dialog.Title>
          <Dialog.Description className="admin-confirm__desc">
            De inschrijving van <strong>{r.firstName} {r.lastName}</strong> wordt afgekeurd.
            De persoon wordt hiervan op de hoogte gesteld.
          </Dialog.Description>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              type="button"
              className="btn-sm btn-sm--danger"
              onClick={handleReject}
              disabled={loading}
            >
              {loading ? "Bezig…" : "Afwijzen"}
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
