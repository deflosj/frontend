"use client";

import { IconX } from "@/components/ui/icons";
import type { ActiveTournament } from "@/lib/tournament-types";
import { escapeTo, useDialogModal } from "../shared";
import { RegisterTeamForm } from "./register-form";

/** Zijpaneel van rechts om teams in te schrijven, aan de balie of tussendoor. */
export function RegisterDrawer({
  tournament,
  onUpdate,
  onClose,
}: Readonly<{
  tournament: ActiveTournament;
  onUpdate: (t: ActiveTournament) => void;
  onClose: () => void;
}>) {
  const dialogRef = useDialogModal();
  return (
    <dialog ref={dialogRef} onCancel={escapeTo(onClose)} className="admin-drawer" aria-label="Team inschrijven">
      <div className="admin-drawer__header">
        <h2>Team inschrijven</h2>
        <button type="button" className="admin-drawer__close" onClick={onClose} aria-label="Sluiten"><IconX /></button>
      </div>
      <RegisterTeamForm tournament={tournament} onUpdate={onUpdate} bare />
    </dialog>
  );
}
