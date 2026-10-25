"use client";

import { fmtDateTime } from "@/utils/DateHelpers";
import { Save } from "lucide-react";
import { useState } from "react";
import { apiFetch } from "@/lib/api";
import type { ActiveTournament } from "@/lib/tournament-types";
import { Notice, Panel } from "@/components/admin/ui";

// ── Default rules text ────────────────────────────────────────────────────────

const DEFAULT_RULES = `── Fairplay en bandjes ──

- Het toernooi is puur recreatief: we rekenen op fairplay van elk team.
- Bij onenigheid beslist de aangeduide scheidsrechter. Die beslissing is definitief.
- Elk team krijgt vier spelersbandjes.
- De bandjes draag je het hele toernooi en ze zijn niet uitwisselbaar.
- Basisregel: De Flosj heeft altijd gelijk!

── Ploegen en opstelling ──

- Je speelt verplicht met vier spelers per ploeg.
- Uitzondering: de eerste poulewedstrijd mag je met twee of drie spelers spelen.
- Vanaf de tweede wedstrijd minder dan vier spelers? Dan verlies je die wedstrijd met forfait.
- Per mène spelen twee spelers van elk team.
- Speler 1 en 2 vormen een duo, speler 3 en 4 het andere duo.
- De duo's wisselen elke mène af: een speler speelt nooit twee mènes na elkaar.
- Speler 1 en 2 blijven aan de ene kant van het terrein, speler 3 en 4 aan de andere kant.
- In de eerste poulewedstrijd geldt de wisselregel niet.

── Poulefase en aanwezigheid ──

- 12 poules van 4 ploegen.
- De eerste twee van elke poule gaan door naar de 1/16 finales.
- De acht beste derdes gaan ook door naar de 1/16 finales.
- Elk team (of een afgevaardigde) is ten laatste 15 minuten voor zijn eerste wedstrijd aanwezig.
- Niet tijdig aanwezig? Dan verlies je die wedstrijd met forfait.
- Na twee forfaitnederlagen is het toernooi voorbij voor dat team.

── Punten en rangschikking ──

Winst: 2 punten | Gelijkspel: 1 punt | Verlies: 0 punten

Gelijk in punten na de poulefase? Dan gelden deze criteria, in deze volgorde:
1. Onderling resultaat (enkel bij twee teams uit dezelfde poule)
2. Puntenverschil: gescoorde punten min punten tegen
3. Meeste gescoorde punten
4. Minste punten tegen
5. Nog steeds gelijk: één speler per team gooit één bal; wie het dichtst bij het cochonnet ligt, gaat door.

- Voor de acht beste derdes gelden de criteria 2 tot en met 5.

── Spelverloop ──

- Voor elke wedstrijd bepaalt een toss welke ploeg start.
- De winnaar van de toss tekent een werpcirkel en werpt het cochonnet uit.
- Het cochonnet is geldig tussen 6 en 9 meter van de cirkel.
- Daarna speelt dat team de eerste bal.
- Het andere team werpt tot het de leiding overneemt, enzovoort, tot alle ballen gespeeld zijn.
- Elke bal werp je vanuit de cirkel, met beide voeten in de cirkel en op de grond.
- Per mène heeft elk team zes ballen: elk van de twee spelers werpt er drie.
- Na elke mène scoort de ploeg met de dichtste bal één punt per bal die beter ligt dan de beste bal van de tegenstander.
- De ploeg met de meeste punten wint. Er is geen puntenlimiet.
- Gemeten wordt van de dichtste rand van het cochonnet tot de dichtste rand van de bal.
- Twijfel over wie het dichtst ligt? De scheidsrechter meet op.
- De winnaar van de mène start de volgende mène en tekent een nieuwe cirkel waar het cochonnet lag.

── Buiten terrein ──

- Een bal die volledig over het koord (terreinrand) gaat, is buiten en telt niet meer mee.
- Het cochonnet is uit het spel als het tijdens een mène volledig over het koord gaat. Dan hangt het af van de ballen die nog in de hand zijn:
1. Beide ploegen hebben nog ballen → de mène is ongeldig, geen punten. De winnaar van de vorige mène (of de toss) start opnieuw.
2. Eén ploeg heeft nog ballen, de andere niet → die ploeg krijgt evenveel punten als ze nog ballen heeft.
3. Geen van beide ploegen heeft nog ballen → de mène is ongeldig, geen punten. De winnaar van de vorige mène (of de toss) start opnieuw.

Voorbeeld: het cochonnet gaat uit het spel. Ploeg A heeft geen ballen meer, ploeg B heeft er nog twee in de hand. Ploeg B krijgt 2 punten.

── Timing en forfait ──

- Poulewedstrijden duren 15 minuten en stoppen exact na 15 minuten, ook als er nog ballen te werpen zijn.
- Na het eindsignaal wordt er geen bal meer gegooid. De ballen worden geteld zoals ze liggen: dat is de eindstand.
- Finalewedstrijden duren 20 minuten. Daarna wordt de lopende mène nog uitgespeeld.
- Daarna nog gelijk? Dan volgt één beslissende extra mène.
- Niet (tijdig) aanwezig, of vanaf de tweede wedstrijd minder dan vier spelers: je verliest die wedstrijd met 0–5 (forfait).
- In de finalerondes betekent een forfait dat je uitgeschakeld bent.

── Beeldmateriaal ──

- Door deel te nemen geef je De Flosj toestemming om foto's te maken en die op sociale media te publiceren.

── Zuipbeker ──

- Een aparte, ludieke competitie naast het toernooi.
- Bij de start vragen we elk team of het meedoet. Enkel teams die dan bevestigen, doen mee.
- Per deelnemend team houden we het aantal alcoholische dranken bij.
- Dat gebeurt met streepjes op een lijst aan de togen van De Flosj (niet in Café De Zijbeuk).
- Elke alcoholische consumptie is één streepje, met maximaal vier streepjes per bestelling.
- Streepjes worden enkel gezet op vertoon van het spelersbandje.
- Je laat enkel streepjes zetten voor je eigen team. Wie dat toch voor een ander team doet, riskeert forfaitscores in het petanquetoernooi.
- Ook hier geldt: De Flosj heeft altijd gelijk!`;

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
    ? fmtDateTime(tournament.rulesUpdatedAt, { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })
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
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-ink-2">
          <span className="mono">── Titel ──</span> wordt een kop, <span className="mono">- tekst</span> een opsommingspunt en <span className="mono">1. tekst</span> een genummerde lijst.
        </p>
        {text.trim() !== DEFAULT_RULES.trim() && (
          <button type="button" className="btn-sm btn-sm--ghost"
            onClick={() => {
              if (globalThis.confirm("De tekst vervangen door het reglement 2026? Vergeet daarna niet op te slaan.")) {
                setText(DEFAULT_RULES); setSaved(false);
              }
            }}>
            Reglement 2026 invullen
          </button>
        )}
      </div>
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
