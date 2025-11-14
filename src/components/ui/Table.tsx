// src/components/ui/Table.tsx
import React from "react";
import clsx from "clsx";

export interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
  striped?: boolean;
  hoverable?: boolean;
}

/**
 * ✅ Table générique et typée
 * Exemple :
 * <Table columns={cols} data={orders} striped hoverable />
 */
export default function Table<T extends Record<string, any>>({
  columns,
  data,
  loading = false,
  emptyMessage = "Aucune donnée à afficher.",
  className,
  striped = true,
  hoverable = true,
}: TableProps<T>) {
  return (
    <div className={clsx("overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700", className)}>
      <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
        {/* Header */}
        <thead className="bg-slate-100 dark:bg-slate-800">
          <tr>
            {columns.map((col) => (
              <th
                key={String(col.key)}
                className={clsx(
                  "px-4 py-2 text-left text-sm font-semibold text-slate-700 dark:text-slate-200",
                  col.className
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>

        {/* Body */}
        <tbody
          className={clsx(
            "divide-y divide-slate-200 dark:divide-slate-700",
            striped && "odd:bg-white even:bg-slate-50 dark:odd:bg-slate-900 dark:even:bg-slate-800"
          )}
        >
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="p-4 text-center text-slate-500 dark:text-slate-400">
                Chargement...
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="p-4 text-center text-slate-500 dark:text-slate-400">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr
                key={i}
                className={clsx(
                  hoverable && "hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                )}
              >
                {columns.map((col) => (
                  <td
                    key={String(col.key)}
                    className={clsx("px-4 py-2 text-sm text-slate-700 dark:text-slate-200", col.className)}
                  >
                    {col.render ? col.render(row) : (row[col.key] as React.ReactNode)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
