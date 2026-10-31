import { DIE_MAX, rollDie, type DieType } from './die';
import { parseDamageRollGroups } from './parse-damage-string';

export type DamageRollDieResult = {
  type: DieType;
  value: number;
  isMax: boolean;
  isMin: boolean;
};

function dieTypeFromSides(sides: number): DieType | null {
  const dieType = `d${sides}` as DieType;
  return dieType in DIE_MAX ? dieType : null;
}

/** Roll dice from a damage label (used by RollProvider.rollDamage). */
export function rollParsedDamage(
  damageStr: string,
  bonus = 0,
): { diceResults: DamageRollDieResult[]; totalBonus: number; total: number } | null {
  if (typeof damageStr !== 'string') return null;

  const groups = parseDamageRollGroups(damageStr);
  const diceResults: DamageRollDieResult[] = [];
  let embeddedMod = 0;

  for (const group of groups) {
    embeddedMod += group.modifier;
    const dieType = dieTypeFromSides(group.size);
    if (!dieType) continue;
    const max = DIE_MAX[dieType];
    for (let i = 0; i < group.count; i++) {
      const value = rollDie(dieType);
      diceResults.push({
        type: dieType,
        value,
        isMax: value === max,
        isMin: value === 1,
      });
    }
  }

  const totalBonus = embeddedMod + bonus;
  const total = diceResults.reduce((sum, die) => sum + die.value, 0) + totalBonus;

  return { diceResults, totalBonus, total };
}
