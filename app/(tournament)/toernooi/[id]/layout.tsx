import type { Metadata } from "next";
import Link from "next/link";

import { ThemeToggle } from "@/components/layout/theme-toggle";
import { IconUser } from "@/components/ui/icons/IconUser";
import { getTournament } from "@/lib/tournament-helpers";
import { TournamentNav } from "./tournament-nav";

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
      <div className="flex min-h-screen items-center justify-center px-5">
        <div className="text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted">404</p>
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
      {/* ── Sticky tournament nav ─────────────────────────────── */}
      <div className="sticky top-0 z-40 bg-paper">

        {/* Row 1 — context: back · name · badges · actions */}
        <div className="border-b border-white/6">
          <div className="mx-auto flex h-11 max-w-5xl items-center gap-3 px-5 sm:px-8">

            {/* Back */}
            <Link
              href="/toernooi"
              className="flex shrink-0 items-center gap-1.5 text-ink/40 transition-colors hover:text-ink/70"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path
                  d="M9 11L5 7l4-4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="hidden text-[0.6875rem] font-semibold sm:block">Toernooien</span>
            </Link>

            <div className="h-4 w-px shrink-0 bg-white/10" />

            {/* Name — links to overview */}
            <Link
              href={`/toernooi/${id}`}
              className="min-w-0 flex-1 truncate text-sm font-semibold text-ink transition-colors hover:text-ink/80"
            >
              {tournament.name}
            </Link>

            {/* Live badge */}
            {tournament.isActive && (
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-pink/15 px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-widest text-pink">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-pink" />
                {"Live"}
              </span>
            )}

            {/* Year */}
            <span className="shrink-0 text-xs font-semibold text-ink/20">
              {tournament.year}
            </span>

            <div className="h-4 w-px shrink-0 bg-white/10" />

            {/* Theme toggle */}
            <ThemeToggle />

            {/* Login */}
            <Link
              href="/login"
              aria-label="Inloggen"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink/40 transition-colors hover:bg-ink/10 hover:text-ink"
            >
              <IconUser />
            </Link>
          </div>
        </div>

        {/* Row 2 — tabs */}
        <div className="mx-auto max-w-5xl px-3 sm:px-6">
          <TournamentNav id={id} />
        </div>
      </div>

      {/* ── Page content ─────────────────────────────────────── */}
      <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8">{children}</div>
    </div>
  );
}
