/**
 * Path loadout item pool — union of all kits + flat path recommendations for Layer 2 customize.
 */

import type { ArchetypePathData, PathItemRecommendation, PathLoadout } from '@/types/archetype';
import { mergeLoadoutArmaments } from '@/lib/guided-creator/resolve-loadout-items';

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
  for (const ref of pathData?.sharedEquipment ?? []) push(ref);

  return out;
}

export interface GuidedLoadoutDraftSelection {
  loadoutWeapons: PathItemRecommendation[];
  loadoutArmor: PathItemRecommendation[];
  armaments: PathItemRecommendation[];
  equipment: PathItemRecommendation[];
}

export function isItemSelectedInDraft(
  draft: {
    loadoutWeapons?: PathItemRecommendation[];
    loadoutArmor?: PathItemRecommendation[];
    armaments: PathItemRecommendation[];
    equipment: PathItemRecommendation[];
  },
  itemId: string
): boolean {
  const key = String(itemId).trim().toLowerCase();
  return (
    (draft.loadoutWeapons ?? []).some((a) => String(a.id).trim().toLowerCase() === key) ||
    (draft.loadoutArmor ?? []).some((a) => String(a.id).trim().toLowerCase() === key) ||
    draft.armaments.some((a) => String(a.id).trim().toLowerCase() === key) ||
    draft.equipment.some((e) => String(e.id).trim().toLowerCase() === key)
  );
}

export function addItemToGuidedDraft(
  draft: GuidedLoadoutDraftSelection,
  ref: PathItemRecommendation,
  category: 'weapon' | 'armor' | 'equipment'
): GuidedLoadoutDraftSelection {
  const key = String(ref.id).trim().toLowerCase();
  const loadoutWeapons = draft.loadoutWeapons.filter(
    (a) => String(a.id).trim().toLowerCase() !== key
  );
  const loadoutArmor = draft.loadoutArmor.filter(
    (a) => String(a.id).trim().toLowerCase() !== key
  );
  const equipment = draft.equipment.filter((e) => String(e.id).trim().toLowerCase() !== key);

  if (category === 'equipment') {
    return {
      loadoutWeapons,
      loadoutArmor,
      equipment: [...equipment, ref],
      armaments: mergeLoadoutArmaments({ loadoutWeapons, loadoutArmor }),
    };
  }

  if (category === 'armor') {
    const nextArmor = [...loadoutArmor, ref];
    return {
      loadoutWeapons,
      loadoutArmor: nextArmor,
      equipment,
      armaments: mergeLoadoutArmaments({ loadoutWeapons, loadoutArmor: nextArmor }),
    };
  }

  const nextWeapons = [...loadoutWeapons, ref];
  return {
    loadoutWeapons: nextWeapons,
    loadoutArmor,
    equipment,
    armaments: mergeLoadoutArmaments({ loadoutWeapons: nextWeapons, loadoutArmor }),
  };
}

export function removeItemFromGuidedDraft(
  draft: GuidedLoadoutDraftSelection,
  itemId: string
): GuidedLoadoutDraftSelection {
  const key = String(itemId).trim().toLowerCase();
  const loadoutWeapons = draft.loadoutWeapons.filter(
    (a) => String(a.id).trim().toLowerCase() !== key
  );
  const loadoutArmor = draft.loadoutArmor.filter(
    (a) => String(a.id).trim().toLowerCase() !== key
  );
  const equipment = draft.equipment.filter((e) => String(e.id).trim().toLowerCase() !== key);
  return {
    loadoutWeapons,
    loadoutArmor,
    equipment,
    armaments: mergeLoadoutArmaments({ loadoutWeapons, loadoutArmor }),
  };
}
