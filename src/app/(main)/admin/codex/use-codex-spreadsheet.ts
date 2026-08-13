/**
 * Codex Spreadsheet — workspace hook (TASK-617)
 *
 * Rows carry a stable `key` and the `originalId` captured at load. Dirty tracking and every
 * write are keyed on those, not on the array index or the id cell: copying a row shifts indices,
 * and an edited id cell would point the save at a different entity.
 */

'use client';

import { useState, useMemo, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui';
import { useCodexFull } from '@/hooks/use-codex';
import { createCodexDoc, updateCodexDoc } from './actions';
import type { CodexCollection } from '@/lib/codex/collections';
import {
  ACTIONS_COL_WIDTH,
  getColumnWidth,
  HIDDEN_COLUMNS,
  orderColumns,
  READONLY_COLUMNS,
  searchableColumns as filterSearchableColumns,
  TAB_CONFIG,
  type CodexSpreadsheetTabId,
} from './codex-spreadsheet-config';
import {
  cellValueToString,
  changedColumns,
  generateNextNumericId,
  rowDataWithoutId,
  stringToCellValue,
} from './codex-spreadsheet-helpers';

const COPY_NAME_SUFFIX = ' copy';

export type CodexSpreadsheetRow = {
  key: string;
  /** Id as loaded from the API; null for rows added in this session. */
  originalId: string | null;
  /** Row as loaded, for the changed-cell summary in the save confirmation. */
  original: Record<string, unknown> | null;
  data: Record<string, unknown>;
};

export type PendingRowChange = {
  key: string;
  name: string;
  isNew: boolean;
  changedColumns: string[];
};

type UseCodexSpreadsheetArgs = {
  activeTab: CodexSpreadsheetTabId;
};

let rowKeyCounter = 0;
function nextRowKey(): string {
  rowKeyCounter += 1;
  return `row_${rowKeyCounter}`;
}

function displayName(row: CodexSpreadsheetRow): string {
  const name = row.data.name;
  return typeof name === 'string' && name.trim() ? name.trim() : `(row ${row.originalId ?? 'new'})`;
}

export function useCodexSpreadsheet({ activeTab }: UseCodexSpreadsheetArgs) {
  const { showToast } = useToast();
  const { data: codex, isLoading, error, refetch } = useCodexFull();
  const queryClient = useQueryClient();
  const [rows, setRows] = useState<CodexSpreadsheetRow[]>([]);
  const [dirty, setDirty] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [findValue, setFindValue] = useState('');
  const [replaceValue, setReplaceValue] = useState('');
  const [replaceMode, setReplaceMode] = useState(false);
  const [focusedCell, setFocusedCell] = useState<{ rowKey: string; col: number } | null>(null);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [saveConfirmOpen, setSaveConfirmOpen] = useState(false);
  const [findWholeCell, setFindWholeCell] = useState(false);
  const [findLimitToColumn, setFindLimitToColumn] = useState<string>('');
  const [savingRowKey, setSavingRowKey] = useState<string | null>(null);

  const config = TAB_CONFIG[activeTab];
  const rawArray = config && codex ? (codex[config.apiKey] as unknown[] | undefined) : undefined;
  const collection = config?.collection as CodexCollection | undefined;

  const columns = useMemo(() => {
    if (!rawArray || rawArray.length === 0) return ['id'];
    const keySet = new Set<string>(['id']);
    rawArray.forEach((row) => {
      if (row && typeof row === 'object') {
        Object.keys(row as Record<string, unknown>).forEach((k) => {
          if (!HIDDEN_COLUMNS.has(k)) keySet.add(k);
        });
      }
    });
    return orderColumns(Array.from(keySet));
  }, [rawArray]);

  /** Find/replace must never rewrite ids: one Replace-all could retarget hundreds of saves. */
  const searchableColumns = useMemo(() => filterSearchableColumns(columns), [columns]);

  const columnWidths = useMemo(() => {
    const first = rows[0];
    return columns.map((col) => getColumnWidth(col, first?.data[col]));
  }, [columns, rows]);

  const minTableWidth = useMemo(
    () => columnWidths.reduce((a, b) => a + b, 0) + 48 + ACTIONS_COL_WIDTH,
    [columnWidths]
  );

  const sortedRows = useMemo(() => {
    if (!sortKey || rows.length === 0) return rows;
    const dir = sortDir === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => {
      const sa = cellValueToString(a.data[sortKey]);
      const sb = cellValueToString(b.data[sortKey]);
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

  const [seededRaw, setSeededRaw] = useState<unknown[] | undefined | null>(null);
  if (rawArray !== seededRaw) {
    setSeededRaw(rawArray);
    if (!rawArray) {
      setRows([]);
      setDirty(new Set());
    } else {
      setRows(
        rawArray.map((r) => {
          const data = r && typeof r === 'object' ? { ...(r as Record<string, unknown>) } : {};
          const id = data.id != null ? String(data.id) : '';
          return {
            key: nextRowKey(),
            originalId: id || null,
            original: { ...data },
            data,
          };
        })
      );
      setDirty(new Set());
    }
  }

  const updateCell = useCallback((rowKey: string, colKey: string, value: unknown) => {
    if (READONLY_COLUMNS.has(colKey)) return;
    setRows((prev) =>
      prev.map((row) => (row.key === rowKey ? { ...row, data: { ...row.data, [colKey]: value } } : row))
    );
    setDirty((prev) => new Set(prev).add(rowKey));
  }, []);

  const handleCellBlur = useCallback(
    (rowKey: string, colKey: string, raw: string, original: unknown) => {
      const parsed = stringToCellValue(raw, original);
      if (parsed !== original) {
        updateCell(rowKey, colKey, parsed);
      }
    },
    [updateCell]
  );

  const copyRow = useCallback(
    (rowKey: string) => {
      const source = rows.find((row) => row.key === rowKey);
      if (!source) return;
      const existingIds = new Set(
        rows.map((r) => String(r.data.id ?? '')).filter((id) => id.length > 0)
      );
      const nameRaw = source.data.name;
      const baseName = typeof nameRaw === 'string' && nameRaw.trim() ? nameRaw.trim() : 'Item';
      const newRow: CodexSpreadsheetRow = {
        key: nextRowKey(),
        originalId: null,
        original: null,
        data: {
          ...source.data,
          id: generateNextNumericId(existingIds),
          name: baseName + COPY_NAME_SUFFIX,
        },
      };
      setRows((prev) => {
        const index = prev.findIndex((row) => row.key === rowKey);
        const next = [...prev];
        next.splice(index < 0 ? prev.length : index + 1, 0, newRow);
        return next;
      });
      setDirty((prev) => new Set(prev).add(newRow.key));
    },
    [rows]
  );

  const doFindReplace = useCallback(
    (replaceAll: boolean) => {
      if (!findValue.trim()) return;
      const find = findValue.trim();
      const repl = replaceValue;
      const colsToSearch =
        findLimitToColumn && !READONLY_COLUMNS.has(findLimitToColumn)
          ? [findLimitToColumn]
          : searchableColumns;
      const newDirty = new Set(dirty);
      const newRows = rows.map((row) => {
        let changed = false;
        const nextData = { ...row.data };
        colsToSearch.forEach((colKey) => {
          const val = row.data[colKey];
          const str = cellValueToString(val);
          const matches = findWholeCell ? str === find : str.includes(find);
          if (!matches) return;
          const newStr = findWholeCell
            ? str === find
              ? repl
              : str
            : replaceAll
              ? str.split(find).join(repl)
              : str.replace(find, repl);
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
            nextData[colKey] = newVal;
            changed = true;
          }
        });
        if (!changed) return row;
        newDirty.add(row.key);
        return { ...row, data: nextData };
      });
      setRows(newRows);
      setDirty(newDirty);
      setReplaceMode(false);
    },
    [findValue, replaceValue, findWholeCell, findLimitToColumn, searchableColumns, rows, dirty]
  );

  const validateDirtyRows = useCallback((): { valid: boolean; invalidNames: string[] } => {
    const invalid: string[] = [];
    sortedRows.forEach((row, displayIndex) => {
      if (!dirty.has(row.key)) return;
      if (row.originalId) return;
      const name = row.data.name;
      if (typeof name !== 'string' || !name.trim()) invalid.push(String(displayIndex + 1));
    });
    return { valid: invalid.length === 0, invalidNames: invalid };
  }, [dirty, sortedRows]);

  const pendingChanges = useMemo<PendingRowChange[]>(
    () =>
      rows
        .filter((row) => dirty.has(row.key))
        .map((row) => ({
          key: row.key,
          name: displayName(row),
          isNew: !row.originalId,
          changedColumns: changedColumns(row.data, row.original),
        })),
    [rows, dirty]
  );

  const saveDirtyRow = useCallback(
    async (row: CodexSpreadsheetRow, usedIds: Set<string>): Promise<string | null> => {
      if (!collection) return 'No collection';
      const data = rowDataWithoutId(row.data);
      if (!row.originalId) {
        const newId = generateNextNumericId(usedIds);
        usedIds.add(newId);
        const result = await createCodexDoc(collection, newId, data);
        return result.success ? null : `Create ${newId}: ${result.error}`;
      }
      const expectedUpdatedAt =
        typeof row.original?.updated_at === 'string' ? row.original.updated_at : undefined;
      const result = await updateCodexDoc(collection, row.originalId, data, { expectedUpdatedAt });
      return result.success ? null : `Update ${row.originalId}: ${result.error}`;
    },
    [collection]
  );

  const clearDirtyKey = useCallback((rowKey: string) => {
    setDirty((prev) => {
      const next = new Set(prev);
      next.delete(rowKey);
      return next;
    });
  }, []);

  const performSaveAll = useCallback(async () => {
    if (!collection || dirty.size === 0) return;
    setSaving(true);
    const errors: string[] = [];
    const usedIds = new Set(rows.map((r) => String(r.data.id ?? '')));

    for (const row of rows) {
      if (!dirty.has(row.key)) continue;
      const err = await saveDirtyRow(row, usedIds);
      if (err) errors.push(err);
      else clearDirtyKey(row.key);
    }

    setSaving(false);
    if (errors.length > 0) {
      // Refetching here would re-seed the grid and drop the edits that failed to save;
      // per-row dirty clearing above already stops a retry from rewriting saved rows.
      showToast(
        errors.slice(0, 5).join('; ') +
          (errors.length > 5 ? `; ... and ${errors.length - 5} more` : ''),
        'error'
      );
      return;
    }
    setSaveConfirmOpen(false);
    queryClient.invalidateQueries({ queryKey: ['codex'] });
    await queryClient.refetchQueries({ queryKey: ['codex'] });
  }, [collection, dirty, rows, queryClient, showToast, saveDirtyRow, clearDirtyKey]);

  const handleSaveAllClick = useCallback(() => {
    const { valid, invalidNames } = validateDirtyRows();
    if (!valid) {
      showToast(
        `Please add a name for new row(s): ${invalidNames.slice(0, 10).join(', ')}${invalidNames.length > 10 ? ` and ${invalidNames.length - 10} more` : ''}.`,
        'error'
      );
      return;
    }
    setSaveConfirmOpen(true);
  }, [validateDirtyRows, showToast]);

  const saveRow = useCallback(
    async (rowKey: string) => {
      if (!collection) return;
      const row = rows.find((r) => r.key === rowKey);
      if (!row) return;
      if (!row.originalId) {
        const name = row.data.name;
        if (typeof name !== 'string' || !name.trim()) {
          showToast('New rows must have a name.', 'error');
          return;
        }
      }
      setSavingRowKey(rowKey);
      const usedIds = new Set(rows.map((r) => String(r.data.id ?? '')));
      const err = await saveDirtyRow(row, usedIds);
      setSavingRowKey(null);
      if (err) {
        showToast(err, 'error');
        return;
      }
      clearDirtyKey(rowKey);
      queryClient.invalidateQueries({ queryKey: ['codex'] });
      await queryClient.refetchQueries({ queryKey: ['codex'] });
    },
    [collection, rows, queryClient, showToast, saveDirtyRow, clearDirtyKey]
  );

  const addNewRow = useCallback(() => {
    const newRow: CodexSpreadsheetRow = {
      key: nextRowKey(),
      originalId: null,
      original: null,
      data: {},
    };
    setRows((prev) => [...prev, newRow]);
    setDirty((prev) => new Set(prev).add(newRow.key));
  }, []);

  const hasDirty = dirty.size > 0;
  const dirtyNewCount = pendingChanges.filter((change) => change.isNew).length;
  const dirtyUpdateCount = pendingChanges.length - dirtyNewCount;

  const idColIndex = columns.indexOf('id');
  const stickyLeftFor = useCallback(
    (colKey: string): number | undefined => {
      if (colKey === 'id') return 48;
      if (colKey === 'name' && idColIndex >= 0) return 48 + columnWidths[idColIndex];
      return undefined;
    },
    [idColIndex, columnWidths]
  );

  return {
    isLoading,
    error,
    refetch,
    config,
    rows,
    dirty,
    saving,
    findValue,
    setFindValue,
    replaceValue,
    setReplaceValue,
    replaceMode,
    setReplaceMode,
    focusedCell,
    setFocusedCell,
    sortKey,
    sortDir,
    saveConfirmOpen,
    setSaveConfirmOpen,
    findWholeCell,
    setFindWholeCell,
    findLimitToColumn,
    setFindLimitToColumn,
    savingRowKey,
    columns,
    searchableColumns,
    columnWidths,
    minTableWidth,
    sortedRows,
    handleSort,
    updateCell,
    handleCellBlur,
    copyRow,
    doFindReplace,
    performSaveAll,
    handleSaveAllClick,
    saveRow,
    addNewRow,
    hasDirty,
    pendingChanges,
    dirtyNewCount,
    dirtyUpdateCount,
    stickyLeftFor,
  };
}
