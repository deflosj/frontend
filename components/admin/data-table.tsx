"use client";

import { useEffect, useMemo, useState } from "react";
import { IconArrowUp, IconArrowDown } from "../icons";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ColumnDef<T> {
  key: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  className?: string;
  sortable?: boolean;
  sortValue?: (row: T) => string | number;
}

interface DataTableProps<T> {
  title?: string;
  data: T[];
  columns: ColumnDef<T>[];
  loading?: boolean;
  emptyText?: string;
  headerAction?: React.ReactNode;
  toolbar?: React.ReactNode;
  defaultPageSize?: number;
  pageSizeOptions?: number[];
}

type SortDir = "asc" | "desc";

// ── Sort icon ─────────────────────────────────────────────────────────────────

function SortIcon({ active, dir }: Readonly<{ active: boolean; dir: SortDir }>) {
  if (!active) {
    return (
      <svg
        width="9"
        height="9"
        viewBox="0 0 10 14"
        fill="none"
        aria-hidden="true"
        style={{ opacity: 0.25 }}
      >
        <path d="M5 1v12M1 4l4-3 4 3M1 10l4 3 4-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return dir === "asc" ? <IconArrowUp /> : <IconArrowDown />
}

// ── DataTable ─────────────────────────────────────────────────────────────────

export function DataTable<T extends { id: number }>({
  title,
  data,
  columns,
  loading = false,
  emptyText = "Geen resultaten gevonden.",
  headerAction,
  toolbar,
  defaultPageSize = 25,
  pageSizeOptions = [10, 25, 50, 100],
}: Readonly<DataTableProps<T>>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  // Reset to page 1 when data set length changes (i.e. filter applied)
  useEffect(() => {
    setPage(1);
  }, [data.length]);

  function handleSort(key: string) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(1);
  }

  const sorted = useMemo(() => {
    if (!sortKey) return data;
    const col = columns.find((c) => c.key === sortKey);
    const getValue =
      col?.sortValue ??
      ((row: T) => {
        const v = (row as Record<string, unknown>)[sortKey];
        return typeof v === "string" || typeof v === "number" ? v : "";
      });
    return [...data].sort((a, b) => {
      const va = getValue(a);
      const vb = getValue(b);
      let cmp = 0;
      if (va < vb) cmp = -1;
      else if (va > vb) cmp = 1;
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [data, sortKey, sortDir, columns]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginated = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);
  const showPagination = sorted.length > pageSize || pageSizeOptions.some((s) => s < sorted.length);

  return (
    <>
      {toolbar && <div className="admin-table-toolbar-row">{toolbar}</div>}

      <div className="admin-table-wrapper">
      {loading && <p className="admin-empty">Laden…</p>}

      {!loading && data.length === 0 && <p className="admin-empty">{emptyText}</p>}

      {!loading && data.length > 0 && (
        <>
          <div style={{ overflowX: "auto" }}>
            <table className="admin-table">
              <thead>
                <tr>
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className={col.className}
                      onClick={col.sortable ? () => handleSort(col.key) : undefined}
                      aria-sort={
                        (() => {
                          if (!col.sortable || sortKey !== col.key) return undefined;
                          return sortDir === "asc" ? "ascending" : "descending";
                        })()
                      }
                      style={col.sortable ? { cursor: "pointer", userSelect: "none" } : undefined}
                    >
                      <span className="th-inner">
                        {col.header}
                        {col.sortable && (
                          <SortIcon active={sortKey === col.key} dir={sortDir} />
                        )}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((row) => (
                  <tr key={row.id}>
                    {columns.map((col) => (
                      <td key={col.key} className={col.className}>
                        {col.cell(row)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination footer */}
          {showPagination && (
            <div className="admin-table-pagination">
              <span className="pagination-info">
                {(() => {
                  if (sorted.length === 0) return "0 rijen";
                  const from = (safePage - 1) * pageSize + 1;
                  const to = Math.min(safePage * pageSize, sorted.length);
                  return `${from}–${to} van ${sorted.length}`;
                })()}
              </span>
              <div className="pagination-controls">
                <select
                  className="pagination-size"
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  aria-label="Rijen per pagina"
                >
                  {pageSizeOptions.map((s) => (
                    <option key={s} value={s}>
                      {s} per pagina
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="pagination-btn"
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  aria-label="Vorige pagina"
                >
                  ‹
                </button>
                <span className="pagination-pages">
                  {safePage} / {totalPages}
                </span>
                <button
                  type="button"
                  className="pagination-btn"
                  disabled={safePage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  aria-label="Volgende pagina"
                >
                  ›
                </button>
              </div>
            </div>
          )}
        </>
      )}
      </div>
    </>
  );
}
