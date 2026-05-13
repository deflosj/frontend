import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-5 text-center">
      <p className="mb-3 text-[0.6875rem] font-semibold uppercase tracking-widest text-pink">
        404
      </p>
      <h1 className="mb-4 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
        Pagina niet gevonden
      </h1>
      <p className="mb-8 max-w-sm text-base leading-relaxed text-ink-2">
        De gevraagde pagina bestaat niet of is nog niet gepubliceerd in deze versie.
      </p>
      <Link
        href="/"
        className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-paper transition-colors hover:bg-ink/80"
      >
        Terug naar de startpagina
      </Link>
    </div>
  );
}
