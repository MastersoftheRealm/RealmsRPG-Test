/**
 * Path equipment recommendation pool for guided L1/L2.
 * Flat armament / equipment / sharedEquipment columns only (quick kits removed).
 */

import type { ArchetypePathData, PathItemRecommendation } from '@/types/archetype';
import { mergeLoadoutArmaments } from '@/lib/guided-creator/resolve-loadout-items';

function refKey(ref: PathItemRecommendation): string {
  return `${String(ref.id).trim().toLowerCase()}:${ref.quantity}`;
}

export function buildPathLoadoutPool(
  pathData: ArchetypePathData['level1'] | undefined,
): PathItemRecommendation[] {
  const seen = new Set<string>();
  const out: PathItemRecommendation[] = [];

  const push = (ref: PathItemRecommendation) => {
    const key = refKey(ref);
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ id: String(ref.id), quantity: ref.quantity });
  };

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
    loadoutWeapons?: PathItemRecommendation[] | undefined;
    loadoutArmor?: PathItemRecommendation[] | undefined;
    armaments: PathItemRecommendation[];
    equipment: PathItemRecommendation[];
  },
  itemId: string,
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
  category: 'weapon' | 'armor' | 'equipment',
): GuidedLoadoutDraftSelection {
  const key = String(ref.id).trim().toLowerCase();
  const loadoutWeapons = draft.loadoutWeapons.filter(
    (a) => String(a.id).trim().toLowerCase() !== key,
  );
  const loadoutArmor = draft.loadoutArmor.filter((a) => String(a.id).trim().toLowerCase() !== key);
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

/** Update quantity for a selected weapon/armor/Equipment ref (min 1). */
export function setItemQuantityInGuidedDraft(
  draft: GuidedLoadoutDraftSelection,
  itemId: string,
  quantity: number,
  category: 'weapon' | 'armor' | 'equipment',
): GuidedLoadoutDraftSelection {
  const key = String(itemId).trim().toLowerCase();
  const qty = Math.max(1, Math.floor(quantity) || 1);

  if (category === 'equipment') {
    const equipment = draft.equipment.map((e) =>
      String(e.id).trim().toLowerCase() === key ? { ...e, quantity: qty } : e,
    );
    return { ...draft, equipment };
  }

  if (category === 'armor') {
    const loadoutArmor = draft.loadoutArmor.map((a) =>
      String(a.id).trim().toLowerCase() === key ? { ...a, quantity: qty } : a,
    );
    return {
      ...draft,
      loadoutArmor,
      armaments: mergeLoadoutArmaments({
        loadoutWeapons: draft.loadoutWeapons,
        loadoutArmor,
      }),
    };
  }

  const loadoutWeapons = draft.loadoutWeapons.map((w) =>
    String(w.id).trim().toLowerCase() === key ? { ...w, quantity: qty } : w,
  );
  return {
    ...draft,
    loadoutWeapons,
    armaments: mergeLoadoutArmaments({
      loadoutWeapons,
      loadoutArmor: draft.loadoutArmor,
    }),
  };
}

/** Add every recommended Equipment ref that is not already selected. */
export function addAllRecommendedEquipment(
  draft: GuidedLoadoutDraftSelection,
  recommended: PathItemRecommendation[],
): GuidedLoadoutDraftSelection {
  let next = draft;
  for (const ref of recommended) {
    const key = String(ref.id).trim().toLowerCase();
    if (next.equipment.some((e) => String(e.id).trim().toLowerCase() === key)) continue;
    next = addItemToGuidedDraft(next, ref, 'equipment');
  }
  return next;
}

export function removeItemFromGuidedDraft(
  draft: GuidedLoadoutDraftSelection,
  itemId: string,
): GuidedLoadoutDraftSelection {
  const key = String(itemId).trim().toLowerCase();
  const loadoutWeapons = draft.loadoutWeapons.filter(
    (a) => String(a.id).trim().toLowerCase() !== key,
  );
  const loadoutArmor = draft.loadoutArmor.filter((a) => String(a.id).trim().toLowerCase() !== key);
  const equipment = draft.equipment.filter((e) => String(e.id).trim().toLowerCase() !== key);
  return {
    loadoutWeapons,
    loadoutArmor,
    equipment,
    armaments: mergeLoadoutArmaments({ loadoutWeapons, loadoutArmor }),
  };
}
