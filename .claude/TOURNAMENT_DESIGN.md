# Tornooi — Design & Feature Spec

## Status van bestaande implementatie

De volgende features zijn al gebouwd en werken:

- **Admin panel** `/admin/toernooi/[id]` met tabs: Overzicht · Teams · Schema · Reglement
- **Teams** — toevoegen, bewerken, verwijderen, aanwezigheid togglen, toewijzen aan poule
- **Schema** — inline match-editing (score, tijd, baan, teams wisselen)
- **Visueel** — groene achtergrond + gekleurde linker border op ingevulde matchen
- **Wedstrijden genereren** — automatisch: 1v3, 2v4 → 1v4, 2v3 → 1v2, 3v4
- **Vertraging** — alle komende matchen X minuten verschuiven
- **Reglement** — vrije tekstbewerking per tornooi
- **Rollen** — `REFEREE` rol bestaat in het systeem maar heeft nog geen eigen portaal

---

## Nog te bouwen

### 1. Tornooi aanmaken — configuratiewizard

Bij het aanmaken van een nieuw tornooi moet de admin een wizard doorlopen:

| Stap | Veld | Type |
|------|------|------|
| 1 | Naam + jaar | text / number |
| 2 | Aantal teams | number |
| 3 | Aantal teams per poule | number (bijv. 4) |
| 4 | Aantal teams dat automatisch doorgaat per poule | number (bijv. top 2) |
| 5 | Aantal beste N-de plaatsen dat extra doorgaat | number + welke plaats (bijv. 8 beste 3des) |
| 6 | Speelduur per match (in minuten) | number (bijv. 15) |
| 7 | Aantal beschikbare banen/tracks | number |
| 8 | Starttijd tornooi | time |

Op basis van stap 2–5 berekent het systeem automatisch:
- Hoeveel poules er nodig zijn
- Welke KO-ronde volgt (R16 / R8 / kwartfinale / halve finale / finale)
- Totaal aantal matchen

> **Voorstel (te bevestigen):** Tijdslot-generator — op basis van speelduur + aantal banen berekent het systeem automatisch de starttijden van alle poule-matchen.

---

### 2. Tiebreakers

Wanneer meerdere teams gelijk eindigen op een doorstootpositie, moet dit opgelost kunnen worden.

- Tiebreaker-matches zijn al als `phase: "TIEBREAK"` gedefinieerd in de types
- **UI nodig:** duidelijke indicatie in de poulestand welke teams in een tiebreaker zitten (bijv. oranje badge of rij)
- Admin kan een tiebreaker-match aanmaken voor de betrokken teams
- Na het invullen van de score wordt automatisch de doorgestoten ploeg bepaald
- Tiebreaker-matches zijn zichtbaar in het schema, apart gegroepeerd of met een label

---

### 3. Referee portaal — `/referee` of `/scheidsrechter`

Aparte omgeving voor gebruikers met de `REFEREE` rol (bestaat al in `routePermissions.ts`).

**Toegang:**
- Eigen login-flow of via bestaande auth met role-check
- Geen toegang tot de volledige admin panel

**Functionaliteiten:**
- Lijst van lopende/komende matchen voor het actieve tornooi
- Per match: score invullen (A – B) en opslaan
- Geen toegang tot: teams bewerken, tijden wijzigen, banen wijzigen, tornooi-instellingen

**UI:**
- Simpele, grote interface — makkelijk op telefoon/tablet
- Duidelijk welke match gespeeld wordt (baan, tijd, teams)
- Bevestigingsscherm na opslaan van score

> **Voorstel (te bevestigen):** Optioneel: referee ziet alleen de matchen op zijn/haar toegewezen baan (filter op track).

---

### 4. Aanvullende suggesties

#### 4a. Forfait-knop
Snelle actie per match om een forfait te registreren (automatisch 5–0 voor het aanwezige team). Scheelt manueel invullen bij no-show.

#### 4b. Schermweergave / TV-modus
Publieke read-only pagina die automatisch refresht — bedoeld voor een scherm in de zaal. Toont huidige matchen, standen, volgende matchen. Geen auth vereist.

#### 4c. Poule-stand automatisch vernieuwen
Admin schema-pagina refresht de standen automatisch na het opslaan van een score (dit werkt al client-side, maar nakijken of de bracket/KO-fase ook live bijwerkt).

#### 4d. Match-log / audit trail
Per match bijhouden wie de score heeft gewijzigd en wanneer. Nuttig bij discussies achteraf. Kan simpel: `updatedBy` + `updatedAt` veld op een match.

#### 4e. Bracket/KO-schema bewerken
Op dit moment is er al een `/brackets` pagina in de publieke view. De admin moet de KO-matchen ook kunnen invullen (score, tijd, baan). Controleer of de `SchemaTab` dit al dekt of enkel GROUP-matchen toont.

> **Huidige code:** `SchemaTab` filtert op `groupPoules` — KO-matchen zijn nog niet bewerkbaar via de admin UI.

---

## Rollenmatrix

| Functie | Admin/Superadmin | Referee | Publiek |
|---------|-----------------|---------|---------|
| Tornooi aanmaken | ✓ | — | — |
| Teams beheren | ✓ | — | — |
| Matchen genereren | ✓ | — | — |
| Score wijzigen | ✓ | ✓ | — |
| Tijd/baan/teams wijzigen | ✓ | — | — |
| Vertraging toepassen | ✓ | — | — |
| Reglement bewerken | ✓ | — | — |
| Tiebreaker aanmaken | ✓ | — | — |
| Standen bekijken | ✓ | ✓ | ✓ |
| Schema bekijken | ✓ | ✓ | ✓ |

---

## Openstaande vragen / beslissingen

- [ ] Tijdslot-generator: automatisch of manueel? ja
- [ ] Referee portaal: aparte route `/referee` of subpagina van admin met beperkte rechten? ja
- [ ] Referee: enkel score, of ook tijd bevestigen (als match echt gespeeld is)? ja 
- [ ] Forfait-knop: gewenst? neen
- [ ] TV-modus: gewenst? ja 
- [ ] Match-log/audit: gewenst? nee
- [ ] KO-matchen bewerkbaar maken in admin SchemaTab? ja
