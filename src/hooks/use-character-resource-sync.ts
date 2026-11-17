/**
 * Fast debounced PATCH for HP / EN / AP so encounter realtime stays in sync.
 * Fires when those fields change — notes/`updatedAt` must not stamp a new
 * lock and 409 the sheet autosave (TASK-786). When the sheet passes its saved
 * snapshot, a changed Health/Energy allocation is included in that same PATCH.
 */

'use client';

import { useEffect, useRef } from 'react';
import type { Character } from '@/types';
import {
  buildSheetResourceSyncPatch,
  nextResourceSyncCursor,
  scheduleCharacterResourceSync,
  type ResourceSyncCursor,
} from '@/lib/encounter/character-resource-sync';

export function useCharacterResourceSync(
  character: Character | null | undefined,
  enabled: boolean,
  savedBaseline?: { readonly current: Record<string, unknown> | null },
): void {
  const cursorRef = useRef<ResourceSyncCursor | null>(null);

  useEffect(() => {
    if (!enabled || !character?.id) {
      cursorRef.current = null;
      return;
    }

    const patch = buildSheetResourceSyncPatch(character, savedBaseline?.current);
    const { schedule, next } = nextResourceSyncCursor(cursorRef.current, character.id, patch);
    cursorRef.current = next;
    if (!schedule || !patch) return;
    scheduleCharacterResourceSync(character.id, patch);
  }, [enabled, character, savedBaseline]);
}
