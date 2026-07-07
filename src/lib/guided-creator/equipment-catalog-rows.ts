/**
 * Build eligibility rows from official + codex equipment libraries.
 */

import type { CodexEquipmentItem } from '@/types/codex';
import type { LibraryItem } from '@/types/library';
import type { ItemPropertyTpRow } from '@/lib/calculators/item-calc';
import type { EligibleEquipmentRow, EquipmentPhase } from '@/lib/guided-creator/equipment-eligibility';
import { resolveItemTrainingPoints } from '@/lib/guided-creator/loadout-tp';
import { formatWeaponDamageLine } from '@/lib/guided-creator/equipment-phase-stats';

function normalizeId(id: string): string {
  return String(id).trim().toLowerCase();
}

function rowFromOfficial(
  item: LibraryItem,
  itemProperties: ItemPropertyTpRow[]
): EligibleEquipmentRow {
  const tp =
    item.costs?.totalTP ??
    resolveItemTrainingPoints(String(item.id), [item], [], itemProperties) ??
    0;
  return {
    id: String(item.id),
    name: String(item.name ?? item.id),
    type: item.type,
    rarity: item.rarity ?? 'common',
    properties: item.properties ?? [],
    gold_cost: item.costs?.totalCurrency,
    trainingPoints: tp,
    abilityRequirement: item.abilityRequirement?.name
      ? {
          name: String(item.abilityRequirement.name),
          level: Number(item.abilityRequirement.level ?? 1) || 1,
        }
      : null,
    range: item.rangeLevel != null ? String(item.rangeLevel) : null,
  };
}

function rowFromCodex(
  item: CodexEquipmentItem,
  itemProperties: ItemPropertyTpRow[]
): EligibleEquipmentRow {
  const props = (item.properties ?? []).map((name) => ({ name }));
  const tp =
    resolveItemTrainingPoints(String(item.id), [], [item], itemProperties) ?? 0;
  return {
    id: String(item.id),
    name: item.name,
    type: item.type,
    rarity: item.rarity ?? 'common',
    properties: props,
    gold_cost: item.gold_cost ?? item.currency,
    currency: item.currency,
    trainingPoints: tp,
    range: null,
  };
}

/** Merged catalog keyed by normalized id (official rows override codex). */
export function buildEquipmentCatalogRows(
  officialItems: LibraryItem[] = [],
  codexEquipment: CodexEquipmentItem[] = [],
  itemProperties: ItemPropertyTpRow[] = []
): Map<string, EligibleEquipmentRow> {
  const map = new Map<string, EligibleEquipmentRow>();
  for (const item of codexEquipment) {
    map.set(normalizeId(String(item.id)), rowFromCodex(item, itemProperties));
  }
  for (const item of officialItems) {
    map.set(normalizeId(String(item.id)), rowFromOfficial(item, itemProperties));
  }
  return map;
}

export function catalogRowForRef(
  refId: string,
  catalog: Map<string, EligibleEquipmentRow>
): EligibleEquipmentRow | undefined {
  return catalog.get(normalizeId(refId));
}

export function weaponDamageLineForRef(
  refId: string,
  officialItems: LibraryItem[],
  codexEquipment: CodexEquipmentItem[]
): string | undefined {
  const key = normalizeId(refId);
  const official = officialItems.find((i) => normalizeId(String(i.id)) === key);
  if (official?.damage?.length) return formatWeaponDamageLine(official.damage);
  const codex = codexEquipment.find((i) => normalizeId(String(i.id)) === key);
  if (codex?.damage?.trim()) return codex.damage.trim();
  return undefined;
}

export function libraryRowForRef(
  refId: string,
  officialItems: LibraryItem[],
  codexEquipment: CodexEquipmentItem[]
): LibraryItem | CodexEquipmentItem | undefined {
  const key = normalizeId(refId);
  return (
    officialItems.find((i) => normalizeId(String(i.id)) === key) ??
    codexEquipment.find((i) => normalizeId(String(i.id)) === key)
  );
}

export function armorStatsForRef(
  refId: string,
  officialItems: LibraryItem[],
  codexEquipment: CodexEquipmentItem[]
): { damageReduction?: number | null; agilityPenalty?: number | null } {
  const key = normalizeId(refId);
  const official = officialItems.find((i) => normalizeId(String(i.id)) === key);
  if (official) {
    return {
      damageReduction: official.damageReduction ?? official.armorValue ?? null,
      agilityPenalty: official.agilityReduction ?? null,
    };
  }
  const codex = codexEquipment.find((i) => normalizeId(String(i.id)) === key);
  if (codex?.armor_value != null) {
    return { damageReduction: codex.armor_value, agilityPenalty: null };
  }
  return {};
}

export function gearShortUseForRef(
  refId: string,
  officialItems: LibraryItem[],
  codexEquipment: CodexEquipmentItem[]
): string | undefined {
  const row = libraryRowForRef(refId, officialItems, codexEquipment);
  if (!row || !('description' in row)) return undefined;
  const text = String(row.description ?? '').trim();
  if (!text) return undefined;
  return text.length > 120 ? `${text.slice(0, 117)}…` : text;
}

export function rowsForEquipmentPhase(
  catalog: Map<string, EligibleEquipmentRow>,
  phase: EquipmentPhase
): EligibleEquipmentRow[] {
  return [...catalog.values()].filter((row) => {
    const t = row.type.toLowerCase();
    if (phase === 'weapon') return t === 'weapon' || t === 'shield';
    if (phase === 'armor') return t === 'armor';
    return t === 'equipment';
  });
}
