/**
 * Pure bootstrap helpers for technique creator — cache restore and library load.
 * Used at workspace mount (remount key) so hydrate logic stays out of useEffect.
 * All functions are pure / render-safe (no localStorage writes).
 */

import type { TechniquePart, CreatorWeaponOption } from '@/hooks';
import { CREATOR_CACHE_KEYS } from '@/lib/game/creator-constants';
import { readCreatorCache } from '@/lib/game/creator-cache';
import { inferTechniqueWeaponTpFromSavedParts } from '@/lib/creator-weapon-persistence';

export const TECHNIQUE_CREATOR_CACHE_KEY = CREATOR_CACHE_KEYS.TECHNIQUE;

export interface TechniqueSelectedPart {
  part: TechniquePart;
  op_1_lvl: number;
  op_2_lvl: number;
  op_3_lvl: number;
  selectedCategory: string;
}

export interface TechniqueDamageConfig {
  amount: number;
  size: number;
  type: string;
}

export interface TechniqueCreatorCache {
  name: string;
  description: string;
  selectedParts: Array<{
    partId: string | number;
    op_1_lvl: number;
    op_2_lvl: number;
    op_3_lvl: number;
    selectedCategory: string;
  }>;
  actionType: string;
  isReaction: boolean;
  damage: TechniqueDamageConfig;
  weaponId: string | number;
  timestamp: number;
}

export interface TechniqueCreatorFormState {
  name: string;
  description: string;
  selectedParts: TechniqueSelectedPart[];
  actionType: string;
  isReaction: boolean;
  damage: TechniqueDamageConfig;
  weapon: CreatorWeaponOption;
}

type TechniqueLibraryRecord = {
  name?: string;
  description?: string;
  parts?: unknown;
  techniqueParts?: unknown;
  actionType?: string;
  actionTypeSelection?: string;
  isReaction?: boolean;
  reaction?: boolean;
  weapon?: { id?: string | number; name?: string };
  damage?: unknown;
};

export function emptyTechniqueCreatorFormState(
  defaultWeapon: CreatorWeaponOption,
): TechniqueCreatorFormState {
  return {
    name: '',
    description: '',
    selectedParts: [],
    actionType: 'basic',
    isReaction: false,
    damage: { amount: 0, size: 6, type: 'none' },
    weapon: defaultWeapon,
  };
}

export function restoreTechniqueCreatorFromCache(
  techniqueParts: TechniquePart[],
  allWeaponOptions: CreatorWeaponOption[],
  defaultWeapon: CreatorWeaponOption,
): TechniqueCreatorFormState | null {
  const parsed = readCreatorCache<TechniqueCreatorCache>(TECHNIQUE_CREATOR_CACHE_KEY);
  if (!parsed) return null;

  let weapon = defaultWeapon;
  if (parsed.weaponId !== undefined && parsed.weaponId !== null) {
    const foundWeapon = allWeaponOptions.find((w) => String(w.id) === String(parsed.weaponId));
    if (foundWeapon) weapon = foundWeapon;
  }

  const selectedParts: TechniqueSelectedPart[] = [];
  for (const savedPart of parsed.selectedParts ?? []) {
    const foundPart = techniqueParts.find((p) => String(p.id) === String(savedPart.partId));
    if (foundPart) {
      selectedParts.push({
        part: foundPart,
        op_1_lvl: savedPart.op_1_lvl,
        op_2_lvl: savedPart.op_2_lvl,
        op_3_lvl: savedPart.op_3_lvl,
        selectedCategory: savedPart.selectedCategory,
      });
    }
  }

  return {
    name: parsed.name || '',
    description: parsed.description || '',
    selectedParts,
    actionType: parsed.actionType || 'basic',
    isReaction: parsed.isReaction || false,
    damage: parsed.damage || { amount: 0, size: 6, type: 'none' },
    weapon,
  };
}

export function techniqueLibraryRecordToFormState(
  technique: TechniqueLibraryRecord,
  techniqueParts: TechniquePart[],
  allWeaponOptions: CreatorWeaponOption[],
  defaultWeapon: CreatorWeaponOption,
): TechniqueCreatorFormState {
  const savedParts = (technique.parts || technique.techniqueParts || []) as Array<{
    id?: number | string;
    name?: string;
    op_1_lvl?: number;
    op_2_lvl?: number;
    op_3_lvl?: number;
  }>;

  // If the saved technique explicitly included the No Attack mechanic part (415),
  // reflect that in the creator's Weapon selection.
  const savedHasNoAttack = savedParts.some(
    (p) => String(p.id) === '415' || String(p.name || '').toLowerCase() === 'no attack',
  );
  const requiredWeaponTPFromParts = inferTechniqueWeaponTpFromSavedParts(savedParts);

  // Skip mechanic-only parts when loading; these are auto-generated from
  // action / damage / weapon and are re-created by buildMechanicParts.
  const loadedParts: TechniqueSelectedPart[] = [];
  for (const savedPart of savedParts) {
    const matchedPart = techniqueParts.find(
      (p) => p.id === String(savedPart.id) || p.name === savedPart.name,
    );
    if (matchedPart && !matchedPart.mechanic) {
      loadedParts.push({
        part: matchedPart,
        op_1_lvl: savedPart.op_1_lvl || 0,
        op_2_lvl: savedPart.op_2_lvl || 0,
        op_3_lvl: savedPart.op_3_lvl || 0,
        selectedCategory: matchedPart.category || 'any',
      });
    }
  }

  let weapon = defaultWeapon;
  const savedWeapon = technique.weapon;
  if (savedHasNoAttack) {
    const noAttackOption = allWeaponOptions.find((w) => String(w.id) === 'no-attack');
    if (noAttackOption) weapon = noAttackOption;
  } else if (savedWeapon) {
    const weaponMatch = allWeaponOptions.find(
      (w) => String(w.id) === String(savedWeapon.id) || w.name === savedWeapon.name,
    );
    if (weaponMatch) {
      weapon = weaponMatch;
    } else if (requiredWeaponTPFromParts > 0) {
      const tpMatch = allWeaponOptions.find((option) => (option.tp ?? 0) === requiredWeaponTPFromParts);
      weapon = tpMatch || defaultWeapon;
    }
  } else if (requiredWeaponTPFromParts > 0) {
    const tpMatch = allWeaponOptions.find((option) => (option.tp ?? 0) === requiredWeaponTPFromParts);
    weapon = tpMatch || defaultWeapon;
  }

  // getPayload persists damage as an array ([{ amount, size }]);
  // tolerate both the array form and a legacy single-object form.
  const rawDamage = Array.isArray(technique.damage) ? technique.damage[0] : technique.damage;
  const d = rawDamage as
    | { amount?: number; dice?: number; size?: number; sides?: number; type?: string }
    | undefined;
  const damage: TechniqueDamageConfig = d
    ? {
        amount: d.amount || d.dice || 0,
        size: d.size || d.sides || 6,
        type: d.type || 'none',
      }
    : { amount: 0, size: 6, type: 'none' };

  return {
    name: technique.name || '',
    description: technique.description || '',
    selectedParts: loadedParts,
    // Saved payloads persist `isReaction` (see getPayload); keep `reaction`
    // as a fallback for legacy/enriched shapes.
    actionType: technique.actionTypeSelection || technique.actionType || 'basic',
    isReaction: technique.isReaction ?? technique.reaction ?? false,
    damage,
    weapon,
  };
}

export function bootstrapTechniqueCreatorFormState(options: {
  editTechniqueId: string | null;
  techniqueParts: TechniquePart[];
  allWeaponOptions: CreatorWeaponOption[];
  defaultWeapon: CreatorWeaponOption;
  rawItems: unknown[];
}): TechniqueCreatorFormState {
  const { editTechniqueId, techniqueParts, allWeaponOptions, defaultWeapon, rawItems } = options;

  if (editTechniqueId) {
    const techniqueToEdit = rawItems.find((t) => {
      const row = t as { docId?: string; id?: string };
      return String(row.docId) === editTechniqueId || String(row.id) === editTechniqueId;
    });
    if (!techniqueToEdit) {
      return emptyTechniqueCreatorFormState(defaultWeapon);
    }
    return techniqueLibraryRecordToFormState(
      techniqueToEdit as TechniqueLibraryRecord,
      techniqueParts,
      allWeaponOptions,
      defaultWeapon,
    );
  }

  return (
    restoreTechniqueCreatorFromCache(techniqueParts, allWeaponOptions, defaultWeapon) ??
    emptyTechniqueCreatorFormState(defaultWeapon)
  );
}
