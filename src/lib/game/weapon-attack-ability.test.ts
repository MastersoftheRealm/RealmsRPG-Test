import { describe, expect, it } from 'vitest';
import { PROPERTY_IDS } from '@/lib/id-constants';
import {
  deriveAbilityRequirementFromProperties,
  getWeaponAttackAbility,
  getWeaponAttackBonusFromProperties,
  hasThrownProperty,
  weaponMatchesArchetypeAbilities,
} from '@/lib/game/weapon-attack-ability';
import type { Abilities } from '@/types';

const abilities: Abilities = {
  strength: 3,
  vitality: 0,
  agility: 5,
  acuity: 2,
  intelligence: 0,
  charisma: 0,
};

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

  describe('deriveAbilityRequirementFromProperties', () => {
    it('parses ability requirement properties with op_1_lvl offset', () => {
      expect(
        deriveAbilityRequirementFromProperties([
          { name: 'Strength Requirement', op_1_lvl: 2 },
        ])
      ).toEqual({ name: 'Strength', level: 3 });
    });

    it('returns undefined when no requirement property is present', () => {
      expect(deriveAbilityRequirementFromProperties([{ name: 'Finesse' }])).toBeUndefined();
      expect(deriveAbilityRequirementFromProperties(undefined)).toBeUndefined();
    });

    it('accepts string property entries', () => {
      expect(
        deriveAbilityRequirementFromProperties(['Agility Requirement'])
      ).toEqual({ name: 'Agility', level: 1 });
    });
  });

  it('matches archetype abilities for ranking', () => {
    const props = [{ id: PROPERTY_IDS.THROWN, name: 'Thrown' }];
    expect(weaponMatchesArchetypeAbilities(props, 'strength', null)).toBe(true);
    expect(weaponMatchesArchetypeAbilities(props, 'agility', null)).toBe(false);
  });

  describe('getWeaponAttackBonusFromProperties', () => {
    const martialProficiency = 2;

    it('adds strength + martial proficiency for melee', () => {
      expect(getWeaponAttackBonusFromProperties([], abilities, martialProficiency)).toEqual({
        bonus: 5,
        abilityName: 'Strength',
        ability: 'strength',
      });
    });

    it('adds agility + martial proficiency for finesse', () => {
      expect(
        getWeaponAttackBonusFromProperties(
          [{ id: PROPERTY_IDS.FINESSE, name: 'Finesse' }],
          abilities,
          martialProficiency
        )
      ).toEqual({
        bonus: 7,
        abilityName: 'Agility',
        ability: 'agility',
      });
    });

    it('adds acuity + martial proficiency for ranged non-thrown', () => {
      expect(
        getWeaponAttackBonusFromProperties(
          [{ id: PROPERTY_IDS.RANGE, name: 'Range', op_1_lvl: 1 }],
          abilities,
          martialProficiency,
          '12 spaces'
        )
      ).toEqual({
        bonus: 4,
        abilityName: 'Acuity',
        ability: 'acuity',
      });
    });

    it('adds strength + martial proficiency for thrown (not acuity)', () => {
      const props = [
        { id: PROPERTY_IDS.THROWN, name: 'Thrown' },
        { id: PROPERTY_IDS.RANGE, name: 'Range', op_1_lvl: 1 },
      ];
      expect(
        getWeaponAttackBonusFromProperties(props, abilities, martialProficiency, '6 spaces')
      ).toEqual({
        bonus: 5,
        abilityName: 'Strength',
        ability: 'strength',
      });
    });

    it('uses range override when properties alone look melee', () => {
      expect(
        getWeaponAttackBonusFromProperties([], abilities, martialProficiency, '24 spaces')
      ).toEqual({
        bonus: 4,
        abilityName: 'Acuity',
        ability: 'acuity',
      });
    });

    it('treats corrupt stored range override as melee', () => {
      expect(getWeaponAttackAbility([], '0')).toBe('strength');
      expect(getWeaponAttackAbility([], '1')).toBe('strength');
      expect(
        getWeaponAttackBonusFromProperties([], abilities, martialProficiency, '0')
      ).toEqual({
        bonus: 5,
        abilityName: 'Strength',
        ability: 'strength',
      });
    });
  });
});
