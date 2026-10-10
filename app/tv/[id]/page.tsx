import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getTournament } from "@/lib/tournament-helpers";
import { TvScreen } from "./tv-screen";

export const metadata: Metadata = { title: "TV-scherm" };

/** Scherm voor een tv op het terrein: wisselt zelf tussen banen, standen en finales. */
export default async function TvPage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  const tournament = await getTournament(id);
  if (!tournament) notFound();
  return <TvScreen tournament={{ ...tournament, id: Number(id) }} />;
}
