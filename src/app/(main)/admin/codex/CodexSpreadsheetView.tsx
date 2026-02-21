/**
 * Codex Spreadsheet View
 * ======================
 * Raw spreadsheet editing for the active codex tab. Find/replace, inline cell edit,
 * Save all (no prompt), copy row with auto-generated new ID. Scrolls like a sheet.
 */

'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Search, Replace, Copy, Save, Loader2 } from 'lucide-react';
import { Button, Spinner } from '@/components/ui';
import { useCodexFull } from '@/hooks/use-codex';
import { createCodexDoc, updateCodexDoc } from './actions';

type TabId =
  | 'feats'
  | 'skills'
  | 'species'
  | 'traits'
  | 'parts'
  | 'properties'
  | 'equipment'
  | 'archetypes'
  | 'creature_feats';

type CodexCollection =
  | 'codex_feats'
  | 'codex_skills'
  | 'codex_species'
  | 'codex_traits'
  | 'codex_parts'
  | 'codex_properties'
  | 'codex_equipment'
  | 'codex_archetypes'
  | 'codex_creature_feats';

const TAB_CONFIG: Record<
  TabId,
  { apiKey: 'feats' | 'skills' | 'species' | 'traits' | 'parts' | 'itemProperties' | 'equipment' | 'archetypes' | 'creatureFeats'; collection: CodexCollection }
> = {
  feats: { apiKey: 'feats', collection: 'codex_feats' },
  skills: { apiKey: 'skills', collection: 'codex_skills' },
  species: { apiKey: 'species', collection: 'codex_species' },
  traits: { apiKey: 'traits', collection: 'codex_traits' },
  parts: { apiKey: 'parts', collection: 'codex_parts' },
  properties: { apiKey: 'itemProperties', collection: 'codex_properties' },
  equipment: { apiKey: 'equipment', collection: 'codex_equipment' },
  archetypes: { apiKey: 'archetypes', collection: 'codex_archetypes' },
  creature_feats: { apiKey: 'creatureFeats', collection: 'codex_creature_feats' },
};

function cellValueToString(value: unknown): string {
  if (value === undefined || value === null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return JSON.stringify(value);
}

function stringToCellValue(str: string, original: unknown): unknown {
  const trimmed = str.trim();
  if (trimmed === '') return undefined;
  if (typeof original === 'number') {
    const n = parseFloat(trimmed);
    return isNaN(n) ? original : n;
  }
  if (typeof original === 'boolean') {
    const lower = trimmed.toLowerCase();
    if (lower === 'true') return true;
    if (lower === 'false') return false;
    return original;
  }
  if (Array.isArray(original) || (typeof original === 'object' && original !== null)) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return trimmed;
    }
  }
  return trimmed;
}

function generateNewId(existingIds: Set<string>, baseName?: string): string {
  const base = (baseName || 'item')
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_-]/g, '')
    .slice(0, 80) || 'item';
  let id = base;
  let n = 0;
  while (existingIds.has(id)) {
    n += 1;
    id = `${base}_${n}`;
  }
  return id.slice(0, 150);
}

interface CodexSpreadsheetViewProps {
  activeTab: TabId;
}

export function CodexSpreadsheetView({ activeTab }: CodexSpreadsheetViewProps) {
  const { data: codex, isLoading, error } = useCodexFull();
  const queryClient = useQueryClient();
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [dirty, setDirty] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);
  const [findValue, setFindValue] = useState('');
  const [replaceValue, setReplaceValue] = useState('');
  const [replaceMode, setReplaceMode] = useState(false);
  const [focusedCell, setFocusedCell] = useState<{ row: number; col: number } | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  const config = TAB_CONFIG[activeTab];
  const rawArray = config && codex ? (codex[config.apiKey] as unknown[] | undefined) : undefined;
  const collection = config?.collection;

  // Derive columns: id first, then union of all keys in row order
  const columns = useMemo(() => {
    if (!rawArray || rawArray.length === 0) return ['id'];
    const keySet = new Set<string>(['id']);
    rawArray.forEach((row) => {
      if (row && typeof row === 'object') {
        Object.keys(row as Record<string, unknown>).forEach((k) => keySet.add(k));
      }
    });
    const rest = Array.from(keySet).filter((k) => k !== 'id').sort();
    return ['id', ...rest];
  }, [rawArray]);

  // Sync rows from API when tab or codex changes
  useEffect(() => {
    if (!rawArray) {
      setRows([]);
      setDirty(new Set());
      return;
    }
    setRows(rawArray.map((r) => (r && typeof r === 'object' ? { ...(r as Record<string, unknown>) } : {})));
    setDirty(new Set());
  }, [activeTab, rawArray]);

  const updateCell = useCallback((rowIndex: number, colKey: string, value: unknown) => {
    setRows((prev) => {
      const next = prev.map((row, i) =>
        i === rowIndex ? { ...row, [colKey]: value } : row
      );
      return next;
    });
    setDirty((prev) => new Set(prev).add(rowIndex));
  }, []);

  const handleCellBlur = useCallback(
    (rowIndex: number, colKey: string, raw: string, original: unknown) => {
      const parsed = stringToCellValue(raw, original);
      if (parsed !== original) {
        updateCell(rowIndex, colKey, parsed);
      }
    },
    [updateCell]
  );

  const copyRow = useCallback(
    (rowIndex: number) => {
      const row = rows[rowIndex];
      if (!row || typeof row !== 'object') return;
      const existingIds = new Set(
        rows.map((r) => String((r as Record<string, unknown>).id ?? '')).filter((id) => id.length > 0)
      );
      const name = (row as Record<string, unknown>).name;
      const newId = generateNewId(existingIds, typeof name === 'string' ? name : undefined);
      const newRow = { ...(row as Record<string, unknown>), id: newId };
      setRows((prev) => {
        const next = [...prev];
        next.splice(rowIndex + 1, 0, newRow);
        return next;
      });
      setDirty((prev) => new Set(prev).add(rowIndex + 1));
    },
    [rows]
  );

  const doFindReplace = useCallback(
    (replaceAll: boolean) => {
      if (!findValue.trim()) return;
      const find = findValue.trim();
      const repl = replaceValue;
      const newDirty = new Set(dirty);
      const newRows = rows.map((row, rowIndex) => {
        const r = row as Record<string, unknown>;
        let changed = false;
        const nextRow = { ...r };
        columns.forEach((colKey) => {
          const val = r[colKey];
          const str = cellValueToString(val);
          if (!str.includes(find)) return;
          const newStr = replaceAll ? str.split(find).join(repl) : str.replace(find, repl);
          if (newStr !== str) {
            let newVal: unknown = newStr;
            if (typeof val === 'number') newVal = parseFloat(newStr) || val;
            else if (typeof val === 'boolean') newVal = newStr.toLowerCase() === 'true';
            else if (Array.isArray(val) || (typeof val === 'object' && val !== null)) {
              try {
                newVal = JSON.parse(newStr);
              } catch {
                newVal = newStr;
              }
            }
            nextRow[colKey] = newVal;
            changed = true;
          }
        });
        if (changed) newDirty.add(rowIndex);
        return nextRow;
      });
      setRows(newRows);
      setDirty(newDirty);
      setReplaceMode(false);
    },
    [findValue, replaceValue, columns, rows, dirty]
  );

  const handleSaveAll = useCallback(async () => {
    if (!collection || dirty.size === 0) return;
    setSaving(true);
    const errors: string[] = [];
    const usedIds = new Set(rows.map((r) => String((r as Record<string, unknown>).id ?? '')));
    for (const rowIndex of dirty) {
      const row = rows[rowIndex] as Record<string, unknown>;
      if (!row) continue;
      const id = String(row.id ?? '').trim();
      if (!id || id.startsWith('__new')) {
        const newId = generateNewId(usedIds, String(row.name ?? ''));
        usedIds.add(newId);
        const { id: _x, ...data } = row;
        const result = await createCodexDoc(collection, newId, data);
        if (!result.success) errors.push(`Create ${newId}: ${result.error}`);
      } else {
        const { id: _x, ...data } = row;
        const result = await updateCodexDoc(collection, id, data);
        if (!result.success) errors.push(`Update ${id}: ${result.error}`);
      }
    }
    if (errors.length > 0) {
      alert(errors.slice(0, 5).join('\n') + (errors.length > 5 ? `\n... and ${errors.length - 5} more` : ''));
    } else {
      setDirty(new Set());
      queryClient.invalidateQueries({ queryKey: ['codex'] });
    }
    setSaving(false);
  }, [collection, dirty, rows, queryClient]);

  const addNewRow = useCallback(() => {
    const newId = `__new_${Date.now()}`;
    const emptyRow: Record<string, unknown> = { id: newId };
    setRows((prev) => [...prev, emptyRow]);
    setDirty((prev) => new Set(prev).add(rows.length));
  }, [rows.length]);

  if (error) {
    return (
      <div className="rounded-lg border border-border bg-surface p-6 text-center text-red-600">
        Failed to load codex. Check console for details.
      </div>
    );
  }

  if (isLoading || !config) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  const columnWidth = 140;
  const minTableWidth = columns.length * columnWidth;
  const hasDirty = dirty.size > 0;

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface">
      {/* Toolbar: Find/Replace + Save All */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-alt/50 px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded border border-border-light bg-surface px-2 py-1">
            <Search className="w-4 h-4 text-text-muted" />
            <input
              type="text"
              value={findValue}
              onChange={(e) => setFindValue(e.target.value)}
              placeholder="Find..."
              className="w-40 bg-transparent text-sm outline-none"
            />
          </div>
          {replaceMode ? (
            <>
              <div className="flex items-center gap-1 rounded border border-border-light bg-surface px-2 py-1">
                <Replace className="w-4 h-4 text-text-muted" />
                <input
                  type="text"
                  value={replaceValue}
                  onChange={(e) => setReplaceValue(e.target.value)}
                  placeholder="Replace with..."
                  className="w-40 bg-transparent text-sm outline-none"
                />
              </div>
              <Button size="sm" variant="secondary" onClick={() => doFindReplace(false)}>
                Replace
              </Button>
              <Button size="sm" variant="secondary" onClick={() => doFindReplace(true)}>
                Replace all
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setReplaceMode(false)}>
                Cancel
              </Button>
            </>
          ) : (
            <Button size="sm" variant="ghost" onClick={() => setReplaceMode(true)}>
              <Replace className="w-4 h-4 mr-1" /> Replace
            </Button>
          )}
          <Button size="sm" variant="secondary" onClick={addNewRow}>
            Add row
          </Button>
        </div>
        <Button
          size="sm"
          onClick={handleSaveAll}
          disabled={saving || !hasDirty}
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
          Save all changes
        </Button>
      </div>

      {/* Spreadsheet table: horizontal + vertical scroll */}
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
              {columns.map((col) => (
                <th
                  key={col}
                  className="border-r border-border-subtle p-1.5 text-left text-xs font-semibold text-text-secondary whitespace-nowrap"
                  style={{ width: columnWidth, minWidth: columnWidth }}
                >
                  {col}
                </th>
              ))}
              <th className="w-14 min-w-[56px] bg-surface-alt border-l border-border p-1 text-center text-xs font-semibold text-text-secondary">
                Copy
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={`border-b border-border-subtle hover:bg-surface-alt/50 ${dirty.has(rowIndex) ? 'bg-amber-50/50 dark:bg-amber-900/10' : ''}`}
              >
                <td className="sticky left-0 z-10 bg-surface border-r border-border-subtle p-0 text-center text-xs text-text-muted">
                  {rowIndex + 1}
                </td>
                {columns.map((colKey, colIndex) => {
                  const value = (row as Record<string, unknown>)[colKey];
                  const str = cellValueToString(value);
                  const isFocused = focusedCell?.row === rowIndex && focusedCell?.col === colIndex;
                  return (
                    <td
                      key={colKey}
                      className="border-r border-border-subtle p-0 align-top"
                      style={{ width: columnWidth, minWidth: columnWidth }}
                    >
                      <input
                        type="text"
                        value={str}
                        onChange={(e) => {
                          const v = e.target.value;
                          const parsed = stringToCellValue(v, value);
                          updateCell(rowIndex, colKey, parsed);
                        }}
                        onBlur={(e) => handleCellBlur(rowIndex, colKey, e.target.value, value)}
                        onFocus={() => setFocusedCell({ row: rowIndex, col: colIndex })}
                        className={`w-full min-w-0 border-0 bg-transparent px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-inset focus:ring-primary-400 ${isFocused ? 'ring-1 ring-inset ring-primary-400' : ''}`}
                        style={{ boxSizing: 'border-box' }}
                      />
                    </td>
                  );
                })}
                <td className="sticky right-0 z-10 bg-surface border-l border-border-subtle p-1 text-center">
                  <button
                    type="button"
                    onClick={() => copyRow(rowIndex)}
                    className="p-1.5 rounded text-text-muted hover:bg-surface-alt hover:text-text-primary transition-colors"
                    title="Copy row below (new ID)"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-2 text-xs text-text-muted border-t border-border">
        {rows.length} rows · {columns.length} columns
        {hasDirty && ` · ${dirty.size} unsaved change(s)`}
      </div>
    </div>
  );
}
