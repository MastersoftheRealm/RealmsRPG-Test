/**
 * Codex Spreadsheet — toolbar (TASK-617)
 * Hit area follows pointer tiers (ADR-0023 / TASK-847), not viewport `md:` slabs.
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
        <div className="flex items-center gap-1 rounded border border-border-light bg-surface px-2 py-1.5">
          <Search className="h-4 w-4 shrink-0 text-text-muted" aria-hidden />
          <input
            type="text"
            value={findValue}
            onChange={(e) => onFindValueChange(e.target.value)}
            placeholder="Find..."
            className="touch-tier-standard h-8 w-40 bg-transparent text-sm outline-none"
            aria-label="Find in spreadsheet"
          />
        </div>
        <label className="touch-tier-standard flex cursor-pointer items-center gap-2 text-xs text-text-secondary select-none">
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
          className="touch-tier-standard h-8 rounded border border-border-light bg-surface px-2 py-1.5 text-sm"
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
            <div className="flex items-center gap-1 rounded border border-border-light bg-surface px-2 py-1.5">
              <Replace className="h-4 w-4 shrink-0 text-text-muted" aria-hidden />
              <input
                type="text"
                value={replaceValue}
                onChange={(e) => onReplaceValueChange(e.target.value)}
                placeholder="Replace with..."
                className="touch-tier-standard h-8 w-40 bg-transparent text-sm outline-none"
                aria-label="Replace with"
              />
            </div>
            <Button size="sm" variant="secondary" onClick={() => onFindReplace(false)}>
              Replace
            </Button>
            <Button size="sm" variant="secondary" onClick={() => onFindReplace(true)}>
              Replace all
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onReplaceModeChange(false)}>
              Cancel
            </Button>
          </>
        ) : (
          <Button size="sm" variant="ghost" onClick={() => onReplaceModeChange(true)}>
            <Replace className="mr-1 h-4 w-4" /> Replace
          </Button>
        )}
        <Button size="sm" variant="secondary" onClick={onAddNewRow}>
          Add row
        </Button>
      </div>
      <Button size="sm" onClick={onSaveAllClick} disabled={saving || !hasDirty}>
        {saving ? (
          <Loader2 className="mr-1 h-4 w-4 animate-spin" />
        ) : (
          <Save className="mr-1 h-4 w-4" />
        )}
        Save all changes
      </Button>
    </div>
  );
}
