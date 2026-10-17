'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { listCodexSourceCatalog } from '@/app/(main)/admin/codex/source-catalog-action';
import type { ChipSelectOption } from '@/components/patterns/filters/chip-select';
import { codexKeys } from '@/hooks/use-codex';

/**
 * Same client freshness as `useCodex*` (TASK-359).
 * The key sits under `codexKeys.all` so an admin save refreshes it with the rest of the codex.
 */
const CATALOG_QUERY_OPTIONS = {
  staleTime: 5 * 60 * 1000,
  gcTime: 30 * 60 * 1000,
  retry: 2,
  refetchOnWindowFocus: false,
} as const;

export interface CodexSourceCatalogState {
  options: ChipSelectOption[];
  /** True until the first successful catalog read. A cached read is not loading. */
  isLoading: boolean;
  /** True when the catalog has never loaded. A failed refresh keeps the last options. */
  isError: boolean;
}

/** One shared catalog for every Sources chip control. Empty selection stays All. */
export function useCodexSourceCatalog(): CodexSourceCatalogState {
  const query = useQuery({
    queryKey: [...codexKeys.all, 'source-catalog'] as const,
    queryFn: () => listCodexSourceCatalog(),
    ...CATALOG_QUERY_OPTIONS,
  });

  const options = useMemo(
    () => (query.data ?? []).map((entry) => ({ value: entry.name, label: entry.name })),
    [query.data],
  );

  return {
    options,
    isLoading: query.isPending,
    isError: query.isError && query.data == null,
  };
}
