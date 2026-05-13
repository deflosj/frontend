import type { Metadata } from "next";

import { SectionHeading } from "@/components/section-heading";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  description: `Meer over ${siteConfig.name}: missie, sfeer en organisatie.`,
  title: "Over ons",
};

export default function AboutPage() {
  return (
    <div className="page-shell">
      <SectionHeading
        eyebrow="Over ons"
        title="Een vereniging met een duidelijke stijl en een nuchtere aanpak"
        description="Deze pagina legt uit wie De Flosj is, waarom de vereniging bestaat en welke rol de site speelt binnen het bredere geheel."
      />

      <div className="info-grid">
        <article className="content-box">
          <h3>Waar we voor staan</h3>
          <p>
            De eerste versie van de frontend kiest voor duidelijke informatie, warme kleuren en een
            directe structuur. Zo voelt de site vertrouwd voor leden en bezoekers, terwijl de
            backend later zonder breuklijnen kan worden aangesloten.
          </p>
        </article>

        <article className="content-box">
          <h3>Hoe we werken</h3>
          <p>
            Content wordt gegroepeerd rond de belangrijkste acties: meedoen, het toernooi volgen,
            de dorpskoers ontdekken en contact opnemen met de organisatie.
          </p>
        </article>

        <article className="content-box">
          <h3>Wat later kan groeien</h3>
          <p>
            Nieuws, ledeninformatie en beheerde content kunnen later rechtstreeks uit het backend
            komen zonder dat de publieke structuur opnieuw moet worden uitgevonden.
          </p>
        </article>

        <article className="content-box">
          <h3>Waarom dit nu nuttig is</h3>
          <p>
            De site is bruikbaar als eerste release en vormt tegelijk een stabiele basis voor data,
            authenticatie en beheerde inhoud uit de API.
          </p>
        </article>
      </div>
    </div>
  );
}
