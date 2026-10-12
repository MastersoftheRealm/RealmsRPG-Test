'use client';

import { memo, type Ref } from 'react';
import { Copy, Save, Loader2 } from 'lucide-react';
import { IconButton } from '@/components/ui';
import { BOOLEAN_COLUMNS, NUMERIC_COLUMNS, READONLY_COLUMNS } from './codex-spreadsheet-config';
import {
  cellValueToString,
  isFiniteNumberString,
  stringToCellValue,
} from './codex-spreadsheet-helpers';
import type { CodexSpreadsheetRow } from './use-codex-spreadsheet';

export type CodexSpreadsheetTableRowProps = {
  row: CodexSpreadsheetRow;
  displayIndex: number;
  columns: string[];
  columnWidths: number[];
  isDirty: boolean;
  isSaving: boolean;
  focusedCol: number | null;
  onFocusCell: (cell: { rowKey: string; col: number }) => void;
  onUpdateCell: (rowKey: string, colKey: string, value: unknown) => void;
  onCellBlur: (rowKey: string, colKey: string, raw: string, original: unknown) => void;
  onSaveRow: (rowKey: string) => void;
  onCopyRow: (rowKey: string) => void;
  stickyLeftFor: (colKey: string) => number | undefined;
  /** TanStack Virtual `measureElement` callback ref. */
  measureRef?: (node: Element | null) => void;
  virtualIndex?: number;
};

function CodexSpreadsheetTableRowInner({
  row,
  displayIndex,
  columns,
  columnWidths,
  isDirty,
  isSaving,
  focusedCol,
  onFocusCell,
  onUpdateCell,
  onCellBlur,
  onSaveRow,
  onCopyRow,
  stickyLeftFor,
  measureRef,
  virtualIndex,
}: CodexSpreadsheetTableRowProps) {
  return (
    <tr
      ref={measureRef as Ref<HTMLTableRowElement> | undefined}
      data-index={virtualIndex}
      className={`border-b border-border-subtle hover:bg-surface-alt/50 ${isDirty ? 'bg-warning-light/50' : ''}`}
    >
      <td className="sticky left-0 z-10 border-r border-border-subtle bg-surface p-0 text-center text-xs text-text-muted">
        {displayIndex + 1}
      </td>
      {columns.map((colKey, colIndex) => {
        const value = row.data[colKey];
        const str = cellValueToString(value);
        const isFocused = focusedCol === colIndex;
        const left = stickyLeftFor(colKey);
        const isSticky = left !== undefined;
        const isReadOnly = READONLY_COLUMNS.has(colKey);
        const isNumCol = NUMERIC_COLUMNS.has(colKey);
        const isBool = BOOLEAN_COLUMNS.has(colKey) || typeof value === 'boolean';
        const isDesc = colKey === 'description';
        const canRenderAsNumber =
          isNumCol &&
          (value == null ||
            typeof value === 'number' ||
            (typeof value === 'string' && (value.trim() === '' || isFiniteNumberString(value))) ||
            (typeof value === 'boolean') === false) &&
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
                className={`${inputClass} cursor-default text-text-muted`}
                style={{ boxSizing: 'border-box' }}
                title="Ids are assigned when the entry is created and cannot be changed"
                aria-label={`${colKey}, row ${displayIndex + 1} (read only)`}
              />
            ) : isBool ? (
              <label className="touch-tier-standard flex cursor-pointer items-center justify-center px-2">
                <input
                  type="checkbox"
                  checked={value === true}
                  onChange={(e) => onUpdateCell(row.key, colKey, e.target.checked)}
                  onFocus={() => onFocusCell({ rowKey: row.key, col: colIndex })}
                  className="h-4 w-4 rounded border-border"
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
                className={`${inputClass} block min-h-[3rem] resize-y`}
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
      <td className="sticky right-0 z-10 border-l border-border-subtle bg-surface p-1 text-center align-middle">
        <div className="flex items-center justify-center gap-0.5">
          {isDirty && (
            <IconButton
              type="button"
              variant="primary"
              size="md"
              onClick={() => onSaveRow(row.key)}
              disabled={isSaving}
              label="Save this row"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
            </IconButton>
          )}
          <IconButton
            type="button"
            size="md"
            onClick={() => onCopyRow(row.key)}
            label="Copy row below (new ID and name copy)"
          >
            <Copy className="h-4 w-4" />
          </IconButton>
        </div>
      </td>
    </tr>
  );
}

export const CodexSpreadsheetTableRow = memo(CodexSpreadsheetTableRowInner);
