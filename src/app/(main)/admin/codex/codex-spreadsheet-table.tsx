/**
 * Codex Spreadsheet — table body (TASK-617)
 */

'use client';

import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { CodexSpreadsheetTableRow } from './codex-spreadsheet-table-row';
import {
  SPREADSHEET_ESTIMATED_ROW_HEIGHT,
  SPREADSHEET_VIRTUALIZE_ROW_THRESHOLD,
} from './codex-spreadsheet-virtualization';
import type { CodexSpreadsheetRow } from './use-codex-spreadsheet';

type CodexSpreadsheetTableProps = {
  columns: string[];
  columnWidths: number[];
  minTableWidth: number;
  sortedRows: CodexSpreadsheetRow[];
  dirty: Set<string>;
  sortKey: string | null;
  sortDir: 'asc' | 'desc';
  focusedCell: { rowKey: string; col: number } | null;
  savingRowKey: string | null;
  onSort: (key: string) => void;
  onFocusCell: (cell: { rowKey: string; col: number }) => void;
  onUpdateCell: (rowKey: string, colKey: string, value: unknown) => void;
  onCellBlur: (rowKey: string, colKey: string, raw: string, original: unknown) => void;
  onSaveRow: (rowKey: string) => void;
  onCopyRow: (rowKey: string) => void;
  stickyLeftFor: (colKey: string) => number | undefined;
};

export function CodexSpreadsheetTable({
  columns,
  columnWidths,
  minTableWidth,
  sortedRows,
  dirty,
  sortKey,
  sortDir,
  focusedCell,
  savingRowKey,
  onSort,
  onFocusCell,
  onUpdateCell,
  onCellBlur,
  onSaveRow,
  onCopyRow,
  stickyLeftFor,
}: CodexSpreadsheetTableProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const shouldVirtualize = sortedRows.length > SPREADSHEET_VIRTUALIZE_ROW_THRESHOLD;
  const colSpan = columns.length + 2;

  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Virtual owns scroll metrics (see CodexBrowseListShell).
  const rowVirtualizer = useVirtualizer({
    count: sortedRows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => SPREADSHEET_ESTIMATED_ROW_HEIGHT,
    overscan: 10,
  });

  const virtualRows = shouldVirtualize ? rowVirtualizer.getVirtualItems() : null;
  const firstVirtual = virtualRows?.[0];
  const lastVirtual = virtualRows?.[virtualRows.length - 1];
  const paddingTop = firstVirtual ? firstVirtual.start : 0;
  const paddingBottom = lastVirtual != null ? rowVirtualizer.getTotalSize() - lastVirtual.end : 0;

  const renderRow = (row: CodexSpreadsheetRow, displayIndex: number, virtualIndex?: number) => {
    const focusedCol = focusedCell?.rowKey === row.key ? focusedCell.col : null;
    const rowProps = {
      row,
      displayIndex,
      columns,
      columnWidths,
      isDirty: dirty.has(row.key),
      isSaving: savingRowKey === row.key,
      focusedCol,
      onFocusCell,
      onUpdateCell,
      onCellBlur,
      onSaveRow,
      onCopyRow,
      stickyLeftFor,
      ...(virtualIndex !== undefined ? { virtualIndex } : {}),
      ...(shouldVirtualize ? { measureRef: rowVirtualizer.measureElement } : {}),
    };
    return <CodexSpreadsheetTableRow key={row.key} {...rowProps} />;
  };

  return (
    <div
      ref={scrollRef}
      className="overflow-auto border-t border-border"
      style={{ maxHeight: 'calc(100vh - 280px)', minHeight: 320 }}
    >
      <table
        className="border-collapse text-sm"
        style={{ minWidth: minTableWidth, tableLayout: 'fixed' }}
      >
        <thead>
          <tr className="sticky top-0 z-10 border-b border-border bg-surface-alt shadow-sm">
            <th className="sticky left-0 z-20 w-12 max-w-[48px] min-w-[48px] border-r border-border bg-surface-alt p-1 text-left text-xs font-semibold text-text-secondary">
              #
            </th>
            {columns.map((col, colIndex) => {
              const isSortKey = sortKey === col;
              const left = stickyLeftFor(col);
              const isSticky = left !== undefined;
              return (
                <th
                  key={col}
                  tabIndex={0}
                  onClick={() => onSort(col)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSort(col);
                    }
                  }}
                  className={`cursor-pointer border-r border-border-subtle p-1.5 text-left text-xs font-semibold whitespace-nowrap text-text-secondary select-none hover:bg-surface-alt/80 focus:ring-1 focus:ring-primary-outline-border focus:outline-none focus:ring-inset ${isSticky ? 'sticky z-20 bg-surface-alt shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)] dark:shadow-[2px_0_4px_-2px_rgba(0,0,0,0.3)]' : ''}`}
                  style={{
                    width: columnWidths[colIndex],
                    minWidth: columnWidths[colIndex],
                    ...(isSticky ? { left } : {}),
                  }}
                  aria-sort={isSortKey ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
                  aria-label={
                    isSortKey
                      ? `Sort by ${col} ${sortDir === 'asc' ? 'ascending' : 'descending'}. Click to reverse.`
                      : `Sort by ${col}`
                  }
                >
                  <span className="inline-flex items-center gap-1">
                    {col}
                    {isSortKey &&
                      (sortDir === 'asc' ? (
                        <ChevronUp className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5" />
                      ))}
                  </span>
                </th>
              );
            })}
            <th className="sticky right-0 z-20 w-[7rem] min-w-[7rem] border-l border-border bg-surface-alt p-1 text-center text-xs font-semibold text-text-secondary">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {shouldVirtualize && paddingTop > 0 && (
            <tr aria-hidden="true">
              <td colSpan={colSpan} style={{ height: paddingTop, padding: 0, border: 0 }} />
            </tr>
          )}
          {shouldVirtualize
            ? virtualRows!.map((virtualRow) => {
                const row = sortedRows[virtualRow.index];
                if (!row) return null;
                return renderRow(row, virtualRow.index, virtualRow.index);
              })
            : sortedRows.map((row, displayIndex) => renderRow(row, displayIndex))}
          {shouldVirtualize && paddingBottom > 0 && (
            <tr aria-hidden="true">
              <td colSpan={colSpan} style={{ height: paddingBottom, padding: 0, border: 0 }} />
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
