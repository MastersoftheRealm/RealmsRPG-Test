/**
 * Codex Spreadsheet View
 * ======================
 * Raw spreadsheet editing for the active codex tab. Find/replace (with whole-cell
 * and limit-to-column options), inline cell edit, Save all (with confirmation and
 * validation), per-row save, copy row with " copy" name and derived ID.
 */

'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Search, Replace, Copy, Save, Loader2, ChevronUp, ChevronDown } from 'lucide-react';
import { Button, Spinner, Modal } from '@/components/ui';
import { useCodexFull } from '@/hooks/use-codex';
import { createCodexDoc, updateCodexDoc } from './actions';

const COPY_NAME_SUFFIX = ' copy';

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

/** Next available numeric ID: max(existing numeric ids) + 1, or "1" if none. */
function generateNextNumericId(existingIds: Set<string>): string {
  const nums = [...existingIds]
    .map((s) => parseInt(s, 10))
    .filter((n) => !Number.isNaN(n) && n >= 0);
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
  return String(next);
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

/** Preferred column order: id, name, description first, then known short/narrow columns, then rest alphabetically. */
const PREFERRED_ORDER_AFTER_DESC = [
  'flaw', 'characteristic', 'option_trait_ids', 'rec_period', 'uses_per_rec', 'uses_per_rec_per_tier',
  'category', 'type', 'size', 'speed', 'skill_req', 'skill_req_val', 'ability_req', 'abil_req_val',
  'char_feat', 'state_feat', 'tags', 'lvl_req', 'mechanic', 'base_skill_id', 'base_skill_id_alt',
  'sizes', 'skills', 'species_traits', 'ancestry_traits', 'characteristics', 'flaws',
  'languages', 'ave_height', 'ave_weight', 'adulthood_lifespan',
];

function orderColumns(keys: string[]): string[] {
  const hasId = keys.includes('id');
  const hasName = keys.includes('name');
  const hasDesc = keys.includes('description');
  const rest = keys.filter((k) => k !== 'id' && k !== 'name' && k !== 'description');
  const ordered: string[] = [];
  if (hasId) ordered.push('id');
  if (hasName) ordered.push('name');
  if (hasDesc) ordered.push('description');
  const afterSet = new Set(PREFERRED_ORDER_AFTER_DESC);
  const preferred = PREFERRED_ORDER_AFTER_DESC.filter((k) => rest.includes(k));
  const remaining = rest.filter((k) => !afterSet.has(k)).sort();
  return [...ordered, ...preferred, ...remaining];
}

/** Known numeric columns (spreadsheet uses number input). */
const NUMERIC_COLUMNS = new Set([
  'lvl_req', 'uses_per_rec', 'uses_per_rec_per_tier', 'feat_lvl', 'pow_abil_req', 'mart_abil_req',
  'pow_prof_req', 'mart_prof_req', 'speed_req', 'abil_req_val', 'skill_req_val',
  'base_en', 'base_tp', 'op_1_en', 'op_1_tp', 'op_2_en', 'op_2_tp', 'op_3_en', 'op_3_tp',
  'base_ip', 'base_c', 'op_1_ip', 'op_1_tp', 'op_1_c', 'currency', 'feat_points',
  'ave_height', 'ave_weight', 'adulthood_lifespan',
]);
/** Known boolean columns (spreadsheet uses checkbox). */
const BOOLEAN_COLUMNS = new Set([
  'flaw', 'characteristic', 'char_feat', 'state_feat', 'percentage', 'duration', 'mechanic',
]);

/** Column width in px: narrow for id/boolean/short fields, wider for description. */
function getColumnWidth(colKey: string, sampleValue: unknown): number {
  if (colKey === 'id') return 90;
  if (colKey === 'name') return 120;
  if (colKey === 'description') return 320;
  if (typeof sampleValue === 'boolean') return 56;
  const narrowKeys = [
    'rec_period', 'uses_per_rec', 'uses_per_rec_per_tier', 'lvl_req', 'speed',
    'flaw', 'characteristic', 'char_feat', 'state_feat', 'base_skill_id', 'base_skill_id_alt',
  ];
  if (narrowKeys.includes(colKey)) return 72;
  if (colKey === 'category' || colKey === 'type' || colKey === 'size') return 88;
  return 140;
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
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [saveConfirmOpen, setSaveConfirmOpen] = useState(false);
  const [findWholeCell, setFindWholeCell] = useState(false);
  const [findLimitToColumn, setFindLimitToColumn] = useState<string>('');
  const [savingRowIndex, setSavingRowIndex] = useState<number | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  const config = TAB_CONFIG[activeTab];
  const rawArray = config && codex ? (codex[config.apiKey] as unknown[] | undefined) : undefined;
  const collection = config?.collection;

  // Derive columns: id, name, description first, then logical order
  const columns = useMemo(() => {
    if (!rawArray || rawArray.length === 0) return ['id'];
    const keySet = new Set<string>(['id']);
    rawArray.forEach((row) => {
      if (row && typeof row === 'object') {
        Object.keys(row as Record<string, unknown>).forEach((k) => keySet.add(k));
      }
    });
    return orderColumns(Array.from(keySet));
  }, [rawArray]);

  // Per-column width from first row sample
  const columnWidths = useMemo(() => {
    const first = rows[0] as Record<string, unknown> | undefined;
    return columns.map((col) => getColumnWidth(col, first?.[col]));
  }, [columns, rows]);

  const actionsColWidth = 112; /* 7rem */
  const minTableWidth = useMemo(
    () => columnWidths.reduce((a, b) => a + b, 0) + 48 + actionsColWidth,
    [columnWidths]
  );

  // Sorted view: array of row indices into rows
  const sortedRowIndices = useMemo(() => {
    if (!sortKey || rows.length === 0) return rows.map((_, i) => i);
    const dir = sortDir === 'asc' ? 1 : -1;
    return [...rows.keys()].sort((i, j) => {
      const a = rows[i] as Record<string, unknown>;
      const b = rows[j] as Record<string, unknown>;
      const sa = cellValueToString(a[sortKey]);
      const sb = cellValueToString(b[sortKey]);
      return sa.localeCompare(sb, undefined, { numeric: true }) * dir;
    });
  }, [rows, sortKey, sortDir]);

  const handleSort = useCallback((key: string) => {
    setSortKey((prev) => {
      if (prev === key) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        return prev;
      }
      setSortDir('asc');
      return key;
    });
  }, []);

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
      const nameRaw = (row as Record<string, unknown>).name;
      const baseName = typeof nameRaw === 'string' && nameRaw.trim() ? nameRaw.trim() : 'Item';
      const newName = baseName + COPY_NAME_SUFFIX;
      const newId = generateNextNumericId(existingIds);
      const newRow = { ...(row as Record<string, unknown>), id: newId, name: newName };
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
      const colsToSearch = findLimitToColumn ? [findLimitToColumn] : columns;
      const newDirty = new Set(dirty);
      const newRows = rows.map((row, rowIndex) => {
        const r = row as Record<string, unknown>;
        let changed = false;
        const nextRow = { ...r };
        colsToSearch.forEach((colKey) => {
          const val = r[colKey];
          const str = cellValueToString(val);
          const matches = findWholeCell ? str === find : str.includes(find);
          if (!matches) return;
          const newStr = findWholeCell
            ? (replaceAll ? (str === find ? repl : str) : (str === find ? repl : str))
            : (replaceAll ? str.split(find).join(repl) : str.replace(find, repl));
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
    [findValue, replaceValue, findWholeCell, findLimitToColumn, columns, rows, dirty]
  );

  /** Validate dirty rows: new rows must have a non-empty name. Returns display indices (1-based) of invalid rows. */
  const validateDirtyRows = useCallback((): { valid: boolean; invalidDisplayIndices: number[] } => {
    const invalid: number[] = [];
    sortedRowIndices.forEach((rowIndex, displayIndex) => {
      if (!dirty.has(rowIndex)) return;
      const row = rows[rowIndex] as Record<string, unknown>;
      const id = String(row?.id ?? '').trim();
      const isNew = !id || id.startsWith('__new');
      if (isNew) {
        const name = row?.name;
        const hasName = typeof name === 'string' && name.trim().length > 0;
        if (!hasName) invalid.push(displayIndex + 1);
      }
    });
    return { valid: invalid.length === 0, invalidDisplayIndices: invalid };
  }, [dirty, rows, sortedRowIndices]);

  const performSaveAll = useCallback(async () => {
    if (!collection || dirty.size === 0) return;
    setSaving(true);
    const errors: string[] = [];
    const usedIds = new Set(rows.map((r) => String((r as Record<string, unknown>).id ?? '')));
    for (const rowIndex of dirty) {
      const row = rows[rowIndex] as Record<string, unknown>;
      if (!row) continue;
      const id = String(row.id ?? '').trim();
      if (!id || id.startsWith('__new')) {
        const newId = generateNextNumericId(usedIds);
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
      setSaveConfirmOpen(false);
      queryClient.invalidateQueries({ queryKey: ['codex'] });
    }
    setSaving(false);
  }, [collection, dirty, rows, queryClient]);

  const handleSaveAllClick = useCallback(() => {
    const { valid, invalidDisplayIndices } = validateDirtyRows();
    if (!valid) {
      alert(`Please add a name for new row(s): ${invalidDisplayIndices.slice(0, 10).join(', ')}${invalidDisplayIndices.length > 10 ? ` and ${invalidDisplayIndices.length - 10} more` : ''}.`);
      return;
    }
    setSaveConfirmOpen(true);
  }, [validateDirtyRows]);

  const handleSaveAll = useCallback(() => {
    performSaveAll();
  }, [performSaveAll]);

  const saveRow = useCallback(
    async (rowIndex: number) => {
      if (!collection) return;
      const row = rows[rowIndex] as Record<string, unknown>;
      if (!row) return;
      const id = String(row.id ?? '').trim();
      const isNew = !id || id.startsWith('__new');
      if (isNew) {
        const name = row.name;
        if (typeof name !== 'string' || !name.trim()) {
          alert('New rows must have a name.');
          return;
        }
      }
      setSavingRowIndex(rowIndex);
      const usedIds = new Set(rows.map((r) => String((r as Record<string, unknown>).id ?? '')));
      let err: string | null | undefined = null;
      if (isNew) {
        const newId = generateNextNumericId(usedIds);
        const { id: _x, ...data } = row;
        const result = await createCodexDoc(collection, newId, data);
        if (!result.success) err = result.error ?? null;
        else {
          setRows((prev) => {
            const next = prev.map((r, i) => (i === rowIndex ? { ...(r as Record<string, unknown>), id: newId } : r));
            return next;
          });
        }
      } else {
        const { id: _x, ...data } = row;
        const result = await updateCodexDoc(collection, id, data);
        if (!result.success) err = result.error ?? null;
      }
      setSavingRowIndex(null);
      if (err) alert(err);
      else {
        setDirty((prev) => {
          const next = new Set(prev);
          next.delete(rowIndex);
          return next;
        });
        queryClient.invalidateQueries({ queryKey: ['codex'] });
      }
    },
    [collection, rows, queryClient]
  );

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

  const hasDirty = dirty.size > 0;
  const dirtyNewCount = useMemo(
    () => [...dirty].filter((i) => { const r = rows[i] as Record<string, unknown>; const id = String(r?.id ?? ''); return !id || id.startsWith('__new'); }).length,
    [dirty, rows]
  );
  const dirtyUpdateCount = dirty.size - dirtyNewCount;
  const idColIndex = columns.indexOf('id');
  const nameColIndex = columns.indexOf('name');
  const stickyLeftFor = (colKey: string, colIndex: number): number | undefined => {
    if (colKey === 'id') return 48;
    if (colKey === 'name' && idColIndex >= 0) return 48 + columnWidths[idColIndex];
    return undefined;
  };

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface">
      {/* Mobile: hint that spreadsheet is best on desktop */}
      <div className="md:hidden rounded-t-lg border-b border-border bg-surface-alt/70 px-4 py-2 text-xs text-text-secondary">
        Spreadsheet works best on desktop. Consider List view on small screens.
      </div>
      {/* Toolbar: Find/Replace + Save All. Touch targets min 44px per MOBILE_UX. */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-alt/50 px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded border border-border-light bg-surface px-2 py-1.5 min-h-[44px] md:min-h-0">
            <Search className="w-4 h-4 text-text-muted shrink-0" aria-hidden />
            <input
              type="text"
              value={findValue}
              onChange={(e) => setFindValue(e.target.value)}
              placeholder="Find..."
              className="w-40 bg-transparent text-sm outline-none min-h-[32px]"
              aria-label="Find in spreadsheet"
            />
          </div>
          <label className="flex items-center gap-2 text-xs text-text-secondary cursor-pointer select-none min-h-[44px] md:min-h-0 items-center">
            <input
              type="checkbox"
              checked={findWholeCell}
              onChange={(e) => setFindWholeCell(e.target.checked)}
              className="rounded border-border"
              aria-label="Match whole cell only"
            />
            Match whole cell
          </label>
          <select
            value={findLimitToColumn}
            onChange={(e) => setFindLimitToColumn(e.target.value)}
            className="rounded border border-border-light bg-surface px-2 py-1.5 text-sm min-h-[44px] md:min-h-[32px]"
            aria-label="Limit find/replace to column"
          >
            <option value="">All columns</option>
            {columns.map((col) => (
              <option key={col} value={col}>{col}</option>
            ))}
          </select>
          {replaceMode ? (
            <>
              <div className="flex items-center gap-1 rounded border border-border-light bg-surface px-2 py-1.5 min-h-[44px] md:min-h-0">
                <Replace className="w-4 h-4 text-text-muted shrink-0" aria-hidden />
                <input
                  type="text"
                  value={replaceValue}
                  onChange={(e) => setReplaceValue(e.target.value)}
                  placeholder="Replace with..."
                  className="w-40 bg-transparent text-sm outline-none min-h-[32px]"
                  aria-label="Replace with"
                />
              </div>
              <Button size="sm" variant="secondary" onClick={() => doFindReplace(false)} className="min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0">
                Replace
              </Button>
              <Button size="sm" variant="secondary" onClick={() => doFindReplace(true)} className="min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0">
                Replace all
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setReplaceMode(false)} className="min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0">
                Cancel
              </Button>
            </>
          ) : (
            <Button size="sm" variant="ghost" onClick={() => setReplaceMode(true)} className="min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0">
              <Replace className="w-4 h-4 mr-1" /> Replace
            </Button>
          )}
          <Button size="sm" variant="secondary" onClick={addNewRow} className="min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0">
            Add row
          </Button>
        </div>
        <Button
          size="sm"
          onClick={handleSaveAllClick}
          disabled={saving || !hasDirty}
          className="min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
          Save all changes
        </Button>
      </div>

      {/* Save-all confirmation */}
      <Modal
        isOpen={saveConfirmOpen}
        onClose={() => !saving && setSaveConfirmOpen(false)}
        title="Save all changes?"
        description={
          dirtyNewCount > 0 && dirtyUpdateCount > 0
            ? `Save ${dirty.size} rows (${dirtyNewCount} new, ${dirtyUpdateCount} updated)?`
            : dirtyNewCount > 0
              ? `Save ${dirty.size} new row(s)?`
              : `Save ${dirty.size} updated row(s)?`
        }
        footer={
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setSaveConfirmOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSaveAll} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
              Save
            </Button>
          </div>
        }
      >
        <p className="text-sm text-text-secondary">This will persist all unsaved edits. You cannot undo after saving.</p>
      </Modal>

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
              {columns.map((col, colIndex) => {
                const isSortKey = sortKey === col;
                const left = stickyLeftFor(col, colIndex);
                const isSticky = left !== undefined;
                return (
                  <th
                    key={col}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleSort(col)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSort(col); } }}
                    className={`border-r border-border-subtle p-1.5 text-left text-xs font-semibold text-text-secondary whitespace-nowrap cursor-pointer select-none hover:bg-surface-alt/80 focus:outline-none focus:ring-1 focus:ring-inset focus:ring-primary-400 ${isSticky ? 'sticky z-20 bg-surface-alt shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)] dark:shadow-[2px_0_4px_-2px_rgba(0,0,0,0.3)]' : ''}`}
                    style={{
                      width: columnWidths[colIndex],
                      minWidth: columnWidths[colIndex],
                      ...(isSticky ? { left } : {}),
                    }}
                    aria-sort={isSortKey ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined}
                    aria-label={isSortKey ? `Sort by ${col} ${sortDir === 'asc' ? 'ascending' : 'descending'}. Click to reverse.` : `Sort by ${col}`}
                  >
                    <span className="inline-flex items-center gap-1">
                      {col}
                      {isSortKey && (sortDir === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />)}
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
            {sortedRowIndices.map((rowIndex, displayIndex) => {
              const row = rows[rowIndex] as Record<string, unknown>;
              return (
              <tr
                key={rowIndex}
                className={`border-b border-border-subtle hover:bg-surface-alt/50 ${dirty.has(rowIndex) ? 'bg-amber-50/50 dark:bg-amber-900/10' : ''}`}
              >
                <td className="sticky left-0 z-10 bg-surface border-r border-border-subtle p-0 text-center text-xs text-text-muted">
                  {displayIndex + 1}
                </td>
                {columns.map((colKey, colIndex) => {
                  const value = row[colKey];
                  const str = cellValueToString(value);
                  const isFocused = focusedCell?.row === rowIndex && focusedCell?.col === colIndex;
                  const left = stickyLeftFor(colKey, colIndex);
                  const isSticky = left !== undefined;
                  const isNum = NUMERIC_COLUMNS.has(colKey);
                  const isBool = BOOLEAN_COLUMNS.has(colKey);
                  const isDesc = colKey === 'description';
                  const inputClass = `w-full min-w-0 border-0 bg-transparent px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-inset focus:ring-primary-400 ${isFocused ? 'ring-1 ring-inset ring-primary-400' : ''}`;
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
                      {isBool ? (
                        <label className="flex items-center justify-center min-h-[44px] md:min-h-[36px] px-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={value === true}
                            onChange={(e) => updateCell(rowIndex, colKey, e.target.checked)}
                            onFocus={() => setFocusedCell({ row: rowIndex, col: colIndex })}
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
                            updateCell(rowIndex, colKey, parsed);
                          }}
                          onBlur={(e) => handleCellBlur(rowIndex, colKey, e.target.value, value)}
                          onFocus={() => setFocusedCell({ row: rowIndex, col: colIndex })}
                          rows={2}
                          className={`${inputClass} resize-y min-h-[3rem] block`}
                          style={{ boxSizing: 'border-box' }}
                          aria-label={`Edit ${colKey}, row ${displayIndex + 1}`}
                        />
                      ) : isNum ? (
                        <input
                          type="number"
                          step="any"
                          value={str}
                          onChange={(e) => {
                            const v = e.target.value;
                            const parsed = v === '' ? undefined : (parseFloat(v) ?? value);
                            updateCell(rowIndex, colKey, parsed);
                          }}
                          onBlur={(e) => handleCellBlur(rowIndex, colKey, e.target.value, value)}
                          onFocus={() => setFocusedCell({ row: rowIndex, col: colIndex })}
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
                            updateCell(rowIndex, colKey, parsed);
                          }}
                          onBlur={(e) => handleCellBlur(rowIndex, colKey, e.target.value, value)}
                          onFocus={() => setFocusedCell({ row: rowIndex, col: colIndex })}
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
                    {dirty.has(rowIndex) && (
                      <button
                        type="button"
                        onClick={() => saveRow(rowIndex)}
                        disabled={savingRowIndex === rowIndex}
                        className="min-h-[44px] min-w-[44px] md:min-h-[36px] md:min-w-[36px] p-1.5 rounded text-text-muted hover:bg-surface-alt hover:text-primary-600 transition-colors inline-flex items-center justify-center"
                        title="Save this row"
                        aria-label="Save this row"
                      >
                        {savingRowIndex === rowIndex ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => copyRow(rowIndex)}
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
      <div className="px-4 py-2 text-xs text-text-muted dark:text-text-secondary border-t border-border">
        {rows.length} rows · {columns.length} columns
        {hasDirty && ` · ${dirty.size} unsaved change(s)`}
      </div>
    </div>
  );
}
