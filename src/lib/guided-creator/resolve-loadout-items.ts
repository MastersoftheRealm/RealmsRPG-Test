/**
 * Resolve path loadout item refs to display names and categories from official + codex libraries.
 */

import type { CodexEquipmentItem } from '@/types/codex';
import type { LibraryItem } from '@/types/library';
import type { PathItemRecommendation, PathLoadout } from '@/types/archetype';

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

function normalizeId(id: string): string {
  return String(id).trim().toLowerCase();
}

function mapLibraryType(type: string | undefined): LoadoutItemCategory {
  const t = String(type ?? '').toLowerCase();
  if (t === 'armor') return 'armor';
  if (t === 'equipment') return 'equipment';
  return 'weapon';
}

function formatDamage(damage: LibraryItem['damage']): string | undefined {
  if (!Array.isArray(damage) || damage.length === 0) return undefined;
  const first = damage[0];
  if (!first) return undefined;
  const amount = first.amount ?? '';
  const size = first.size ?? '';
  const type = first.type ?? '';
  const dice = amount && size ? `${amount}d${size}` : '';
  return [dice, type].filter(Boolean).join(' ').trim() || undefined;
}

function entryFromOfficial(item: LibraryItem): EquipmentLookupEntry {
  const category = mapLibraryType(item.type);
  const statsLine =
    category === 'armor' && item.damageReduction != null
      ? `DR ${item.damageReduction}`
      : formatDamage(item.damage);
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

export function flattenLoadoutEntries(loadout: PathLoadout): PathItemRecommendation[] {
  return [
    ...(loadout.armaments ?? []),
    ...(loadout.armor ?? []),
    ...(loadout.equipment ?? []),
  ];
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

export function loadoutDraftFromSelection(loadout: PathLoadout): {
  armaments: PathItemRecommendation[];
  equipment: PathItemRecommendation[];
} {
  return {
    armaments: [...(loadout.armaments ?? []), ...(loadout.armor ?? [])],
    equipment: loadout.equipment ?? [],
  };
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
