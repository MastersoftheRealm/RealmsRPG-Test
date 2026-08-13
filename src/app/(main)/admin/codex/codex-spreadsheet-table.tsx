/**
 * Codex Spreadsheet — table body (TASK-617)
 */

'use client';

import { useRef } from 'react';
import { Copy, Save, Loader2, ChevronUp, ChevronDown } from 'lucide-react';
import { BOOLEAN_COLUMNS, NUMERIC_COLUMNS, READONLY_COLUMNS } from './codex-spreadsheet-config';
import { cellValueToString, isFiniteNumberString, stringToCellValue } from './codex-spreadsheet-helpers';
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
  const tableRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={tableRef}
      className="overflow-auto border-t border-border"
      style={{ maxHeight: 'calc(100vh - 280px)', minHeight: 320 }}
    >
      <table
        className="border-collapse text-sm"
        style={{ minWidth: minTableWidth, tableLayout: 'fixed' }}
      >
        <thead>
          <tr className="sticky top-0 z-10 bg-surface-alt border-b border-border shadow-sm">
            <th className="sticky left-0 z-20 w-12 min-w-[48px] max-w-[48px] bg-surface-alt border-r border-border p-1 text-left text-xs font-semibold text-text-secondary">
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
                  className={`border-r border-border-subtle p-1.5 text-left text-xs font-semibold text-text-secondary whitespace-nowrap cursor-pointer select-none hover:bg-surface-alt/80 focus:outline-none focus:ring-1 focus:ring-inset focus:ring-primary-outline-border ${isSticky ? 'sticky z-20 bg-surface-alt shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)] dark:shadow-[2px_0_4px_-2px_rgba(0,0,0,0.3)]' : ''}`}
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
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      ))}
                  </span>
                </th>
              );
            })}
            <th className="sticky right-0 z-20 w-[7rem] min-w-[7rem] bg-surface-alt border-l border-border p-1 text-center text-xs font-semibold text-text-secondary">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedRows.map((row, displayIndex) => {
            const isDirty = dirty.has(row.key);
            return (
              <tr
                key={row.key}
                className={`border-b border-border-subtle hover:bg-surface-alt/50 ${isDirty ? 'bg-warning-light/50' : ''}`}
              >
                <td className="sticky left-0 z-10 bg-surface border-r border-border-subtle p-0 text-center text-xs text-text-muted">
                  {displayIndex + 1}
                </td>
                {columns.map((colKey, colIndex) => {
                  const value = row.data[colKey];
                  const str = cellValueToString(value);
                  const isFocused = focusedCell?.rowKey === row.key && focusedCell?.col === colIndex;
                  const left = stickyLeftFor(colKey);
                  const isSticky = left !== undefined;
                  const isReadOnly = READONLY_COLUMNS.has(colKey);
                  const isNumCol = NUMERIC_COLUMNS.has(colKey);
                  const isBool = BOOLEAN_COLUMNS.has(colKey);
                  const isDesc = colKey === 'description';
                  const canRenderAsNumber =
                    isNumCol &&
                    (value == null ||
                      typeof value === 'number' ||
                      (typeof value === 'string' && (value.trim() === '' || isFiniteNumberString(value))) ||
                      typeof value === 'boolean' === false) &&
                    !Array.isArray(value) &&
                    !(typeof value === 'object' && value !== null);
                  const inputClass = `w-full min-w-0 border-0 bg-transparent px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-inset focus:ring-primary-outline-border ${isFocused ? 'ring-1 ring-inset ring-primary-outline-border' : ''}`;
                  return (
                    <td
                      key={colKey}
                      className={`border-r border-border-subtle p-0 align-top ${isSticky ? 'sticky z-10 bg-surface shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)] dark:shadow-[2px_0_4px_-2px_rgba(0,0,0,0.25)]' : ''}`}
                      style={{
                        width: columnWidths[colIndex],
                        minWidth: columnWidths[colIndex],
                        ...(isSticky ? { left } : {}),
                      }}
                    >
                      {isReadOnly ? (
                        <input
                          type="text"
                          value={str}
                          readOnly
                          onFocus={() => onFocusCell({ rowKey: row.key, col: colIndex })}
                          className={`${inputClass} text-text-muted dark:text-text-secondary cursor-default`}
                          style={{ boxSizing: 'border-box' }}
                          title="Ids are assigned when the entry is created and cannot be changed"
                          aria-label={`${colKey}, row ${displayIndex + 1} (read only)`}
                        />
                      ) : isBool ? (
                        <label className="flex items-center justify-center min-h-[44px] md:min-h-[36px] px-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={value === true}
                            onChange={(e) => onUpdateCell(row.key, colKey, e.target.checked)}
                            onFocus={() => onFocusCell({ rowKey: row.key, col: colIndex })}
                            className="rounded border-border h-4 w-4"
                            aria-label={`Edit ${colKey}, row ${displayIndex + 1}`}
                          />
                        </label>
                      ) : isDesc ? (
                        <textarea
                          value={str}
                          onChange={(e) => {
                            const v = e.target.value;
                            const parsed = stringToCellValue(v, value);
                            onUpdateCell(row.key, colKey, parsed);
                          }}
                          onBlur={(e) => onCellBlur(row.key, colKey, e.target.value, value)}
                          onFocus={() => onFocusCell({ rowKey: row.key, col: colIndex })}
                          rows={2}
                          className={`${inputClass} resize-y min-h-[3rem] block`}
                          style={{ boxSizing: 'border-box' }}
                          aria-label={`Edit ${colKey}, row ${displayIndex + 1}`}
                        />
                      ) : canRenderAsNumber ? (
                        <input
                          type="number"
                          step="any"
                          value={
                            value == null
                              ? ''
                              : typeof value === 'number'
                                ? Number.isFinite(value)
                                  ? String(value)
                                  : ''
                                : typeof value === 'string'
                                  ? value
                                  : ''
                          }
                          onChange={(e) => {
                            const v = e.target.value;
                            const parsed = v === '' ? undefined : (parseFloat(v) ?? value);
                            onUpdateCell(row.key, colKey, parsed);
                          }}
                          onBlur={(e) => onCellBlur(row.key, colKey, e.target.value, value)}
                          onFocus={() => onFocusCell({ rowKey: row.key, col: colIndex })}
                          className={inputClass}
                          style={{ boxSizing: 'border-box' }}
                          aria-label={`Edit ${colKey}, row ${displayIndex + 1}`}
                        />
                      ) : (
                        <input
                          type="text"
                          value={str}
                          onChange={(e) => {
                            const v = e.target.value;
                            const parsed = stringToCellValue(v, value);
                            onUpdateCell(row.key, colKey, parsed);
                          }}
                          onBlur={(e) => onCellBlur(row.key, colKey, e.target.value, value)}
                          onFocus={() => onFocusCell({ rowKey: row.key, col: colIndex })}
                          className={inputClass}
                          style={{ boxSizing: 'border-box' }}
                          aria-label={`Edit ${colKey}, row ${displayIndex + 1}`}
                        />
                      )}
                    </td>
                  );
                })}
                <td className="sticky right-0 z-10 bg-surface border-l border-border-subtle p-1 text-center align-middle">
                  <div className="flex items-center justify-center gap-0.5">
                    {isDirty && (
                      <button
                        type="button"
                        onClick={() => onSaveRow(row.key)}
                        disabled={savingRowKey === row.key}
                        className="min-h-[44px] min-w-[44px] md:min-h-[36px] md:min-w-[36px] p-1.5 rounded text-text-muted hover:bg-surface-alt hover:text-primary-fg-hover transition-colors inline-flex items-center justify-center"
                        title="Save this row"
                        aria-label="Save this row"
                      >
                        {savingRowKey === row.key ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onCopyRow(row.key)}
                      className="min-h-[44px] min-w-[44px] md:min-h-[36px] md:min-w-[36px] p-1.5 rounded text-text-muted hover:bg-surface-alt hover:text-text-primary transition-colors inline-flex items-center justify-center"
                      title="Copy row below (new ID and name copy)"
                      aria-label="Copy row below (new ID and name copy)"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
