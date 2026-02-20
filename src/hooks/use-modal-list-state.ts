/**
 * useModalListState — Shared search + sort state for list modals
 * ==============================================================
 * Use in add-X modals, load modals, and selection modals to keep
 * search/sort logic in one place. Composes useSort with search filtering.
 *
 * Apply modal-specific filters to items before passing in; this hook
 * handles search and sort only.
 */

import { useState, useMemo, useCallback } from 'react';
import { useSort } from './use-sort';

export interface UseModalListStateOptions<T> {
  /** Full list of items (after any modal-specific filters) */
  items: T[];
  /** Object keys to search in (e.g. ['name', 'description']) */
  searchFields: (keyof T)[];
  /** Initial sort column key (default 'name') */
  initialSortKey?: string;
  /** Optional: custom string for search (overrides searchFields) */
  getSearchableString?: (item: T) => string;
}

export function useModalListState<T extends object>({
  items,
  searchFields,
  initialSortKey = 'name',
  getSearchableString,
}: UseModalListStateOptions<T>) {
  const [search, setSearch] = useState('');
  const { sortState, handleSort, sortItems } = useSort(initialSortKey);

  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter((item) => {
      const str = getSearchableString
        ? getSearchableString(item)
        : searchFields
            .map((k) => String((item as Record<string, unknown>)[k as string] ?? ''))
            .join(' ')
            .toLowerCase();
      return str.includes(q);
    });
  }, [items, search, searchFields, getSearchableString]);

  const sortedItems = useMemo(() => sortItems(filteredItems), [filteredItems, sortItems]);

  const reset = useCallback(() => {
    setSearch('');
  }, []);

  return {
    search,
    setSearch,
    filteredItems,
    sortedItems,
    sortState,
    handleSort,
    sortItems,
    reset,
  };
}
