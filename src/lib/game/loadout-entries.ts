/**
 * Neutral path loadout data helpers (no library/creator resolution).
 */

import type { PathItemRecommendation, PathLoadout } from '@/types/archetype';

/** Flatten armaments, armor, and equipment refs from a path loadout kit. */
export function flattenLoadoutEntries(loadout: PathLoadout): PathItemRecommendation[] {
  return [
    ...(loadout.armaments ?? []),
    ...(loadout.armor ?? []),
    ...(loadout.equipment ?? []),
  ];
}
