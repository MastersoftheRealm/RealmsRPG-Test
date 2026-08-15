/**
 * Shared compact-fact formatters (TASK-454) — unit tests.
 */

import { describe, expect, it } from 'vitest';
import { PROPERTY_IDS } from '@/lib/id-constants';
import {
  abilityRequirementChip,
  actionTypeFactChip,
  capitalizeSpacesTerm,
  currencyFactChip,
  energyFactChip,
  formatAbilityRequirementFact,
  formatActionTypeFact,
  formatActionTypeValue,
  formatCurrencyFact,
  formatDamageFact,
  formatEnergyFact,
  formatAgilityReductionFact,
  formatHandednessFact,
  formatRangeFact,
  formatSpacesFact,
  formatTrainingPointsFact,
  formatWeaponAbilityFact,
  formatWeaponAbilityFactFromProperties,
  isMechanicPropertyName,
  namedPropertyDescriptorChips,
  propertyDescriptorChip,
  agilityReductionFactChip,
  trainingPointsFactChip,
} from './compact-facts';

describe('compact-facts formatters', () => {
  it('formats Abilityname Requirement without Ability/Weapon/Armor prefix', () => {
    expect(formatAbilityRequirementFact({ name: 'strength', level: 3 })).toBe(
      'Strength Requirement 3+',
    );
    expect(formatAbilityRequirementFact({ name: 'Strength Requirement', level: 1 })).toBe(
      'Strength Requirement 1+',
    );
    expect(formatAbilityRequirementFact({ name: 'Weapon strength requirement', level: 1 })).toBe(
      'Strength Requirement 1+',
    );
    expect(formatAbilityRequirementFact(null)).toBeUndefined();
    expect(formatAbilityRequirementFact({ name: 'Agility', level: 0 })).toBeUndefined();
    expect(abilityRequirementChip({ name: 'Vitality', level: 2 })?.name).toBe(
      'Vitality Requirement 2+',
    );
  });

  it('formats bare handedness labels', () => {
    expect(formatHandednessFact([{ id: PROPERTY_IDS.TWO_HANDED, name: 'Two-handed' }])).toBe(
      'Two-handed',
    );
    expect(formatHandednessFact([{ id: PROPERTY_IDS.THROWN, name: 'Thrown' }])).toBe('Thrown');
    expect(formatHandednessFact([{ id: PROPERTY_IDS.RANGE, name: 'Range', op_1_lvl: 1 }])).toBe(
      'Ranged',
    );
    expect(formatHandednessFact([])).toBe('One-handed');
    expect(formatHandednessFact([], '16 spaces')).toBe('Ranged');
    expect(formatHandednessFact([], '0')).toBe('One-handed');
    expect(formatHandednessFact([], '1')).toBe('One-handed');
  });

  it('formats damage as XdY Type Damage', () => {
    expect(formatDamageFact({ amount: 2, size: 6, type: 'slashing' })).toBe('2d6 Slashing Damage');
    expect(formatDamageFact('1d4 pierce')).toBe('1d4 Pierce Damage');
    expect(formatDamageFact('2d8 Fire damage')).toBe('2d8 Fire Damage');
    expect(formatDamageFact(null)).toBeUndefined();
    expect(formatDamageFact('')).toBeUndefined();
  });

  it('formats Strength / Agility / Acuity Weapon', () => {
    expect(formatWeaponAbilityFact('strength')).toBe('Strength Weapon');
    expect(formatWeaponAbilityFact('agility')).toBe('Agility Weapon');
    expect(formatWeaponAbilityFact('acuity')).toBe('Acuity Weapon');
    expect(
      formatWeaponAbilityFactFromProperties([{ id: PROPERTY_IDS.FINESSE, name: 'Finesse' }]),
    ).toBe('Agility Weapon');
    expect(
      formatWeaponAbilityFactFromProperties([
        { id: PROPERTY_IDS.RANGE, name: 'Range', op_1_lvl: 0 },
      ]),
    ).toBe('Acuity Weapon');
    expect(formatWeaponAbilityFactFromProperties([])).toBe('Strength Weapon');
  });

  it('formats Range and Spaces with capitalized Spaces', () => {
    expect(capitalizeSpacesTerm('16 spaces')).toBe('16 Spaces');
    expect(formatRangeFact('16 spaces')).toBe('Range 16 Spaces');
    expect(formatRangeFact('Melee')).toBeUndefined();
    expect(formatRangeFact(null)).toBeUndefined();
    expect(formatSpacesFact(3)).toBe('3 Spaces');
    expect(formatSpacesFact(1)).toBe('1 Space');
    expect(formatSpacesFact('4 spaces')).toBe('4 Spaces');
  });

  it('formats Action Type value vs labeled fact (chip vs column)', () => {
    expect(formatActionTypeValue('basic reaction')).toBe('Basic Reaction');
    expect(formatActionTypeValue('quick action')).toBe('Quick Action');
    expect(formatActionTypeValue('Reaction')).toBe('Reaction');
    expect(formatActionTypeValue('long3')).toBe('Long (3 AP)');
    expect(formatActionTypeValue(null)).toBeUndefined();
    // Labeled string for metadata / self-describing contexts without a column header
    expect(formatActionTypeFact('basic reaction')).toBe('Action Type Basic Reaction');
    expect(formatActionTypeFact('Reaction')).toBe('Action Type Reaction');
    expect(formatActionTypeFact('long3')).toBe('Action Type Long (3 AP)');
    expect(formatActionTypeFact(null)).toBeUndefined();
    // Desc chips are value-only (column header supplies “Action Type”)
    expect(actionTypeFactChip('quick action')?.name).toBe('Quick Action');
    expect(actionTypeFactChip('basic reaction')?.name).toBe('Basic Reaction');
    expect(actionTypeFactChip(null)).toBeNull();
    expect(formatEnergyFact(4)).toBe('Energy 4');
    expect(energyFactChip(0)?.name).toBe('Energy 0');
    expect(energyFactChip(undefined)).toBeNull();
  });

  it('formats Currency and Training Points in full words', () => {
    expect(formatCurrencyFact(12)).toBe('Currency 12');
    expect(formatCurrencyFact(-2)).toBe('Currency 0');
    expect(formatTrainingPointsFact(4)).toBe('Training Points 4');
    expect(currencyFactChip(5)?.name).toBe('Currency 5');
    expect(trainingPointsFactChip(1)?.name).toBe('Training Points 1');
    expect(currencyFactChip(null)).toBeNull();
    expect(trainingPointsFactChip(undefined)).toBeNull();
  });

  it('formats Agility Reduction consistently', () => {
    expect(formatAgilityReductionFact(-1)).toBe('Agility Reduction -1');
    expect(formatAgilityReductionFact(1)).toBe('Agility Reduction -1');
    expect(formatAgilityReductionFact(0)).toBeUndefined();
    expect(agilityReductionFactChip(2)?.name).toBe('Agility Reduction -2');
  });

  it('builds non-expanding property descriptor chips with tippy description', () => {
    const chip = propertyDescriptorChip('Graze', 'Deal half damage on a miss.');
    expect(chip.kind).toBe('descriptor');
    expect(chip.name).toBe('Graze');
    expect(chip.description).toBe('Deal half damage on a miss.');

    const named = namedPropertyDescriptorChips(
      ['Graze', 'Finesse', 'Two-handed', 'Weapon Damage', 'Armor Base', 'Damage Reduction'],
      [
        {
          id: 1,
          name: 'Graze',
          description: 'Deal half damage on a miss.',
        },
        { id: PROPERTY_IDS.FINESSE, name: 'Finesse', description: 'Use Agility.' },
        { id: 99, name: 'Weapon Damage', description: 'Base damage.' },
        { id: 98, name: 'Armor Base', description: 'Calc only.' },
        { id: 97, name: 'Damage Reduction', description: 'DR prop.' },
      ],
    );
    expect(named).toHaveLength(1);
    expect(named[0].name).toBe('Graze');
    expect(named[0].kind).toBe('descriptor');
    expect(named[0].description).toBe('Deal half damage on a miss.');
    expect(named[0].cost).toBeUndefined();
    expect(isMechanicPropertyName('Finesse')).toBe(true);
    expect(isMechanicPropertyName('Graze')).toBe(false);
    expect(isMechanicPropertyName('Weapon Damage')).toBe(true);
    expect(isMechanicPropertyName('Armor Base')).toBe(true);
    expect(isMechanicPropertyName('Damage Reduction')).toBe(true);

    const withCost = namedPropertyDescriptorChips(
      ['Graze'],
      [{ id: 1, name: 'Graze', description: 'Tip', op_1_lvl: 2, base_tp: 1, op_1_tp: 1 } as never],
      { includeCost: true },
    );
    expect(withCost[0]?.cost).toBeGreaterThan(0);
  });
});
