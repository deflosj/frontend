"use client";

/**
 * Gedeelde bouwstenen voor de filterbare toernooipagina's (wedstrijden,
 * standen, bracket): teamzoeker, filterknop, filterpaneel (paneel op laptop,
 * venster van onderen op gsm), actieve-filterlabels, chips en segmenten.
 */
import { useParams } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

// ── Iconen ────────────────────────────────────────────────────────────────────

const IconSearch = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);
export const IconClose = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);
const IconFilter = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <path d="M4 6h16" />
    <path d="M7 12h10" />
    <path d="M10 18h4" />
  </svg>
);
export const IconArrow = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <path d="M5 12h14" />
    <path d="m13 6 6 6-6 6" />
  </svg>
);

// ── Hertriggerbare animatie ───────────────────────────────────────────────────

/** Geeft een sleutel die verandert bij elke filterwijziging. Zet hem als `key`
 *  op een lijst: React hermount die, en de binnenkomst-animatie speelt opnieuw. */
export function useAnimKey(deps: unknown[]): number {
  const [key, setKey] = useState(0);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setKey((k) => k + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return key;
}

// ── Teamzoeker ────────────────────────────────────────────────────────────────

export interface TeamOption {
  id: number;
  name: string;
  /** Rechts in de suggestie, bv. "Poule E". */
  meta?: string;
}

export function TeamSearch({
  options,
  selected,
  onSelect,
  query,
  onQuery,
  placeholder = "Zoek je team…",
  selectedPrefix,
  selectedAction,
  disabled = false,
}: Readonly<{
  options: TeamOption[];
  selected: TeamOption | null;
  onSelect: (id: number | null) => void;
  query: string;
  onQuery: (q: string) => void;
  placeholder?: string;
  selectedPrefix?: string;
  /** Extra knop naast de gekozen ploeg, bv. de volg-ster. */
  selectedAction?: React.ReactNode;
  disabled?: boolean;
}>) {
  const id = useId();
  const [focused, setFocused] = useState(false);
  const q = query.trim().toLowerCase();
  const sugg = q ? options.filter((o) => o.name.toLowerCase().includes(q)).slice(0, 6) : [];

  if (selected) {
    return (
      <div className="flex h-12 items-center gap-2.5 rounded-xl border border-pink bg-pink-soft pl-3.5 pr-1 md:h-11">
        {selectedPrefix && <span className="text-xs font-bold text-pink-ink">{selectedPrefix}</span>}
        <span className="min-w-0 flex-1 truncate text-[0.9375rem] font-bold text-pink-ink md:text-sm">{selected.name}</span>
        {selectedAction}
        <button
          type="button"
          onClick={() => onSelect(null)}
          aria-label="Team wissen"
          className="t-press flex h-11 w-11 items-center justify-center rounded-lg text-pink-ink hover:bg-pink/10 md:h-9 md:w-9"
        >
          <IconClose />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <label htmlFor={id} className="sr-only">Zoek je team</label>
      <div className="flex h-12 items-center gap-2.5 rounded-xl border border-rule bg-surface px-3.5 text-ink-2 focus-within:border-ink-2 md:h-11">
        <IconSearch />
        <input
          id={id}
          type="search"
          value={query}
          disabled={disabled}
          onChange={(e) => onQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && sugg[0]) {
              onSelect(sugg[0].id);
              onQuery("");
            }
          }}
          placeholder={placeholder}
          autoComplete="off"
          className="h-full min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-ink-2 disabled:opacity-60 md:text-sm"
        />
      </div>
      {focused && sugg.length > 0 && (
        <div role="listbox" className="t-drop absolute inset-x-0 top-[calc(100%+6px)] z-30 overflow-hidden rounded-xl border border-rule bg-surface py-1 shadow-xl">
          {sugg.map((o) => (
            <button
              key={o.id}
              type="button"
              role="option"
              aria-selected={false}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onSelect(o.id);
                onQuery("");
              }}
              className="flex min-h-11 w-full items-center gap-2.5 px-3.5 text-left text-[0.9375rem] font-semibold hover:bg-ink/5 md:text-sm"
            >
              <span className="flex-1 truncate">{o.name}</span>
              {o.meta && <span className="text-xs font-medium text-ink-2">{o.meta}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Filterknop ────────────────────────────────────────────────────────────────

export function FilterButton({
  count,
  open,
  onClick,
  controls,
}: Readonly<{ count: number; open: boolean; onClick: () => void; controls: string }>) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={open}
      aria-controls={controls}
      aria-label={count ? `Filters (${count} actief)` : "Filters"}
      className={`t-press relative flex h-12 w-12 shrink-0 items-center justify-center gap-2 rounded-xl border bg-surface text-sm font-semibold md:h-11 md:w-auto md:px-4 ${
        open ? "border-ink bg-ink text-paper" : count ? "border-ink" : "border-rule hover:border-ink-2"
      }`}
    >
      <IconFilter size={18} />
      <span className="hidden md:inline">Filters</span>
      {count > 0 && (
        <span className="t-pop absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-paper bg-pink px-1 text-[0.7rem] font-extrabold text-[#16161a] md:static md:border-0">
          {count}
        </span>
      )}
    </button>
  );
}

// ── Filterpaneel ──────────────────────────────────────────────────────────────

/** Op gsm een venster dat van onderen opschuift, vanaf md een paneel onder de
 *  knop. Speelt een sluitanimatie af voor het verdwijnt. Escape sluit. */
export function FilterPanel({
  id,
  open,
  onClose,
  onClear,
  applyLabel,
  children,
}: Readonly<{
  id: string;
  open: boolean;
  onClose: () => void;
  onClear: () => void;
  applyLabel: string;
  children: React.ReactNode;
}>) {
  const [render, setRender] = useState(open);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (open) {
      setRender(true);
      setClosing(false);
      return;
    }
    if (!render) return;
    setClosing(true);
    const t = setTimeout(() => {
      setRender(false);
      setClosing(false);
    }, 200);
    return () => clearTimeout(t);
  }, [open, render]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!render) return null;
  const cls = closing ? " is-closing" : "";

  return (
    <>
      <button
        type="button"
        aria-label="Filters sluiten"
        onClick={onClose}
        className={`t-scrim${cls} fixed inset-0 z-40 cursor-default bg-ink/40 md:bg-ink/15`}
      />
      <div
        id={id}
        role="dialog"
        aria-label="Filters"
        className={`t-sheet${cls} fixed inset-x-0 bottom-0 z-50 flex max-h-[86vh] flex-col rounded-t-3xl bg-surface shadow-2xl md:absolute md:inset-x-auto md:bottom-auto md:right-0 md:top-[calc(100%+8px)] md:max-h-none md:w-[460px] md:rounded-2xl md:border md:border-rule`}
      >
        <div className="flex justify-center pb-0.5 pt-2 md:hidden">
          <span className="h-1.5 w-10 rounded-full bg-rule" />
        </div>
        <div className="flex items-center justify-between py-1 pl-5 pr-2 md:border-b md:border-rule md:py-2.5">
          <span className="text-lg font-extrabold md:text-base">Filters</span>
          <button type="button" onClick={onClose} aria-label="Sluiten" className="t-press flex h-11 w-11 items-center justify-center rounded-xl hover:bg-ink/5 md:h-9 md:w-9">
            <IconClose size={18} />
          </button>
        </div>
        <div className="flex flex-col gap-5 overflow-y-auto px-5 pb-5 pt-2 md:pt-4">{children}</div>
        <div className="flex items-center gap-3 border-t border-rule px-5 pb-6 pt-3 md:justify-between md:pb-3.5">
          <button type="button" onClick={onClear} className="t-press min-h-11 rounded-lg px-1 text-sm font-semibold text-ink-2 underline underline-offset-4 hover:text-ink">
            Alles wissen
          </button>
          <button type="button" onClick={onClose} className="t-press h-[52px] flex-1 rounded-2xl bg-ink px-5 text-[0.9375rem] font-bold text-paper md:h-11 md:flex-none md:rounded-xl md:text-sm">
            {applyLabel}
          </button>
        </div>
      </div>
    </>
  );
}

export function FilterSection({ title, children, hint }: Readonly<{ title: string; children: React.ReactNode; hint?: string }>) {
  return (
    <div className="t-rise flex flex-col gap-2.5">
      <h3 className="text-xs font-bold uppercase tracking-wide text-ink-2">{title}</h3>
      {children}
      {hint && <p className="text-xs text-ink-2">{hint}</p>}
    </div>
  );
}

// ── Chips, segment, schakelaar ────────────────────────────────────────────────

export function Chip({
  on,
  onClick,
  children,
  square = false,
}: Readonly<{ on: boolean; onClick: () => void; children: React.ReactNode; square?: boolean }>) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`t-press inline-flex h-11 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full border text-sm font-semibold md:h-9 md:text-[0.8125rem] ${
        square ? "min-w-11 px-0 md:min-w-9" : "px-4"
      } ${on ? "border-ink bg-ink text-paper" : "border-rule bg-surface hover:border-ink-2"}`}
    >
      {children}
    </button>
  );
}

export function Count({ n }: Readonly<{ n: number }>) {
  return <span className="font-medium tabular-nums opacity-65">{n}</span>;
}

export function Segmented<K extends string>({
  options,
  value,
  onChange,
  label,
  stretch = false,
}: Readonly<{ options: { key: K; label: string }[]; value: K; onChange: (k: K) => void; label: string; stretch?: boolean }>) {
  return (
    <div role="group" aria-label={label} className={`${stretch ? "flex" : "inline-flex"} h-11 items-center gap-0.5 rounded-xl bg-ink/5 p-[3px]`}>
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          aria-pressed={value === o.key}
          onClick={() => onChange(o.key)}
          className={`t-press h-[38px] rounded-[9px] px-4 text-[0.8125rem] font-semibold ${stretch ? "flex-1" : ""} ${
            value === o.key ? "bg-surface text-ink shadow-sm" : "text-ink-2 hover:text-ink"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Toggle({ on, onClick, children }: Readonly<{ on: boolean; onClick: () => void; children: React.ReactNode }>) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className="t-press t-rise flex h-[52px] w-full items-center justify-between gap-3 rounded-xl border border-rule bg-surface px-3.5 text-left text-sm font-semibold md:h-12"
    >
      <span>{children}</span>
      <span className={`relative h-6 w-10 shrink-0 rounded-full transition-colors duration-200 ${on ? "bg-pink" : "bg-ink/10"}`}>
        <span
          className={`absolute left-[3px] top-[3px] h-[18px] w-[18px] rounded-full bg-white shadow transition-transform duration-200 ${on ? "translate-x-4" : ""}`}
          style={{ transitionTimingFunction: "cubic-bezier(.3,1.4,.5,1)" }}
        />
      </span>
    </button>
  );
}

// ── Actieve filters ───────────────────────────────────────────────────────────

export interface ActiveFilter {
  label: string;
  onRemove: () => void;
}

export function FilterPills({
  filters,
  onClear,
  lead,
}: Readonly<{ filters: ActiveFilter[]; onClear: () => void; lead?: React.ReactNode }>) {
  if (!filters.length && !lead) return null;
  return (
    <div className="-mx-5 flex items-center gap-1.5 overflow-x-auto px-5 [scrollbar-width:none] sm:-mx-8 sm:px-8 md:mx-0 md:flex-wrap md:overflow-visible md:px-0">
      {lead}
      {filters.map((f) => (
        <button
          key={f.label}
          type="button"
          onClick={f.onRemove}
          aria-label={`${f.label} weghalen`}
          className="t-press t-pop inline-flex h-[34px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-ink/10 pl-3 pr-2 text-[0.8125rem] font-semibold hover:bg-ink/15 md:h-8"
        >
          {f.label}
          <IconClose size={14} />
        </button>
      ))}
      {filters.length > 1 && (
        <button type="button" onClick={onClear} className="t-press shrink-0 rounded-lg px-2 py-1.5 text-[0.8125rem] font-semibold text-ink-2 underline underline-offset-4 hover:text-ink">
          Alles wissen
        </button>
      )}
    </div>
  );
}

// ── Filters onthouden ─────────────────────────────────────────────────────────

/**
 * useState dat zijn waarde onthoudt in localStorage van dit toestel, per
 * toernooi en per pagina. Eerst de standaardwaarde (zodat server en client
 * hetzelfde renderen), meteen na het mounten de bewaarde waarde.
 */
export function usePersisted<T>(page: string, name: string, initial: T): [T, (v: T | ((prev: T) => T)) => void] {
  const params = useParams<{ id?: string }>();
  const key = `deflosj:filters:${params?.id ?? "x"}:${page}:${name}`;
  const [value, setValue] = useState<T>(initial);
  const loaded = useRef(false);

  useEffect(() => {
    try {
      const raw = globalThis.localStorage?.getItem(key);
      if (raw !== null && raw !== undefined) setValue(JSON.parse(raw) as T);
    } catch {
      /* niets bewaard of opslag geblokkeerd */
    }
    loaded.current = true;
  }, [key]);

  useEffect(() => {
    if (!loaded.current) return;
    try {
      globalThis.localStorage?.setItem(key, JSON.stringify(value));
    } catch {
      /* opslag geblokkeerd: dan onthouden we het gewoon niet */
    }
  }, [key, value]);

  return [value, setValue];
}

// ── Uitleg-popup ──────────────────────────────────────────────────────────────

export function IconInfo({ size = 16 }: Readonly<{ size?: number }>) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v6M12 7.5v.01" />
    </svg>
  );
}

/** Onderblad op gsm, gecentreerd venster vanaf md. */
export function InfoSheet({
  open,
  onClose,
  title,
  children,
}: Readonly<{ open: boolean; onClose: () => void; title: string; children: React.ReactNode }>) {
  const [render, setRender] = useState(open);
  const [closing, setClosing] = useState(false);
  const titleId = useId();

  useEffect(() => {
    if (open) {
      setRender(true);
      setClosing(false);
      return;
    }
    if (!render) return;
    setClosing(true);
    const t = setTimeout(() => {
      setRender(false);
      setClosing(false);
    }, 200);
    return () => clearTimeout(t);
  }, [open, render]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!render) return null;
  const cls = closing ? " is-closing" : "";
  return (
    <>
      <button type="button" aria-label="Sluiten" onClick={onClose} className={`t-scrim${cls} fixed inset-0 z-40 cursor-default bg-ink/40`} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`t-info${cls} fixed inset-x-0 bottom-0 z-50 flex max-h-[86vh] flex-col rounded-t-3xl bg-surface shadow-2xl md:inset-x-auto md:bottom-auto md:left-1/2 md:top-1/2 md:w-[520px] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-2xl md:border md:border-rule`}
      >
        <div className="flex justify-center pb-0.5 pt-2 md:hidden">
          <span className="h-1.5 w-10 rounded-full bg-rule" />
        </div>
        <div className="flex items-center justify-between py-1 pl-5 pr-2 md:border-b md:border-rule md:py-2.5">
          <h2 id={titleId} className="text-lg font-bold md:text-base">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Sluiten" className="t-press flex h-11 w-11 items-center justify-center rounded-xl hover:bg-ink/5 md:h-9 md:w-9">
            <IconClose size={18} />
          </button>
        </div>
        <div className="flex flex-col gap-3 overflow-y-auto px-5 pb-7 pt-2 text-[0.9375rem] leading-relaxed text-ink-2 md:pt-4">{children}</div>
      </div>
    </>
  );
}
