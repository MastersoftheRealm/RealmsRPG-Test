/**
 * Equipment path refs → DetailOptionItem (Weapons, Shields, Armor, gear).
 * Column facts become labeled expanded chips (Damage, Range, Damage Reduction, etc.).
 */

import type { ItemPropertyTpRow } from '@/lib/calculators/item-calc';
import {
  armorStatsForRef,
  catalogRowForRef,
  buildEquipmentCatalogRows,
  libraryRowForRef,
  weaponDamageLineForRef,
} from '@/lib/guided-creator/equipment-catalog-rows';
import { buildEquipmentPhaseCardStats } from '@/lib/guided-creator/equipment-phase-stats';
import {
  buildEquipmentLookup,
  resolveEquipmentRef,
} from '@/lib/guided-creator/resolve-loadout-items';
import type { PathItemRecommendation } from '@/types/archetype';
import type { CodexEquipmentItem } from '@/types/codex';
import type { LibraryItem } from '@/types/library';
import type { ChipData } from '@/components/shared/grid-list-row-types';
import { deriveShieldAmountFromProperties } from '@/lib/calculators';
import type { ItemPropertyPayload } from '@/lib/calculators/item-calc';
import { factChip, type DetailOptionItemModel } from './builders';
import { damageFactChip } from './compact-facts';

function isBudgetChip(name: string): boolean {
  const n = name.toLowerCase();
  return /^currency\s/.test(n) || /^training points\s/.test(n);
}

function isDamageDiceChip(name: string): boolean {
  return /\bdamage\b/i.test(name) && /\dd\d/i.test(name);
}

export function equipmentRefToDetailOption(
  ref: PathItemRecommendation,
  lookup: ReturnType<typeof buildEquipmentLookup>,
  catalog: ReturnType<typeof buildEquipmentCatalogRows>,
  officialItems: LibraryItem[],
  codexEquipment: CodexEquipmentItem[],
  itemProperties: ItemPropertyTpRow[]
): DetailOptionItemModel | null {
  const resolved = resolveEquipmentRef(ref, lookup);
  if (!resolved.resolved) return null;
  const row = catalogRowForRef(ref.id, catalog);
  const lib = libraryRowForRef(ref.id, officialItems, codexEquipment ?? []);
  const properties =
    (lib && 'properties' in lib ? lib.properties : row?.properties) ?? [];
  const itemType = String(
    (lib && 'type' in lib ? lib.type : row?.type) ?? ''
  ).toLowerCase();
  const isShield = itemType === 'shield';
  const factChips: ChipData[] = [];

  if (resolved.category === 'weapon' && !isShield) {
    const damage = weaponDamageLineForRef(ref.id, officialItems, codexEquipment ?? []);
    const phase = buildEquipmentPhaseCardStats({
      category: 'weapon',
      properties: properties as never,
      damageLine: damage,
      itemProperties,
    });
    const dmgChip = damageFactChip(damage);
    if (dmgChip) factChips.push(dmgChip);
    for (const chip of phase.factChips) {
      if (isDamageDiceChip(chip.name) || isBudgetChip(chip.name)) continue;
      factChips.push(chip);
    }
  } else if (isShield) {
    factChips.push(factChip('Shield'));
    const block = deriveShieldAmountFromProperties(
      (properties ?? []) as ItemPropertyPayload[]
    );
    if (block !== '-') factChips.push(factChip(`Block ${block}`));
    const phase = buildEquipmentPhaseCardStats({
      category: 'weapon',
      properties: properties as never,
      itemProperties,
    });
    for (const chip of phase.factChips) {
      const n = chip.name.toLowerCase();
      if (n === 'one-handed' || isBudgetChip(chip.name)) continue;
      factChips.push(chip);
    }
  } else if (resolved.category === 'armor') {
    const armor = armorStatsForRef(ref.id, officialItems, codexEquipment ?? []);
    const phase = buildEquipmentPhaseCardStats({
      category: 'armor',
      properties: properties as never,
      damageReduction: armor.damageReduction,
      agilityPenalty: armor.agilityPenalty,
      itemProperties,
    });
    for (const chip of phase.detailChips) {
      factChips.push(chip);
    }
  } else {
    // Equipment: description on the row — no Use-duplicate chip.
    const phase = buildEquipmentPhaseCardStats({
      category: 'equipment',
      properties: properties as never,
      itemProperties,
    });
    for (const chip of phase.detailChips) {
      factChips.push(chip);
    }
  }

  const qtySuffix = ref.quantity > 1 ? ` ×${ref.quantity}` : '';
  return {
    id: String(ref.id),
    name: `${resolved.name}${qtySuffix}`,
    description: resolved.description,
    chips: factChips.length > 0 ? factChips : undefined,
    chipsLabel: 'Details',
  };
}
