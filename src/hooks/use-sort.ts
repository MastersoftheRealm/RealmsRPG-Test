/**
 * useSort Hook & Sort Utilities
 * ==============================
 * Shared sorting logic for list views. Eliminates 20+ duplicate toggleSort/handleSort
 * implementations across Codex, Library, character sheet modals, and creator modals.
 *
 * Use useSort() when you need sort state + handler.
 * Use toggleSort() and sortByColumn() for non-hook contexts.
 */

import { useState, useCallback, useMemo } from 'react';
import type { SortState } from '@/components/shared/list-header';

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

/**
 * Pure function: sort an array by SortState column.
 * Handles string (localeCompare with numeric) and number comparison.
 */
export function sortByColumn<T extends object>(
  arr: T[],
  sortState: SortState
): T[] {
  return [...arr].sort((a, b) => {
    const aVal = (a as Record<string, unknown>)[sortState.col];
    const bVal = (b as Record<string, unknown>)[sortState.col];
    const aStr = aVal != null ? String(aVal) : '';
    const bStr = bVal != null ? String(bVal) : '';
    const cmp = aStr.localeCompare(bStr, undefined, { numeric: true });
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
    [sortState]
  );

  return { sortState, setSortState, handleSort, sortItems };
}
