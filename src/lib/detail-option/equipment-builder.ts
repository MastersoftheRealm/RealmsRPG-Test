/**
 * Equipment path refs → DetailOptionItem (Weapons, Shields, Armor, gear).
 * Column facts become labeled expanded chips (Damage, Range, Damage Reduction, etc.).
 */

import type { ItemPropertyTpRow } from '@/lib/calculators/item-calc';
import {
  armorStatsForRef,
  catalogRowForRef,
  buildEquipmentCatalogRows,
  gearShortUseForRef,
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
import { factChip, propertyChipsFromRefs, type DetailOptionItemModel } from './builders';

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
  const propertyChips = propertyChipsFromRefs(
    properties as Array<string | { name?: string; id?: unknown; op_1_lvl?: number }>,
    itemProperties
  );
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
    });
    if (damage) factChips.push(factChip(`Damage ${damage}`));
    for (const chip of phase.factChips) {
      const n = chip.name.toLowerCase();
      if (n.startsWith('damage ')) continue;
      if (/^currency\s/i.test(n)) continue;
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
    });
    for (const chip of phase.factChips) {
      const n = chip.name.toLowerCase();
      if (n === 'handedness one-handed') continue;
      if (/^currency\s/i.test(n)) continue;
      factChips.push(chip);
    }
  } else if (resolved.category === 'armor') {
    const armor = armorStatsForRef(ref.id, officialItems, codexEquipment ?? []);
    if (armor.damageReduction != null) {
      factChips.push(factChip(`Damage Reduction ${armor.damageReduction}`));
    }
    if (armor.agilityPenalty != null && armor.agilityPenalty !== 0) {
      const n = armor.agilityPenalty;
      factChips.push(
        factChip(`Agility ${n > 0 ? '+' : ''}${n}`)
      );
    }
  } else {
    const shortUse = gearShortUseForRef(ref.id, officialItems, codexEquipment ?? []);
    if (shortUse) {
      const labeled = /^use\b/i.test(shortUse) ? shortUse : `Use ${shortUse}`;
      factChips.push(factChip(labeled));
    }
  }

  const chips = [...factChips, ...propertyChips];
  const qtySuffix = ref.quantity > 1 ? ` ×${ref.quantity}` : '';
  return {
    id: String(ref.id),
    name: `${resolved.name}${qtySuffix}`,
    description: resolved.description,
    chips: chips.length > 0 ? chips : undefined,
    chipsLabel: 'Details',
  };
}
