"use client";

import { Save } from "lucide-react";
import { useState } from "react";
import { apiFetch } from "@/lib/api";
import type { ActiveTournament } from "@/lib/tournament-types";
import { slotMinutes as slotMinutesOf } from "@/lib/tournament-live";
import { InfoButton } from "@/components/admin/info-button";
import { Notice, NumberField, Panel, Subhead } from "@/components/admin/ui";

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

  const groupMatchCount = groupMatches.length;
  const isPowerOfTwo = koTeamCount > 0 && (koTeamCount & (koTeamCount - 1)) === 0;

  return (
    <div className="flex flex-col gap-5">
      {/* ── 1. Poules loten ─────────────────────────────── */}
      <Panel
        id="draw"
        collapsible
        defaultOpen={groupPouleCount === 0}
        step={groupPouleCount > 0 ? "done" : 1}
        title="Poules loten"
        description={groupPouleCount > 0
          ? `${groupPouleCount} poules geloot. Opnieuw loten wist de poules en poulewedstrijden.`
          : "Verdeelt de teams willekeurig over poules."}
        info={
          <InfoButton title="Poules loten">
            <p>Verdeelt de teams willekeurig over poules (Poule A, B, C…). De poules verschillen hoogstens één team in grootte.</p>
            <p>Met <strong>Enkel aanwezige teams</strong> tellen alleen ploegen die ingecheckt zijn.</p>
            <p><strong>Opnieuw genereren wist de bestaande poules en poulewedstrijden.</strong></p>
          </InfoButton>
        }
      >
        <div className="flex flex-col gap-4">
          {drawError && <Notice tone="err">{drawError}</Notice>}
          {drawNote && <Notice tone="ok">✓ {drawNote}</Notice>}
          <div className="flex flex-wrap items-end gap-4">
            <NumberField id="draw-size" label="Teams per poule" min={2} max={16} value={perPoule} onChange={setPerPoule} />
            <label className="form-checkbox" style={{ paddingBottom: "0.6rem" }}>
              <input type="checkbox" checked={onlyPresent}
                onChange={(e) => setOnlyPresent(e.target.checked)} />
              Enkel aanwezige teams
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" className={`btn-sm ${groupPouleCount > 0 ? "btn-sm--ghost" : "btn-sm--primary"}`}
              onClick={drawPoules}
              disabled={drawing || drawTeamCount < 2 || perPouleNum < 2 || Number.isNaN(perPouleNum)}>
              {drawing ? "Loten…" : groupPouleCount > 0 ? "Opnieuw loten" : "Poules loten"}
            </button>
            {drawPouleCount > 0 && (
              <span className="text-[13px] text-ink-2">{drawTeamCount} teams → {drawPouleCount} poules</span>
            )}
          </div>
        </div>
      </Panel>

      {/* ── 2. Poulewedstrijden ─────────────────────────── */}
      <Panel
        id="gen"
        collapsible
        defaultOpen={groupMatchCount === 0}
        step={groupMatchCount > 0 ? "done" : 2}
        title="Poulewedstrijden genereren"
        description={groupMatchCount > 0
          ? `${groupMatchCount} wedstrijden ingepland. Opnieuw genereren wist ook hun scores.`
          : groupPouleCount === 0 ? "Loot eerst de poules." : "Plant alle poulewedstrijden over de banen."}
        info={
          <InfoButton title="Poulewedstrijden">
            <p>Elke baan krijgt vaste poules. Poules die een baan delen spelen om beurten, zoals in 2025: baan 1 = poule A en B.</p>
            <p>Er spelen nooit meer wedstrijden tegelijk dan er banen zijn.</p>
            <p><strong>Opnieuw genereren wist de bestaande poulewedstrijden.</strong></p>
          </InfoButton>
        }
      >
        <div className="flex flex-col gap-4">
          {genError && <Notice tone="err">{genError}</Notice>}
          {genNote && <Notice tone="ok">✓ {genNote}</Notice>}
          <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
            <div className="form-field" style={{ width: 240 }}>
              <label htmlFor="gen-start">Eerste wedstrijd</label>
              <input id="gen-start" type="datetime-local" value={startTime}
                onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <NumberField id="gen-slot" label="Per match" suffix="min" min={5} max={120} step={5} value={slotMinutes} onChange={setSlotMinutes} />
            <NumberField id="gen-tracks" label="Banen" min={1} max={40} value={trackCount} onChange={setTrackCount} />
          </div>
          <div>
            <button type="button" className={`btn-sm ${groupMatchCount > 0 ? "btn-sm--ghost" : "btn-sm--primary"}`}
              onClick={() => generate("poules")}
              disabled={generating !== "" || groupPouleCount === 0 || !startTime}>
              {generating === "poules" ? "Genereren…" : groupMatchCount > 0 ? "Opnieuw genereren" : "Wedstrijden genereren"}
            </button>
          </div>
        </div>
      </Panel>

      {/* ── 3. Knock-out ────────────────────────────────── */}
      <Panel
        id="ko"
        collapsible
        defaultOpen={!koStarted}
        step={koMatches.length > 0 ? "done" : 3}
        title="Knock-out"
        description="Wordt automatisch opgemaakt na de laatste poulematch, met deze instellingen."
        info={
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
        }
      >
        <div className="flex flex-col gap-4">
          <Notice tone={koStarted || koMatches.length ? "ok" : "info"}>
            {koStarted ? (
              <>De knock-out is begonnen; het schema ligt vast.</>
            ) : koMatches.length ? (
              <>Schema opgemaakt, eerste knock-outmatch om <strong>{hhmm(koStartAt)}</strong>.</>
            ) : groupMatches.length ? (
              <>
                Nog {groupOpen} poulewedstrijd{groupOpen === 1 ? "" : "en"} open.
                {koStartAt > 0 && <> Verwachte start: <strong className="text-ink">{hhmm(koStartAt)}</strong>.</>}
              </>
            ) : (
              <>Maak eerst de poulewedstrijden aan.</>
            )}
          </Notice>

          <div>
            <Subhead>Wie gaat door</Subhead>
            <div className="flex flex-wrap items-end gap-4">
              <NumberField id="ko-adv" label="Door per poule" min={1} max={8} value={advPerPoule} onChange={setAdvPerPoule} />
              <NumberField id="ko-best" label={`+ beste ${nthLabel}s`} min={0} max={groupPouleCount || 32} value={bestNths} onChange={setBestNths} />
              <label className="form-checkbox" style={{ paddingBottom: "0.6rem" }}>
                <input type="checkbox" checked={koConsolation}
                  onChange={(e) => setKoConsolation(e.target.checked)} />
                Kleine finale (3de plaats)
              </label>
            </div>
            <p className="mt-3 text-[13px] text-ink-2">
              {groupPouleCount > 0 ? (
                <>
                  <strong className="text-ink">{koTeamCount} ploegen door</strong>: top {advNum} van
                  elk van de {groupPouleCount} poules ({groupPouleCount * advNum})
                  {bestNum > 0 && <> + de {Math.min(bestNum, groupPouleCount)} beste {nthLabel}s</>}.
                </>
              ) : (
                <>Top {advNum} per poule{bestNum > 0 && <> + de {bestNum} beste {nthLabel}s</>}.</>
              )}
            </p>
            {groupPouleCount > 0 && koTeamCount > 0 && !isPowerOfTwo && (
              <Notice tone="warn" className="mt-2">
                {koTeamCount} is geen macht van 2: de hoogste seeds krijgen een vrijloting in ronde 1.
              </Notice>
            )}
          </div>

          <div>
            <Subhead>Timing</Subhead>
            <div className="flex flex-wrap gap-x-6 gap-y-4">
              <NumberField id="ko-pause" label="Pauze na poules" suffix="min" min={0} max={240} step={5} value={koPause} onChange={setKoPause} />
              <NumberField id="ko-slot" label="Match 1/16 en 1/8" suffix="min" min={5} max={120} step={5} value={koSlot} placeholder={String(groupSlot)} onChange={setKoSlot} />
              <NumberField id="ko-finals-slot" label="Match vanaf kwartfinale" suffix="min" min={5} max={120} step={5} value={koFinalsSlot} onChange={setKoFinalsSlot} />
              <NumberField id="ko-break" label="Pauze tussen rondes" suffix="min" min={0} max={120} step={5} value={koBreak} onChange={setKoBreak} />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t border-rule pt-4">
            <button type="button" className="btn-sm btn-sm--primary" onClick={saveFormat}
              disabled={savingFormat || !formatDirty || advNum < 1}>
              <Save size={13} strokeWidth={1.75} aria-hidden /> {savingFormat ? "Opslaan…" : "Instellingen opslaan"}
            </button>
            {formatNote && <span className="text-[13px] text-ink-2">{formatNote}</span>}
            {!formatDirty && !formatNote && <span className="text-[13px] text-ink-2">Geen wijzigingen.</span>}
            {koStarted && formatDirty && (
              <span className="text-[13px]" style={{ color: "var(--warn-fg)" }}>De knock-out is al bezig: dit verandert het schema niet meer.</span>
            )}
          </div>
        </div>
      </Panel>
    </div>
  );
}
