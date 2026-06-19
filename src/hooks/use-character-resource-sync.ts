/**
 * Fast debounced PATCH for HP / EN / AP so encounter realtime stays in sync.
 */

'use client';

import { useEffect, useRef } from 'react';
import type { Character } from '@/types';
import {
  buildResourcePatchFromCharacter,
  scheduleCharacterResourceSync,
} from '@/lib/encounter/character-resource-sync';

export function useCharacterResourceSync(
  character: Character | null | undefined,
  enabled: boolean
): void {
  const skipInitialRef = useRef(true);

  useEffect(() => {
    if (!enabled || !character?.id) {
      skipInitialRef.current = true;
      return;
    }

    if (skipInitialRef.current) {
      skipInitialRef.current = false;
      return;
    }

    const patch = buildResourcePatchFromCharacter(character);
    if (!patch) return;
    scheduleCharacterResourceSync(character.id, patch);
  }, [
    enabled,
    character?.id,
    character?.currentHealth,
    character?.currentEnergy,
    character?.actionPoints,
    character?.health?.current,
    character?.energy?.current,
  ]);
}
