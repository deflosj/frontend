// Generic admin table — columns drive rendering, no logic inside.

export interface ColumnDef<T> {
  key: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  title: string;
  data: T[];
  columns: ColumnDef<T>[];
  loading?: boolean;
  emptyText?: string;
  headerAction?: React.ReactNode;
}

export function DataTable<T extends { id: number }>({
  title,
  data,
  columns,
  loading = false,
  emptyText = "Geen resultaten gevonden.",
  headerAction,
}: Readonly<DataTableProps<T>>) {
  return (
    <div className="admin-table-wrapper">
      <div className="admin-table-header">
        <h2>{title}</h2>
        {headerAction && <div>{headerAction}</div>}
      </div>

      {loading && <p className="admin-empty">Laden…</p>}

      {!loading && data.length === 0 && (
        <p className="admin-empty">{emptyText}</p>
      )}

      {!loading && data.length > 0 && (
        <table className="admin-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} className={col.className}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
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
      )}
    </div>
  );
}
