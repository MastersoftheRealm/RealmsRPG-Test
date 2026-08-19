/**
 * Shared enrichment + display helpers for character sheet library lists.
 */

import { getWeaponAttackBonusFromProperties } from '@/lib/game/weapon-attack-ability';
import {
  deriveCriticalRangeIncreaseFromProperties,
  deriveDamageReductionFromProperties,
  type ItemPropertyPayload,
} from '@/lib/calculators';
import { calculateCriticalRange } from '@/lib/game/calculations';
import type { CoreRulesMap } from '@/types/core-rules';
import {
  characterPartsToPartData,
  itemPropertiesToPartData,
  type CodexPartRow,
  type CodexPropertyRow,
} from '@/lib/library/part-display';
import { TP_COST_LABEL } from '@/lib/detail-option/compact-facts';
import { capitalizeWords } from '@/lib/utils';
import type { PartData } from '@/components/patterns';
import type { Abilities, CharacterPower, CharacterTechnique, Item } from '@/types';

export type CodexPart = CodexPartRow;
export type CodexProperty = CodexPropertyRow;

export type ItemWithLibrarySource = Item & {
  libraryItem?: { properties?: Item['properties'] | undefined };
};

export function partsToPartData(
  parts?: CharacterPower['parts'] | CharacterTechnique['parts'],
  codexParts: CodexPart[] = [],
  variant: 'power' | 'technique' = 'power',
): PartData[] {
  return characterPartsToPartData(parts, codexParts, variant);
}

export const propertiesToPartData = itemPropertiesToPartData;

export function chipDescriptionWithOptionLevels(
  baseDescription: string | undefined,
  optionLevels: PartData['optionLevels'],
): string | undefined {
  const parts: string[] = [];
  if (baseDescription?.trim()) parts.push(baseDescription.trim());
  if (optionLevels) {
    const opts: string[] = [];
    if ((optionLevels.opt1 ?? 0) > 0) opts.push(`Option 1: Lv.${optionLevels.opt1}`);
    if ((optionLevels.opt2 ?? 0) > 0) opts.push(`Option 2: Lv.${optionLevels.opt2}`);
    if ((optionLevels.opt3 ?? 0) > 0) opts.push(`Option 3: Lv.${optionLevels.opt3}`);
    if (opts.length > 0) parts.push(opts.join('; '));
  }
  return parts.length > 0 ? parts.join('\n\n') : undefined;
}

export function formatArea(area: string | undefined): string {
  if (!area) return '-';
  const lower = area.toLowerCase().trim();
  if (lower === '1 target' || lower === 'single target' || lower === 'target') return 'Target';
  return capitalizeWords(area);
}

export function formatDamageType(damage: string | undefined): string {
  if (!damage) return '-';
  return capitalizeWords(damage);
}

export function resolveItemProperties(item: ItemWithLibrarySource): Item['properties'] | undefined {
  const fromLib = item.libraryItem?.properties;
  if (fromLib && fromLib.length > 0) return fromLib as Item['properties'];
  return item.properties;
}

type ArmorScalarFields = Item & {
  armorValue?: number | undefined;
  armor?: number | undefined;
  damageReduction?: number | undefined;
  criticalRangeIncrease?: number | undefined;
  critRange?: number | undefined;
};

export interface ArmorItemCombatStats {
  damageReduction: number;
  criticalRangeIncrease: number;
}

/** Damage Reduction and Critical Range +1 bonus for one armor item (matches library armor rows). */
export function deriveArmorItemCombatStats(item: ItemWithLibrarySource): ArmorItemCombatStats {
  const typed = item as ArmorScalarFields;
  const fromLib = item.libraryItem as ArmorScalarFields | undefined;
  let damageReduction =
    typed.damageReduction ??
    typed.armorValue ??
    typed.armor ??
    fromLib?.damageReduction ??
    fromLib?.armorValue ??
    fromLib?.armor ??
    0;
  let criticalRangeIncrease =
    typed.criticalRangeIncrease ??
    typed.critRange ??
    fromLib?.criticalRangeIncrease ??
    fromLib?.critRange ??
    0;

  const props = resolveItemProperties(item);
  const payload = (props ?? []) as ItemPropertyPayload[];
  if (damageReduction === 0) {
    damageReduction = deriveDamageReductionFromProperties(payload);
  }
  if (criticalRangeIncrease === 0) {
    criticalRangeIncrease = deriveCriticalRangeIncreaseFromProperties(payload);
  }

  return { damageReduction, criticalRangeIncrease };
}

export interface EquippedArmorQuickRef {
  damageReduction: number;
  /** Stacked Critical Range +1 from equipped armor (0 when armor does not modify crit). */
  criticalRangeIncrease: number;
  /** Evasion + over-target + increase. Only show in the header when increase > 0. */
  criticalRange: number;
}

/** Aggregated DR and effective Critical Range threshold for equipped armor (null if none equipped). */
export function getEquippedArmorQuickRef(
  armor: Item[] | undefined,
  evasion: number,
  rules?: Partial<CoreRulesMap>,
): EquippedArmorQuickRef | null {
  const equipped = (armor ?? []).filter((a) => a?.equipped);
  if (equipped.length === 0) return null;

  let damageReduction = 0;
  let criticalRangeIncrease = 0;
  for (const piece of equipped) {
    const stats = deriveArmorItemCombatStats(piece as ItemWithLibrarySource);
    damageReduction += stats.damageReduction;
    criticalRangeIncrease += stats.criticalRangeIncrease;
  }

  return {
    damageReduction,
    criticalRangeIncrease,
    criticalRange: calculateCriticalRange(evasion, criticalRangeIncrease, rules),
  };
}

export function getWeaponAttackBonus(
  weapon: Item,
  abilities?: Abilities,
  martialProficiency?: number,
): { bonus: number; abilityName: string } {
  const props = resolveItemProperties(weapon) ?? weapon.properties ?? [];
  const { bonus, abilityName } = getWeaponAttackBonusFromProperties(
    props as {
      id?: number | undefined;
      name?: string | undefined;
      op_1_lvl?: number | undefined;
    }[],
    abilities,
    martialProficiency,
  );
  return { bonus, abilityName };
}

/**
 * Character sheet / play-list part & property chips.
 * Always expandable (description / TP / options) — not guided-creator descriptor + InfoTippy.
 * Cost label is dense `TP` (`TP: N` in ExpandableChip), not spelled-out Training Points.
 */
export function partDataToChips(parts: PartData[]) {
  return parts.map((p) => {
    const hasCost = (p.tpCost ?? 0) > 0;
    return {
      name: p.name,
      description: chipDescriptionWithOptionLevels(p.description, p.optionLevels),
      cost: p.tpCost,
      costLabel: TP_COST_LABEL,
      category: hasCost ? ('cost' as const) : ('default' as const),
      level: p.optionLevels
        ? Math.max(p.optionLevels.opt1 ?? 0, p.optionLevels.opt2 ?? 0, p.optionLevels.opt3 ?? 0) ||
          undefined
        : undefined,
      options: p.options,
      kind: 'expandable' as const,
    };
  });
}
