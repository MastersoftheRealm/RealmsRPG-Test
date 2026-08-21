'use client';

import { useCallback, useState } from 'react';
import { useToast } from '@/components/ui';
import { getErrorMessage } from '@/lib/api-client';
import { saveToLibrary, type LibraryType } from '@/services/library-service';

export interface LibrarySyncSanitizeResult {
  hasDrift: boolean;
  changed: boolean;
  value: unknown;
}

export interface UseLibraryEntitySyncOptions<TSource> {
  saveType: LibraryType;
  sources: TSource[];
  getRowId: (source: TSource) => string;
  getRowName: (source: TSource) => string;
  /** Prefer precomputed drifted ids (avoids double sanitize). */
  driftedIds: string[];
  sanitize: (source: TSource) => LibrarySyncSanitizeResult;
  refetch: () => Promise<unknown>;
  entitySingular: string;
  entityPlural: string;
}

export function useLibraryEntitySync<TSource>(options: UseLibraryEntitySyncOptions<TSource>) {
  const {
    saveType,
    sources,
    getRowId,
    getRowName,
    driftedIds,
    sanitize,
    refetch,
    entitySingular,
    entityPlural,
  } = options;
  const { showToast } = useToast();
  const [syncingIds, setSyncingIds] = useState<Set<string>>(new Set());
  const [syncingAll, setSyncingAll] = useState(false);
  const [showSyncAllConfirm, setShowSyncAllConfirm] = useState(false);

  const driftedCount = driftedIds.length;

  const handleSyncOne = useCallback(
    async (itemId: string) => {
      const source = sources.find((s) => getRowId(s) === itemId);
      if (!source) return;
      const sanitized = sanitize(source);
      if (!sanitized.hasDrift || !sanitized.changed) return;

      setSyncingIds((prev) => new Set(prev).add(itemId));
      try {
        await saveToLibrary(saveType, sanitized.value as Record<string, unknown>, {
          existingId: itemId,
        });
        await refetch();
        showToast(`Synced "${getRowName(source)}" to current patch rules.`, 'success');
      } catch (e) {
        showToast(getErrorMessage(e, `Failed to sync ${entitySingular}`), 'error');
      } finally {
        setSyncingIds((prev) => {
          const next = new Set(prev);
          next.delete(itemId);
          return next;
        });
      }
    },
    [sources, getRowId, getRowName, sanitize, saveType, refetch, showToast, entitySingular],
  );

  const handleSyncAll = useCallback(async () => {
    if (driftedCount === 0) return;
    setSyncingAll(true);
    let syncedCount = 0;
    try {
      for (const itemId of driftedIds) {
        const source = sources.find((s) => getRowId(s) === itemId);
        if (!source) continue;
        const sanitized = sanitize(source);
        if (!sanitized.hasDrift || !sanitized.changed) continue;
        await saveToLibrary(saveType, sanitized.value as Record<string, unknown>, {
          existingId: itemId,
        });
        syncedCount += 1;
      }
      await refetch();
      showToast(
        syncedCount > 0
          ? `Synced ${syncedCount} ${syncedCount === 1 ? entitySingular : entityPlural} with current patch.`
          : `All ${entityPlural} are already in sync.`,
        'success',
      );
    } catch (e) {
      showToast(getErrorMessage(e, `Failed to sync all ${entityPlural}`), 'error');
    } finally {
      setSyncingAll(false);
    }
  }, [
    driftedCount,
    driftedIds,
    sources,
    getRowId,
    sanitize,
    saveType,
    refetch,
    showToast,
    entitySingular,
    entityPlural,
  ]);

  return {
    syncingIds,
    syncingAll,
    showSyncAllConfirm,
    setShowSyncAllConfirm,
    driftedCount,
    handleSyncOne,
    handleSyncAll,
  };
}
