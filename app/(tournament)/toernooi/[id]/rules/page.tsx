import { notFound } from "next/navigation";

import { getTournament } from "@/lib/tournament-helpers";
import { Empty } from "../_shared";

export default async function RulesPage({
  params,
}: Readonly<{
  params: Promise<{ id: string }>;
}>) {
  const { id } = await params;
  const tournament = await getTournament(id);
  if (!tournament) notFound();

  const { rules } = tournament;

  if (!rules) return <Empty text="Nog geen reglement toegevoegd." />;

  return (
    <div className="max-w-2xl rounded-2xl border border-rule bg-surface px-6 py-5">
      <p className="whitespace-pre-line text-sm leading-relaxed text-ink-2">
        {rules.description}
      </p>
    </div>
  );
}
