/**
 * Resolve path loadout item refs to display names and categories from official + codex libraries.
 */

import type { CodexEquipmentItem } from '@/types/codex';
import type { LibraryItem } from '@/types/library';
import type { PathItemRecommendation, PathLoadout } from '@/types/archetype';
import { formatDamage, type ItemDamage } from '@/lib/calculators/item-calc';
import { flattenLoadoutEntries } from '@/lib/game/loadout-entries';
import { normalizeId } from '@/lib/utils';

export type LoadoutItemCategory = 'weapon' | 'armor' | 'equipment';

export interface EquipmentLookupEntry {
  id: string;
  name: string;
  description?: string;
  category: LoadoutItemCategory;
  statsLine?: string;
}

export interface ResolvedLoadoutItem {
  id: string;
  quantity: number;
  name: string;
  description?: string;
  category: LoadoutItemCategory;
  categoryLabel: string;
  statsLine?: string;
  resolved: boolean;
}

const CATEGORY_LABELS: Record<LoadoutItemCategory, string> = {
  weapon: 'Weapon',
  armor: 'Armor',
  equipment: 'Gear',
};

function mapLibraryType(type: string | undefined): LoadoutItemCategory {
  const t = String(type ?? '').toLowerCase();
  if (t === 'armor') return 'armor';
  if (t === 'equipment') return 'equipment';
  return 'weapon';
}

function entryFromOfficial(item: LibraryItem): EquipmentLookupEntry {
  const category = mapLibraryType(item.type);
  const damageStats = formatDamage(
    Array.isArray(item.damage) ? (item.damage as ItemDamage[]) : undefined
  );
  const statsLine =
    category === 'armor' && item.damageReduction != null
      ? `DR ${item.damageReduction}`
      : damageStats || undefined;
  return {
    id: String(item.id),
    name: String(item.name ?? item.id),
    description: item.description?.trim() || undefined,
    category,
    statsLine,
  };
}

function entryFromCodex(item: CodexEquipmentItem): EquipmentLookupEntry {
  const category = item.type === 'armor' ? 'armor' : item.type === 'equipment' ? 'equipment' : 'weapon';
  const statsLine =
    category === 'armor' && item.armor_value != null
      ? `DR ${item.armor_value}`
      : item.damage?.trim() || undefined;
  return {
    id: String(item.id),
    name: item.name,
    description: item.description?.trim() || undefined,
    category,
    statsLine,
  };
}

export function buildEquipmentLookup(
  officialItems: LibraryItem[] = [],
  codexEquipment: CodexEquipmentItem[] = []
): Map<string, EquipmentLookupEntry> {
  const map = new Map<string, EquipmentLookupEntry>();
  for (const item of codexEquipment) {
    map.set(normalizeId(String(item.id)), entryFromCodex(item));
  }
  for (const item of officialItems) {
    map.set(normalizeId(String(item.id)), entryFromOfficial(item));
  }
  return map;
}

export function resolveEquipmentRef(
  ref: PathItemRecommendation,
  lookup: Map<string, EquipmentLookupEntry>,
  unresolvedLabel = 'Unknown item'
): ResolvedLoadoutItem {
  const key = normalizeId(ref.id);
  const entry = lookup.get(key);
  const category = entry?.category ?? 'equipment';
  return {
    id: ref.id,
    quantity: ref.quantity,
    name: entry?.name ?? unresolvedLabel,
    description: entry?.description,
    category,
    categoryLabel: CATEGORY_LABELS[category],
    statsLine: entry?.statsLine,
    resolved: Boolean(entry),
  };
}

export function resolveLoadoutItems(
  loadout: PathLoadout,
  lookup: Map<string, EquipmentLookupEntry>,
  unresolvedLabel = 'Unknown item'
): ResolvedLoadoutItem[] {
  return flattenLoadoutEntries(loadout).map((ref) =>
    resolveEquipmentRef(ref, lookup, unresolvedLabel)
  );
}

export function loadoutDraftFromSelection(
  loadout: PathLoadout,
  lookup?: Map<string, EquipmentLookupEntry>
): {
  loadoutWeapons: PathItemRecommendation[];
  loadoutArmor: PathItemRecommendation[];
  equipment: PathItemRecommendation[];
  armaments: PathItemRecommendation[];
} {
  const loadoutWeapons: PathItemRecommendation[] = [];
  const loadoutArmor: PathItemRecommendation[] = [...(loadout.armor ?? [])];
  const armorIds = new Set(loadoutArmor.map((ref) => normalizeId(String(ref.id))));

  for (const ref of loadout.armaments ?? []) {
    const key = normalizeId(String(ref.id));
    const category = lookup?.get(key)?.category;
    // Live path kits often nest armor inside `armaments[]` (no separate `armor` field).
    if (category === 'armor') {
      if (!armorIds.has(key)) {
        loadoutArmor.push(ref);
        armorIds.add(key);
      }
      continue;
    }
    loadoutWeapons.push(ref);
  }

  return {
    loadoutWeapons,
    loadoutArmor,
    equipment: loadout.equipment ?? [],
    armaments: [...loadoutWeapons, ...loadoutArmor],
  };
}

/**
 * Drop draft loadout refs that no longer resolve in the library/codex lookup
 * (stale kit auto-apply, renamed ids, etc.).
 */
export function pruneUnresolvedLoadoutRefs(
  refs: PathItemRecommendation[],
  lookup: Map<string, EquipmentLookupEntry>
): PathItemRecommendation[] {
  if (lookup.size === 0) return refs;
  return refs.filter((ref) => lookup.has(normalizeId(String(ref.id))));
}

/**
 * Re-classify draft weapon/armor buckets using the library lookup.
 * Fixes path recommendations that nest armor inside `armaments[]`.
 */
export function rebucketLoadoutByLookup(
  loadoutWeapons: PathItemRecommendation[],
  loadoutArmor: PathItemRecommendation[],
  lookup: Map<string, EquipmentLookupEntry>
): {
  loadoutWeapons: PathItemRecommendation[];
  loadoutArmor: PathItemRecommendation[];
  armaments: PathItemRecommendation[];
} {
  if (lookup.size === 0) {
    return {
      loadoutWeapons,
      loadoutArmor,
      armaments: [...loadoutWeapons, ...loadoutArmor],
    };
  }

  const weapons: PathItemRecommendation[] = [];
  const armor: PathItemRecommendation[] = [];
  const seenArmor = new Set<string>();

  const pushArmor = (ref: PathItemRecommendation) => {
    const key = normalizeId(String(ref.id));
    if (seenArmor.has(key)) return;
    seenArmor.add(key);
    armor.push(ref);
  };

  for (const ref of loadoutWeapons) {
    const key = normalizeId(String(ref.id));
    if (lookup.get(key)?.category === 'armor') pushArmor(ref);
    else weapons.push(ref);
  }
  for (const ref of loadoutArmor) {
    const key = normalizeId(String(ref.id));
    if (lookup.get(key)?.category === 'weapon') weapons.push(ref);
    else pushArmor(ref);
  }

  return {
    loadoutWeapons: weapons,
    loadoutArmor: armor,
    armaments: [...weapons, ...armor],
  };
}

/** Keep legacy `armaments` in sync with phased weapon + armor selections. */
export function mergeLoadoutArmaments(draft: {
  loadoutWeapons: PathItemRecommendation[];
  loadoutArmor: PathItemRecommendation[];
}): PathItemRecommendation[] {
  return [...draft.loadoutWeapons, ...draft.loadoutArmor];
}

export function groupResolvedItemsByCategory(
  items: ResolvedLoadoutItem[]
): Array<{ id: 'weapons' | 'armor' | 'gear'; label: string; items: ResolvedLoadoutItem[] }> {
  const weapons = items.filter((i) => i.category === 'weapon');
  const armor = items.filter((i) => i.category === 'armor');
  const gear = items.filter((i) => i.category === 'equipment');
  const groups: Array<{ id: 'weapons' | 'armor' | 'gear'; label: string; items: ResolvedLoadoutItem[] }> = [];
  if (weapons.length > 0) groups.push({ id: 'weapons', label: 'Weapons', items: weapons });
  if (armor.length > 0) groups.push({ id: 'armor', label: 'Armor', items: armor });
  if (gear.length > 0) groups.push({ id: 'gear', label: 'Gear', items: gear });
  return groups;
}

export function inventoryTypeForResolvedItem(item: ResolvedLoadoutItem): 'weapon' | 'armor' | 'equipment' {
  if (item.category === 'armor') return 'armor';
  if (item.category === 'weapon') return 'weapon';
  return 'equipment';
}
