import { describe, expect, it } from 'vitest';
import type { Abilities, Character } from '@/types';
import { DEFAULT_ABILITIES } from '@/types';
import { computeMaxHealthEnergy } from '@/lib/game/calculations';
import {
  applySheetAbilityChange,
  applySheetEnergyPointsChange,
  applySheetHealthPointsChange,
} from './current-follows-max';

function sheet(
  partial: Omit<Partial<Character>, 'abilities'> & { abilities?: Partial<Abilities> },
): Character {
  return {
    level: 1,
    healthPoints: 0,
    energyPoints: 0,
    currentHealth: 0,
    currentEnergy: 0,
    pow_prof: 1,
    mart_prof: 0,
    pow_abil: 'charisma',
    ...partial,
    abilities: { ...DEFAULT_ABILITIES, ...partial.abilities },
  } as Character;
}

describe('current follows a lower max (86e3juy8e)', () => {
  it('drops Health from 21/21 to 18/18 when 3 allocation points are removed', () => {
    const prev = sheet({
      abilities: { vitality: 3 },
      healthPoints: 10,
      currentHealth: 21,
    });
    expect(computeMaxHealthEnergy(prev).maxHealth).toBe(21);

    const next = applySheetHealthPointsChange(prev, 7);

    expect(next.healthPoints).toBe(7);
    expect(computeMaxHealthEnergy(next).maxHealth).toBe(18);
    expect(next.currentHealth).toBe(18);
    expect(next.currentEnergy).toBe(0);
  });

  it('drops Energy from 19 to 17 when allocation lowers the max to 17', () => {
    const prev = sheet({
      abilities: { charisma: 2 },
      energyPoints: 17,
      currentEnergy: 19,
    });
    expect(computeMaxHealthEnergy(prev).maxEnergy).toBe(19);

    const next = applySheetEnergyPointsChange(prev, 15);

    expect(next.energyPoints).toBe(15);
    expect(computeMaxHealthEnergy(next).maxEnergy).toBe(17);
    expect(next.currentEnergy).toBe(17);
    expect(next.currentHealth).toBe(0);
  });

  it('drops Health from 20 to 18 when Vitality lowers the max to 18', () => {
    const prev = sheet({
      level: 2,
      abilities: { vitality: 6 },
      healthPoints: 0,
      currentHealth: 20,
    });
    expect(computeMaxHealthEnergy(prev).maxHealth).toBe(20);

    const next = applySheetAbilityChange(prev, 'vitality', 5);

    expect(next.abilities.vitality).toBe(5);
    expect(computeMaxHealthEnergy(next).maxHealth).toBe(18);
    expect(next.currentHealth).toBe(18);
  });

  it('drops Energy from 18 to 16 when Charisma lowers the max to 16', () => {
    const prev = sheet({
      level: 2,
      abilities: { charisma: 4 },
      energyPoints: 10,
      currentEnergy: 18,
    });
    expect(computeMaxHealthEnergy(prev).maxEnergy).toBe(18);

    const next = applySheetAbilityChange(prev, 'charisma', 3);

    expect(next.abilities.charisma).toBe(3);
    expect(computeMaxHealthEnergy(next).maxEnergy).toBe(16);
    expect(next.currentEnergy).toBe(16);
  });

  it('leaves a current value that is already under the new max', () => {
    const prev = sheet({
      abilities: { vitality: 3 },
      healthPoints: 10,
      currentHealth: 10,
    });

    const next = applySheetHealthPointsChange(prev, 7);

    expect(computeMaxHealthEnergy(next).maxHealth).toBe(18);
    expect(next.currentHealth).toBe(10);
  });

  it('pulls Health that is above the old max down to the new max', () => {
    const prev = sheet({
      abilities: { vitality: 3 },
      healthPoints: 10,
      currentHealth: 25,
    });

    const next = applySheetHealthPointsChange(prev, 7);

    expect(next.currentHealth).toBe(18);
  });

  it('leaves Health below 0 when the new max is still above it', () => {
    const prev = sheet({
      abilities: { vitality: 3 },
      healthPoints: 10,
      currentHealth: -4,
    });

    const next = applySheetHealthPointsChange(prev, 7);

    expect(next.currentHealth).toBe(-4);
  });

  it('still raises current Health when allocation raises the max and current is at max', () => {
    const prev = sheet({
      abilities: { vitality: 3 },
      healthPoints: 10,
      currentHealth: 21,
    });

    const next = applySheetHealthPointsChange(prev, 13);

    expect(computeMaxHealthEnergy(next).maxHealth).toBe(24);
    expect(next.currentHealth).toBe(24);
  });

  it('does not raise current Health when allocation rises and current is below max', () => {
    const prev = sheet({
      abilities: { vitality: 3 },
      healthPoints: 10,
      currentHealth: 10,
    });

    const next = applySheetHealthPointsChange(prev, 13);

    expect(next.currentHealth).toBe(10);
  });

  it('does not change current when an ability does not change the max', () => {
    const prev = sheet({
      abilities: { vitality: 3, agility: 2 },
      healthPoints: 10,
      currentHealth: 21,
      energyPoints: 17,
      currentEnergy: 19,
    });

    const next = applySheetAbilityChange(prev, 'agility', 1);

    expect(next.currentHealth).toBe(21);
    expect(next.currentEnergy).toBe(19);
  });
});
