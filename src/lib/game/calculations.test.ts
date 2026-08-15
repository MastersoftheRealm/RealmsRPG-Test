import { describe, expect, it } from 'vitest';
import type { Abilities, Character } from '@/types';
import { DEFAULT_ABILITIES, DEFAULT_DEFENSE_SKILLS } from '@/types';
import {
  calculateAllStats,
  calculateCreatureSpeed,
  calculateEvasion,
  calculateMaxEnergy,
  calculateMaxEnergyForArchetype,
  calculateSpeed,
  resolveEnergyArchetypeAbility,
} from '@/lib/game/calculations';

/** Powered-Martial: INT 1 (power) vs STR 3 (martial) — Energy must use the higher. */
const poweredMartialAbilities: Abilities = {
  ...DEFAULT_ABILITIES,
  intelligence: 1,
  strength: 3,
};

const poweredMartialLevel10: Partial<Character> = {
  level: 10,
  energyPoints: 4,
  pow_abil: 'intelligence',
  mart_abil: 'strength',
  abilities: poweredMartialAbilities,
};

describe('resolveEnergyArchetypeAbility (T1 / M3)', () => {
  it('picks the higher of Power and Martial Archetype Abilities', () => {
    expect(resolveEnergyArchetypeAbility(poweredMartialAbilities, 'intelligence', 'strength')).toBe(
      'strength',
    );
  });

  it('keeps Power when the two scores are equal', () => {
    expect(
      resolveEnergyArchetypeAbility(
        { ...DEFAULT_ABILITIES, intelligence: 2, strength: 2 },
        'intelligence',
        'strength',
      ),
    ).toBe('intelligence');
  });

  it('falls back to the only defined Archetype Ability', () => {
    expect(resolveEnergyArchetypeAbility(poweredMartialAbilities, 'intelligence', undefined)).toBe(
      'intelligence',
    );
    expect(resolveEnergyArchetypeAbility(poweredMartialAbilities, undefined, 'strength')).toBe(
      'strength',
    );
  });
});

describe('calculateMaxEnergyForArchetype / calculateAllStats Powered-Martial Energy (T1)', () => {
  it('uses the higher Archetype Ability (STR 3), not Power-first (INT 1)', () => {
    // ability 3 × level 10 + energyPoints 4
    expect(
      calculateMaxEnergyForArchetype(4, poweredMartialAbilities, 10, 'intelligence', 'strength'),
    ).toBe(34);
    expect(calculateAllStats(poweredMartialLevel10).maxEnergy).toBe(34);

    // Regression: passing pow_abil alone would have used INT 1 → 14
    expect(calculateMaxEnergy(4, 'intelligence', poweredMartialAbilities, 10)).toBe(14);
  });
});

describe('calculateCreatureSpeed (M12 / D4)', () => {
  it('matches player Speed and does not add a size modifier', () => {
    expect(calculateCreatureSpeed(2)).toBe(calculateSpeed(2));
    expect(calculateCreatureSpeed(2)).toBe(7);
    expect(calculateCreatureSpeed(-2)).toBe(calculateSpeed(-2));
  });
});

describe('calculateEvasion (D5)', () => {
  it('is base 10 + Agility', () => {
    expect(calculateEvasion(3)).toBe(13);
    expect(calculateEvasion(-1)).toBe(9);
  });
});

describe('calculateAllStats golden characters (T9)', () => {
  it('level 1 Power matches GAME_RULES Speed / Evasion / Health / Energy / defenses', () => {
    const stats = calculateAllStats({
      level: 1,
      healthPoints: 0,
      energyPoints: 0,
      pow_abil: 'intelligence',
      abilities: {
        ...DEFAULT_ABILITIES,
        vitality: 1,
        agility: 2,
        intelligence: 2,
      },
    });
    expect(stats.maxHealth).toBe(9);
    expect(stats.maxEnergy).toBe(2);
    expect(stats.terminal).toBe(3);
    expect(stats.speed).toBe(7);
    expect(stats.evasion).toBe(12);
    expect(stats.defenseBonuses.fortitude).toBe(1);
    expect(stats.defenseScores.fortitude).toBe(11);
    expect(stats.defenseBonuses.reflex).toBe(2);
    expect(stats.defenseScores.reflex).toBe(12);
    expect(stats.defenseBonuses.mentalFortitude).toBe(2);
    expect(stats.defenseScores.mentalFortitude).toBe(12);
  });

  it('level 10 Martial uses Strength Energy and skill-point Might', () => {
    const stats = calculateAllStats({
      level: 10,
      healthPoints: 4,
      energyPoints: 2,
      mart_abil: 'strength',
      abilities: {
        ...DEFAULT_ABILITIES,
        strength: 3,
        vitality: 1,
        agility: 2,
        charisma: 1,
      },
      defenseVals: { ...DEFAULT_DEFENSE_SKILLS, might: 2 },
    });
    expect(stats.maxHealth).toBe(22);
    expect(stats.maxEnergy).toBe(32);
    expect(stats.terminal).toBe(6);
    expect(stats.speed).toBe(7);
    expect(stats.evasion).toBe(12);
    expect(stats.defenseBonuses.might).toBe(5);
    expect(stats.defenseScores.might).toBe(15);
    expect(stats.defenseBonuses.resolve).toBe(1);
    expect(stats.defenseScores.resolve).toBe(11);
  });

  it('level 20 Powered-Martial Energy uses the higher Archetype Ability', () => {
    const stats = calculateAllStats({
      level: 20,
      healthPoints: 10,
      energyPoints: 8,
      pow_abil: 'intelligence',
      mart_abil: 'strength',
      abilities: {
        ...DEFAULT_ABILITIES,
        strength: 4,
        vitality: 2,
        agility: 3,
        acuity: 1,
        intelligence: 2,
        charisma: 1,
      },
    });
    expect(stats.maxHealth).toBe(58);
    expect(stats.maxEnergy).toBe(88);
    expect(stats.terminal).toBe(15);
    expect(stats.speed).toBe(8);
    expect(stats.evasion).toBe(13);
    expect(stats.defenseBonuses.might).toBe(4);
    expect(stats.defenseScores.might).toBe(14);
    expect(stats.defenseBonuses.reflex).toBe(3);
    expect(stats.defenseScores.reflex).toBe(13);
  });
});
