/**
 * Layer 1 card stats for guided equipment.
 * Visible chips: named item properties + Currency; mechanic facts live under More details.
 */

import { formatDamageDisplay } from '@/lib/utils';
import { formatRange, type ItemPropertyPayload, type ItemPropertyTpRow } from '@/lib/calculators/item-calc';
import {
  getWeaponAttackAbility,
  hasThrownProperty,
  hasTwoHandedProperty,
  weaponAttackAbilityLabel,
  type WeaponPropertyRef,
} from '@/lib/game/weapon-attack-ability';
import {
  deriveAbilityRequirementFromProperties,
  type AbilityRequirement,
} from '@/lib/guided-creator/equipment-eligibility';
import type { LoadoutItemCategory } from '@/lib/guided-creator/resolve-loadout-items';
import type { ChipData } from '@/components/shared/grid-list-row-types';
import { factChip, propertyChipsFromRefs } from '@/lib/detail-option/builders';

/** Properties that are pure mechanic labels — keep under More details, not card chips. */
const MECHANIC_PROPERTY_NAMES = new Set([
  'one-handed',
  'two-handed',
  'thrown',
  'ranged',
  'melee',
]);

function normalizePropName(ref: WeaponPropertyRef): string {
  if (typeof ref === 'string') return ref.trim().toLowerCase();
  return String(ref.name ?? '').trim().toLowerCase();
}

function handednessLabel(properties: WeaponPropertyRef[] | undefined): string {
  if (hasTwoHandedProperty(properties)) return 'Two-handed';
  if (hasThrownProperty(properties)) return 'Thrown';
  const range = formatRange((properties ?? []) as ItemPropertyPayload[]);
  if (range.toLowerCase() !== 'melee') return 'Ranged';
  return 'One-handed';
}

function rangeLabel(properties: WeaponPropertyRef[] | undefined): string | undefined {
  const range = formatRange((properties ?? []) as ItemPropertyPayload[]);
  if (range.toLowerCase() === 'melee') return undefined;
  return range;
}

function abilityReqChip(req: AbilityRequirement | undefined | null): ChipData | null {
  if (!req) return null;
  return factChip(`${req.name} ${req.level}+`);
}

function currencyChip(cost: number | null | undefined): ChipData | null {
  if (cost == null || Number.isNaN(cost)) return null;
  const n = Math.max(0, Math.floor(Number(cost)));
  return factChip(`Currency ${n}`);
}

function isMechanicPropertyName(name: string): boolean {
  const n = name.trim().toLowerCase();
  if (!n) return true;
  if (n.includes('requirement')) return true;
  return MECHANIC_PROPERTY_NAMES.has(n);
}

/** Named item properties for card desc chips (Cleave, Finesse, …). */
function namedPropertyChips(
  properties: WeaponPropertyRef[] | undefined,
  itemProperties: ItemPropertyTpRow[]
): ChipData[] {
  return propertyChipsFromRefs(properties as never, itemProperties).filter(
    (chip) => !isMechanicPropertyName(chip.name)
  );
}

export interface EquipmentPhaseCardStats {
  /** Collapsed string tags (legacy); prefer cardChips. */
  tags: string[];
  /** Visible card desc chips: named properties + Currency. */
  cardChips: ChipData[];
  /** Mechanic facts for More details (ability, handedness, damage, …). */
  detailChips: ChipData[];
  primaryLine?: string;
  secondaryLine?: string;
  /** Full fact chips (card + detail) for L2/deep-dive consumers. */
  factChips: ChipData[];
}

export interface BuildPhaseCardStatsInput {
  category: LoadoutItemCategory;
  properties?: WeaponPropertyRef[];
  damageLine?: string;
  damageReduction?: number | null;
  agilityPenalty?: number | null;
  shortUse?: string;
  unitCost?: number | null;
  abilityRequirement?: AbilityRequirement | null;
  itemProperties?: ItemPropertyTpRow[];
}

/** Build card chips + expandable fact chips for GuidedChoiceCard. */
export function buildEquipmentPhaseCardStats(input: BuildPhaseCardStatsInput): EquipmentPhaseCardStats {
  const {
    category,
    properties,
    damageLine,
    damageReduction,
    agilityPenalty,
    shortUse,
    unitCost,
    abilityRequirement,
    itemProperties = [],
  } = input;

  const factChips: ChipData[] = [];
  const cardChips: ChipData[] = [];
  const detailChips: ChipData[] = [];
  const cost = currencyChip(unitCost);
  const named = namedPropertyChips(properties, itemProperties);

  if (category === 'weapon') {
    const req =
      abilityRequirement ?? deriveAbilityRequirementFromProperties(properties);
    const reqChip = abilityReqChip(req);
    if (reqChip) detailChips.push(reqChip);

    const hand = handednessLabel(properties);
    detailChips.push(factChip(`Handedness ${hand}`));

    const range = rangeLabel(properties);
    if (range) detailChips.push(factChip(`Range ${range}`));

    if (damageLine) detailChips.push(factChip(`Damage ${damageLine}`));

    const attack = getWeaponAttackAbility(properties);
    detailChips.push(factChip(`${weaponAttackAbilityLabel(attack)} attack`));

    cardChips.push(...named);
    if (cost) cardChips.push(cost);

    factChips.push(...detailChips, ...named);
    if (cost) factChips.push(cost);

    return {
      tags: cardChips.map((c) => c.name),
      cardChips,
      detailChips,
      primaryLine: damageLine ? `Damage: ${damageLine}` : undefined,
      secondaryLine: `${weaponAttackAbilityLabel(attack)} attack`,
      factChips,
    };
  }

  if (category === 'armor') {
    if (damageReduction != null) {
      detailChips.push(factChip(`Damage Reduction ${damageReduction}`));
    }
    if (agilityPenalty != null && agilityPenalty !== 0) {
      detailChips.push(
        factChip(`Agility ${agilityPenalty > 0 ? '+' : ''}${agilityPenalty}`)
      );
    }
    cardChips.push(...named);
    if (cost) cardChips.push(cost);

    factChips.push(...detailChips, ...named);
    if (cost) factChips.push(cost);

    return {
      tags: cardChips.map((c) => c.name),
      cardChips,
      detailChips,
      primaryLine:
        damageReduction != null ? `Damage reduction ${damageReduction}` : undefined,
      factChips,
    };
  }

  if (shortUse) {
    const labeled = /^use\b/i.test(shortUse) ? shortUse : `Use ${shortUse}`;
    cardChips.push(factChip(labeled));
  }
  if (cost) {
    cardChips.push(cost);
  }
  factChips.push(...cardChips);

  return {
    tags: cardChips.map((c) => c.name),
    cardChips,
    detailChips,
    primaryLine: shortUse,
    factChips,
  };
}

/** Format library damage array for card display. */
export function formatWeaponDamageLine(
  damage: Array<{ amount?: number | string; size?: number | string; type?: string }> | undefined
): string | undefined {
  if (!damage?.length) return undefined;
  const formatted = formatDamageDisplay(damage[0]);
  return formatted || undefined;
}
