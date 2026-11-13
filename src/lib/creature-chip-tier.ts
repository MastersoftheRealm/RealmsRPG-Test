/**
 * Movement/sense chip tier replacement via creature feat families (replaces name-only tier list).
 */

import type { LeveledFeatLike } from '@/lib/leveled-feats';
import { getFeatFamilyId } from '@/lib/leveled-feats';

export function replaceTieredCreatureChipValue(
  existing: readonly string[],
  nextChipValue: string,
  chipValueToFeatId: Record<string, number>,
  creatureFeatsById: Map<string, LeveledFeatLike>,
): string[] {
  const nextFeatId = chipValueToFeatId[nextChipValue];
  if (nextFeatId == null) {
    return existing.includes(nextChipValue) ? [...existing] : [...existing, nextChipValue];
  }

  const nextDef = creatureFeatsById.get(String(nextFeatId));
  if (!nextDef) {
    return existing.includes(nextChipValue) ? [...existing] : [...existing, nextChipValue];
  }

  const nextFamily = getFeatFamilyId(nextDef);

  const withoutSameFamily = existing.filter((chip) => {
    if (chip === nextChipValue) return false;
    const featId = chipValueToFeatId[chip];
    if (featId == null) return true;
    const def = creatureFeatsById.get(String(featId));
    if (!def) return true;
    return getFeatFamilyId(def) !== nextFamily;
  });

  return [...withoutSameFamily, nextChipValue];
}
