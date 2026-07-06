import { describe, expect, it } from 'vitest';
import { PROPERTY_IDS } from '@/lib/id-constants';
import {
  getWeaponAttackAbility,
  hasThrownProperty,
  weaponMatchesArchetypeAbilities,
} from '@/lib/game/weapon-attack-ability';

describe('weapon-attack-ability', () => {
  it('uses agility for finesse', () => {
    expect(getWeaponAttackAbility([{ id: PROPERTY_IDS.FINESSE, name: 'Finesse' }])).toBe('agility');
  });

  it('uses strength for thrown even with range property', () => {
    const props = [
      { id: PROPERTY_IDS.THROWN, name: 'Thrown' },
      { id: PROPERTY_IDS.RANGE, name: 'Range', op_1_lvl: 1 },
    ];
    expect(hasThrownProperty(props)).toBe(true);
    expect(getWeaponAttackAbility(props)).toBe('strength');
  });

  it('uses acuity for ranged non-thrown', () => {
    expect(
      getWeaponAttackAbility([{ id: PROPERTY_IDS.RANGE, name: 'Range', op_1_lvl: 1 }])
    ).toBe('acuity');
  });

  it('defaults to strength for melee', () => {
    expect(getWeaponAttackAbility([])).toBe('strength');
  });

  it('matches archetype abilities for ranking', () => {
    const props = [{ id: PROPERTY_IDS.THROWN, name: 'Thrown' }];
    expect(weaponMatchesArchetypeAbilities(props, 'strength', null)).toBe(true);
    expect(weaponMatchesArchetypeAbilities(props, 'agility', null)).toBe(false);
  });
});
