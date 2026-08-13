/**
 * Build eligibility rows from official + codex equipment libraries.
 */

import type { CodexEquipmentItem } from '@/types/codex';
import type { LibraryItem } from '@/types/library';
import {
  calculateItemCosts,
  type ItemPropertyPayload,
  type ItemPropertyTpRow,
} from '@/lib/calculators/item-calc';
import type { EligibleEquipmentRow, EquipmentPhase } from '@/lib/guided-creator/equipment-eligibility';
import { resolveItemUnitCost } from '@/lib/guided-creator/equipment-currency';
import { resolveItemTrainingPoints } from '@/lib/guided-creator/loadout-tp';
import { formatWeaponDamageLine } from '@/lib/guided-creator/equipment-phase-stats';
import { resolveArmorDamageReduction } from '@/lib/game/resolve-armor-damage-reduction';
import { findByNormalizedId, normalizeId } from '@/lib/utils';

function readTaxonomyCategory(item: unknown): string | undefined {
  if (!item || typeof item !== 'object') return undefined;
  const trimmed = String((item as { category?: unknown }).category ?? '').trim();
  return trimmed || undefined;
}

/**
 * Official rows: Currency column = market cost (OfficialItemList / Library GLR protocol),
 * not raw costs.totalCurrency (property C sum).
 */
function rowFromOfficial(
  item: LibraryItem,
  itemProperties: ItemPropertyTpRow[]
): EligibleEquipmentRow {
  const props = (item.properties ?? []) as ItemPropertyPayload[];
  const fromProps =
    itemProperties.length > 0 ? calculateItemCosts(props, itemProperties) : null;
  const totalCurrency = fromProps?.totalCurrency ?? item.costs?.totalCurrency ?? 0;
  const totalIP = fromProps?.totalIP ?? item.costs?.totalIP ?? 0;
  const currencyCost = resolveItemUnitCost({
    costs: { totalCurrency, totalIP },
  });
  const tp =
    fromProps?.totalTP ??
    item.costs?.totalTP ??
    resolveItemTrainingPoints(String(item.id), [item], [], itemProperties) ??
    0;
  return {
    id: String(item.id),
    name: String(item.name ?? item.id),
    type: item.type,
    itemCategory: readTaxonomyCategory(item),
    rarity: item.rarity ?? 'common',
    properties: item.properties ?? [],
    gold_cost: currencyCost,
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
    itemCategory: readTaxonomyCategory(item),
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
    const officialRow = rowFromOfficial(item, itemProperties);
    const existing =
      map.get(normalizeId(item.id)) ?? map.get(normalizeId(item.docId));
    const merged = {
      ...officialRow,
      itemCategory: officialRow.itemCategory || existing?.itemCategory,
    };
    const idKey = normalizeId(item.id);
    if (idKey) map.set(idKey, merged);
    const docKey = normalizeId(item.docId);
    if (docKey) map.set(docKey, merged);
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
  const official = findByNormalizedId(officialItems, refId);
  if (official?.damage?.length) return formatWeaponDamageLine(official.damage);
  const codex = findByNormalizedId(codexEquipment, refId);
  if (codex?.damage?.trim()) return codex.damage.trim();
  return undefined;
}

export function libraryRowForRef(
  refId: string,
  officialItems: LibraryItem[],
  codexEquipment: CodexEquipmentItem[]
): LibraryItem | CodexEquipmentItem | undefined {
  return findByNormalizedId(officialItems, refId) ?? findByNormalizedId(codexEquipment, refId);
}

export function armorStatsForRef(
  refId: string,
  officialItems: LibraryItem[],
  codexEquipment: CodexEquipmentItem[]
): { damageReduction?: number | null; agilityPenalty?: number | null } {
  const official = findByNormalizedId(officialItems, refId);
  if (official) {
    const damageReduction = resolveArmorDamageReduction(official);
    return {
      damageReduction: damageReduction > 0 ? damageReduction : null,
      agilityPenalty: official.agilityReduction ?? null,
    };
  }
  const codex = findByNormalizedId(codexEquipment, refId);
  if (codex) {
    const damageReduction = resolveArmorDamageReduction({
      armor_value: codex.armor_value,
      properties: (codex.properties ?? []).map((name) => ({ name })),
    });
    if (damageReduction > 0) {
      return { damageReduction, agilityPenalty: null };
    }
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
    return t === 'equipment' || t === 'item' || t === 'consumable' || t === 'tool';
  });
}
