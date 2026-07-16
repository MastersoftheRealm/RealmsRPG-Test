/**
 * Pure bootstrap helper for creature creator — cache restore and ?edit= load.
 * Render-safe (no localStorage writes); used by the page's one-time render adjust.
 */

import { readCreatorCache } from '@/lib/game/creator-cache';
import { initialState, CREATURE_CREATOR_CACHE_KEY } from './creature-creator-constants';
import type { CreatureState } from './creature-creator-types';
import { rawRecordToCreatureState } from './creature-skill-utils';

interface CreatureCreatorCache {
  creature?: CreatureState;
  timestamp?: number;
}

export function bootstrapCreatureState(options: {
  editCreatureId: string | null;
  rawItems: unknown[];
}): CreatureState {
  const { editCreatureId, rawItems } = options;

  if (editCreatureId) {
    const match = rawItems.find(
      (x) =>
        String((x as { id?: string; docId?: string }).id) === editCreatureId ||
        String((x as { id?: string; docId?: string }).docId) === editCreatureId,
    );
    if (!match) return initialState;
    return rawRecordToCreatureState(match as Record<string, unknown>);
  }

  const parsed = readCreatorCache<CreatureCreatorCache>(CREATURE_CREATOR_CACHE_KEY);
  return parsed?.creature || initialState;
}
