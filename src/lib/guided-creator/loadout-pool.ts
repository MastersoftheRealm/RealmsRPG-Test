/**
 * Path loadout item pool — union of all kits + flat path recommendations for Layer 2 customize.
 */

import type { ArchetypePathData, PathItemRecommendation, PathLoadout } from '@/types/archetype';

function refKey(ref: PathItemRecommendation): string {
  return `${String(ref.id).trim().toLowerCase()}:${ref.quantity}`;
}

export function buildPathLoadoutPool(
  loadouts: PathLoadout[],
  pathData: ArchetypePathData['level1'] | undefined
): PathItemRecommendation[] {
  const seen = new Set<string>();
  const out: PathItemRecommendation[] = [];

  const push = (ref: PathItemRecommendation) => {
    const key = refKey(ref);
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ id: String(ref.id), quantity: ref.quantity });
  };

  for (const loadout of loadouts) {
    for (const ref of [
      ...(loadout.armaments ?? []),
      ...(loadout.armor ?? []),
      ...(loadout.equipment ?? []),
    ]) {
      push(ref);
    }
  }

  for (const ref of pathData?.armamentRecommendations ?? []) push(ref);
  for (const ref of pathData?.equipmentRecommendations ?? []) push(ref);

  return out;
}

export function isItemSelectedInDraft(
  draft: { armaments: PathItemRecommendation[]; equipment: PathItemRecommendation[] },
  itemId: string
): boolean {
  const key = String(itemId).trim().toLowerCase();
  return (
    draft.armaments.some((a) => String(a.id).trim().toLowerCase() === key) ||
    draft.equipment.some((e) => String(e.id).trim().toLowerCase() === key)
  );
}

export function addItemToGuidedDraft(
  draft: { armaments: PathItemRecommendation[]; equipment: PathItemRecommendation[] },
  ref: PathItemRecommendation,
  category: 'weapon' | 'armor' | 'equipment'
): { armaments: PathItemRecommendation[]; equipment: PathItemRecommendation[] } {
  const key = String(ref.id).trim().toLowerCase();
  const armaments = draft.armaments.filter((a) => String(a.id).trim().toLowerCase() !== key);
  const equipment = draft.equipment.filter((e) => String(e.id).trim().toLowerCase() !== key);

  if (category === 'equipment') {
    return { armaments, equipment: [...equipment, ref] };
  }
  return { armaments: [...armaments, ref], equipment };
}

export function removeItemFromGuidedDraft(
  draft: { armaments: PathItemRecommendation[]; equipment: PathItemRecommendation[] },
  itemId: string
): { armaments: PathItemRecommendation[]; equipment: PathItemRecommendation[] } {
  const key = String(itemId).trim().toLowerCase();
  return {
    armaments: draft.armaments.filter((a) => String(a.id).trim().toLowerCase() !== key),
    equipment: draft.equipment.filter((e) => String(e.id).trim().toLowerCase() !== key),
  };
}
