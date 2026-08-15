/**
 * Advanced character-creator equipment catalog / budget helpers.
 * Pure functions only — no React. Mirrors guided equipment-currency / catalog patterns.
 */

import {
  deriveItemDisplay,
  type ItemProperty,
  type ItemPropertyTpRow,
} from '@/lib/calculators/item-calc';
import { wouldExceedCurrency } from '@/lib/guided-creator/equipment-currency';
import {
  buildRequiredProficiencies,
  calculateProficiencyTP,
  dedupeHighestProficiencies,
  getTrainingPointLimit,
} from '@/lib/proficiencies';
import type { PathItemRecommendation } from '@/types/archetype';
import type { CodexEquipmentItem } from '@/types/codex';
import type { Item } from '@/types/equipment';
import type { CharacterPower, CharacterTechnique } from '@/types';
import type { LibraryItem, UserItem } from '@/types/library';

/** Property shape used by Advanced equipment list / inventory rows. */
export type AdvancedEquipmentProperty =
  | string
  | {
      id?: string | number;
      name?: string;
      op_1_lvl?: number;
      base_tp?: number;
      op_1_tp?: number;
    };

/** Unified catalog row for Advanced equipment step (inline list UX). */
export interface AdvancedEquipmentItem {
  id: string;
  name: string;
  type: 'weapon' | 'armor' | 'equipment';
  description: string;
  damage?: string;
  armor_value?: number;
  gold_cost: number;
  currency: number;
  properties: AdvancedEquipmentProperty[];
  rarity?: string;
  category?: string;
  source: 'library' | 'codex' | 'public';
  image_id?: string | null;
  image_url?: string | null;
}

/** Selected inventory row (quantity-aware). */
export interface AdvancedSelectedItem {
  id: string;
  name: string;
  type: string;
  cost: number;
  quantity: number;
  damage?: string | Array<{ amount?: number | string; size?: number | string; type?: string }>;
  armor?: number;
  properties: AdvancedEquipmentProperty[];
}

export type AdvancedEquipmentTabId = 'weapon' | 'armor' | 'equipment' | 'unarmed';
export type AdvancedLoadoutPhase = 'weapon' | 'armor';
export type AdvancedSourceFilter = 'all' | 'public' | 'my';

export const UNARMED_PROWESS_BASE_TP = 10;
export const UNARMED_PROWESS_UPGRADE_TP = 6;

const UNARMED_PROWESS_LEVELS = [
  {
    level: 1,
    charLevel: 1,
    name: 'Unarmed Prowess',
    description:
      'Your unarmed strikes deal damage equal to your Attack Bonus (Ability + Martial Proficiency). Use Strength or Agility (whichever is higher) for attack and damage.',
  },
  {
    level: 2,
    charLevel: 4,
    name: 'Unarmed Prowess II',
    description:
      'Your unarmed damage increases to 1d2 + Attack Bonus (Ability + Martial Proficiency).',
  },
  {
    level: 3,
    charLevel: 8,
    name: 'Unarmed Prowess III',
    description:
      'Your unarmed damage increases to 1d4 + Attack Bonus (Ability + Martial Proficiency).',
  },
  {
    level: 4,
    charLevel: 12,
    name: 'Unarmed Prowess IV',
    description:
      'Your unarmed damage increases to 1d6 + Attack Bonus (Ability + Martial Proficiency).',
  },
  {
    level: 5,
    charLevel: 16,
    name: 'Unarmed Prowess V',
    description:
      'Your unarmed damage increases to 1d8 + Attack Bonus (Ability + Martial Proficiency).',
  },
] as const;

export type UnarmedProwessLevel = (typeof UNARMED_PROWESS_LEVELS)[number];

export function computeUnarmedProwessTpCost(level: number): number {
  if (level <= 0) return 0;
  return UNARMED_PROWESS_BASE_TP + (level - 1) * UNARMED_PROWESS_UPGRADE_TP;
}

export function availableUnarmedProwessLevels(charLevel = 1): UnarmedProwessLevel[] {
  return UNARMED_PROWESS_LEVELS.filter((up) => up.charLevel <= charLevel);
}

function enrichProperty(
  prop: string | { id?: string | number; name?: string; op_1_lvl?: number },
  itemProperties: ItemPropertyTpRow[] | undefined,
): AdvancedEquipmentProperty {
  if (typeof prop === 'string') {
    const dbProp = itemProperties?.find(
      (p) => String(p.name ?? '').toLowerCase() === prop.toLowerCase(),
    );
    return {
      name: prop,
      id: dbProp?.id,
      op_1_lvl: 0,
      base_tp: dbProp?.base_tp,
      op_1_tp: dbProp?.op_1_tp,
    };
  }
  const dbProp = itemProperties?.find(
    (p) =>
      String(p.id) === String(prop.id) ||
      String(p.name ?? '').toLowerCase() === String(prop.name ?? '').toLowerCase(),
  );
  return {
    id: prop.id,
    name: prop.name,
    op_1_lvl: prop.op_1_lvl ?? 0,
    base_tp: dbProp?.base_tp,
    op_1_tp: dbProp?.op_1_tp,
  };
}

function normalizeArmamentType(raw: string): string {
  if (!raw) return '';
  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
}

function tabTypeFromArmament(
  normalizedType: string,
  rawType?: string,
): 'weapon' | 'armor' | 'equipment' {
  if (normalizedType === 'Weapon' || normalizedType === 'Shield') return 'weapon';
  if (normalizedType === 'Armor') return 'armor';
  if (rawType === 'weapon' || rawType === 'shield') return 'weapon';
  if (rawType === 'armor') return 'armor';
  return 'equipment';
}

/** Loose library row (user items may still carry legacy `armamentType`). */
export type AdvancedLibraryItemInput = UserItem & {
  armamentType?: string;
  damage?: { amount: number; size: number; type: string }[] | LibraryItem['damage'];
};

function rowFromUserLibraryItem(
  userItem: AdvancedLibraryItemInput,
  itemProperties: ItemPropertyTpRow[],
): AdvancedEquipmentItem | null {
  const rawData = userItem as unknown as Record<string, unknown>;
  const armamentType = (rawData.armamentType as string) || '';
  const itemType = (rawData.type as string) || '';
  const normalizedType = armamentType || normalizeArmamentType(itemType);

  if (!normalizedType || !['Weapon', 'Shield', 'Armor'].includes(normalizedType)) {
    return null;
  }

  const display = deriveItemDisplay(
    {
      name: userItem.name,
      description: userItem.description,
      armamentType: normalizedType as 'Weapon' | 'Armor' | 'Shield',
      properties: userItem.properties?.map((p) => ({
        id: typeof p.id === 'number' ? p.id : p.id != null ? Number(p.id) : undefined,
        name: p.name,
        op_1_lvl: p.op_1_lvl,
      })),
      damage: rawData.damage as { amount: number; size: number; type: string }[] | undefined,
    },
    itemProperties as ItemProperty[],
  );

  const type = tabTypeFromArmament(normalizedType);

  return {
    id: userItem.id,
    name: display.name,
    type,
    description: display.description,
    damage: display.damage || undefined,
    armor_value: display.damageReduction || undefined,
    gold_cost: display.currencyCost,
    currency: display.currencyCost,
    properties: (userItem.properties || []).map((prop) => enrichProperty(prop, itemProperties)),
    rarity: display.rarity,
    source: 'library',
    image_id: userItem.image_id ?? null,
    image_url: userItem.image_url ?? null,
  };
}

function rowFromCodexItem(
  item: CodexEquipmentItem,
  itemProperties: ItemPropertyTpRow[] | undefined,
): AdvancedEquipmentItem {
  return {
    id: item.id,
    name: item.name,
    type: item.type,
    description: item.description || '',
    damage: item.damage,
    armor_value: item.armor_value,
    gold_cost: item.gold_cost || 0,
    currency: item.currency || item.gold_cost || 0,
    properties: (item.properties || []).map((prop) => enrichProperty(prop, itemProperties)),
    rarity: item.rarity,
    category: item.category,
    source: 'codex',
    image_id: item.image_id ?? null,
    image_url: item.image_url ?? null,
  };
}

function rowFromPublicLibraryItem(
  pub: LibraryItem,
  itemProperties: ItemPropertyTpRow[],
): AdvancedEquipmentItem {
  const rawType = pub.type || '';
  const normalizedType = rawType ? normalizeArmamentType(rawType) : '';
  const type = tabTypeFromArmament(normalizedType, rawType);
  const display = deriveItemDisplay(
    {
      name: String(pub.name ?? ''),
      description: String(pub.description ?? ''),
      armamentType: (normalizedType || 'Weapon') as 'Weapon' | 'Armor' | 'Shield',
      properties: (Array.isArray(pub.properties) ? pub.properties : []).map((p) => ({
        id:
          p.id != null ? (typeof p.id === 'number' ? p.id : parseInt(String(p.id), 10)) : undefined,
        name: p.name,
        op_1_lvl: p.op_1_lvl,
      })),
      damage: pub.damage as { amount: number; size: number; type: string }[] | undefined,
    },
    itemProperties as ItemProperty[],
  );

  return {
    id: String(pub.id ?? pub.docId ?? ''),
    name: display.name,
    type,
    description: display.description,
    damage: display.damage || undefined,
    armor_value: display.damageReduction || undefined,
    gold_cost: display.currencyCost,
    currency: display.currencyCost,
    properties: (Array.isArray(pub.properties) ? pub.properties : []).map((prop) =>
      enrichProperty(prop, itemProperties),
    ),
    rarity: display.rarity,
    category: type === 'equipment' ? 'Equipment' : undefined,
    source: 'public',
    image_id: pub.image_id ?? null,
    image_url: pub.image_url ?? null,
  };
}

/**
 * Merge user library armaments + Codex equipment + official/public items into
 * Advanced creator catalog rows (source tags preserved for SourceFilter).
 */
export function buildAdvancedEquipmentCatalog(args: {
  userItems?: AdvancedLibraryItemInput[] | null;
  codexEquipment?: CodexEquipmentItem[] | null;
  publicItems?: LibraryItem[] | null;
  itemProperties?: ItemPropertyTpRow[] | null;
}): AdvancedEquipmentItem[] {
  const { userItems, codexEquipment, publicItems, itemProperties } = args;
  const items: AdvancedEquipmentItem[] = [];
  const props = itemProperties ?? undefined;

  if (userItems && props) {
    for (const userItem of userItems) {
      const row = rowFromUserLibraryItem(userItem, props);
      if (row) items.push(row);
    }
  }

  if (codexEquipment) {
    for (const item of codexEquipment) {
      items.push(rowFromCodexItem(item, props));
    }
  }

  if (publicItems && publicItems.length > 0 && props) {
    for (const pub of publicItems) {
      items.push(rowFromPublicLibraryItem(pub, props));
    }
  }

  return items;
}

function findAdvancedEquipmentItem(
  catalog: AdvancedEquipmentItem[],
  idOrName: string,
): AdvancedEquipmentItem | undefined {
  const norm = String(idOrName).toLowerCase().trim();
  return catalog.find(
    (e) =>
      String(e.id).toLowerCase().trim() === norm ||
      String(e.name ?? '')
        .toLowerCase()
        .trim() === norm,
  );
}

/** Resolve path armament + equipment recommendations against the merged catalog. */
export function resolvePathRecommendedEquipment(
  catalog: AdvancedEquipmentItem[],
  armamentRecommendations: PathItemRecommendation[],
  equipmentRecommendations: PathItemRecommendation[],
): Array<{ item: AdvancedEquipmentItem; quantity: number }> {
  const out: Array<{ item: AdvancedEquipmentItem; quantity: number }> = [];
  const seenIds = new Set<string>();
  const pushIfNew = (item: AdvancedEquipmentItem, quantity: number) => {
    const key = String(item.id).toLowerCase();
    if (seenIds.has(key)) return;
    seenIds.add(key);
    out.push({ item, quantity });
  };
  for (const rec of armamentRecommendations) {
    const item = findAdvancedEquipmentItem(catalog, rec.id);
    if (item) pushIfNew(item, rec.quantity);
  }
  for (const rec of equipmentRecommendations) {
    const item = findAdvancedEquipmentItem(catalog, rec.id);
    if (item) pushIfNew(item, rec.quantity);
  }
  return out;
}

export function filterPathRecommendedForPhase(
  recommended: Array<{ item: AdvancedEquipmentItem; quantity: number }>,
  args: {
    pathMode: boolean;
    showFullEquipmentList: boolean;
    loadoutPhase: AdvancedLoadoutPhase;
  },
): Array<{ item: AdvancedEquipmentItem; quantity: number }> {
  if (!args.pathMode || args.showFullEquipmentList) return recommended;
  if (args.loadoutPhase === 'weapon') {
    return recommended.filter(({ item }) => item.type === 'weapon');
  }
  return recommended.filter(({ item }) => item.type === 'armor');
}

export function selectedItemsFromInventory(
  inventory: Item[] | null | undefined,
): AdvancedSelectedItem[] {
  return (inventory || []).map((item) => ({
    id: String(item.id),
    name: item.name,
    type: item.type || 'equipment',
    cost: item.cost || 0,
    quantity: item.quantity || 1,
    damage: item.damage,
    armor: item.armor,
    properties: Array.isArray(item.properties)
      ? (item.properties as AdvancedEquipmentProperty[])
      : [],
  }));
}

export function filterAdvancedEquipmentCatalog(
  catalog: AdvancedEquipmentItem[],
  args: {
    activeTab: AdvancedEquipmentTabId;
    searchTerm?: string;
    sourceFilter?: AdvancedSourceFilter;
  },
): AdvancedEquipmentItem[] {
  const { activeTab, searchTerm = '', sourceFilter = 'all' } = args;
  if (activeTab === 'unarmed') return [];
  return catalog.filter((item) => {
    if (item.type !== activeTab) return false;
    if (sourceFilter === 'my' && item.source !== 'library') return false;
    if (sourceFilter === 'public' && item.source !== 'public' && item.source !== 'codex') {
      return false;
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const name = String(item.name ?? '');
      const desc = String(item.description ?? '');
      if (!name.toLowerCase().includes(term) && !desc.toLowerCase().includes(term)) {
        return false;
      }
    }
    return true;
  });
}

export function recommendationIdSet(recs: PathItemRecommendation[]): Set<string> {
  return new Set(recs.map((r) => String(r.id).toLowerCase()));
}

export function isPathRecommendedItem(
  item: AdvancedEquipmentItem,
  recommendedArmamentRefs: Set<string>,
  recommendedEquipmentRefs: Set<string>,
): boolean {
  const idKey = String(item.id).toLowerCase();
  const nameKey = String(item.name).toLowerCase();
  if (item.type === 'equipment') {
    return recommendedEquipmentRefs.has(idKey) || recommendedEquipmentRefs.has(nameKey);
  }
  return recommendedArmamentRefs.has(idKey) || recommendedArmamentRefs.has(nameKey);
}

export interface AdvancedProficiencyTpSummary {
  spent: number;
  limit: number;
  remaining: number;
}

export function computeAdvancedEquipmentProficiencyTp(args: {
  inventory?: Item[] | null;
  powers?: CharacterPower[] | null;
  techniques?: CharacterTechnique[] | null;
  abilities?: Record<string, number | unknown> | object | null;
  powAbil?: string | null;
  martAbil?: string | null;
  level?: number;
  powerPartsDb?: Array<{ id?: string | number; name?: string; base_tp?: number; op_1_tp?: number }>;
  techniquePartsDb?: Array<{
    id?: string | number;
    name?: string;
    base_tp?: number;
    op_1_tp?: number;
  }>;
  itemPropertiesDb?: ItemPropertyTpRow[] | null;
}): AdvancedProficiencyTpSummary {
  const inventory = args.inventory || [];
  const weapons = inventory.filter((item) => item.type === 'weapon');
  const shields = inventory.filter((item) => item.type === 'shield');
  const armor = inventory.filter((item) => item.type === 'armor');
  const required = buildRequiredProficiencies({
    powers: (args.powers || []) as CharacterPower[],
    techniques: (args.techniques || []) as CharacterTechnique[],
    weapons: weapons as Item[],
    shields: shields as Item[],
    armor: armor as Item[],
    powerPartsDb: args.powerPartsDb,
    techniquePartsDb: args.techniquePartsDb,
    itemPropertiesDb: args.itemPropertiesDb ?? [],
  });
  const spent = dedupeHighestProficiencies(required).reduce(
    (sum, p) => sum + calculateProficiencyTP(p),
    0,
  );

  const abilities = args.abilities || {};
  const getAbility = (key: string | undefined | null): number =>
    key ? Number((abilities as Record<string, unknown>)[key] ?? 0) || 0 : 0;
  const highestAbility = Math.max(
    ...Object.values(abilities).filter((v): v is number => typeof v === 'number'),
    0,
  );
  const archetypeAbility = Math.max(
    getAbility(args.powAbil),
    getAbility(args.martAbil),
    highestAbility,
  );
  const limit = getTrainingPointLimit(args.level || 1, archetypeAbility);
  return { spent, limit, remaining: limit - spent };
}

function catalogItemToInventoryItem(item: AdvancedEquipmentItem, quantity: number): Item {
  const cost = item.gold_cost || item.currency || 0;
  return {
    id: item.id,
    name: item.name,
    type: item.type,
    cost,
    quantity,
    damage: item.damage,
    armor: item.armor_value,
    properties: item.properties as unknown as Item['properties'],
    image_id: item.image_id ?? null,
    image_url: item.image_url ?? null,
  };
}

/** Add qty units; returns null when currency would be exceeded. */
export function addAdvancedEquipmentToInventory(
  inventory: Item[],
  item: AdvancedEquipmentItem,
  qty: number,
  remainingCurrency: number,
): Item[] | null {
  if (qty < 1) return null;
  const cost = item.gold_cost || item.currency || 0;
  if (wouldExceedCurrency(remainingCurrency, cost, qty)) return null;
  const existingIndex = inventory.findIndex((i) => String(i.id) === item.id);
  if (existingIndex >= 0) {
    const updated = [...inventory];
    const existingQty = updated[existingIndex].quantity || 1;
    updated[existingIndex] = {
      ...updated[existingIndex],
      quantity: existingQty + qty,
    };
    return updated;
  }
  return [...inventory, catalogItemToInventoryItem(item, qty)];
}

/** Decrease quantity by 1, or remove when quantity would drop below 1. */
export function removeAdvancedEquipmentFromInventory(inventory: Item[], itemId: string): Item[] {
  const existingIndex = inventory.findIndex((i) => String(i.id) === itemId);
  if (existingIndex < 0) return inventory;
  const existing = inventory[existingIndex];
  const currentQty = existing.quantity || 1;
  if (currentQty <= 1) {
    return inventory.filter((i) => String(i.id) !== itemId);
  }
  const updated = [...inventory];
  updated[existingIndex] = {
    ...updated[existingIndex],
    quantity: currentQty - 1,
  };
  return updated;
}

/** Replace prior recommended set with current path recommendations (no duplicates). */
export function replaceRecommendedInventory(
  inventory: Item[],
  recommended: Array<{ item: AdvancedEquipmentItem; quantity: number }>,
): Item[] {
  if (recommended.length === 0) return inventory;
  const recommendedIds = new Set(recommended.map(({ item }) => String(item.id)));
  const otherItems = inventory.filter((i) => !recommendedIds.has(String(i.id)));
  const recommendedEntries = recommended.map(({ item, quantity }) =>
    catalogItemToInventoryItem(item, quantity),
  );
  return [...otherItems, ...recommendedEntries];
}

export function recommendedItemsInInventory(
  inventory: Item[] | null | undefined,
  recommended: Array<{ item: AdvancedEquipmentItem; quantity: number }>,
): Array<{ item: AdvancedEquipmentItem; quantity: number }> {
  const invIds = new Set((inventory ?? []).map((i) => String(i.id)));
  return recommended.filter(({ item }) => invIds.has(String(item.id)));
}

export function pathRecommendedMergeKey(
  archetypeId: string | null | undefined,
  recommended: Array<{ item: AdvancedEquipmentItem; quantity: number }>,
): string {
  return `${archetypeId ?? ''}:${recommended.map(({ item, quantity }) => `${item.id}:${quantity}`).join('|')}`;
}
