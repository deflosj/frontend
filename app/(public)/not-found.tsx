import Link from "next/link";

export default function NotFound() {
  return (
    <div className="page-shell">
      <div className="hero__panel">
        <p className="hero__eyebrow">404</p>
        <h1 className="page-title">Pagina niet gevonden</h1>
        <p className="page-lead">
          De gevraagde pagina bestaat niet of is nog niet gepubliceerd in deze eerste versie.
        </p>
        <div className="hero__actions">
          <Link className="button" href="/">
            Terug naar de startpagina
          </Link>
        </div>
      </div>
    </div>
  );
}
