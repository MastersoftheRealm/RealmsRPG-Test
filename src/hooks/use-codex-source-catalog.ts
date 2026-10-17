'use client';

import { useEffect, useMemo, useState } from 'react';
import { listCodexSourceCatalog } from '@/app/(main)/admin/codex/source-catalog-action';
import type { ChipSelectOption } from '@/components/patterns/filters/chip-select';

/** Distinct rules-source names from the cached codex catalog (display strings). */
export function useCodexSourceCatalogOptions(): ChipSelectOption[] {
  const [names, setNames] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    void listCodexSourceCatalog()
      .then((entries) => {
        if (!cancelled) setNames(entries.map((entry) => entry.name));
      })
      .catch(() => {
        if (!cancelled) setNames([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return useMemo(() => names.map((name) => ({ value: name, label: name })), [names]);
}
