"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { apiFetch } from "@/lib/api";
import type { Registration } from "@/lib/registration-types";
import { useDrawer } from "@/components/admin/drawer-provider";

interface Props {
  registration: Registration;
  onDeleted: (id: number) => void;
}

export function DeleteConfirm({ registration: r, onDeleted }: Readonly<Props>) {
  const { closeDrawer } = useDrawer();
  const [open, setOpen] = useState(true);
  const [loading, setLoading] = useState(false);

  function close() {
    setOpen(false);
    closeDrawer();
  }

  async function handleDelete() {
    setLoading(true);
    try {
      await apiFetch(`registrations/${r.id}`, { method: "DELETE" });
      onDeleted(r.id);
      close();
    } catch {
      setLoading(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={(o) => { if (!o) close(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="admin-sheet-overlay" />
        <Dialog.Content className="admin-confirm" aria-label="Inschrijving verwijderen">
          <Dialog.Title className="admin-confirm__title">Inschrijving verwijderen?</Dialog.Title>
          <Dialog.Description className="admin-confirm__desc">
            De inschrijving van <strong>{r.firstName} {r.lastName}</strong> wordt permanent
            verwijderd. Dit kan niet ongedaan gemaakt worden.
          </Dialog.Description>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              type="button"
              className="btn-sm btn-sm--danger"
              onClick={handleDelete}
              disabled={loading}
            >
              {loading ? "Verwijderen…" : "Verwijderen"}
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
