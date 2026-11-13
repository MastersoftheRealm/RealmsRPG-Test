/**
 * Pure bootstrap helper for creature creator — cache restore and ?edit= load.
 * Render-safe (no localStorage writes); used by the page's one-time render adjust.
 */

import type { CreatureFeat as CodexCreatureFeat } from '@/hooks';
import { readNewCreatorDraftCache } from '@/lib/game/creator-cache';
import { initialState, CREATURE_CREATOR_CACHE_KEY } from './creature-creator-constants';
import type { CreatureState } from './creature-creator-types';
import { rawRecordToCreatureState } from './creature-skill-utils';
import { migrateLegacySenseNames } from './creature-senses';

interface CreatureCreatorCache {
  creature?: CreatureState | undefined;
  timestamp?: number | undefined;
}

export function bootstrapCreatureState(options: {
  editCreatureId: string | null;
  rawItems: unknown[];
  creatureFeatsCatalog?: readonly CodexCreatureFeat[];
}): CreatureState {
  const { editCreatureId, rawItems, creatureFeatsCatalog = [] } = options;

  let state: CreatureState;
  if (editCreatureId) {
    const match = rawItems.find(
      (x) =>
        String((x as { id?: string | undefined; docId?: string | undefined }).id) ===
          editCreatureId ||
        String((x as { id?: string | undefined; docId?: string | undefined }).docId) ===
          editCreatureId,
    );
    if (match) {
      state = rawRecordToCreatureState(match as Record<string, unknown>);
    } else {
      const parsed = readNewCreatorDraftCache<CreatureCreatorCache>(CREATURE_CREATOR_CACHE_KEY);
      state = parsed?.creature
        ? rawRecordToCreatureState(parsed.creature as unknown as Record<string, unknown>)
        : initialState;
    }
  } else {
    const parsed = readNewCreatorDraftCache<CreatureCreatorCache>(CREATURE_CREATOR_CACHE_KEY);
    state = parsed?.creature
      ? rawRecordToCreatureState(parsed.creature as unknown as Record<string, unknown>)
      : initialState;
  }

  if (creatureFeatsCatalog.length === 0) return state;
  return migrateLegacySenseNames(state, creatureFeatsCatalog);
}
