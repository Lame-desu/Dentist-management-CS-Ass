'use client';

import React from 'react';

interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor?: (row: T) => string;
  emptyMessage?: string;
  className?: string;
  onRowClick?: (row: T) => void;
  loading?: boolean;
}

export function Table<T extends Record<string, unknown>>({
  columns,
  data,
  keyExtractor,
  emptyMessage = 'No data to display.',
  className = '',
  onRowClick,
  loading = false,
}: TableProps<T>) {
  return (
    <div className={`overflow-x-auto rounded-xl border border-surface-200 dark:border-surface-700 ${className}`}>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-surface-200 bg-surface-50 dark:border-surface-700 dark:bg-surface-800/50">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400 ${col.className || ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-200 dark:divide-surface-700">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={`skeleton-${i}`}>
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3">
                    <div className="h-4 w-3/4 animate-pulse rounded bg-surface-200 dark:bg-surface-700" />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-12 text-center text-surface-500 dark:text-surface-400"
              >
                <div className="flex flex-col items-center gap-2">
                  <svg className="h-10 w-10 text-surface-300 dark:text-surface-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <span>{emptyMessage}</span>
                </div>
              </td>
            </tr>
          ) : (
            data.map((row, idx) => (
              <tr
                key={keyExtractor ? keyExtractor(row) : idx}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={`
                  bg-white transition-colors dark:bg-surface-800
                  ${onRowClick ? 'cursor-pointer hover:bg-surface-50 dark:hover:bg-surface-700/50' : ''}
                `}
              >
                {columns.map((col) => (
                  <td key={col.key} className={`px-4 py-3 text-surface-700 dark:text-surface-300 ${col.className || ''}`}>
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
