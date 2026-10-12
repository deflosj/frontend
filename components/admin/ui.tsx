/**
 * Kleine bouwstenen voor de admin, in dezelfde stijl als het dashboard:
 * kaarten met afgeronde hoeken, een duidelijke kop en rustige meldingen.
 */

type PanelProps = Readonly<{
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Knoppen rechts in de kop. */
  actions?: React.ReactNode;
  /** Bv. een InfoButton naast de titel. */
  info?: React.ReactNode;
  /** Stapnummer links van de titel; `true` = afgevinkt. */
  step?: number | "done";
  /** Inhoud zonder binnenmarge (tabellen, lijsten). */
  flush?: boolean;
  id?: string;
  className?: string;
  children?: React.ReactNode;
}>;

export function Panel({ title, description, actions, info, step, flush, id, className = "", children }: PanelProps) {
  const headingId = id ? `${id}-title` : undefined;
  return (
    <section aria-labelledby={headingId} className={`overflow-hidden rounded-2xl border border-rule bg-surface ${className}`}>
      <div className="flex flex-wrap items-start justify-between gap-3 px-5 pb-3 pt-4">
        <div className="flex min-w-0 items-start gap-3">
          {step !== undefined && (
            <span
              aria-hidden
              className={`mt-px flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono text-xs font-bold ${
                step === "done" ? "bg-[var(--ok-bg)] text-[var(--ok-fg)]" : "bg-ink text-paper"
              }`}
            >
              {step === "done" ? "✓" : step}
            </span>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 id={headingId} className="text-base font-semibold">{title}</h2>
              {info}
            </div>
            {description && <p className="mt-0.5 text-[13px] text-ink-2">{description}</p>}
          </div>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children !== undefined && (flush ? <div className="border-t border-rule">{children}</div> : <div className="px-5 pb-5">{children}</div>)}
    </section>
  );
}

const NOTICE_TONES = {
  ok: "bg-[var(--ok-bg)] text-[var(--ok-fg)]",
  warn: "bg-[var(--warn-bg)] text-[var(--warn-fg)]",
  err: "bg-[var(--err-bg)] text-[var(--err-fg)]",
  info: "bg-paper text-ink-2",
} as const;

export function Notice({ tone = "info", children, className = "" }: Readonly<{
  tone?: keyof typeof NOTICE_TONES;
  children: React.ReactNode;
  className?: string;
}>) {
  return (
    <div role={tone === "err" ? "alert" : "status"} className={`rounded-xl px-3.5 py-2.5 text-[13px] leading-relaxed ${NOTICE_TONES[tone]} ${className}`}>
      {children}
    </div>
  );
}

/** Kleine sectietitel binnen een kaart. */
export function Subhead({ children, info }: Readonly<{ children: React.ReactNode; info?: React.ReactNode }>) {
  return (
    <div className="mb-3 flex items-center gap-1.5">
      <h3 className="text-sm font-semibold">{children}</h3>
      {info}
    </div>
  );
}
