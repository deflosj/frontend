"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useTournament } from "../tournament-context";
import { RegisterDrawer } from "./register-drawer";
import { TeamsTable } from "./teams-table";

export default function TournamentTeamsPage() {
  const { tournament, setTournament } = useTournament();
  const [registerOpen, setRegisterOpen] = useState(false);

  return (
    <div>
      <TeamsTable
        tournament={tournament}
        onUpdate={setTournament}
        toolbarExtra={
          <button type="button" className="btn-sm btn-sm--primary" onClick={() => setRegisterOpen(true)}>
            <Plus size={16} strokeWidth={2} /> Team inschrijven
          </button>
        }
      />
      {registerOpen && (
        <RegisterDrawer tournament={tournament} onUpdate={setTournament} onClose={() => setRegisterOpen(false)} />
      )}
    </div>
  );
}
