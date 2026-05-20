"use client";

import { useEffect, useRef, useState } from "react";
import {
  IconSearch,
  IconChevronDown,
  IconPlus,
  IconColumns,
  IconX,
  IconDotsH,
} from "@/components/ui/icons";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterConfig {
  key: string;
  label: string;
  value: string;
  defaultValue?: string;
  options: FilterOption[];
  onChange: (value: string) => void;
}

export interface ColumnDisplay {
  key: string;
  label: string;
  visible: boolean;
  fixed?: boolean;
}

export interface SettingsMenuItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  separator?: boolean;
}

export interface TableToolbarProps {
  search?: string;
  onSearch?: (q: string) => void;
  searchPlaceholder?: string;
  filters?: FilterConfig[];
  columns?: ColumnDisplay[];
  onColumnToggle?: (key: string) => void;
  onAdd?: () => void;
  addLabel?: string;
  menuItems?: SettingsMenuItem[];
  resultCount?: number;
  totalCount?: number;
}

// ── useClickOutside ───────────────────────────────────────────────────────────

function useClickOutside(ref: { current: HTMLElement | null }, handler: () => void) {
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) handler();
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [ref, handler]);
}

// ── Dropdown ──────────────────────────────────────────────────────────────────

function Dropdown({
  trigger,
  children,
  align = "left",
}: {
  trigger: (open: boolean, toggle: () => void) => React.ReactNode;
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));

  return (
    <div ref={ref} style={{ position: "relative" }}>
      {trigger(open, () => setOpen((o) => !o))}
      {open && (
        <div className="tb-dropdown" data-align={align}>
          {children}
        </div>
      )}
    </div>
  );
}

// ── TableToolbar ──────────────────────────────────────────────────────────────

export function TableToolbar({
  search,
  onSearch,
  searchPlaceholder = "Zoeken…",
  filters = [],
  columns = [],
  onColumnToggle,
  onAdd,
  addLabel = "Toevoegen",
  menuItems = [],
  resultCount,
  totalCount,
}: Readonly<TableToolbarProps>) {
  const hasActiveFilters =
    filters.some((f) => f.value !== (f.defaultValue ?? f.options[0]?.value ?? "")) ||
    Boolean(search);

  function resetAll() {
    onSearch?.("");
    filters.forEach((f) => f.onChange(f.defaultValue ?? f.options[0]?.value ?? ""));
  }

  const showCount = typeof resultCount === "number" && typeof totalCount === "number";

  return (
    <div className="table-toolbar">
      {/* Left: search + filters + reset + count */}
      <div className="table-toolbar__left">
        {onSearch !== undefined && (
          <div className="tb-search">
            <span className="tb-search__icon">
              <IconSearch />
            </span>
            <input
              type="search"
              className="tb-search__input"
              placeholder={searchPlaceholder}
              value={search ?? ""}
              onChange={(e) => onSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                className="tb-search__clear"
                onClick={() => onSearch("")}
                aria-label="Zoekopdracht wissen"
              >
                <IconX />
              </button>
            )}
          </div>
        )}

        {filters.map((f) => (
          <select
            key={f.key}
            className="tb-select"
            value={f.value}
            onChange={(e) => f.onChange(e.target.value)}
            aria-label={f.label}
          >
            {f.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        ))}

        {hasActiveFilters && (
          <button type="button" className="tb-btn tb-btn--ghost" onClick={resetAll}>
            <IconX /> Wis filters
          </button>
        )}

        {showCount && (
          <span className="tb-count">
            {resultCount === totalCount
              ? `${totalCount} ${totalCount === 1 ? "rij" : "rijen"}`
              : `${resultCount} van ${totalCount}`}
          </span>
        )}
      </div>

      {/* Right: column toggle + add + settings */}
      <div className="table-toolbar__right">
        {columns.length > 0 && onColumnToggle && (
          <Dropdown
            align="right"
            trigger={(open, toggle) => (
              <button
                type="button"
                className={`tb-btn tb-btn--ghost${open ? " tb-btn--active" : ""}`}
                onClick={toggle}
                aria-expanded={open}
              >
                <IconColumns /> Kolommen <IconChevronDown />
              </button>
            )}
          >
            <p className="tb-dropdown__label">Zichtbare kolommen</p>
            {columns.map((col) => (
              <label
                key={col.key}
                className={`tb-dropdown__check${col.fixed ? " tb-dropdown__check--disabled" : ""}`}
              >
                <input
                  type="checkbox"
                  checked={col.visible}
                  disabled={col.fixed}
                  onChange={() => !col.fixed && onColumnToggle(col.key)}
                />
                {col.label}
              </label>
            ))}
          </Dropdown>
        )}

        {onAdd && (
          <button type="button" className="tb-btn tb-btn--primary" onClick={onAdd}>
            <IconPlus /> {addLabel}
          </button>
        )}

        {menuItems.length > 0 && (
          <Dropdown
            align="right"
            trigger={(open, toggle) => (
              <button
                type="button"
                className={`tb-btn tb-btn--ghost tb-btn--icon${open ? " tb-btn--active" : ""}`}
                onClick={toggle}
                aria-expanded={open}
                aria-label="Meer opties"
              >
                <IconDotsH />
              </button>
            )}
          >
            {menuItems.map((item, i) => (
              <div key={item.key}>
                {item.separator && i > 0 && <div className="tb-dropdown__sep" />}
                <button
                  type="button"
                  className={`tb-dropdown__item${item.danger ? " tb-dropdown__item--danger" : ""}`}
                  onClick={item.onClick}
                >
                  {item.icon && <span className="tb-dropdown__item-icon">{item.icon}</span>}
                  {item.label}
                </button>
              </div>
            ))}
          </Dropdown>
        )}
      </div>
    </div>
  );
}
