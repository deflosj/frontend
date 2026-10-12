"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";
import type { ActiveTournament } from "@/lib/tournament-types";
import { IconSave } from "@/components/ui/icons";
import { slotMinutes as slotMinutesOf } from "@/lib/tournament-live";
import { InfoButton } from "@/components/admin/info-button";

// ── Tab: Overzicht ────────────────────────────────────────────────────────────

/** Vandaag om 13:00 in het formaat dat datetime-local verwacht. */
function defaultStartTime(): string {
  const d = new Date();
  d.setHours(13, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Eind van de poulefase (laatste poulematch + slotduur) als waarde voor een
 *  datetime-local veld, of null als er nog geen poulewedstrijden zijn. */
function latestGroupEnd(t: ActiveTournament, slotMinutes: number): string | null {
  const times = t.matches
    .filter((m) => m.phase === "GROUP_STAGE" && m.scheduledAt)
    .map((m) => new Date(m.scheduledAt as string).getTime());
  if (times.length === 0) return null;
  const d = new Date(Math.max(...times) + slotMinutes * 60_000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function PlanningPanel({
  tournament,
  onUpdate,
}: Readonly<{
  tournament: ActiveTournament;
  onUpdate: (t: ActiveTournament) => void;
}>) {
  const [generating, setGenerating] = useState<"" | "poules" | "ko">("");
  const [genError, setGenError]     = useState("");
  const [genNote, setGenNote]       = useState("");
  // Poulefase: 20 minuten per wedstrijd op alle banen van het terrein.
  const [startTime, setStartTime]     = useState(defaultStartTime);
  const [slotMinutes, setSlotMinutes] = useState("20");
  const [trackCount, setTrackCount]   = useState(String(tournament.trackCount ?? 6));
  // Knock-out: wordt automatisch opgemaakt na de laatste poulematch,
  // met deze instellingen (bewaard op het toernooi).
  const [koPause, setKoPause]           = useState(String(tournament.knockoutPauseMinutes ?? 15));
  const [koSlot, setKoSlot]             = useState(tournament.knockoutSlotMinutes ? String(tournament.knockoutSlotMinutes) : "");
  const [koBreak, setKoBreak]           = useState(String(tournament.roundBreakMinutes ?? 0));
  // Vanaf de kwartfinales duren de matchen langer (2025: 30 i.p.v. 20 min).
  const [koFinalsSlot, setKoFinalsSlot] = useState(String(tournament.finalsSlotMinutes ?? 30));
  const [koConsolation, setKoConsolation] = useState(tournament.withConsolation ?? true);
  const [perPoule, setPerPoule]         = useState(String(tournament.teamsPerPoule ?? 4));
  // Wie gaat door naar de knock-out: top N per poule + X beste (N+1)-des.
  const [advPerPoule, setAdvPerPoule]   = useState(String(tournament.teamsAdvancingPerPoule ?? 2));
  const [bestNths, setBestNths]         = useState(String(tournament.bestNthsAdvancing ?? 0));
  const [savingFormat, setSavingFormat] = useState(false);
  const [formatNote, setFormatNote]     = useState("");
  const [onlyPresent, setOnlyPresent]   = useState(false);
  const [drawing, setDrawing]           = useState(false);
  const [drawError, setDrawError]       = useState("");
  const [drawNote, setDrawNote]         = useState("");

  const teamCount    = tournament.teams.length;
  const presentCount = tournament.teams.filter((t) => t.isPresent).length;
  const matchCount   = tournament.matches.length;
  const groupPouleCount = tournament.poules.filter((p) => p.phase === "GROUP_STAGE").length;
  const drawTeamCount   = onlyPresent ? presentCount : teamCount;
  const perPouleNum     = Number.parseInt(perPoule, 10);
  const drawPouleCount  = perPouleNum >= 2 ? Math.ceil(drawTeamCount / perPouleNum) : 0;

  const advNum      = Math.max(0, Number.parseInt(advPerPoule, 10) || 0);
  const bestNum     = Math.max(0, Number.parseInt(bestNths, 10) || 0);
  const nthLabel    = `${advNum + 1}de`;
  const koTeamCount = groupPouleCount * advNum + Math.min(bestNum, groupPouleCount);
  const koSettings = {
    teamsAdvancingPerPoule: advNum,
    bestNthsAdvancing: bestNum,
    knockoutPauseMinutes: Math.max(0, Number.parseInt(koPause, 10) || 0),
    knockoutSlotMinutes: koSlot.trim() ? Number.parseInt(koSlot, 10) : null,
    finalsSlotMinutes: Number.parseInt(koFinalsSlot, 10) || 30,
    roundBreakMinutes: Math.max(0, Number.parseInt(koBreak, 10) || 0),
    withConsolation: koConsolation,
  };
  const formatDirty =
    advNum !== (tournament.teamsAdvancingPerPoule ?? 2) ||
    bestNum !== (tournament.bestNthsAdvancing ?? 0) ||
    koSettings.knockoutPauseMinutes !== (tournament.knockoutPauseMinutes ?? 15) ||
    koSettings.knockoutSlotMinutes !== (tournament.knockoutSlotMinutes ?? null) ||
    koSettings.finalsSlotMinutes !== (tournament.finalsSlotMinutes ?? 30) ||
    koSettings.roundBreakMinutes !== (tournament.roundBreakMinutes ?? 0) ||
    koSettings.withConsolation !== (tournament.withConsolation ?? true);

  // Status van het automatische knock-outschema.
  const groupMatches = tournament.matches.filter((m) => m.phase === "GROUP_STAGE");
  const groupOpen    = groupMatches.filter((m) => m.scoreA === null || m.scoreB === null).length;
  const koMatches    = tournament.matches.filter((m) => m.bracketPos);
  const koStarted    = koMatches.some((m) => m.scoreA !== null || m.scoreB !== null);
  const groupSlot    = slotMinutesOf(groupMatches);
  const lastGroup    = Math.max(0, ...groupMatches.filter((m) => m.scheduledAt).map((m) => new Date(m.scheduledAt!).getTime()));
  const koStartAt    = koMatches.length
    ? Math.min(...koMatches.filter((m) => m.scheduledAt).map((m) => new Date(m.scheduledAt!).getTime()))
    : lastGroup ? lastGroup + (groupSlot + koSettings.knockoutPauseMinutes) * 60_000 : 0;
  const hhmm = (t: number) => new Date(t).toLocaleTimeString("nl-BE", { hour: "2-digit", minute: "2-digit" });

  async function saveFormat() {
    setFormatNote(""); setSavingFormat(true);
    try {
      const updated = await apiFetch<ActiveTournament>(`tournaments/${tournament.id}`, {
        method: "PATCH",
        body: JSON.stringify(koSettings),
      });
      onUpdate(updated);
      setFormatNote("Opgeslagen.");
    } catch (err) {
      setFormatNote(err instanceof Error ? err.message : "Opslaan mislukt.");
    } finally { setSavingFormat(false); }
  }

  /** Verdeelt de teams willekeurig over nieuwe poules. Bestaande poules en
   *  poulewedstrijden gaan verloren, dus eerst bevestigen als die er zijn. */
  async function drawPoules() {
    if ((groupPouleCount > 0 || matchCount > 0) && !globalThis.confirm(
      "De bestaande poules en poulewedstrijden worden gewist en de teams opnieuw willekeurig verdeeld. Doorgaan?"
    )) return;
    setDrawError(""); setDrawNote(""); setDrawing(true);
    try {
      const result = await apiFetch<{ poules: number; teams: number }>(
        `tournaments/${tournament.id}/generate-poules`,
        { method: "POST", body: JSON.stringify({ teamsPerPoule: perPouleNum, onlyPresent }) }
      );
      const fresh = await apiFetch<ActiveTournament>(`tournaments/${tournament.id}`);
      onUpdate(fresh);
      setDrawNote(`${result.teams} teams verdeeld over ${result.poules} poules.`);
    } catch (err) { setDrawError(err instanceof Error ? err.message : "Poules genereren mislukt."); }
    finally { setDrawing(false); }
  }

  /** De backend wil een starttijd en een rondeduur; zonder die twee kan ze de
   *  wedstrijden niet inplannen. Na het genereren halen we het toernooi
   *  opnieuw op, want het antwoord is enkel een teller. */
  async function generate(kind: "poules" | "ko", force = false) {
    const hasExisting = tournament.matches.some((m) =>
      kind === "poules" ? m.phase === "GROUP_STAGE" : m.phase !== "GROUP_STAGE"
    );
    if (!force && hasExisting && !globalThis.confirm(
      kind === "poules"
        ? "De bestaande poulewedstrijden (en hun scores) worden gewist. Doorgaan?"
        : "Het bestaande knockoutschema (en de scores) wordt gewist. Doorgaan?"
    )) return;

    setGenError(""); setGenNote(""); setGenerating(kind);
    try {
      const tracks = Number.parseInt(trackCount, 10) || 6;
      const body: Record<string, unknown> =
        kind === "poules"
          ? {
              startTime: new Date(startTime).toISOString(),
              slotMinutes: Number.parseInt(slotMinutes, 10),
              trackCount: tracks,
            }
          : {
              startTime: new Date(koStartAt || Date.now()).toISOString(),
              slotMinutes: Number.parseInt(koSlot, 10) || groupSlot,
              breakMinutes: Number.parseInt(koBreak, 10) || 0,
              finalsSlotMinutes: Number.parseInt(koFinalsSlot, 10) || 30,
              trackCount: tracks,
              withConsolation: koConsolation,
              force,
            };

      const path = kind === "poules" ? "generate-matches" : "generate-knockout";
      const result = await apiFetch<{ created: number; totalAdvancing?: number; lastSlotAt?: string | null }>(
        `tournaments/${tournament.id}/${path}`,
        { method: "POST", body: JSON.stringify(body) }
      );
      const fresh = await apiFetch<ActiveTournament>(`tournaments/${tournament.id}`);
      onUpdate(fresh);
      if (kind === "poules") {
        const end = result.lastSlotAt ? new Date(result.lastSlotAt) : null;
        setGenNote(
          `${result.created} poulewedstrijden over ${tracks} banen` +
          (end ? ` · laatste start om ${end.toLocaleTimeString("nl-BE", { hour: "2-digit", minute: "2-digit" })}.` : ".")
        );
      } else {
        setGenNote(`Knock-out met ${result.totalAdvancing} teams: ${result.created} wedstrijden aangemaakt.`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Genereren mislukt.";
      // De backend weigert zolang er poulewedstrijden zonder score zijn.
      if (kind === "ko" && !force && msg.startsWith("Nog ") &&
          globalThis.confirm(`${msg}. Toch een knockoutschema maken op basis van de huidige stand?`)) {
        setGenerating("");
        await generate("ko", true);
        return;
      }
      setGenError(msg);
    }
    finally { setGenerating(""); }
  }

  return (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      {/* Generate poules */}
      <div className="admin-table-wrapper">
        <div className="admin-table-header">
          <div className="title-row">
            <h2>Poules genereren</h2>
            <InfoButton title="Poules genereren">
              <p>Verdeelt de teams willekeurig over poules (Poule A, B, C…). De poules verschillen hoogstens één team in grootte.</p>
              <p>Met <strong>Enkel aanwezige teams</strong> tellen alleen ploegen die ingecheckt zijn.</p>
              <p><strong>Opnieuw genereren wist de bestaande poules en poulewedstrijden.</strong></p>
            </InfoButton>
          </div>
        </div>
        <div style={{ padding: "1.25rem 1.4rem" }}>
          {drawError && <div className="form-error" style={{ marginBottom: "1rem" }}>{drawError}</div>}
          {drawNote && (
            <p style={{ margin: "0 0 1rem", fontSize: "0.8rem", color: "var(--ok-fg)", fontWeight: 500 }}>
              ✓ {drawNote}
            </p>
          )}

          <div style={{ display: "flex", gap: "1.25rem", alignItems: "flex-end", flexWrap: "wrap", marginBottom: "1rem" }}>
            <div className="form-field">
              <label htmlFor="draw-size">Teams per poule</label>
              <input id="draw-size" type="number" min="2" max="16" value={perPoule}
                style={{ width: "110px" }}
                onChange={(e) => setPerPoule(e.target.value)} />
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.875rem", paddingBottom: "0.5rem" }}>
              <input type="checkbox" checked={onlyPresent}
                onChange={(e) => setOnlyPresent(e.target.checked)} />
              Enkel aanwezige teams
            </label>
          </div>

          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
            <button type="button" className="btn-sm btn-sm--primary"
              onClick={drawPoules}
              disabled={drawing || drawTeamCount < 2 || perPouleNum < 2 || Number.isNaN(perPouleNum)}>
              {drawing ? "Genereren…" : "Genereer poules"}
            </button>
            {drawPouleCount > 0 && (
              <span style={{ fontSize: "0.8rem", color: "var(--ink-2)" }}>
                {drawTeamCount} teams → {drawPouleCount} poules
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Generate matches */}
      <div className="admin-table-wrapper">
        <div className="admin-table-header">
          <div className="title-row">
            <h2>Wedstrijden genereren</h2>
            <InfoButton title="Poulewedstrijden">
              <p>Elke baan krijgt vaste poules. Poules die een baan delen spelen om beurten, zoals in 2025: baan 1 = poule A en B.</p>
              <p>Er spelen nooit meer wedstrijden tegelijk dan er banen zijn.</p>
              <p><strong>Opnieuw genereren wist de bestaande poulewedstrijden.</strong></p>
            </InfoButton>
          </div>
        </div>
        <div style={{ padding: "1.25rem 1.4rem" }}>
          {genError && <div className="form-error" style={{ marginBottom: "1rem" }}>{genError}</div>}
          {genNote && (
            <p style={{ margin: "0 0 1rem", fontSize: "0.8rem", color: "var(--ok-fg)", fontWeight: 500 }}>
              ✓ {genNote}
            </p>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: "1rem", marginBottom: "1rem" }}>
            <div className="form-field">
              <label htmlFor="gen-start">Eerste wedstrijd</label>
              <input id="gen-start" type="datetime-local" value={startTime}
                onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div className="form-field">
              <label htmlFor="gen-slot">Minuten per match</label>
              <input id="gen-slot" type="number" min="5" max="120" value={slotMinutes}
                style={{ width: "110px" }}
                onChange={(e) => setSlotMinutes(e.target.value)} />
            </div>
            <div className="form-field">
              <label htmlFor="gen-tracks">Banen</label>
              <input id="gen-tracks" type="number" min="1" max="40" value={trackCount}
                style={{ width: "90px" }}
                onChange={(e) => setTrackCount(e.target.value)} />
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
            <button type="button" className="btn-sm btn-sm--primary"
              onClick={() => generate("poules")}
              disabled={generating !== "" || groupPouleCount === 0 || !startTime}>
              {generating === "poules" ? "Genereren…" : "Genereer poulewedstrijden"}
            </button>
          </div>

          <div className="title-row" style={{ margin: "0 0 0.5rem" }}>
            <h3 style={{ margin: 0, fontSize: "0.95rem" }}>Knock-out</h3>
            <InfoButton title="Knock-out">
              <p>Je hoeft niets te genereren. Zodra de laatste poulematch een score heeft, maakt de site het knock-outschema zelf op met de instellingen hieronder. Tot dan zien de spelers een voorlopige bracket die na elke match verschuift.</p>
              <p>
                Rangschikking: eerst alle 1sten (beste eerst), dan alle 2den
                {bestNum > 0 && <>, dan de beste {nthLabel}s</>}. Binnen elke groep tellen punten, dan saldo, dan gemaakte punten.
                In ronde 1 speelt seed 1 tegen de laatste seed, 2 tegen de voorlaatste, …
                {bestNum > 0 && <> De beste 1ste speelt dus tegen de slechtste {nthLabel} die doorgaat.</>}
              </p>
              <p>Nooit twee ploegen uit dezelfde poule in ronde 1. Latere rondes vullen zich automatisch zodra je scores ingeeft.</p>
              <p>Pas je daarna nog een poulescore aan, dan wordt het schema opnieuw geloot, tot de eerste knock-outmatch gespeeld is. Vanaf dan ligt alles vast.</p>
            </InfoButton>
          </div>

          <p style={{ margin: "0 0 0.9rem", fontSize: "0.875rem", lineHeight: 1.6 }}>
            {koStarted ? (
              <><span className="badge badge--green">Bezig</span>{" "}De knock-out is begonnen; het schema ligt vast.</>
            ) : koMatches.length ? (
              <><span className="badge badge--green">Klaar</span>{" "}Schema opgemaakt, eerste knock-outmatch om <strong>{hhmm(koStartAt)}</strong>.</>
            ) : groupMatches.length ? (
              <span style={{ color: "var(--text-2)" }}>
                Wordt automatisch opgemaakt na de laatste poulematch (nog {groupOpen} open).
                {koStartAt > 0 && <> Verwachte start: <strong style={{ color: "var(--text)" }}>{hhmm(koStartAt)}</strong>.</>}
              </span>
            ) : (
              <span style={{ color: "var(--text-2)" }}>Maak eerst de poulewedstrijden aan.</span>
            )}
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: "1rem", marginBottom: "0.5rem" }}>
            <div className="form-field" style={{ margin: 0 }}>
              <label htmlFor="ko-adv">Door per poule</label>
              <input id="ko-adv" type="number" min="1" max="8" value={advPerPoule} style={{ width: "6rem" }}
                onChange={(e) => setAdvPerPoule(e.target.value)} />
            </div>
            <div className="form-field" style={{ margin: 0 }}>
              <label htmlFor="ko-best">+ beste {nthLabel}s</label>
              <input id="ko-best" type="number" min="0" max={groupPouleCount || 32} value={bestNths} style={{ width: "6rem" }}
                onChange={(e) => setBestNths(e.target.value)} />
            </div>
            <div className="form-field" style={{ margin: 0 }}>
              <label htmlFor="ko-pause">Pauze na de poules</label>
              <input id="ko-pause" type="number" min="0" max="240" value={koPause} style={{ width: "6rem" }}
                onChange={(e) => setKoPause(e.target.value)} />
            </div>
            <div className="form-field" style={{ margin: 0 }}>
              <label htmlFor="ko-slot">Min. per match 1/16, 1/8</label>
              <input id="ko-slot" type="number" min="5" max="120" value={koSlot} placeholder={String(groupSlot)} style={{ width: "6rem" }}
                onChange={(e) => setKoSlot(e.target.value)} />
            </div>
            <div className="form-field" style={{ margin: 0 }}>
              <label htmlFor="ko-finals-slot">Min. vanaf kwartfinale</label>
              <input id="ko-finals-slot" type="number" min="5" max="120" value={koFinalsSlot} style={{ width: "6rem" }}
                onChange={(e) => setKoFinalsSlot(e.target.value)} />
            </div>
            <div className="form-field" style={{ margin: 0 }}>
              <label htmlFor="ko-break">Pauze tussen rondes</label>
              <input id="ko-break" type="number" min="0" max="120" value={koBreak} style={{ width: "6rem" }}
                onChange={(e) => setKoBreak(e.target.value)} />
            </div>
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.875rem", margin: "0.5rem 0 0.9rem" }}>
            <input type="checkbox" checked={koConsolation}
              onChange={(e) => setKoConsolation(e.target.checked)} />
            Kleine finale (3de plaats)
          </label>

          <p style={{ margin: "0 0 0.9rem", fontSize: "0.875rem", color: "var(--text-2)" }}>
            {groupPouleCount > 0 ? (
              <>
                <strong style={{ color: "var(--text)" }}>{koTeamCount} ploegen door</strong>: top {advNum} van
                elk van de {groupPouleCount} poules ({groupPouleCount * advNum})
                {bestNum > 0 && <> + de {Math.min(bestNum, groupPouleCount)} beste {nthLabel}s</>}.
              </>
            ) : (
              <>Top {advNum} per poule{bestNum > 0 && <> + de {bestNum} beste {nthLabel}s</>}.</>
            )}
            {groupPouleCount > 0 && koTeamCount > 0 && (koTeamCount & (koTeamCount - 1)) !== 0 && (
              <span style={{ display: "block", marginTop: "0.35rem", color: "var(--warn-fg)" }}>
                {koTeamCount} is geen macht van 2: de hoogste seeds krijgen een vrijloting in ronde 1.
              </span>
            )}
          </p>

          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <button type="button" className="btn-sm btn-sm--primary" onClick={saveFormat}
              disabled={savingFormat || !formatDirty || advNum < 1}>
              {savingFormat ? "Opslaan…" : "Instellingen opslaan"}
            </button>
            {formatNote && <span style={{ fontSize: "0.8rem", color: "var(--text-2)" }}>{formatNote}</span>}
            {koStarted && formatDirty && (
              <span style={{ fontSize: "0.8rem", color: "var(--warn-fg)" }}>De knock-out is al bezig: dit verandert het schema niet meer.</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
