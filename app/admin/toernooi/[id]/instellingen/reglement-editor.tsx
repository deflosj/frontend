"use client";

import { Save } from "lucide-react";
import { useState } from "react";
import { apiFetch } from "@/lib/api";
import type { ActiveTournament } from "@/lib/tournament-types";
import { Notice, Panel } from "@/components/admin/ui";

// ── Default rules text ────────────────────────────────────────────────────────

const DEFAULT_RULES = `── Fairplay en bandjes ──

De wedstrijd heeft een puur recreatief karakter, dus we rekenen op fairplay van elk team. Bij onenigheid neemt de aangeduide scheidsrechter de definitieve beslissing. Basisregel: De Flosj heeft altijd gelijk!

Elk team ontvangt vier spelersbandjes. Deze moeten tijdens het toernooi gedragen worden en zijn niet uitwisselbaar.

── Ploegen en opstelling ──

Er wordt verplicht gespeeld in ploegen van vier spelers (uitzondering: eerste poulewedstrijd). Indien een team vanaf de tweede wedstrijd met minder dan vier spelers aantreedt, krijgt het andere team automatisch een forfaitoverwinning (5–0).

Per spelronde moet elk team afwisselend twee verschillende spelers opstellen. Met uitzondering van de eerste poulewedstrijd mag een speler nooit twee spelletjes na elkaar spelen. Speler 1 en 2 blijven aan de ene kant, speler 3 en 4 aan de andere kant van het terrein.

── Poulefase ──

Er wordt gespeeld in poules van 4 ploegen. De eerste twee ploegen in de stand gaan automatisch door naar de volgende ronde. Daarnaast stoten ook de acht beste derdes door naar de 1/16 finales.

Elk team (of een afgevaardigde) moet 15 minuten voor de eerste wedstrijd aanwezig zijn. Niet tijdig aanwezig zijn resulteert in een forfait voor de volgende wedstrijd. Na twee forfaitnederlagen eindigt het toernooi voor het betrokken team.

── Punten en rangschikking ──

Winst: 2 punten | Gelijkspel: 1 punt | Verlies: 0 punten

Bij gelijke stand na de poulefase gelden de volgende criteria in volgorde:
1. Aantal gemaakte ballen
2. Aantal ballen tegen
3. Verschil: gemaakte ballen – ballen tegen
4. Aantal gewonnen wedstrijden
5. Aantal verloren wedstrijden
6. Onderling resultaat
7. Indien nog steeds gelijk: één speler van elk team gooit één bal; wie het dichtst bij het cochonnet ligt, gaat door.

── Spelverloop ──

Voor elke wedstrijd bepaalt een toss welke ploeg mag starten.

Het team dat de toss wint, werpt het cochonnet uit (tussen de 6 m en 9 m om geldig te zijn) en speelt vervolgens de eerste bal. De ploeg met de bal het dichtst bij het cochonnet scoort één punt per beter geplaatste bal dan de beste bal van de tegenstander.

De ploeg met de meeste punten wint. Er is geen puntenlimiet. Per werpbeurt krijgt elk team zes ballen.

Ballen die volledig over het koord gaan, zijn buiten en tellen niet meer mee.

── Timing en forfait ──

Poulewedstrijden duren 15 minuten en stoppen exact na 15 minuten. Er worden geen ballen meer gegooid zodra het eindsignaal klinkt. Wanneer de 20 minuten verstreken zijn, wordt de lopende mène nog uitgespeeld.

Wanneer een team niet komt opdagen of met onvoldoende spelers verschijnt, verliest het met 0–5 (forfait).

── Beeldmateriaal ──

Door deel te nemen aan dit toernooi geef je toestemming aan De Flosj om foto's te maken en deze te publiceren op sociale media.

── Zuipbeker ──

Bij aanvang van het toernooi wordt elk team gevraagd of het wil deelnemen aan de Zuipbeker. Voor elk deelnemend team wordt het aantal geconsumeerde alcoholische dranken bijgehouden aan de togen van De Flosj met streepjes op een lijst. Per bestelling kunnen maximaal vier streepjes worden genoteerd. Streepjes worden enkel gezet op vertoon van het spelersbandje. Een team kan enkel streepjes laten bijzetten voor het eigen team.

Ook hier geldt: De Flosj heeft altijd gelijk!`;

// ── Tab: Reglement ────────────────────────────────────────────────────────────

export function ReglementEditor({
  tournament,
  onUpdate,
}: Readonly<{
  tournament: ActiveTournament;
  onUpdate: (t: ActiveTournament) => void;
}>) {
  const [text, setText] = useState(tournament.rules ?? DEFAULT_RULES);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");
  const [saved, setSaved]   = useState(false);

  async function save() {
    setError(""); setSaving(true);
    try {
      const saved = await apiFetch<{ rules: string; rulesUpdatedAt: string }>(
        `tournaments/${tournament.id}/rules`,
        { method: "PUT", body: JSON.stringify({ rules: text }) }
      );
      onUpdate({ ...tournament, rules: saved.rules, rulesUpdatedAt: saved.rulesUpdatedAt });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Opslaan mislukt.");
    } finally { setSaving(false); }
  }

  const updated = tournament.rulesUpdatedAt
    ? new Date(tournament.rulesUpdatedAt).toLocaleString("nl-BE", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <Panel
      id="rules"
      title="Reglement"
      description={updated ? `Laatst opgeslagen op ${updated}. Wordt getoond op de publieke toernooipagina.` : "Wordt getoond op de publieke toernooipagina."}
      actions={
        <>
          {saved && <span className="text-[13px] font-medium text-[var(--ok-fg)]">✓ Opgeslagen</span>}
          <button type="button" className="btn-sm btn-sm--primary" onClick={save} disabled={saving}>
            <Save size={13} strokeWidth={1.75} aria-hidden /> {saving ? "Opslaan…" : "Opslaan"}
          </button>
        </>
      }
    >
      {error && <Notice tone="err" className="mb-3">{error}</Notice>}
      <p className="mb-2 text-xs text-ink-2">Een regel als <span className="mono">── Titel ──</span> wordt een kop op de site.</p>
      <textarea
        value={text}
        onChange={(e) => { setText(e.target.value); setSaved(false); }}
        rows={24}
        aria-label="Reglement tekst"
        className="w-full rounded-xl border border-rule bg-paper p-3.5 font-mono text-[13px] leading-[1.7] text-ink outline-none focus:border-pink"
        style={{ resize: "vertical" }}
      />
    </Panel>
  );
}
