import type { Metadata } from "next";
import Link from "next/link";

import { getTournament } from "@/lib/tournament-helpers";
import { TournamentHeader } from "./tournament-header";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const t = await getTournament(id);
  return {
    title: t ? `${t.name} | Toernooi` : "Toernooi",
    description: t ? `Standen, wedstrijden en finale van ${t.name}.` : undefined,
  };
}

export default async function TournamentDetailLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}>) {
  const { id } = await params;
  const tournament = await getTournament(id);

  if (!tournament) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-5">
        <div className="text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-ink-2">404</p>
          <h1 className="mb-4 text-2xl font-bold text-ink">Toernooi niet gevonden</h1>
          <Link href="/toernooi" className="text-sm font-semibold text-pink hover:underline">
            ← Terug naar overzicht
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <TournamentHeader
        id={id}
        name={tournament.name}
        year={tournament.year}
        isActive={tournament.isActive}
      />

      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">{children}</div>
    </div>
  );
}
