import type { PowerPart } from '@/hooks/codex-types';
import type { CharacterPower, CharacterTechnique, Item } from '@/types';
import {
  composedPowerProficiencyParts,
  plainPowerProficiencyParts,
  resolvePowerComposition,
} from '@/lib/calculators';
import { findByIdOrName } from '@/lib/id-constants';
import {
  resolveCreatureInventoryBuckets,
  creatureInventoryQuantityMultiplier,
} from '@/lib/game/creature-inventory';
import { sumRequiredProficiencyTrainingPoints } from '@/lib/proficiencies';
import type { CreatureState } from './creature-creator-types';
import type { CreatureArmament, CreaturePower, CreatureTechnique } from './transformers';

type CodexPartRef = {
  id?: string | number | undefined;
  name?: string | undefined;
};

function savedPartResolvesInCodex(
  codex: CreatureProficiencyDbContext['powerPartsDb'] | undefined,
  raw: unknown,
): boolean {
  if (!Array.isArray(codex) || codex.length === 0) return false;
  const partObj =
    typeof raw === 'string' ? { name: raw } : (raw as Record<string, unknown> | null | undefined);
  if (!partObj || typeof partObj !== 'object') return false;
  const ref: CodexPartRef = {
    id: partObj.id as string | number | undefined,
    name: partObj.name as string | undefined,
  };
  return findByIdOrName(codex, ref) != null;
}

function creaturePowerDocumentForProficiency(power: CreaturePower) {
  return {
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
}

/** Every part row listed on the creature power snapshot (including composition variants). */
function listedCreaturePowerParts(power: CreaturePower): unknown[] {
  const listed: unknown[] = [...(power.parts ?? [])];
  const composition = power.composition;
  if (!composition) return listed;
  for (const variant of composition.variants ?? []) {
    if (Array.isArray(variant.parts)) listed.push(...variant.parts);
  }
  const reverse = composition.reverse;
  if (reverse && Array.isArray(reverse.parts)) listed.push(...reverse.parts);
  return listed;
}

function proficiencyPartsAfterRebuild(power: CreaturePower, partsDb: PowerPart[]): boolean {
  const { parts } = creaturePowerForProficiency(power, partsDb);
  return Array.isArray(parts) && parts.length > 0;
}

/**
 * Live proficiency pricing when every listed part resolves, or when the row has no listed
 * parts but a document rebuild still yields proficiency parts (e.g. range steps). Otherwise
 * stored `tp` only.
 */
function powerRowUsesLiveProficiencyPricing(power: CreaturePower, partsDb: PowerPart[]): boolean {
  const listed = listedCreaturePowerParts(power);
  if (listed.length === 0) return proficiencyPartsAfterRebuild(power, partsDb);
  return listed.every((raw) => savedPartResolvesInCodex(partsDb, raw));
}

function techniqueRowUsesLiveProficiencyPricing(
  technique: CreatureTechnique,
  partsDb: CreatureProficiencyDbContext['techniquePartsDb'],
): boolean {
  const listed = technique.parts ?? [];
  if (listed.length === 0) return false;
  return listed.every((raw) => savedPartResolvesInCodex(partsDb, raw));
}

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
function sumLegacyCreatureTrainingSpent(creature: CreatureState): number {
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
  const doc = creaturePowerDocumentForProficiency(power);
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
  coveredTechniqueIds: ReadonlySet<string>,
): number {
  const powerTp = powers.reduce((sum, power) => {
    if (coveredPowerIds.has(String(power.id))) return sum;
    return sum + (typeof power.tp === 'number' && Number.isFinite(power.tp) ? power.tp : 0);
  }, 0);
  const techniqueTp = techniques.reduce((sum, technique) => {
    if (coveredTechniqueIds.has(String(technique.id))) return sum;
    return (
      sum + (typeof technique.tp === 'number' && Number.isFinite(technique.tp) ? technique.tp : 0)
    );
  }, 0);
  return powerTp + techniqueTp;
}

/** Hidden Powers, Techniques, and Inventory stay saved but do not spend TP or Currency. */
export function creatureLoadoutForBudget(creature: CreatureState): CreatureState {
  return {
    ...creature,
    powers: creature.enablePowers ? creature.powers : [],
    techniques: creature.enableTechniques ? creature.techniques : [],
    weapons: creature.enableArmaments ? creature.weapons : [],
    armor: creature.enableArmaments ? creature.armor : [],
    shields: creature.enableArmaments ? creature.shields : [],
    equipment: creature.enableArmaments ? creature.equipment : [],
  };
}

export function computeCreatureTrainingSpent(
  creature: CreatureState,
  ctx?: CreatureProficiencyDbContext,
): number {
  const active = creatureLoadoutForBudget(creature);
  if (
    !ctx?.powerPartsDb?.length &&
    !ctx?.techniquePartsDb?.length &&
    !ctx?.itemPropertiesDb?.length
  ) {
    return sumLegacyCreatureTrainingSpent(active);
  }

  const buckets = resolveCreatureInventoryBuckets(active);
  const powerPartsDb = (ctx.powerPartsDb ?? []) as PowerPart[];
  const techniquePartsDb = ctx.techniquePartsDb ?? [];
  const livePowers = active.powers.filter((power) =>
    powerRowUsesLiveProficiencyPricing(power, powerPartsDb),
  );
  const liveTechniques = active.techniques.filter((technique) =>
    techniqueRowUsesLiveProficiencyPricing(technique, techniquePartsDb),
  );
  const powers = livePowers.map((power) => creaturePowerForProficiency(power, powerPartsDb));
  const coveredPowerIds = new Set(livePowers.map((power) => String(power.id)));
  const coveredTechniqueIds = new Set(liveTechniques.map((technique) => String(technique.id)));
  const deduped = sumRequiredProficiencyTrainingPoints({
    powers,
    techniques: liveTechniques as CharacterTechnique[],
    weapons: buckets.weapons.map(armamentToItem),
    shields: buckets.shields.map(armamentToItem),
    armor: buckets.armor.map(armamentToItem),
    powerPartsDb: ctx.powerPartsDb ?? [],
    techniquePartsDb: ctx.techniquePartsDb ?? [],
    itemPropertiesDb: ctx.itemPropertiesDb ?? [],
  });

  return (
    deduped +
    storedTpWithoutParts(active.powers, active.techniques, coveredPowerIds, coveredTechniqueIds) +
    sumStoredArmamentTp(buckets.equipment) +
    storedTpWithoutResolvableParts([...buckets.weapons, ...buckets.armor, ...buckets.shields])
  );
}
