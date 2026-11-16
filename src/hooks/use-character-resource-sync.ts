/**
 * Fast debounced PATCH for current HP / EN / AP so encounter realtime stays
 * in sync. Pool allocation stays on the locked sheet autosave: this sync
 * omits `updatedAt` (`skipLock`), so it must not send `healthPoints` or
 * `energyPoints`.
 */

'use client';

import { useEffect, useRef } from 'react';
import type { Character } from '@/types';
import {
  buildResourcePatchFromCharacter,
  nextResourceSyncCursor,
  scheduleCharacterResourceSync,
  type ResourceSyncCursor,
} from '@/lib/encounter/character-resource-sync';

export function useCharacterResourceSync(
  character: Character | null | undefined,
  enabled: boolean,
): void {
  const cursorRef = useRef<ResourceSyncCursor | null>(null);

  useEffect(() => {
    if (!enabled || !character?.id) {
      cursorRef.current = null;
      return;
    }

    const patch = buildResourcePatchFromCharacter(character);
    const { schedule, next } = nextResourceSyncCursor(cursorRef.current, character.id, patch);
    cursorRef.current = next;
    if (!schedule || !patch) return;
    scheduleCharacterResourceSync(character.id, patch);
  }, [enabled, character]);
}
