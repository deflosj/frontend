import { notFound } from "next/navigation";

import { getTournament } from "@/lib/tournament-helpers";
import { parseRules } from "@/lib/rules-parser";
import { Empty, PageHead } from "../_shared";
import { RulesIndex } from "./rules-index";

export default async function RulesPage({
  params,
}: Readonly<{
  params: Promise<{ id: string }>;
}>) {
  const { id } = await params;
  const tournament = await getTournament(id);
  if (!tournament) notFound();

  const { rules, name, year } = tournament;

  if (!rules?.trim()) return <Empty text="Nog geen reglement toegevoegd." />;

  const sections = parseRules(rules);
  const indexItems = sections
    .filter((s) => s.title)
    .map((s) => ({ id: s.id, title: s.title as string }));

  return (
    <div className="flex flex-col gap-7">
      <PageHead title="Reglement" subtitle={`${name} · ${year}`} />

      <div className="grid gap-8 lg:grid-cols-[232px_minmax(0,1fr)]">
        {indexItems.length > 1 ? (
          <div className="hidden lg:block">
            <div className="sticky top-20">
              <RulesIndex sections={indexItems} />
            </div>
          </div>
        ) : (
          <div className="hidden lg:block" />
        )}

        <div className="rounded-2xl border border-rule bg-surface px-6 py-6 sm:px-8 sm:py-7">
          <div className="flex flex-col gap-6">
            {sections.map((section) => (
              <div key={section.id} id={section.id} className="scroll-mt-20">
                {section.title && (
                  <h2 className="mb-3 text-base font-bold text-ink">{section.title}</h2>
                )}
                <div className="flex flex-col gap-3">
                  {section.blocks.map((block, i) =>
                    block.type === "list" ? (
                      <ol
                        key={i}
                        className="flex list-decimal flex-col gap-1.5 pl-5 text-[0.85rem] leading-relaxed text-ink-2"
                      >
                        {block.items?.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ol>
                    ) : (
                      <p key={i} className="text-sm leading-relaxed text-ink-2">
                        {block.text}
                      </p>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
