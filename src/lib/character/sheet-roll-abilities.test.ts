import { describe, expect, it } from 'vitest';
import { getEffectiveAbilities } from '@/lib/character/temp-modifiers';
import { calculateBonuses } from '@/lib/game/calculations';
import { getWeaponAttackBonusFromProperties } from '@/lib/game/weapon-attack-ability';
import type { Abilities } from '@/types';

const baseAbilities: Abilities = {
  strength: 2,
  vitality: 0,
  agility: 0,
  acuity: 0,
  intelligence: 0,
  charisma: 0,
};

describe('sheet attack rolls use effective abilities (ADR-0006)', () => {
  it('strength temp modifiers increase martial attack and default weapon attack bonuses', () => {
    const martialProf = 3;
    const effective = getEffectiveAbilities(baseAbilities, {
      abilities: { strength: 2 },
    });

    const bonuses = calculateBonuses(martialProf, 0, effective);
    expect(bonuses.strength.prof).toBe(7);

    const weapon = getWeaponAttackBonusFromProperties([], effective, martialProf);
    expect(weapon.bonus).toBe(7);
  });
});
