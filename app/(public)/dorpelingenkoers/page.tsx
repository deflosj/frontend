import type { Metadata } from "next";

import { SectionHeading } from "@/components/section-heading";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  description: `De dorpelingenkoers van ${siteConfig.name}: uitleg en praktische info.`,
  title: "Dorpelingenkoers",
};

const raceDetails = [
  {
    title: "Voor wie",
    text: "Voor inwoners, supporters en deelnemers die de lokale koers willen meemaken.",
  },
  {
    title: "Sfeer",
    text: "Gezellig, toegankelijk en ingebed in de buurt zonder overbodige franje.",
  },
  {
    title: "Praktische aanpak",
    text: "Duidelijke informatie over vertrek, timing, route en contactpunten.",
  },
];

export default function VillageRacePage() {
  return (
    <div className="page-shell">
      <SectionHeading
        eyebrow="Dorpelingenkoers"
        title="Een aparte pagina voor het lokale publiekmoment"
        description="Deze route is bewust eigen, zodat de koers als herkenbaar evenement overeind blijft binnen de site."
      />

      <div className="cards-grid">
        {raceDetails.map((detail) => (
          <article className="card" key={detail.title}>
            <h3>{detail.title}</h3>
            <p className="card__text">{detail.text}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
