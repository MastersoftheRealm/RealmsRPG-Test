/**
 * Shared compact-fact grammar (TASK-454).
 *
 * When a labeled GridListRow column is unavailable, format the same fact as a
 * self-describing descriptor chip — natural language, not "Header: value".
 * Dense browse lists should keep real columns; do not chip-ify comparison tables.
 *
 * @see AGENT_GUIDE.md — GridListRow fact policy / column-vs-chip
 * @see GAME_RULES.md — Terminology & Definitions (capitalize rules terms)
 */

import type { ChipData } from '@/components/patterns/list/grid-list-row-types';
import { descriptorChipData } from '@/lib/chip/chip-data-helpers';
import {
  resolveWeaponRangeDisplay,
  trainingPointsForItemPropertyRef,
  type ItemPropertyPayload,
  type ItemPropertyTpRow,
} from '@/lib/calculators/item-calc';
import {
  getWeaponAttackAbility,
  hasReachProperty,
  hasThrownProperty,
  hasTwoHandedProperty,
  weaponAttackAbilityLabel,
  type WeaponAttackAbility,
  type WeaponPropertyRef,
} from '@/lib/game/weapon-attack-ability';
import { formatActionTypeForDisplay } from '@/lib/utils/action-type';
import { capitalize, formatDamageDisplay } from '@/lib/utils';
import { formatTargetsFact } from '@/lib/game/targeted-defenses';

/** Ability name + minimum level (weapon/armor/feat requirements). */
export interface AbilityRequirementFact {
  name: string;
  level: number;
}

/**
 * Properties that are mechanic labels — format via dedicated facts, not named property chips.
 * Also includes calculation-only bases and facts already represented by compact-fact formatters
 * (do not repeat if already represented).
 */
export const MECHANIC_PROPERTY_NAMES = new Set([
  'one-handed',
  'two-handed',
  'thrown',
  'reach',
  'ranged',
  'melee',
  'finesse',
  'heavy',
  // Dedicated compact-fact formatters / column facts
  'weapon damage',
  'damage reduction',
  'agility reduction',
  'range',
  'split damage dice',
  // Ranked armor Crit + fact (column or compact chip — never a named property chip)
  'critical range +1',
  'critical range increase',
  // Calculation-only — never user-facing on cards/chips
  'armor base',
  'shield base',
]);

/** True when a compact-fact value should not become a chip (empty, dash, none). */
export function isBlank(value: string | number | null | undefined): boolean {
  if (value == null) return true;
  const text = String(value).trim();
  return !text || text === '-' || text === '—' || text.toLowerCase() === 'none';
}

/** Capitalize Spaces / Space as game terms without title-casing ordinary prose. */
export function capitalizeSpacesTerm(text: string): string {
  return String(text)
    .trim()
    .replace(/\bspaces\b/gi, 'Spaces')
    .replace(/\bspace\b/gi, 'Space');
}

/**
 * Abilityname Requirement X+ — never "Ability Requirement …", never "Weapon/Armor …".
 * Example: "Strength Requirement 3+"
 */
export function formatAbilityRequirementFact(
  req: AbilityRequirementFact | null | undefined,
): string | undefined {
  if (!req?.name?.trim() || req.level == null || Number.isNaN(Number(req.level))) {
    return undefined;
  }
  const level = Math.floor(Number(req.level));
  if (level <= 0) return undefined;
  // Strip accidental "Ability Requirement" / "Weapon" / "Armor" prefixes from raw names
  let ability = req.name
    .trim()
    .replace(/\s+requirement\s*$/i, '')
    .trim();
  ability = ability.replace(/^(ability|weapon|armor)\s+/i, '').trim();
  if (!ability) return undefined;
  return `${capitalize(ability)} Requirement ${level}+`;
}

export type HandednessLabel = 'Two-handed' | 'One-handed' | 'Thrown' | 'Ranged';

/** Bare handedness — "Two-handed", never "Handedness: Two-handed". */
export function formatHandednessFact(
  properties: WeaponPropertyRef[] | undefined,
  storedRange?: string | number | null,
): HandednessLabel {
  if (hasTwoHandedProperty(properties)) return 'Two-handed';
  if (hasThrownProperty(properties)) return 'Thrown';
  if (hasReachProperty(properties)) return 'One-handed';
  const range = resolveWeaponRangeDisplay(storedRange, (properties ?? []) as ItemPropertyPayload[]);
  if (range.toLowerCase() !== 'melee') return 'Ranged';
  return 'One-handed';
}

/**
 * XdY Type Damage — e.g. "2d6 Slashing Damage".
 * Accepts a preformatted damage line or a raw damage object/array.
 * "Damage" is a game term (GAME_RULES); do not also chip the Weapon Damage property.
 */
export function formatDamageFact(damage: unknown): string | undefined {
  if (damage == null) return undefined;
  let line: string;
  if (typeof damage === 'string') {
    const trimmed = damage.trim();
    if (!trimmed) return undefined;
    // Strip trailing "damage" before capitalizing the type, then re-append capitalized.
    const withoutSuffix = trimmed.replace(/\s+damage\s*$/i, '').trim();
    line = formatDamageDisplay(withoutSuffix || trimmed).trim() || withoutSuffix || trimmed;
  } else {
    line = formatDamageDisplay(damage).trim();
  }
  if (!line) return undefined;
  line = line.replace(/\s+damage\s*$/i, '').trim();
  if (!line) return undefined;
  return `${line} Damage`;
}

/** Strength Weapon / Agility Weapon / Acuity Weapon. */
export function formatWeaponAbilityFact(
  ability: WeaponAttackAbility | null | undefined,
): string | undefined {
  if (!ability) return undefined;
  return `${weaponAttackAbilityLabel(ability)} Weapon`;
}

export function formatWeaponAbilityFactFromProperties(
  properties: WeaponPropertyRef[] | undefined,
  rangeOverride?: string | null,
): string {
  return formatWeaponAbilityFact(getWeaponAttackAbility(properties, rangeOverride))!;
}

/**
 * Range chip — omit Melee (handedness / weapon type already imply it).
 * Example: "Range 16 Spaces"
 */
export function formatRangeFact(range: string | number | null | undefined): string | undefined {
  if (isBlank(range)) return undefined;
  const raw = capitalizeSpacesTerm(String(range));
  if (raw.toLowerCase() === 'melee') return undefined;
  if (/^range\b/i.test(raw)) return raw.replace(/^range\b/i, 'Range');
  return `Range ${raw}`;
}

/** Standalone Spaces value — e.g. "3 Spaces". */
export function formatSpacesFact(spaces: string | number | null | undefined): string | undefined {
  if (isBlank(spaces)) return undefined;
  const raw = String(spaces).trim();
  if (/^\d+$/.test(raw)) {
    const n = Number(raw);
    return `${n} ${n === 1 ? 'Space' : 'Spaces'}`;
  }
  return capitalizeSpacesTerm(raw);
}

/**
 * Capitalized Action Type **value** only (Quick Action, Basic Reaction, Long (3 AP), …).
 * Use for desc chips and GridListRow **cells** when the column header already says Action Type.
 * Prefer {@link formatActionTypeFact} only when a self-describing labeled string is required
 * (metadata chip with no Action Type column).
 */
export function formatActionTypeValue(actionType: string | null | undefined): string | undefined {
  if (isBlank(actionType)) return undefined;
  let formatted = formatActionTypeForDisplay(String(actionType));
  if (!formatted || formatted === '-') return undefined;
  // Ensure Action / Reaction / Basic / Quick / Free stay Title Case (game terms)
  formatted = formatted
    .replace(/\bbasic\b/gi, 'Basic')
    .replace(/\bquick\b/gi, 'Quick')
    .replace(/\bfree\b/gi, 'Free')
    .replace(/\baction\b/gi, 'Action')
    .replace(/\breaction\b/gi, 'Reaction');
  if (/^action type\b/i.test(formatted)) {
    formatted = formatted.replace(/^action type\s+/i, '').trim();
  }
  return formatted || undefined;
}

/**
 * Labeled Action Type fact for contexts without a column header
 * (e.g. metadata chips when Action Type is omitted from GridListRow columns).
 * Chip / disclosure label: prefer {@link actionTypeFactChip} / {@link formatActionTypeValue}.
 */
export function formatActionTypeFact(actionType: string | null | undefined): string | undefined {
  const value = formatActionTypeValue(actionType);
  if (!value) return undefined;
  return `Action Type ${value}`;
}

/** Currency N — full word for L1/L2 (GAME_RULES). */
export function formatCurrencyFact(cost: number | null | undefined): string | undefined {
  if (cost == null || Number.isNaN(Number(cost))) return undefined;
  const n = Math.max(0, Math.floor(Number(cost)));
  return `Currency ${n}`;
}

/** Training Points — full word for guided L1/L2 (GAME_RULES). */
export const TRAINING_POINTS_COST_LABEL = 'Training Points';

/**
 * Dense sheet / play / L3 column + expandable chip cost label.
 * Character sheet and other non-creator surfaces prefer `TP: N` over spelling out
 * Training Points (full term remains for guided creator L1/L2).
 */
export const TP_COST_LABEL = 'TP';

/** Training Points N — full word for L1/L2 (GAME_RULES). */
export function formatTrainingPointsFact(points: number | null | undefined): string | undefined {
  if (points == null || Number.isNaN(Number(points))) return undefined;
  const n = Math.max(0, Math.floor(Number(points)));
  return `Training Points ${n}`;
}

/**
 * Armor Agility Reduction — e.g. "Agility Reduction -1".
 * Accepts signed penalty or positive reduction amount from catalog fields.
 */
export function formatAgilityReductionFact(value: number | null | undefined): string | undefined {
  if (value == null || Number.isNaN(Number(value))) return undefined;
  const n = Math.floor(Number(value));
  if (n === 0) return undefined;
  const amount = Math.abs(n);
  return `Agility Reduction -${amount}`;
}

export function agilityReductionFactChip(value: number | null | undefined): ChipData | null {
  return compactFactChip(formatAgilityReductionFact(value));
}

/** Damage Reduction N — self-describing chip for armor. */
export function formatDamageReductionFact(value: number | null | undefined): string | undefined {
  if (value == null || Number.isNaN(Number(value))) return undefined;
  const n = Math.floor(Number(value));
  return `Damage Reduction ${n}`;
}

export function damageReductionFactChip(value: number | null | undefined): ChipData | null {
  return compactFactChip(formatDamageReductionFact(value));
}

/** Critical Range +N — self-describing chip when Crit is not a column. */
export function formatCriticalRangeIncreaseFact(
  value: number | null | undefined,
): string | undefined {
  if (value == null || Number.isNaN(Number(value))) return undefined;
  const n = Math.floor(Number(value));
  if (n <= 0) return undefined;
  return `Critical Range +${n}`;
}

export function criticalRangeIncreaseFactChip(value: number | null | undefined): ChipData | null {
  return compactFactChip(formatCriticalRangeIncreaseFact(value));
}

/** Descriptor chip from a compact-fact label (never expands). */
export function compactFactChip(label: string | undefined | null): ChipData | null {
  if (!label?.trim()) return null;
  return descriptorChipData(label.trim(), 'default');
}

export function abilityRequirementChip(
  req: AbilityRequirementFact | null | undefined,
): ChipData | null {
  return compactFactChip(formatAbilityRequirementFact(req));
}

export function handednessChip(
  properties: WeaponPropertyRef[] | undefined,
  storedRange?: string | number | null,
): ChipData {
  return descriptorChipData(formatHandednessFact(properties, storedRange), 'default');
}

export function damageFactChip(damage: unknown): ChipData | null {
  return compactFactChip(formatDamageFact(damage));
}

export function weaponAbilityChip(
  properties: WeaponPropertyRef[] | undefined,
  rangeOverride?: string | null,
): ChipData {
  return descriptorChipData(
    formatWeaponAbilityFactFromProperties(properties, rangeOverride),
    'default',
  );
}

export function rangeFactChip(range: string | number | null | undefined): ChipData | null {
  return compactFactChip(formatRangeFact(range));
}

export function spacesFactChip(spaces: string | number | null | undefined): ChipData | null {
  return compactFactChip(formatSpacesFact(spaces));
}

/**
 * Desc-chip for Action Type — value only (“Quick Action”), not “Action Type Quick Action”.
 * Column headers / ListHeader keep the “Action Type” label separately.
 */
export function actionTypeFactChip(actionType: string | null | undefined): ChipData | null {
  return compactFactChip(formatActionTypeValue(actionType));
}

export function targetsFactChip(targetedDefenses: string[] | null | undefined): ChipData | null {
  return compactFactChip(formatTargetsFact(targetedDefenses));
}

/**
 * Desc-chip for power/technique Category — value only ("Offense", "Offense, Damage"),
 * not "Category Offense". Column headers keep "Category" separately.
 */
export function categoryFactChip(category: string | null | undefined): ChipData | null {
  if (isBlank(category)) return null;
  let text = String(category).trim();
  if (/^category\b/i.test(text)) {
    text = text.replace(/^category\s+/i, '').trim();
  }
  if (!text) return null;
  return compactFactChip(text);
}

/** Energy N — compact fact for power/technique cards and catalogs. */
export function formatEnergyFact(energy: number | null | undefined): string | undefined {
  if (energy == null || Number.isNaN(Number(energy))) return undefined;
  const n = Math.max(0, Math.floor(Number(energy)));
  return `Energy ${n}`;
}

export function energyFactChip(energy: number | null | undefined): ChipData | null {
  return compactFactChip(formatEnergyFact(energy));
}

export function currencyFactChip(cost: number | null | undefined): ChipData | null {
  return compactFactChip(formatCurrencyFact(cost));
}

export function trainingPointsFactChip(points: number | null | undefined): ChipData | null {
  return compactFactChip(formatTrainingPointsFact(points));
}

export function isMechanicPropertyName(name: string): boolean {
  const n = name.trim().toLowerCase();
  if (!n) return true;
  if (n.includes('requirement')) return true;
  return MECHANIC_PROPERTY_NAMES.has(n);
}

/**
 * Non-mechanic named properties as non-expanding descriptor chips.
 * Keep `description` for InfoTippy (do not expand the chip).
 * L1/choice cards: name only (no Training Points on the chip — budgets live in titleMeta).
 * Pass `includeCost: true` for dense browse rows that still show property TP on the chip.
 */
export function propertyDescriptorChip(
  name: string,
  description?: string | null,
  opts?: {
    cost?: number | undefined;
    costLabel?: string | undefined;
    includeCost?: boolean | undefined;
  },
): ChipData {
  const tip = description?.trim() || undefined;
  const includeCost = opts?.includeCost === true;
  const cost = includeCost && opts?.cost != null && opts.cost > 0 ? opts.cost : undefined;
  const chip: ChipData = {
    ...descriptorChipData(name.trim(), cost ? 'cost' : 'default'),
    description: tip,
    cost,
    costLabel: cost ? (opts?.costLabel ?? TRAINING_POINTS_COST_LABEL) : undefined,
  };
  return chip;
}

/**
 * Named item properties for cards / compact surfaces: Graze, Cleave, …
 * Excludes mechanic labels and facts already represented by compact-fact formatters
 * (Weapon Damage, Damage Reduction, Armor Base, Range, …).
 * Descriptions stay on the chip for InfoTippy — chips never expand.
 * Default: property **name only** (no Training Points cost on the chip).
 */
export function namedPropertyDescriptorChips(
  properties:
    | Array<
        | string
        | { name?: string | undefined; id?: unknown | undefined; op_1_lvl?: number | undefined }
      >
    | undefined,
  itemProperties: ItemPropertyTpRow[] = [],
  opts?: { includeCost?: boolean | undefined },
): ChipData[] {
  if (!properties?.length) return [];
  const includeCost = opts?.includeCost === true;
  return properties
    .map((prop) => {
      const propName = typeof prop === 'string' ? prop : String(prop?.name ?? '');
      if (!propName.trim() || isMechanicPropertyName(propName)) return null;
      const dbProp = itemProperties.find(
        (p) => String(p.name ?? '').toLowerCase() === propName.toLowerCase(),
      );
      const displayName = dbProp?.name || propName;
      if (isMechanicPropertyName(displayName)) return null;
      const tp = includeCost ? trainingPointsForItemPropertyRef(prop, itemProperties) : 0;
      return propertyDescriptorChip(displayName, dbProp?.description, {
        cost: tp > 0 ? tp : undefined,
        costLabel: TRAINING_POINTS_COST_LABEL,
        includeCost,
      });
    })
    .filter((c): c is ChipData => Boolean(c));
}
