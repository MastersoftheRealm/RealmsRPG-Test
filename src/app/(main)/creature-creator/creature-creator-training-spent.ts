import type { CharacterPower, CharacterTechnique, Item } from '@/types';
import {
  resolveCreatureInventoryBuckets,
  creatureInventoryQuantityMultiplier,
} from '@/lib/game/creature-inventory';
import { sumRequiredProficiencyTrainingPoints } from '@/lib/proficiencies';
import type { CreatureState } from './creature-creator-types';
import type { CreatureArmament } from './transformers';

export type CreatureProficiencyDbContext = {
  powerPartsDb?: Array<{
    id?: string | number;
    name?: string;
    base_tp?: number;
    op_1_tp?: number;
    op_2_tp?: number;
    op_3_tp?: number;
  }>;
  techniquePartsDb?: Array<{
    id?: string | number;
    name?: string;
    base_tp?: number;
    op_1_tp?: number;
    op_2_tp?: number;
    op_3_tp?: number;
  }>;
  itemPropertiesDb?: Array<{
    id?: string | number;
    name?: string;
    base_tp?: number;
    op_1_tp?: number;
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
  const inventory = resolveCreatureInventoryBuckets(creature);
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
  return powerTp + techniqueTp + sumStoredArmamentTp(collectCreatureInventoryArmaments(inventory));
}

function collectCreatureInventoryArmaments(
  buckets: ReturnType<typeof resolveCreatureInventoryBuckets>,
): CreatureArmament[] {
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

function storedTpWithoutParts(
  powers: CreatureState['powers'],
  techniques: CreatureState['techniques'],
): number {
  const powerTp = powers.reduce((sum, power) => {
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
  const deduped = sumRequiredProficiencyTrainingPoints({
    powers: creature.powers as CharacterPower[],
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
    storedTpWithoutParts(creature.powers, creature.techniques) +
    sumStoredArmamentTp(buckets.equipment) +
    storedTpWithoutResolvableParts([...buckets.weapons, ...buckets.armor, ...buckets.shields])
  );
}
