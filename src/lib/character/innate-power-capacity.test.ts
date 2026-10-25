import { describe, expect, it } from 'vitest';
import {
  characterSupportsInnatePowers,
  formatInnateThresholdWarningForPower,
  isInnateEnergyTotalOverBudget,
  isInnatePowerOverThreshold,
  resolveCharacterInnateEnergy,
} from './innate-power-capacity';
import type { Character } from '@/types';

describe('innate-power-capacity (86e3jvfm2)', () => {
  it('Pure-Martial progression has no Innate Energy', () => {
    const martial: Character = {
      id: 'c1',
      level: 2,
      mart_prof: 2,
      pow_prof: 0,
      archetypeChoices: {},
    } as Character;
    expect(resolveCharacterInnateEnergy(martial)).toBe(0);
    expect(characterSupportsInnatePowers(martial)).toBe(false);
  });

  it('Power path has Innate Energy', () => {
    const power: Character = {
      id: 'c2',
      level: 1,
      mart_prof: 0,
      pow_prof: 2,
      archetypeChoices: {},
    } as Character;
    expect(resolveCharacterInnateEnergy(power)).toBeGreaterThan(0);
    expect(characterSupportsInnatePowers(power)).toBe(true);
  });
});

describe('innate budget warnings (86e3pbwf2)', () => {
  it('flags per-power threshold and total energy overages', () => {
    expect(isInnatePowerOverThreshold(9, 8)).toBe(true);
    expect(isInnatePowerOverThreshold(8, 8)).toBe(false);
    expect(isInnateEnergyTotalOverBudget(8, [4, 5])).toBe(true);
    expect(isInnateEnergyTotalOverBudget(8, [4, 4])).toBe(false);
  });
});

describe('formatInnateThresholdWarningForPower (86e3rkvau)', () => {
  it('substitutes the power name into the human-written warning copy', () => {
    expect(formatInnateThresholdWarningForPower('QA PC126 Modify', 16, 8)).toBe(
      'QA PC126 Modify exceeds your Innate Threshold.',
    );
  });
});
