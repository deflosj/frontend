"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { apiFetch } from "@/lib/api";
import type { RaceCategory, Registration } from "@/lib/registration-types";
import { RACE_CATEGORY_LABELS } from "@/lib/registration-types";
import { useDrawer } from "@/components/admin/drawer-provider";

interface Props {
  registration: Registration;
  targetCategory: RaceCategory;
  onUpdated: (r: Registration) => void;
}

export function ChangeCategoryConfirm({
  registration: r,
  targetCategory,
  onUpdated,
}: Readonly<Props>) {
  const { closeDrawer } = useDrawer();
  const [open, setOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function close() {
    setOpen(false);
    closeDrawer();
  }

  async function handleChangeCategory() {
    setLoading(true);
    setError("");
    try {
      const updated = await apiFetch<Registration>(`registrations/${r.id}/category`, {
        method: "PATCH",
        body: JSON.stringify({ raceCategory: targetCategory }),
      });
      onUpdated(updated);
      close();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wijzigen mislukt.");
      setLoading(false);
    }
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(o) => {
        if (!o) close();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="admin-sheet-overlay" />
        <Dialog.Content className="admin-confirm" aria-label="Wedstrijd wijzigen">
          <Dialog.Title className="admin-confirm__title">Wedstrijd wijzigen?</Dialog.Title>
          <Dialog.Description className="admin-confirm__desc">
            <strong>
              {r.firstName} {r.lastName}
            </strong>{" "}
            wordt verplaatst van <strong>{RACE_CATEGORY_LABELS[r.raceCategory]}</strong> naar{" "}
            <strong>{RACE_CATEGORY_LABELS[targetCategory]}</strong>.
          </Dialog.Description>

          {error && (
            <div className="form-error" style={{ marginBottom: "0.75rem" }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              type="button"
              className="btn-sm btn-sm--primary"
              onClick={handleChangeCategory}
              disabled={loading}
            >
              {loading ? "Bezig…" : "Wijzigen"}
            </button>
            <button type="button" className="btn-sm btn-sm--ghost" onClick={close} disabled={loading}>
              Annuleren
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
