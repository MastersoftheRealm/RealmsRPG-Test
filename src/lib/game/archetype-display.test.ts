import { describe, expect, it } from 'vitest';
import type { Character, CharacterArchetype } from '@/types';
import {
  applyLevelUpProficiencyUpdates,
  applyProficiencyGainForLevelUp,
  applyPathProficiencyForLevel,
} from './archetype-display';

function char(prof: { mart?: number; pow?: number; level?: number }): Character {
  return {
    mart_prof: prof.mart ?? 0,
    pow_prof: prof.pow ?? 0,
    level: prof.level ?? 1,
  } as Character;
}

describe('applyProficiencyGainForLevelUp', () => {
  it('auto-assigns +1 to martial when all points are martial-only (level 4 → 5)', () => {
    expect(applyProficiencyGainForLevelUp(char({ mart: 2, pow: 0, level: 4 }), 4, 5)).toEqual({
      mart_prof: 3,
      pow_prof: 0,
    });
  });

  it('auto-assigns +1 to power when all points are power-only', () => {
    expect(applyProficiencyGainForLevelUp(char({ mart: 0, pow: 2, level: 4 }), 4, 5)).toEqual({
      mart_prof: 0,
      pow_prof: 3,
    });
  });

  it('does not auto-assign when both sides have points (Powered-Martial split)', () => {
    expect(applyProficiencyGainForLevelUp(char({ mart: 1, pow: 1, level: 4 }), 4, 5)).toBeNull();
  });

  it('assigns multiple gains when jumping several levels (pure martial 4 → 10)', () => {
    expect(applyProficiencyGainForLevelUp(char({ mart: 2, pow: 0, level: 4 }), 4, 10)).toEqual({
      mart_prof: 4,
      pow_prof: 0,
    });
  });

  it('returns null when proficiency cap does not increase', () => {
    expect(applyProficiencyGainForLevelUp(char({ mart: 2, pow: 0 }), 3, 4)).toBeNull();
  });

  it('returns null on level down', () => {
    expect(applyProficiencyGainForLevelUp(char({ mart: 3, pow: 0 }), 5, 4)).toBeNull();
  });
});

describe('applyLevelUpProficiencyUpdates', () => {
  it('combines auto-assign with path level-5 floor', () => {
    const character = {
      ...char({ mart: 2, pow: 0, level: 4 }),
      archetypePathId: 'fighter-path',
    } as Character;
    const pathArch = {
      id: 'fighter-path',
      type: 'martial',
      martial_prof_level5: 3,
      power_prof_level5: 0,
    } as CharacterArchetype;

    expect(applyLevelUpProficiencyUpdates(character, 4, 5, pathArch)).toEqual({
      mart_prof: 3,
      pow_prof: 0,
    });
  });

  it('applies path floor without auto-assign when split', () => {
    const character = {
      ...char({ mart: 1, pow: 1, level: 4 }),
      archetypePathId: 'pm-path',
    } as Character;
    const pathArch = {
      id: 'pm-path',
      type: 'powered-martial',
      martial_prof_level5: 2,
      power_prof_level5: 2,
    } as CharacterArchetype;

    expect(applyLevelUpProficiencyUpdates(character, 4, 5, pathArch)).toEqual({
      mart_prof: 2,
      pow_prof: 2,
    });
  });

  it('returns null when neither auto-assign nor path floor changes values', () => {
    const character = {
      ...char({ mart: 1, pow: 1, level: 4 }),
      archetypePathId: 'pm-path',
    } as Character;

    expect(applyLevelUpProficiencyUpdates(character, 4, 5, undefined)).toBeNull();
  });
});

describe('applyPathProficiencyForLevel (unchanged floor behavior)', () => {
  it('floors to admin targets at level 5+ without reducing higher values', () => {
    const character = {
      ...char({ mart: 4, pow: 0 }),
      archetypePathId: 'path',
    } as Character;

    expect(
      applyPathProficiencyForLevel(character, 5, {
        id: 'path',
        type: 'martial',
        martial_prof_level5: 2,
      } as CharacterArchetype),
    ).toBeNull();
  });
});
