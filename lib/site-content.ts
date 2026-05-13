export type FeatureCard = {
  eyebrow: string;
  title: string;
  description: string;
  href: string;
};

export type ProgramItem = {
  time: string;
  title: string;
  description: string;
};

export type Sponsor = {
  name: string;
  category: string;
};

export const homeHighlights = [
  {
    label: "Jaarlijks toernooi",
    value: "Petranque",
  },
  {
    label: "Dorpelingenkoers",
    value: "Open voor iedereen",
  },
  {
    label: "Gedragen door",
    value: "Vrijwilligers",
  },
] as const;

export const featureCards: FeatureCard[] = [
  {
    eyebrow: "Toernooi",
    title: "Jaarlijks petanquetornooi",
    description:
      "Elk jaar organiseert De Flosj een groot petanquetornooi in Rotselaar. Ploegen uit de regio strijden in een gezellige sfeer om de overwinning.",
    href: "/toernooi",
  },
  {
    eyebrow: "Dorpelingenkoers",
    title: "Fietskoers voor het hele dorp",
    description:
      "Geen profs, wel veel sfeer. De dorpelingenkoers is open voor iedereen uit de regio. Supporters langs de kant, deelnemers op de fiets.",
    href: "/dorpelingenkoers",
  },
  {
    eyebrow: "Over ons",
    title: "Een vereniging uit Rotselaar",
    description:
      "De Flosj is een actieve vzw gedragen door vrijwilligers. Wij brengen sport en gemeenschap samen in evenementen waar iedereen welkom is.",
    href: "/over",
  },
] as const;

export const weeklyProgram: ProgramItem[] = [
  {
    time: "08:30",
    title: "Opbouw en ontvangst",
    description: "Vrijwilligers en organisatie zetten alles klaar voor een vlotte start.",
  },
  {
    time: "10:00",
    title: "Start van de wedstrijden",
    description: "De eerste reeksen starten met een duidelijke indeling en begeleiding.",
  },
  {
    time: "15:00",
    title: "Dorpelingenkoers",
    description: "Het publieksmoment van de dag: koers, sfeer en lokale supporters.",
  },
  {
    time: "19:30",
    title: "Prijsuitreiking en ontmoeting",
    description: "De dag sluit af met dankwoord, prijzen en een moment voor de community.",
  },
];

export const sponsors: Sponsor[] = [
  { name: "Lokale Horeca", category: "partner" },
  { name: "Bouwgroep", category: "hoofdsponsor" },
  { name: "Sportwinkel", category: "materiaal" },
  { name: "Gemeente", category: "steun" },
];
