/**
 * Codex Spreadsheet — toolbar (TASK-617)
 */

'use client';

import { Search, Replace, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui';

type CodexSpreadsheetToolbarProps = {
  findValue: string;
  onFindValueChange: (value: string) => void;
  findWholeCell: boolean;
  onFindWholeCellChange: (checked: boolean) => void;
  findLimitToColumn: string;
  onFindLimitToColumnChange: (value: string) => void;
  columns: string[];
  replaceMode: boolean;
  onReplaceModeChange: (mode: boolean) => void;
  replaceValue: string;
  onReplaceValueChange: (value: string) => void;
  onFindReplace: (replaceAll: boolean) => void;
  onAddNewRow: () => void;
  onSaveAllClick: () => void;
  saving: boolean;
  hasDirty: boolean;
};

export function CodexSpreadsheetToolbar({
  findValue,
  onFindValueChange,
  findWholeCell,
  onFindWholeCellChange,
  findLimitToColumn,
  onFindLimitToColumnChange,
  columns,
  replaceMode,
  onReplaceModeChange,
  replaceValue,
  onReplaceValueChange,
  onFindReplace,
  onAddNewRow,
  onSaveAllClick,
  saving,
  hasDirty,
}: CodexSpreadsheetToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-alt/50 px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 rounded border border-border-light bg-surface px-2 py-1.5 min-h-[44px] md:min-h-0">
          <Search className="w-4 h-4 text-text-muted shrink-0" aria-hidden />
          <input
            type="text"
            value={findValue}
            onChange={(e) => onFindValueChange(e.target.value)}
            placeholder="Find..."
            className="w-40 bg-transparent text-sm outline-none min-h-[32px]"
            aria-label="Find in spreadsheet"
          />
        </div>
        <label className="flex items-center gap-2 text-xs text-text-secondary cursor-pointer select-none min-h-[44px] md:min-h-0 items-center">
          <input
            type="checkbox"
            checked={findWholeCell}
            onChange={(e) => onFindWholeCellChange(e.target.checked)}
            className="rounded border-border"
            aria-label="Match whole cell only"
          />
          Match whole cell
        </label>
        <select
          value={findLimitToColumn}
          onChange={(e) => onFindLimitToColumnChange(e.target.value)}
          className="rounded border border-border-light bg-surface px-2 py-1.5 text-sm min-h-[44px] md:min-h-[32px]"
          aria-label="Limit find/replace to column"
        >
          <option value="">All columns</option>
          {columns.map((col) => (
            <option key={col} value={col}>
              {col}
            </option>
          ))}
        </select>
        {replaceMode ? (
          <>
            <div className="flex items-center gap-1 rounded border border-border-light bg-surface px-2 py-1.5 min-h-[44px] md:min-h-0">
              <Replace className="w-4 h-4 text-text-muted shrink-0" aria-hidden />
              <input
                type="text"
                value={replaceValue}
                onChange={(e) => onReplaceValueChange(e.target.value)}
                placeholder="Replace with..."
                className="w-40 bg-transparent text-sm outline-none min-h-[32px]"
                aria-label="Replace with"
              />
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onFindReplace(false)}
              className="min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0"
            >
              Replace
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onFindReplace(true)}
              className="min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0"
            >
              Replace all
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onReplaceModeChange(false)}
              className="min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0"
            >
              Cancel
            </Button>
          </>
        ) : (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onReplaceModeChange(true)}
            className="min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0"
          >
            <Replace className="w-4 h-4 mr-1" /> Replace
          </Button>
        )}
        <Button
          size="sm"
          variant="secondary"
          onClick={onAddNewRow}
          className="min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0"
        >
          Add row
        </Button>
      </div>
      <Button
        size="sm"
        onClick={onSaveAllClick}
        disabled={saving || !hasDirty}
        className="min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
        Save all changes
      </Button>
    </div>
  );
}
