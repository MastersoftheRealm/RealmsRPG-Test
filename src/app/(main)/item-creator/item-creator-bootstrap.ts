/**
 * Pure bootstrap helpers for armament (item) creator — cache restore and library load.
 * Used at workspace mount (remount key) so hydrate logic stays out of useEffect.
 * All functions are pure / render-safe (no localStorage writes).
 */

import type { ItemProperty } from '@/hooks';
import { CREATOR_CACHE_KEYS } from '@/lib/game/creator-constants';
import { readCreatorCache } from '@/lib/game/creator-cache';
import { filterSavedItemPropertiesForList } from '@/lib/calculators';

export const ITEM_CREATOR_CACHE_KEY = CREATOR_CACHE_KEYS.ITEM;

export type ArmamentType = 'Weapon' | 'Armor' | 'Shield';

export interface ItemSelectedProperty {
  property: ItemProperty;
  op_1_lvl: number;
}

export interface ItemDamageConfig {
  amount: number;
  size: number;
  type: string;
}

export interface ItemAbilityRequirement {
  id: number;
  name: string;
  level: number;
}

export interface ItemCreatorCache {
  name: string;
  description: string;
  armamentType: ArmamentType;
  selectedProperties: Array<{
    propertyId: string | number;
    op_1_lvl: number;
  }>;
  damage: ItemDamageConfig;
  isTwoHanded: boolean;
  rangeLevel: number;
  damageReduction: number;
  agilityReduction: number;
  criticalRangeIncrease: number;
  shieldDR: { amount: number; size: number };
  hasShieldDamage: boolean;
  shieldDamage: { amount: number; size: number };
  abilityRequirement: ItemAbilityRequirement | null;
  imageId?: string | null;
  imageUrl?: string | null;
  timestamp: number;
}

export interface ItemCreatorFormState {
  name: string;
  description: string;
  armamentType: ArmamentType;
  selectedProperties: ItemSelectedProperty[];
  damage: ItemDamageConfig;
  isTwoHanded: boolean;
  rangeLevel: number;
  damageReduction: number;
  agilityReduction: number;
  criticalRangeIncrease: number;
  shieldDR: { amount: number; size: number };
  hasShieldDamage: boolean;
  shieldDamage: { amount: number; size: number };
  abilityRequirement: ItemAbilityRequirement | null;
  imageId: string | null;
  imageUrl: string | null;
}

export type ItemLibraryRecord = {
  name?: string;
  description?: string;
  type?: string;
  imageId?: string | null;
  image_id?: string | null;
  imageUrl?: string | null;
  image_url?: string | null;
  properties?: unknown;
  damage?: unknown;
  isTwoHanded?: boolean;
  rangeLevel?: number;
  damageReduction?: number;
  armorValue?: number;
  agilityReduction?: number;
  criticalRangeIncrease?: number;
  shieldDR?: { amount?: number; size?: number };
  hasShieldDamage?: boolean;
  shieldDamage?: { amount?: number; size?: number };
  abilityRequirement?: { id?: number | string; name?: string; level?: number } | null;
};

export function emptyItemCreatorFormState(): ItemCreatorFormState {
  return {
    name: '',
    description: '',
    armamentType: 'Weapon',
    selectedProperties: [],
    damage: { amount: 1, size: 4, type: 'slashing' },
    isTwoHanded: false,
    rangeLevel: 0,
    damageReduction: 0,
    agilityReduction: 0,
    criticalRangeIncrease: 0,
    shieldDR: { amount: 1, size: 4 },
    hasShieldDamage: false,
    shieldDamage: { amount: 1, size: 4 },
    abilityRequirement: null,
    imageId: null,
    imageUrl: null,
  };
}

export function restoreItemCreatorFromCache(
  itemProperties: ItemProperty[],
): ItemCreatorFormState | null {
  const parsed = readCreatorCache<ItemCreatorCache>(ITEM_CREATOR_CACHE_KEY);
  if (!parsed) return null;

  const base = emptyItemCreatorFormState();

  const selectedProperties: ItemSelectedProperty[] = [];
  for (const savedProp of parsed.selectedProperties ?? []) {
    const foundProp = itemProperties.find((p) => String(p.id) === String(savedProp.propertyId));
    if (foundProp) {
      selectedProperties.push({ property: foundProp, op_1_lvl: savedProp.op_1_lvl });
    }
  }

  return {
    ...base,
    name: parsed.name || '',
    description: parsed.description || '',
    armamentType: parsed.armamentType || 'Weapon',
    selectedProperties,
    damage: parsed.damage || base.damage,
    isTwoHanded: parsed.isTwoHanded || false,
    rangeLevel: parsed.rangeLevel || 0,
    damageReduction: parsed.damageReduction || 0,
    agilityReduction: parsed.agilityReduction || 0,
    criticalRangeIncrease: parsed.criticalRangeIncrease || 0,
    shieldDR: parsed.shieldDR || base.shieldDR,
    hasShieldDamage: parsed.hasShieldDamage || false,
    shieldDamage: parsed.shieldDamage || base.shieldDamage,
    abilityRequirement: parsed.abilityRequirement || null,
    imageId: parsed.imageId ?? null,
    imageUrl: parsed.imageUrl ?? null,
  };
}

/**
 * Unified library-record → form state (used by both ?edit= bootstrap and the
 * Load modal). Restores shield block/damage config on the edit path too, which
 * the old per-path edit effect missed.
 */
export function itemLibraryRecordToFormState(
  item: ItemLibraryRecord,
  itemProperties: ItemProperty[],
): ItemCreatorFormState {
  const base = emptyItemCreatorFormState();

  const typeMap: Record<string, ArmamentType> = {
    weapon: 'Weapon',
    armor: 'Armor',
    shield: 'Shield',
  };
  const armamentType = typeMap[item.type?.toLowerCase() ?? ''] || 'Weapon';

  let selectedProperties: ItemSelectedProperty[] = [];
  if (item.properties && Array.isArray(item.properties) && itemProperties.length > 0) {
    // Only non-mechanic properties belong in the selectable list; mechanic properties
    // are driven by dedicated UI fields (damage, rangeLevel, DR, etc.).
    selectedProperties = filterSavedItemPropertiesForList(
      item.properties as Array<{ id?: number | string; name?: string; op_1_lvl?: number }>,
      itemProperties,
    );
  }

  let damage = { amount: 1, size: 6, type: 'slashing' };
  if (item.damage && Array.isArray(item.damage) && item.damage.length > 0) {
    const dmg = item.damage[0] as { amount?: number; size?: number; type?: string };
    damage = {
      amount: Number(dmg.amount) || 1,
      size: Number(dmg.size) || 6,
      type: dmg.type || 'slashing',
    };
  }

  const abilityRequirement: ItemAbilityRequirement | null =
    (armamentType === 'Weapon' || armamentType === 'Armor') && item.abilityRequirement
      ? {
          id:
            typeof item.abilityRequirement.id === 'number'
              ? item.abilityRequirement.id
              : Number(item.abilityRequirement.id) || 0,
          name: item.abilityRequirement.name || '',
          level: item.abilityRequirement.level || 0,
        }
      : null;

  return {
    ...base,
    name: item.name || '',
    description: item.description || '',
    armamentType,
    selectedProperties,
    damage,
    imageId: item.imageId ?? item.image_id ?? null,
    imageUrl:
      typeof (item.imageUrl ?? item.image_url) === 'string' && (item.imageUrl ?? item.image_url)?.trim()
        ? (item.imageUrl ?? item.image_url) as string
        : null,
    isTwoHanded:
      armamentType === 'Weapon' || armamentType === 'Shield' ? item.isTwoHanded || false : false,
    rangeLevel: armamentType === 'Weapon' ? item.rangeLevel || 0 : 0,
    abilityRequirement,
    damageReduction:
      armamentType === 'Armor' ? item.damageReduction ?? item.armorValue ?? 0 : 0,
    agilityReduction: armamentType === 'Armor' ? item.agilityReduction || 0 : 0,
    criticalRangeIncrease: armamentType === 'Armor' ? item.criticalRangeIncrease || 0 : 0,
    shieldDR:
      armamentType === 'Shield' && item.shieldDR
        ? { amount: item.shieldDR.amount || 1, size: item.shieldDR.size || 4 }
        : base.shieldDR,
    hasShieldDamage: armamentType === 'Shield' ? item.hasShieldDamage || false : false,
    shieldDamage:
      armamentType === 'Shield' && item.shieldDamage
        ? { amount: item.shieldDamage.amount || 1, size: item.shieldDamage.size || 4 }
        : base.shieldDamage,
  };
}

export function bootstrapItemCreatorFormState(options: {
  editItemId: string | null;
  itemProperties: ItemProperty[];
  rawItems: unknown[];
}): ItemCreatorFormState {
  const { editItemId, itemProperties, rawItems } = options;

  if (editItemId) {
    const itemToEdit = rawItems.find((it) => {
      const row = it as { docId?: string; id?: string };
      return String(row.docId) === editItemId || String(row.id) === editItemId;
    });
    if (!itemToEdit) {
      return emptyItemCreatorFormState();
    }
    return itemLibraryRecordToFormState(itemToEdit as ItemLibraryRecord, itemProperties);
  }

  return restoreItemCreatorFromCache(itemProperties) ?? emptyItemCreatorFormState();
}
