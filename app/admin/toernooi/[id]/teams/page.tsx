"use client";

import { useState } from "react";
import { ClipboardPen } from "lucide-react";
import { useTournament } from "../tournament-context";
import { RegisterTeamForm } from "./register-form";
import { TeamsTable } from "./teams-table";

export default function TournamentTeamsPage() {
  const { tournament, setTournament } = useTournament();
  const [registerOpen, setRegisterOpen] = useState(false);

  return (
    <div>
      {registerOpen && (
        <div className="mb-6">
          <RegisterTeamForm tournament={tournament} onUpdate={setTournament} />
        </div>
      )}
      <TeamsTable
        tournament={tournament}
        onUpdate={setTournament}
        toolbarExtra={
          <button
            type="button"
            className={`btn-sm btn-sm--ghost ${registerOpen ? "tb-btn--active" : ""}`}
            aria-expanded={registerOpen}
            onClick={() => setRegisterOpen((o) => !o)}
          >
            <ClipboardPen size={16} strokeWidth={1.75} /> {registerOpen ? "Inschrijftafel sluiten" : "Inschrijftafel"}
          </button>
        }
      />
    </div>
  );
}
