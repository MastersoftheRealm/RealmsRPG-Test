import type { PowerPart, TechniquePart } from '@/hooks';
import {
  buildRequiredProficiencies,
  calculateProficiencyTP,
  dedupeHighestProficiencies,
  getTrainingPointLimit,
} from '@/lib/proficiencies';
import type { CharacterPower, CharacterTechnique, Item } from '@/types';

export function computePowersStepProficiencyTp(
  draft: {
    equipment?: { inventory?: Item[] | undefined } | null | undefined;
    powers?: CharacterPower[] | null | undefined;
    techniques?: CharacterTechnique[] | null | undefined;
    abilities?: object | null | undefined;
    pow_abil?: string | undefined;
    mart_abil?: string | undefined;
    level?: number | undefined;
  },
  powerParts: PowerPart[] | undefined | null,
  techniqueParts: TechniquePart[] | undefined | null,
  itemPropertiesDb: unknown[],
): { spent: number; limit: number; remaining: number } {
  const inventory = draft.equipment?.inventory || [];
  const weapons = inventory.filter((item) => item.type === 'weapon');
  const shields = inventory.filter((item) => item.type === 'shield');
  const armor = inventory.filter((item) => item.type === 'armor');
  const required = buildRequiredProficiencies({
    powers: (draft.powers || []) as CharacterPower[],
    techniques: (draft.techniques || []) as CharacterTechnique[],
    weapons: weapons as Item[],
    shields: shields as Item[],
    armor: armor as Item[],
    powerPartsDb: (powerParts ?? []) as PowerPart[],
    techniquePartsDb: (techniqueParts ?? []) as TechniquePart[],
    itemPropertiesDb: itemPropertiesDb as never,
  });
  const spent = dedupeHighestProficiencies(required).reduce(
    (sum, p) => sum + calculateProficiencyTP(p),
    0,
  );
  const abilities = (draft.abilities || {}) as Record<string, unknown>;
  const getAbility = (key: string | undefined): number =>
    key ? Number(abilities[key] ?? 0) || 0 : 0;
  const highestAbility = Math.max(
    ...Object.values(abilities).filter((v): v is number => typeof v === 'number'),
    0,
  );
  const archetypeAbility = Math.max(
    getAbility(draft.pow_abil),
    getAbility(draft.mart_abil),
    highestAbility,
  );
  const limit = getTrainingPointLimit(draft.level || 1, archetypeAbility);
  return { spent, limit, remaining: limit - spent };
}
