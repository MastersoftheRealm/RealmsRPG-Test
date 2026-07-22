/**
 * Codex Spreadsheet — workspace hook (TASK-617)
 */

'use client';

import { useState, useMemo, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui';
import { useCodexFull } from '@/hooks/use-codex';
import { createCodexDoc, updateCodexDoc } from './actions';
import {
  ACTIONS_COL_WIDTH,
  COPY_NAME_SUFFIX,
  getColumnWidth,
  orderColumns,
  TAB_CONFIG,
  type CodexCollection,
  type CodexSpreadsheetTabId,
} from './codex-spreadsheet-config';
import {
  cellValueToString,
  generateNextNumericId,
  rowDataWithoutId,
  stringToCellValue,
} from './codex-spreadsheet-helpers';

export type UseCodexSpreadsheetArgs = {
  activeTab: CodexSpreadsheetTabId;
};

export function useCodexSpreadsheet({ activeTab }: UseCodexSpreadsheetArgs) {
  const { showToast } = useToast();
  const { data: codex, isLoading, error, refetch } = useCodexFull();
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

  const config = TAB_CONFIG[activeTab];
  const rawArray = config && codex ? (codex[config.apiKey] as unknown[] | undefined) : undefined;
  const collection = config?.collection as CodexCollection | undefined;

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

  const columnWidths = useMemo(() => {
    const first = rows[0] as Record<string, unknown> | undefined;
    return columns.map((col) => getColumnWidth(col, first?.[col]));
  }, [columns, rows]);

  const minTableWidth = useMemo(
    () => columnWidths.reduce((a, b) => a + b, 0) + 48 + ACTIONS_COL_WIDTH,
    [columnWidths]
  );

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

  const [seededRaw, setSeededRaw] = useState<unknown[] | undefined | null>(null);
  if (rawArray !== seededRaw) {
    setSeededRaw(rawArray);
    if (!rawArray) {
      setRows([]);
      setDirty(new Set());
    } else {
      setRows(
        rawArray.map((r) =>
          r && typeof r === 'object' ? { ...(r as Record<string, unknown>) } : {}
        )
      );
      setDirty(new Set());
    }
  }

  const updateCell = useCallback((rowIndex: number, colKey: string, value: unknown) => {
    setRows((prev) => {
      const next = prev.map((row, i) => (i === rowIndex ? { ...row, [colKey]: value } : row));
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
            ? replaceAll
              ? str === find
                ? repl
                : str
              : str === find
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
        const data = rowDataWithoutId(row);
        const result = await createCodexDoc(collection, newId, data);
        if (!result.success) errors.push(`Create ${newId}: ${result.error}`);
      } else {
        const data = rowDataWithoutId(row);
        const result = await updateCodexDoc(collection, id, data);
        if (!result.success) errors.push(`Update ${id}: ${result.error}`);
      }
    }
    if (errors.length > 0) {
      showToast(
        errors.slice(0, 5).join('; ') +
          (errors.length > 5 ? `; ... and ${errors.length - 5} more` : ''),
        'error'
      );
    } else {
      setDirty(new Set());
      setSaveConfirmOpen(false);
      queryClient.invalidateQueries({ queryKey: ['codex'] });
      await queryClient.refetchQueries({ queryKey: ['codex'] });
    }
    setSaving(false);
  }, [collection, dirty, rows, queryClient, showToast]);

  const handleSaveAllClick = useCallback(() => {
    const { valid, invalidDisplayIndices } = validateDirtyRows();
    if (!valid) {
      showToast(
        `Please add a name for new row(s): ${invalidDisplayIndices.slice(0, 10).join(', ')}${invalidDisplayIndices.length > 10 ? ` and ${invalidDisplayIndices.length - 10} more` : ''}.`,
        'error'
      );
      return;
    }
    setSaveConfirmOpen(true);
  }, [validateDirtyRows, showToast]);

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
          showToast('New rows must have a name.', 'error');
          return;
        }
      }
      setSavingRowIndex(rowIndex);
      const usedIds = new Set(rows.map((r) => String((r as Record<string, unknown>).id ?? '')));
      let err: string | null | undefined = null;
      if (isNew) {
        const newId = generateNextNumericId(usedIds);
        const data = rowDataWithoutId(row);
        const result = await createCodexDoc(collection, newId, data);
        if (!result.success) err = result.error ?? null;
        else {
          setRows((prev) => {
            const next = prev.map((r, i) =>
              i === rowIndex ? { ...(r as Record<string, unknown>), id: newId } : r
            );
            return next;
          });
        }
      } else {
        const data = rowDataWithoutId(row);
        const result = await updateCodexDoc(collection, id, data);
        if (!result.success) err = result.error ?? null;
      }
      setSavingRowIndex(null);
      if (err) showToast(err, 'error');
      else {
        setDirty((prev) => {
          const next = new Set(prev);
          next.delete(rowIndex);
          return next;
        });
        queryClient.invalidateQueries({ queryKey: ['codex'] });
        await queryClient.refetchQueries({ queryKey: ['codex'] });
      }
    },
    [collection, rows, queryClient, showToast]
  );

  const addNewRow = useCallback(() => {
    const newId = `__new_${Date.now()}`;
    const emptyRow: Record<string, unknown> = { id: newId };
    setRows((prev) => [...prev, emptyRow]);
    setDirty((prev) => new Set(prev).add(rows.length));
  }, [rows.length]);

  const hasDirty = dirty.size > 0;
  const dirtyNewCount = useMemo(
    () =>
      [...dirty].filter((i) => {
        const r = rows[i] as Record<string, unknown>;
        const id = String(r?.id ?? '');
        return !id || id.startsWith('__new');
      }).length,
    [dirty, rows]
  );
  const dirtyUpdateCount = dirty.size - dirtyNewCount;

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
    savingRowIndex,
    columns,
    columnWidths,
    minTableWidth,
    sortedRowIndices,
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
    dirtyNewCount,
    dirtyUpdateCount,
    stickyLeftFor,
  };
}
