import Link from "next/link";

type Event = {
  id: number;
  title: string;
  startsAt: string;
  location: string | null;
};

async function getEvents(): Promise<Event[]> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api"}/content/events`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];
    return res.json() as Promise<Event[]>;
  } catch {
    return [];
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("nl-BE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function HomePage() {
  const events = await getEvents();

  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="border-b border-rule">
        <div className="mx-auto max-w-5xl px-5 py-14 sm:px-8 sm:py-24">
          <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[1fr_300px] lg:gap-16">
            <div>
              <p className="mb-5 text-[0.6875rem] font-semibold uppercase tracking-widest text-pink">
                Kermiscomité Rotselaar dorp
              </p>
              <h1 className="mb-6 text-4xl font-bold leading-[1.06] tracking-tight text-ink sm:text-5xl lg:text-6xl">
                De Flosj <br /> VZW
              </h1>
              <p className="mb-8 max-w-lg text-base leading-relaxed text-ink-2 sm:text-lg">
                De Flosj VZW is opgericht in 2022 met als doel het dorp van Rotselaar terug leven in te blazen. Dit door geregeld evenementen te organiseren die de mensen dichter bij elkaar brengen. Dit jaar willen we dit doen met volgende evenementen:
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/toernooi"
                  className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-paper transition-colors hover:bg-ink/80"
                >
                  Bekijk het Petanque toernooi
                </Link>
                <Link
                  href="/dorpelingenkoers"
                  className="rounded-full border border-rule px-5 py-2.5 text-sm font-semibold text-ink-2 transition-colors hover:border-ink/20 hover:text-ink"
                >
                  Dorpelingenkoers
                </Link>
              </div>
            </div>

            {/* Events */}
            <div className="grid grid-cols-3 gap-3 lg:grid-cols-1">
              {events.length > 0 ? (
                events.map((event) => (
                  <div
                    key={event.id}
                    className="rounded-2xl border border-rule bg-surface px-4 py-3 lg:px-5 lg:py-4"
                  >
                    <p className="text-[0.6rem] font-semibold uppercase tracking-[0.08em] text-muted sm:text-[0.625rem]">
                      {formatDate(event.startsAt)}
                    </p>
                    <p className="mt-1 text-sm font-bold text-ink lg:text-base">{event.title}</p>
                    {event.location && (
                      <p className="mt-0.5 text-xs text-muted">{event.location}</p>
                    )}
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-rule bg-surface px-4 py-3 lg:px-5 lg:py-4">
                  <p className="text-xs text-muted">Geen evenementen gepland.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
