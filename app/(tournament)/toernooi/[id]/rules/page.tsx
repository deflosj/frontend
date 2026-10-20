import { notFound } from "next/navigation";

import { getTournament } from "@/lib/tournament-helpers";
import { parseRules, type RulesBlock, type RulesSection } from "@/lib/rules-parser";
import { Empty } from "../_shared";
import { RulesIndex, RulesIndexChips } from "./rules-index";

/**
 * Reglementpagina. De tekst komt vrij uit het beheer (`── Kop ──` per sectie),
 * de opmaak herkent een paar vaste vormen uit het reglement:
 *  - "De Flosj heeft altijd gelijk!" wordt de kop van de pagina;
 *  - een regel als "Winst: 2 punten | Gelijkspel: 1 punt" wordt een puntentabel;
 *  - "Voorbeeld: …" wordt een voorbeeldkader;
 *  - "- tekst" wordt een opsommingspunt met een boule als teken;
 *  - de Zuipbeker krijgt zijn eigen streepjeslijst.
 */

const GOLDEN_RULE = /de flosj heeft altijd gelijk!?/i;

/** "Winst: 2 punten | Gelijkspel: 1 punt" → [{label, value, unit}] */
function scoreTiles(text: string) {
  if (!text.includes("|")) return null;
  const parts = text.split("|").map((p) => /^\s*([^:]+):\s*(\d+)\s*(.*)$/.exec(p));
  if (parts.some((p) => !p)) return null;
  return parts.map((p) => ({ label: p![1].trim(), value: p![2], unit: p![3].trim() }));
}

/** Haalt de basisregel uit een zin ("… Basisregel: De Flosj heeft altijd gelijk!"). */
function withoutGoldenRule(text: string) {
  return text
    .replace(/\s*(basisregel:|ook hier geldt:)?\s*de flosj heeft altijd gelijk!?/i, "")
    .trim();
}

const capitalize = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

function Block({ block }: Readonly<{ block: RulesBlock }>) {
  if (block.type === "bullets") {
    return (
      <ul className="flex flex-col gap-1.5">
        {block.items?.map((item) => {
          const golden = GOLDEN_RULE.test(item);
          return (
            <li key={item} className={`relative pl-4 text-[0.9375rem] leading-relaxed ${golden ? "font-semibold text-ink" : "text-ink-2"}`}>
              <span aria-hidden className="absolute left-0 top-[0.7em] h-1 w-1 rounded-full bg-ink-2/50" />
              {item}
            </li>
          );
        })}
      </ul>
    );
  }

  if (block.type === "list") {
    return (
      <ol className="flex flex-col gap-2.5">
        {block.items?.map((item, i) => (
          <li key={item} className="grid grid-cols-[1.75rem_minmax(0,1fr)] gap-3 text-[0.9375rem] leading-relaxed text-ink">
            <span
              aria-hidden
              className="mt-[0.15rem] flex h-7 w-7 items-center justify-center rounded-full border-2 border-ink text-[0.8125rem] font-bold tabular-nums"
            >
              {i + 1}
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ol>
    );
  }

  const text = block.text ?? "";
  const tiles = scoreTiles(text);
  if (tiles) {
    return (
      <dl className="grid grid-cols-3 overflow-hidden rounded-2xl border-2 border-ink">
        {tiles.map((t, i) => (
          <div key={t.label} className={`flex flex-col items-center gap-0.5 px-2 py-4 ${i > 0 ? "border-l-2 border-ink" : ""} ${i === 0 ? "bg-pink text-white" : ""}`}>
            <dd className="text-4xl font-black leading-none tabular-nums sm:text-5xl">{t.value}</dd>
            <dt className={`text-[0.8125rem] font-semibold ${i === 0 ? "text-white" : "text-ink-2"}`}>
              {t.label} <span className="sr-only">{t.unit}</span>
            </dt>
          </div>
        ))}
      </dl>
    );
  }

  if (/^voorbeeld:/i.test(text)) {
    return (
      <p className="rounded-xl bg-paper px-4 py-3 text-[0.9375rem] leading-relaxed text-ink">
        <strong className="font-bold">Voorbeeld.</strong> {capitalize(text.replace(/^voorbeeld:\s*/i, ""))}
      </p>
    );
  }

  const rest = GOLDEN_RULE.test(text) ? withoutGoldenRule(text) : text;
  if (!rest) {
    return <p className="text-[0.9375rem] font-bold text-pink">De Flosj heeft altijd gelijk!</p>;
  }
  return <p className="text-[0.9375rem] leading-[1.7] text-ink-2">{rest}</p>;
}

/** Vier streepjes en een dwarse: zo wordt er aan de toog geteld. */
function Tally({ className = "" }: Readonly<{ className?: string }>) {
  return (
    <svg viewBox="0 0 64 40" className={className} aria-hidden fill="none" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round">
      <path d="M10 6 L9 34" />
      <path d="M22 5 L21 35" />
      <path d="M34 6 L33 34" />
      <path d="M46 5 L46 35" />
      <path d="M3 30 L56 10" />
    </svg>
  );
}

function Section({ section }: Readonly<{ section: RulesSection }>) {
  const isZuipbeker = /zuipbeker/i.test(section.title ?? "");

  if (isZuipbeker) {
    return (
      <section id={section.id} aria-labelledby={`${section.id}-t`} className="scroll-mt-20">
        <div className="relative overflow-hidden rounded-3xl bg-ink px-6 py-7 text-paper sm:px-9 sm:py-9">
          <Tally className="absolute -right-3 -top-2 h-28 w-44 rotate-[-8deg] text-pink opacity-90" />
          <p className="mb-1 text-[0.8125rem] font-semibold text-pink">Naast het toernooi</p>
          <h2 id={`${section.id}-t`} className="mb-5 text-3xl font-black tracking-tight sm:text-4xl">
            {section.title}
          </h2>
          <div className="flex max-w-[62ch] flex-col gap-3.5 [&_li]:text-paper/85 [&_p]:text-paper/80 [&_li>span]:bg-paper/50">
            {section.blocks.map((b, i) => <Block key={i} block={b} />)}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      id={section.id}
      aria-labelledby={section.title ? `${section.id}-t` : undefined}
      className="scroll-mt-20 border-t-2 border-ink pt-5 first:border-t-0 first:pt-0"
    >
      {section.title && (
        <h2 id={`${section.id}-t`} className="mb-4 text-xl font-extrabold tracking-tight text-ink sm:text-2xl">
          {section.title}
        </h2>
      )}
      <div className="flex max-w-[66ch] flex-col gap-3.5">
        {section.blocks.map((b, i) => <Block key={i} block={b} />)}
      </div>
    </section>
  );
}

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
  const hasGoldenRule = GOLDEN_RULE.test(rules);

  return (
    <div className="flex flex-col gap-8">
      {/* De kop: de enige regel die altijd geldt. */}
      <header className="relative overflow-hidden rounded-3xl border-2 border-ink bg-surface px-6 pb-7 pt-6 sm:px-10 sm:pb-10 sm:pt-8">
        <p className="mb-6 text-[0.875rem] font-semibold text-ink-2">
          Reglement {name} {year}
        </p>
        {hasGoldenRule ? (
          <>
            <h1 className="max-w-[14ch] text-[2.6rem] font-black leading-[0.95] tracking-[-0.035em] text-ink sm:text-[4.25rem]">
              De Flosj heeft altijd gelijk.
            </h1>
            <p className="mt-5 max-w-[52ch] text-[0.9375rem] leading-relaxed text-ink-2">
              Het toernooi is recreatief en we rekenen op fairplay. Bij twijfel beslist de scheidsrechter van de dag.
              Hieronder alles wat je verder moet weten.
            </p>
            <span
              aria-hidden
              className="absolute right-5 top-5 hidden rotate-[9deg] rounded-full bg-pink px-4 py-2 text-[0.8125rem] font-extrabold text-white shadow-[3px_3px_0_var(--ink)] sm:block"
            >
              Basisregel
            </span>
          </>
        ) : (
          <h1 className="text-[2.6rem] font-black leading-none tracking-[-0.035em] text-ink sm:text-[4.25rem]">Reglement</h1>
        )}
      </header>

      {indexItems.length > 1 && (
        <div className="lg:hidden">
          <RulesIndexChips sections={indexItems} />
        </div>
      )}

      <div className="grid gap-10 lg:grid-cols-[220px_minmax(0,1fr)]">
        {indexItems.length > 1 ? (
          <div className="hidden lg:block">
            <div className="sticky top-20">
              <RulesIndex sections={indexItems} />
            </div>
          </div>
        ) : (
          <div className="hidden lg:block" />
        )}

        <div className="flex flex-col gap-9">
          {sections.map((section) => (
            <Section key={section.id} section={section} />
          ))}
        </div>
      </div>
    </div>
  );
}
