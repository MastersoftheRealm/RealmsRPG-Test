/**
 * useSort Hook & Sort Utilities
 * ==============================
 * Shared sorting logic for list views. Eliminates 20+ duplicate toggleSort/handleSort
 * implementations across Codex, Library, character sheet modals, and creator modals.
 *
 * Use useSort() when you need sort state + handler.
 * Use toggleSort() and sortByColumn() for non-hook contexts.
 */

import { useState, useCallback } from 'react';
import type { SortState } from '@/components/shared/list-header';
import { parseCreatureLevelSortValue } from '@/lib/game/creature-level-display';

/**
 * Pure function: compute next SortState when user clicks a column.
 * Toggle direction if same column, else set to ascending.
 */
export function toggleSort(current: SortState, col: string): SortState {
  if (current.col === col) {
    return { col, dir: current.dir === 1 ? -1 : 1 };
  }
  return { col, dir: 1 };
}

function getRawSortValue<T extends object>(row: T, columnKey: string): unknown {
  const record = row as Record<string, unknown>;
  const direct = record[columnKey];
  if (direct != null && direct !== '') return direct;

  // Support GridListRow-backed records (e.g. SelectableItem) where values
  // live in `columns` entries rather than top-level object keys.
  const columns = record.columns;
  if (Array.isArray(columns)) {
    const keyLower = columnKey.toLowerCase();
    const colMatch = columns.find((col) => {
      if (!col || typeof col !== 'object') return false;
      const colKey = (col as Record<string, unknown>).key;
      if (colKey == null) return false;
      return String(colKey).toLowerCase() === keyLower;
    }) as Record<string, unknown> | undefined;
    const colValue = colMatch?.value;
    if (colValue != null && colValue !== '') return colValue;
  }

  return null;
}

function compareSortValues(aVal: unknown, bVal: unknown, columnKey: string): number {
  const keyLower = columnKey.toLowerCase();
  if (keyLower === 'level' || keyLower === 'lvl') {
    const aNum = parseCreatureLevelSortValue(aVal);
    const bNum = parseCreatureLevelSortValue(bVal);
    if (aNum != null && bNum != null) return aNum - bNum;
  }

  if (
    typeof aVal === 'number' &&
    typeof bVal === 'number' &&
    Number.isFinite(aVal) &&
    Number.isFinite(bVal)
  ) {
    return aVal - bVal;
  }

  const aStr = aVal == null || aVal === '' ? '' : String(aVal);
  const bStr = bVal == null || bVal === '' ? '' : String(bVal);
  return aStr.localeCompare(bStr, undefined, { numeric: true });
}

/**
 * Pure function: sort an array by SortState column.
 * Creature levels use numeric quarter-step order; other numbers compare numerically.
 */
export function sortByColumn<T extends object>(arr: T[], sortState: SortState): T[] {
  return [...arr].sort((a, b) => {
    const aVal = getRawSortValue(a, sortState.col);
    const bVal = getRawSortValue(b, sortState.col);
    const cmp = compareSortValues(aVal, bVal, sortState.col);
    return sortState.dir === 1 ? cmp : -cmp;
  });
}

/**
 * Hook: sort state + handler for ListHeader onSort.
 * Returns sortState, handleSort (pass to onSort), and sortItems helper.
 */
export function useSort(initialCol: string = 'name') {
  const [sortState, setSortState] = useState<SortState>({
    col: initialCol,
    dir: 1,
  });

  const handleSort = useCallback((col: string) => {
    setSortState((prev) => toggleSort(prev, col));
  }, []);

  const sortItems = useCallback(
    <T extends object>(arr: T[]): T[] => {
      return sortByColumn(arr, sortState);
    },
    [sortState],
  );

  return { sortState, setSortState, handleSort, sortItems };
}
