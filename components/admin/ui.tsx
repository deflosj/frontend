"use client";

/**
 * Kleine bouwstenen voor de admin, in dezelfde stijl als het dashboard:
 * kaarten met afgeronde hoeken, een duidelijke kop en rustige meldingen.
 */

import { useId, useState } from "react";
import { ChevronDown, Minus, Plus } from "lucide-react";

type PanelProps = Readonly<{
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Knoppen rechts in de kop. */
  actions?: React.ReactNode;
  /** Bv. een InfoButton naast de titel. */
  info?: React.ReactNode;
  /** Stapnummer links van de titel; `"done"` = afgevinkt. */
  step?: number | "done";
  /** Inhoud zonder binnenmarge (tabellen, lijsten). */
  flush?: boolean;
  /** Kop wordt een knop die de inhoud in- en uitklapt. */
  collapsible?: boolean;
  defaultOpen?: boolean;
  id?: string;
  className?: string;
  children?: React.ReactNode;
}>;

function StepBadge({ step }: Readonly<{ step: number | "done" }>) {
  return (
    <span
      aria-hidden
      className={`mt-px flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono text-xs font-bold ${
        step === "done" ? "bg-[var(--ok-bg)] text-[var(--ok-fg)]" : "bg-ink text-paper"
      }`}
    >
      {step === "done" ? "✓" : step}
    </span>
  );
}

export function Panel({
  title, description, actions, info, step, flush, collapsible = false, defaultOpen = true, id, className = "", children,
}: PanelProps) {
  const autoId = useId();
  const baseId = id ?? autoId;
  const headingId = `${baseId}-title`;
  const bodyId = `${baseId}-body`;
  const [open, setOpen] = useState(defaultOpen);
  const showBody = children !== undefined && (!collapsible || open);

  const heading = (
    <div className="flex min-w-0 items-start gap-3">
      {step !== undefined && <StepBadge step={step} />}
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <h2 id={headingId} className="text-base font-semibold">{title}</h2>
          {info}
        </div>
        {description && <p className="mt-0.5 text-[13px] text-ink-2">{description}</p>}
      </div>
    </div>
  );

  return (
    <section aria-labelledby={headingId} className={`overflow-hidden rounded-2xl border border-rule bg-surface ${className}`}>
      <div className={`flex flex-wrap items-start justify-between gap-3 px-5 pt-4 ${showBody ? "pb-3" : "pb-4"}`}>
        {collapsible ? (
          <div className="flex min-w-0 flex-1 items-start gap-2">
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-controls={bodyId}
              aria-label={open ? "Inklappen" : "Uitklappen"}
              className="-ml-1.5 mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-ink-2 transition-colors hover:bg-ink/5 hover:text-ink"
            >
              <ChevronDown size={18} strokeWidth={1.75} className={`transition-transform duration-200 ${open ? "" : "-rotate-90"}`} />
            </button>
            <div className="min-w-0 flex-1">{heading}</div>
          </div>
        ) : heading}
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {showBody && (
        <div id={bodyId} className={flush ? "border-t border-rule" : "px-5 pb-5"}>
          {children}
        </div>
      )}
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

/**
 * Getalveld met − en + ernaast, voor kleine aantallen (teams per poule,
 * banen, minuten). Typen blijft mogelijk.
 */
export function NumberField({
  id, label, value, onChange, min = 0, max = 999, step = 1, suffix, placeholder, disabled,
}: Readonly<{
  id: string;
  label: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  placeholder?: string;
  disabled?: boolean;
}>) {
  const num = Number.parseInt(value || placeholder || "", 10);
  const base = Number.isNaN(num) ? min : num;
  const bump = (d: number) => onChange(String(Math.min(max, Math.max(min, base + d))));
  const btn = "flex h-full w-9 items-center justify-center text-ink-2 transition-colors hover:bg-paper hover:text-ink disabled:opacity-40 disabled:hover:bg-transparent";

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-medium text-ink">{label}</label>
      <div className="inline-flex h-10 items-stretch self-start overflow-hidden rounded-[10px] border border-rule bg-surface focus-within:border-pink focus-within:shadow-[0_0_0_3px_var(--pink-soft)]">
        <button type="button" className={btn} onClick={() => bump(-step)} disabled={disabled || base <= min} aria-label="Minder">
          <Minus size={15} strokeWidth={2} />
        </button>
        <div className="flex items-center border-x border-rule">
          <input
            id={id}
            type="number"
            inputMode="numeric"
            min={min}
            max={max}
            step={step}
            value={value}
            placeholder={placeholder}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value)}
            className="admin-number h-full w-12 bg-transparent text-center font-mono text-sm tabular-nums text-ink outline-none placeholder:text-ink-2/60"
          />
          {suffix && <span className="pr-2.5 text-xs text-ink-2">{suffix}</span>}
        </div>
        <button type="button" className={btn} onClick={() => bump(step)} disabled={disabled || base >= max} aria-label="Meer">
          <Plus size={15} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
