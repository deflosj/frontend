"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { apiFetch } from "@/lib/api";
import type { ActiveTournament, TournamentTeam } from "@/lib/tournament-types";
import { PaymentSelect, paymentBody, paymentValue } from "../payment-select";
import { escapeTo, useDialogModal } from "../shared";
import { Search } from "lucide-react";
import { isTeamComplete } from "@/lib/tournament-phase";
import { TeamLinkActions } from "../team-link";
import { TeamDrawer } from "./team-drawer";

type FilterKey = "all" | "incomplete" | "unpaid" | "absent" | "noPoule";

const FILTERS: Record<FilterKey, { label: string; test: (t: TournamentTeam) => boolean }> = {
  all:        { label: "Alle",          test: () => true },
  incomplete: { label: "Onvolledig",    test: (t) => !isTeamComplete(t) },
  unpaid:     { label: "Niet betaald",  test: (t) => !t.isPaid && !t.paymentMethod },
  absent:     { label: "Niet aanwezig", test: (t) => !t.isPresent },
  noPoule:    { label: "Zonder poule",  test: (t) => t.pouleId === null },
};

// ── Tab: Teams ────────────────────────────────────────────────────────────────

export function TeamsTable({
  tournament,
  onUpdate,
  toolbarExtra,
}: Readonly<{
  tournament: ActiveTournament;
  onUpdate: (t: ActiveTournament) => void;
  /** Extra knoppen rechts in de werkbalk (bv. "Inschrijven"). */
  toolbarExtra?: React.ReactNode;
}>) {
  const [editTeam, setEditTeam]     = useState<TournamentTeam | null>(null);
  const [deleteTeam, setDeleteTeam] = useState<TournamentTeam | null>(null);
  const [deleting, setDeleting]     = useState(false);
  const [query, setQuery]           = useState("");
  const [filter, setFilter]         = useState<FilterKey>("all");

  const groupPoules = tournament.poules.filter((p) => p.phase === "GROUP_STAGE");
  const pouleMap    = new Map(groupPoules.map((p) => [p.id, p.name]));

  const q = query.trim().toLowerCase();
  const visible = tournament.teams.filter((t) =>
    FILTERS[filter].test(t) &&
    (!q || t.name.toLowerCase().includes(q) || (t.captainName ?? "").toLowerCase().includes(q))
  );

  function handleSaved(saved: TournamentTeam) {
    const teams = tournament.teams.find((t) => t.id === saved.id)
      ? tournament.teams.map((t) => (t.id === saved.id ? saved : t))
      : [...tournament.teams, saved];
    onUpdate({ ...tournament, teams });
    setEditTeam(null);
  }

  async function togglePresent(team: TournamentTeam) {
    try {
      const updated = await apiFetch<TournamentTeam>(
        `tournaments/${tournament.id}/teams/${team.id}`,
        { method: "PATCH", body: JSON.stringify({ isPresent: !team.isPresent }) }
      );
      onUpdate({ ...tournament, teams: tournament.teams.map((t) => (t.id === updated.id ? updated : t)) });
    } catch { /* ignore */ }
  }

  async function setPayment(team: TournamentTeam, value: string) {
    try {
      const updated = await apiFetch<TournamentTeam>(
        `tournaments/${tournament.id}/teams/${team.id}`,
        { method: "PATCH", body: JSON.stringify(paymentBody(value)) }
      );
      onUpdate({ ...tournament, teams: tournament.teams.map((t) => (t.id === updated.id ? updated : t)) });
    } catch { /* ignore */ }
  }

  async function doDelete() {
    if (!deleteTeam) return;
    setDeleting(true);
    try {
      await apiFetch(`tournaments/${tournament.id}/teams/${deleteTeam.id}`, { method: "DELETE" });
      onUpdate({ ...tournament, teams: tournament.teams.filter((t) => t.id !== deleteTeam.id) });
      setDeleteTeam(null);
    } catch (e) {
      globalThis.alert(`Verwijderen mislukt: ${e instanceof Error ? e.message : "onbekende fout"}`);
    } finally { setDeleting(false); }
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div role="group" aria-label="Filter teams" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-0.5 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 [&>*]:shrink-0">
          {(Object.keys(FILTERS) as FilterKey[]).map((k) => (
            <button key={k} type="button" className="chip" aria-pressed={filter === k} onClick={() => setFilter(k)}>
              {FILTERS[k].label}
              <span className="chip__n">{tournament.teams.filter(FILTERS[k].test).length}</span>
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="tb-search">
            <span className="sr-only">Zoek team of kapitein</span>
            <span className="tb-search__icon"><Search size={15} aria-hidden /></span>
            <input type="search" className="tb-search__input" placeholder="Zoek team of kapitein"
              value={query} onChange={(e) => setQuery(e.target.value)} />
          </label>
          {toolbarExtra}
        </div>
      </div>

      <div className="admin-table-wrapper" style={{ overflowX: "auto" }}>
        {tournament.teams.length === 0 ? (
          <p className="admin-empty">Nog geen teams. Klik op &quot;Team inschrijven&quot; om te beginnen.</p>
        ) : visible.length === 0 ? (
          <p className="admin-empty">Geen teams die hieraan voldoen.</p>
        ) : (
          <>
          {/* Gsm: één kaart per team, knoppen binnen duimbereik */}
          <ul className="md:hidden" aria-label="Teams">
            {visible.map((team) => {
              const n = [team.speler1, team.speler2, team.speler3, team.speler4].filter((s) => s?.trim()).length;
              return (
                <li key={team.id} className="flex flex-col gap-3 border-t border-rule px-4 py-4 first:border-t-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-semibold">{team.name}</p>
                      <p className="truncate text-[13px] text-ink-2">
                        {team.captainName || "Geen kapitein"}
                        {team.phone && <> · <a href={`tel:${team.phone}`} className="underline">{team.phone}</a></>}
                      </p>
                      <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
                        {team.pouleId
                          ? <span className="badge badge--blue">{pouleMap.get(team.pouleId) ?? `#${team.pouleId}`}</span>
                          : <span className="text-ink-2">Geen poule</span>}
                        <span className={n < 4 ? "font-semibold text-[var(--warn-fg)]" : "text-ink-2"}>{n}/4 spelers</span>
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button type="button" className="tb-btn tb-btn--ghost tb-btn--icon" style={{ width: 40, height: 40 }}
                        onClick={() => setEditTeam(team)} aria-label={`${team.name} bewerken`}>
                        <Pencil size={13} strokeWidth={1.75} aria-hidden />
                      </button>
                      <button type="button" className="tb-btn tb-btn--ghost tb-btn--icon" style={{ width: 40, height: 40, color: "var(--err-fg)" }}
                        onClick={() => setDeleteTeam(team)} aria-label={`${team.name} verwijderen`}>
                        <Trash2 size={13} strokeWidth={1.75} aria-hidden />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <PaymentSelect value={paymentValue(team)} onChange={(v) => setPayment(team, v)} />
                    <button type="button"
                      className={`btn-sm ${team.isPresent ? "btn-sm--success" : "btn-sm--ghost"}`}
                      style={{ minHeight: 40 }}
                      onClick={() => togglePresent(team)}>
                      {team.isPresent ? "✓ Aanwezig" : "Afwezig"}
                    </button>
                    <span className="ml-auto"><TeamLinkActions tournamentId={tournament.id} team={team} /></span>
                  </div>
                </li>
              );
            })}
          </ul>

          <table className="admin-table max-md:hidden">
            <thead>
              <tr>
                <th>Team</th><th>Kapitein</th><th>Poule</th><th>Betaald</th><th>Aanwezig</th><th>Teamlink</th>
                <th><span className="sr-only">Acties</span></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((team) => (
                <tr key={team.id}>
                  <td>
                    <strong>{team.name}</strong>
                    {!isTeamComplete(team) && (
                      <span className="block text-xs" style={{ color: "var(--warn-fg)" }}>
                        {[team.speler1, team.speler2, team.speler3, team.speler4].filter((s) => s?.trim()).length}/4 spelers
                      </span>
                    )}
                  </td>
                  <td>
                    {team.captainName || <span style={{ color: "var(--ink-2)" }}>—</span>}
                    {team.phone && (
                      <div style={{ fontSize: "0.75rem" }}>
                        <a href={`tel:${team.phone}`} style={{ color: "var(--ink-2)" }}>{team.phone}</a>
                      </div>
                    )}
                  </td>
                  <td>
                    {team.pouleId ? (
                      <span className="badge badge--blue">{pouleMap.get(team.pouleId) ?? `#${team.pouleId}`}</span>
                    ) : (
                      <span style={{ color: "var(--ink-2)", fontSize: "0.8rem" }}>Niet toegewezen</span>
                    )}
                  </td>
                  <td>
                    <PaymentSelect value={paymentValue(team)} onChange={(v) => setPayment(team, v)} />
                  </td>
                  <td>
                    <button type="button"
                      className={`btn-sm ${team.isPresent ? "btn-sm--success" : "btn-sm--ghost"}`}
                      onClick={() => togglePresent(team)}>
                      {team.isPresent ? "✓ Aanwezig" : "Afwezig"}
                    </button>
                  </td>
                  <td>
                    <TeamLinkActions tournamentId={tournament.id} team={team} />
                  </td>
                  <td>
                    <div className="row-actions" style={{ justifyContent: "flex-end" }}>
                      <button type="button" className="tb-btn tb-btn--ghost tb-btn--icon"
                        onClick={() => setEditTeam(team)} aria-label={`${team.name} bewerken`} title="Bewerken">
                        <Pencil size={13} strokeWidth={1.75} aria-hidden />
                      </button>
                      <button type="button" className="tb-btn tb-btn--ghost tb-btn--icon"
                        onClick={() => setDeleteTeam(team)} aria-label={`${team.name} verwijderen`} title="Verwijderen"
                        style={{ color: "var(--err-fg)" }}>
                        <Trash2 size={13} strokeWidth={1.75} aria-hidden />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </>
        )}
      </div>

      {editTeam !== null && (
        <TeamDrawer
          tournamentId={tournament.id}
          poules={tournament.poules}
          team={editTeam}
          onClose={() => setEditTeam(null)}
          onSaved={handleSaved}
        />
      )}

      {deleteTeam && (
        <DeleteTeamConfirm
          team={deleteTeam}
          onConfirm={doDelete}
          onCancel={() => setDeleteTeam(null)}
          loading={deleting}
        />
      )}
    </>
  );
}

function DeleteTeamConfirm({
  team, onConfirm, onCancel, loading,
}: Readonly<{ team: TournamentTeam; onConfirm: () => void; onCancel: () => void; loading: boolean }>) {
  const dialogRef = useDialogModal();
  return (
    <dialog ref={dialogRef} onCancel={escapeTo(onCancel)} className="admin-confirm" aria-label="Team verwijderen">
      <h2 style={{ margin: "0 0 0.5rem", fontSize: "1.1rem", fontWeight: 500, color: "var(--text)" }}>
        Team verwijderen?
      </h2>
      <p style={{ margin: "0 0 1.5rem", fontSize: "0.875rem", color: "var(--ink-2)" }}>
        <strong style={{ color: "var(--text)" }}>{team.name}</strong> en alle bijbehorende
        data worden permanent verwijderd.
      </p>
      <div style={{ display: "flex", gap: "0.75rem" }}>
        <button type="button" className="btn-sm btn-sm--danger" onClick={onConfirm} disabled={loading}>
          {loading ? "Verwijderen…" : "Verwijderen"}
        </button>
        <button type="button" className="btn-sm btn-sm--ghost" onClick={onCancel}>Annuleren</button>
      </div>
    </dialog>
  );
}
