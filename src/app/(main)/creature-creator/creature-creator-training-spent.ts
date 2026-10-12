import type { PowerPart } from '@/hooks/codex-types';
import type { CharacterPower, CharacterTechnique, Item } from '@/types';
import {
  composedPowerProficiencyParts,
  plainPowerProficiencyParts,
  resolvePowerComposition,
} from '@/lib/calculators';
import {
  resolveCreatureInventoryBuckets,
  creatureInventoryQuantityMultiplier,
} from '@/lib/game/creature-inventory';
import { sumRequiredProficiencyTrainingPoints } from '@/lib/proficiencies';
import type { CreatureState } from './creature-creator-types';
import type { CreatureArmament, CreaturePower } from './transformers';

export type CreatureProficiencyDbContext = {
  powerPartsDb?: Array<{
    id?: string | number | undefined;
    name?: string | undefined;
    base_tp?: number | undefined;
    op_1_tp?: number | undefined;
    op_2_tp?: number | undefined;
    op_3_tp?: number | undefined;
  }>;
  techniquePartsDb?: Array<{
    id?: string | number | undefined;
    name?: string | undefined;
    base_tp?: number | undefined;
    op_1_tp?: number | undefined;
    op_2_tp?: number | undefined;
    op_3_tp?: number | undefined;
  }>;
  itemPropertiesDb?: Array<{
    id?: string | number | undefined;
    name?: string | undefined;
    base_tp?: number | undefined;
    op_1_tp?: number | undefined;
  }>;
};

function armamentToItem(armament: CreatureArmament): Item {
  return {
    id: armament.id,
    name: armament.name,
    properties: (armament.properties ?? []) as Item['properties'],
    damage: armament.damage as Item['damage'],
  };
}

function sumStoredArmamentTp(armaments: CreatureArmament[]): number {
  return armaments.reduce(
    (sum, armament) =>
      sum +
      (typeof armament.tp === 'number' && Number.isFinite(armament.tp) ? armament.tp : 0) *
        creatureInventoryQuantityMultiplier(armament.quantity),
    0,
  );
}

/** Sum per-row TP when parts/properties are not available (legacy saves / custom rows). */
export function sumLegacyCreatureTrainingSpent(creature: CreatureState): number {
  const inventory = collectCreatureInventoryArmaments(creature);
  const powerTp = creature.powers.reduce(
    (sum, power) =>
      sum + (typeof power.tp === 'number' && Number.isFinite(power.tp) ? power.tp : 0),
    0,
  );
  const techniqueTp = creature.techniques.reduce(
    (sum, technique) =>
      sum + (typeof technique.tp === 'number' && Number.isFinite(technique.tp) ? technique.tp : 0),
    0,
  );
  return powerTp + techniqueTp + sumStoredArmamentTp(inventory);
}

function collectCreatureInventoryArmaments(creature: CreatureState): CreatureArmament[] {
  const buckets = resolveCreatureInventoryBuckets(creature);
  return [...buckets.weapons, ...buckets.armor, ...buckets.shields, ...buckets.equipment];
}

function storedTpWithoutResolvableParts(armaments: CreatureArmament[]): number {
  return armaments.reduce((sum, armament) => {
    const hasProperties = Array.isArray(armament.properties) && armament.properties.length > 0;
    if (hasProperties) return sum;
    const tp = typeof armament.tp === 'number' && Number.isFinite(armament.tp) ? armament.tp : 0;
    return sum + tp * creatureInventoryQuantityMultiplier(armament.quantity);
  }, 0);
}

function creaturePowerForProficiency(power: CreaturePower, partsDb: PowerPart[]): CharacterPower {
  const doc = {
    name: power.name,
    parts: power.parts ?? [],
    actionType: power.actionType,
    isReaction: power.isReaction,
    range: power.rangeValue,
    area: power.areaValue,
    duration: power.durationValue,
    damage: power.damageValue,
    ...(power.composition ? { composition: power.composition } : {}),
  };
  const composition = power.composition ? resolvePowerComposition(doc, partsDb) : null;
  const parts = composition
    ? composedPowerProficiencyParts(composition, partsDb)
    : plainPowerProficiencyParts(doc, partsDb);
  return {
    id: power.id,
    name: power.name,
    parts,
    damage: power.damageValue as CharacterPower['damage'],
  };
}

function storedTpWithoutParts(
  powers: CreatureState['powers'],
  techniques: CreatureState['techniques'],
  coveredPowerIds: ReadonlySet<string>,
): number {
  const powerTp = powers.reduce((sum, power) => {
    if (coveredPowerIds.has(String(power.id))) return sum;
    if (Array.isArray(power.parts) && power.parts.length > 0) return sum;
    return sum + (typeof power.tp === 'number' && Number.isFinite(power.tp) ? power.tp : 0);
  }, 0);
  const techniqueTp = techniques.reduce((sum, technique) => {
    const parts = (technique as { parts?: unknown[] }).parts;
    if (Array.isArray(parts) && parts.length > 0) return sum;
    return (
      sum + (typeof technique.tp === 'number' && Number.isFinite(technique.tp) ? technique.tp : 0)
    );
  }, 0);
  return powerTp + techniqueTp;
}

export function computeCreatureTrainingSpent(
  creature: CreatureState,
  ctx?: CreatureProficiencyDbContext,
): number {
  if (
    !ctx?.powerPartsDb?.length &&
    !ctx?.techniquePartsDb?.length &&
    !ctx?.itemPropertiesDb?.length
  ) {
    return sumLegacyCreatureTrainingSpent(creature);
  }

  const buckets = resolveCreatureInventoryBuckets(creature);
  const powerPartsDb = (ctx.powerPartsDb ?? []) as PowerPart[];
  const powers = creature.powers.map((power) => creaturePowerForProficiency(power, powerPartsDb));
  const coveredPowerIds = new Set(
    powers
      .filter((power) => Array.isArray(power.parts) && power.parts.length > 0)
      .map((power) => String(power.id)),
  );
  const deduped = sumRequiredProficiencyTrainingPoints({
    powers,
    techniques: creature.techniques as CharacterTechnique[],
    weapons: buckets.weapons.map(armamentToItem),
    shields: buckets.shields.map(armamentToItem),
    armor: buckets.armor.map(armamentToItem),
    powerPartsDb: ctx.powerPartsDb ?? [],
    techniquePartsDb: ctx.techniquePartsDb ?? [],
    itemPropertiesDb: ctx.itemPropertiesDb ?? [],
  });

  return (
    deduped +
    storedTpWithoutParts(creature.powers, creature.techniques, coveredPowerIds) +
    sumStoredArmamentTp(buckets.equipment) +
    storedTpWithoutResolvableParts([...buckets.weapons, ...buckets.armor, ...buckets.shields])
  );
}
