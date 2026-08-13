/**
 * Layer 1 card stats for guided equipment (TASK-457).
 * Title-adjacent: Currency + Training Points.
 * See more: mechanic facts + named property descriptors (TASK-454 grammar).
 * Collapsed body: no expandable chips.
 */

import {
  abilityRequirementChip,
  agilityReductionFactChip,
  currencyFactChip,
  damageFactChip,
  damageReductionFactChip,
  formatAgilityReductionFact,
  formatDamageFact,
  formatDamageReductionFact,
  formatWeaponAbilityFactFromProperties,
  handednessChip,
  namedPropertyDescriptorChips,
  rangeFactChip,
  trainingPointsFactChip,
  weaponAbilityChip,
} from '@/lib/detail-option/compact-facts';
import { formatDamageDisplay } from '@/lib/utils';
import {
  resolveWeaponRangeDisplay,
  type ItemPropertyPayload,
  type ItemPropertyTpRow,
} from '@/lib/calculators/item-calc';
import {
  deriveAbilityRequirementFromProperties,
  type AbilityRequirement,
  type WeaponPropertyRef,
} from '@/lib/game/weapon-attack-ability';
import type { LoadoutItemCategory } from '@/lib/guided-creator/resolve-loadout-items';
import type { ChipData } from '@/components/shared/grid-list-row-types';

export interface EquipmentPhaseCardStats {
  /** Collapsed string tags (legacy); prefer titleChips / detailChips. */
  tags: string[];
  /**
   * Title-adjacent budget descriptors (Currency, Training Points).
   * Always visible; never under the disclosure row.
   */
  titleChips: ChipData[];
  /**
   * Named property descriptors (Graze, Cleave, …) — for L2 expand sections
   * and See more (also included in detailChips for weapon/armor).
   */
  cardChips: ChipData[];
  /**
   * See more facts: mechanics + named properties (non-expanding chips).
   */
  detailChips: ChipData[];
  primaryLine?: string;
  secondaryLine?: string;
  /** Full fact chips (title + detail) for L2/deep-dive consumers. */
  factChips: ChipData[];
}

export interface BuildPhaseCardStatsInput {
  category: LoadoutItemCategory;
  properties?: WeaponPropertyRef[];
  damageLine?: string;
  damageReduction?: number | null;
  agilityPenalty?: number | null;
  /** @deprecated Do not chip duplicate description text; keep description on the card. */
  shortUse?: string;
  unitCost?: number | null;
  /** Armament Training Points cost. */
  trainingPoints?: number | null;
  abilityRequirement?: AbilityRequirement | null;
  itemProperties?: ItemPropertyTpRow[];
  /** Stored range (may be corrupt `0` / bare level); display SoT is resolveWeaponRangeDisplay. */
  storedRange?: string | number | null;
}

/** Build title / See more / L2 fact chips for GuidedChoiceCard. */
export function buildEquipmentPhaseCardStats(input: BuildPhaseCardStatsInput): EquipmentPhaseCardStats {
  const {
    category,
    properties,
    damageLine,
    damageReduction,
    agilityPenalty,
    unitCost,
    trainingPoints,
    abilityRequirement,
    itemProperties = [],
    storedRange,
  } = input;

  const factChips: ChipData[] = [];
  const titleChips: ChipData[] = [];
  const cardChips: ChipData[] = [];
  const detailChips: ChipData[] = [];
  const cost = currencyFactChip(unitCost);
  const tpChip = trainingPointsFactChip(trainingPoints);
  const named = namedPropertyDescriptorChips(properties as never, itemProperties);

  const pushBudgetChips = (target: ChipData[]) => {
    if (cost) target.push(cost);
    if (tpChip) target.push(tpChip);
  };

  if (category === 'weapon') {
    const req =
      abilityRequirement ?? deriveAbilityRequirementFromProperties(properties);
    const reqChip = abilityRequirementChip(req);
    if (reqChip) detailChips.push(reqChip);

    detailChips.push(handednessChip(properties, storedRange));

    const range = resolveWeaponRangeDisplay(
      storedRange,
      (properties ?? []) as ItemPropertyPayload[]
    );
    const rangeChip = rangeFactChip(range);
    if (rangeChip) detailChips.push(rangeChip);

    const dmgChip = damageFactChip(damageLine);
    if (dmgChip) detailChips.push(dmgChip);

    const rangeOverride =
      storedRange == null ? undefined : String(storedRange);
    detailChips.push(weaponAbilityChip(properties, rangeOverride));
    detailChips.push(...named);

    cardChips.push(...named);
    pushBudgetChips(titleChips);

    factChips.push(...detailChips);
    pushBudgetChips(factChips);

    return {
      tags: titleChips.map((c) => c.name),
      titleChips,
      cardChips,
      detailChips,
      primaryLine: formatDamageFact(damageLine),
      secondaryLine: formatWeaponAbilityFactFromProperties(properties, rangeOverride),
      factChips,
    };
  }

  if (category === 'armor') {
    const req =
      abilityRequirement ?? deriveAbilityRequirementFromProperties(properties);
    const reqChip = abilityRequirementChip(req);
    if (reqChip) detailChips.push(reqChip);

    const drChip = damageReductionFactChip(damageReduction);
    if (drChip) detailChips.push(drChip);
    const agilityChip = agilityReductionFactChip(agilityPenalty);
    if (agilityChip) detailChips.push(agilityChip);

    detailChips.push(...named);
    cardChips.push(...named);
    pushBudgetChips(titleChips);

    factChips.push(...detailChips);
    pushBudgetChips(factChips);

    return {
      tags: titleChips.map((c) => c.name),
      titleChips,
      cardChips,
      detailChips,
      primaryLine: formatDamageReductionFact(damageReduction),
      secondaryLine: formatAgilityReductionFact(agilityPenalty),
      factChips,
    };
  }

  // Equipment (gear): description stays on the card — do not duplicate as a Use chip.
  pushBudgetChips(titleChips);
  pushBudgetChips(factChips);

  return {
    tags: titleChips.map((c) => c.name),
    titleChips,
    cardChips,
    detailChips,
    factChips,
  };
}

/** Format library damage array for labeled column values (bare XdY Type; chips add "Damage"). */
export function formatWeaponDamageLine(
  damage: Array<{ amount?: number | string; size?: number | string; type?: string }> | undefined
): string | undefined {
  if (!damage?.length) return undefined;
  const formatted = formatDamageDisplay(damage[0]);
  return formatted || undefined;
}
