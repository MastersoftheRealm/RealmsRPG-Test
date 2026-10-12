import { describe, expect, it } from 'vitest';
import {
  characterSupportsInnatePowers,
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
