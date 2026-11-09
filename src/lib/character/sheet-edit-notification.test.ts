import { describe, expect, it } from 'vitest';
import type { Character } from '@/types';
import type { CoreRulesMap } from '@/types/core-rules';
import {
  buildLevelDownOverspendWarning,
  buildSheetEditNotification,
  computeSheetPointPools,
} from './sheet-edit-notification';
import { normalizeCharacterOnLoad } from '@/lib/character/schema-normalize';

const baseCharacter: Character = {
  id: '1',
  userId: 'u1',
  name: 'Test',
  level: 5,
  experience: 0,
  abilities: {
    strength: 0,
    vitality: 0,
    agility: 0,
    acuity: 0,
    intelligence: 0,
    charisma: 0,
  },
  skills: [],
  healthPoints: 0,
  energyPoints: 0,
  mart_prof: 0,
  pow_prof: 0,
  archetypeFeats: [],
  feats: [],
};

describe('buildSheetEditNotification', () => {
  it('uses mixed semantics when some pools are over and others have points left', () => {
    const notification = buildSheetEditNotification({
      abilityRemaining: -1,
      skillRemaining: 3,
      heRemaining: 0,
      profRemaining: 0,
      archetypeFeatRemaining: 0,
      characterFeatRemaining: 0,
      canLevelUp: false,
    });

    expect(notification.severity).toBe('mixed');
    expect(notification.title).toContain('Over budget');
    expect(notification.title).toContain('Unspent');
    expect(notification.title).toContain('ability point');
    expect(notification.title).toContain('skill point');
  });

  it('uses danger semantics only for overspend', () => {
    const notification = buildSheetEditNotification({
      abilityRemaining: -1,
      skillRemaining: 0,
      heRemaining: 0,
      profRemaining: 0,
      archetypeFeatRemaining: 0,
      characterFeatRemaining: 0,
      canLevelUp: false,
    });

    expect(notification.severity).toBe('overspent');
    expect(notification.title).toContain('Over budget');
    expect(notification.title).toContain('ability point');
  });

  it('uses unspent semantics when pools remain and nothing is over', () => {
    const notification = buildSheetEditNotification({
      abilityRemaining: 2,
      skillRemaining: 0,
      heRemaining: 0,
      profRemaining: 0,
      archetypeFeatRemaining: 1,
      characterFeatRemaining: 0,
      canLevelUp: true,
    });

    expect(notification.severity).toBe('unspent');
    expect(notification.title).toContain('Unspent');
    expect(notification.title).toContain('ability point');
    expect(notification.title).not.toContain('feat slot');
  });

  it('shows level-up only when no overspend or unspent pools remain', () => {
    const notification = buildSheetEditNotification({
      abilityRemaining: 0,
      skillRemaining: 0,
      heRemaining: 0,
      profRemaining: 0,
      archetypeFeatRemaining: 0,
      characterFeatRemaining: 0,
      canLevelUp: true,
    });

    expect(notification.severity).toBe('level-up');
    expect(notification.show).toBe(true);
  });

  it('ignores feat slot overspend and unspent in toolbar copy', () => {
    const notification = buildSheetEditNotification({
      abilityRemaining: 0,
      skillRemaining: 0,
      heRemaining: 0,
      profRemaining: 0,
      archetypeFeatRemaining: -2,
      characterFeatRemaining: 3,
      canLevelUp: false,
    });

    expect(notification.show).toBe(false);
    expect(notification.title).not.toContain('feat');
  });

  it('shows nothing when all pools are balanced and cannot level up', () => {
    const notification = buildSheetEditNotification({
      abilityRemaining: 0,
      skillRemaining: 0,
      heRemaining: 0,
      profRemaining: 0,
      archetypeFeatRemaining: 0,
      characterFeatRemaining: 0,
      canLevelUp: false,
    });

    expect(notification.show).toBe(false);
    expect(notification.severity).toBe('none');
  });
});

describe('buildLevelDownOverspendWarning', () => {
  it('warns when a lower level would leave overspent pools', () => {
    const character: Character = {
      ...baseCharacter,
      level: 3,
      abilities: {
        strength: 3,
        vitality: 3,
        agility: 2,
        acuity: 0,
        intelligence: 0,
        charisma: 0,
      },
      healthPoints: 20,
      energyPoints: 10,
    };

    const warning = buildLevelDownOverspendWarning({
      character,
      targetLevel: 1,
      characterSpeciesSkills: [],
      featsDb: [],
      rules: undefined,
    });

    expect(warning).not.toBeNull();
    expect(warning?.severity === 'overspent' || warning?.severity === 'mixed').toBe(true);
    expect(warning?.title).toContain('Over budget');
  });

  it('returns null when leveling down would not overspend', () => {
    const warning = buildLevelDownOverspendWarning({
      character: { ...baseCharacter, level: 3 },
      targetLevel: 2,
      characterSpeciesSkills: [],
      featsDb: [],
      rules: undefined,
    });

    expect(warning).toBeNull();
  });

  it('returns null when target level is not lower', () => {
    const warning = buildLevelDownOverspendWarning({
      character: baseCharacter,
      targetLevel: 5,
      characterSpeciesSkills: [],
      featsDb: [],
      rules: undefined,
    });

    expect(warning).toBeNull();
  });
});

describe('computeSheetPointPools', () => {
  it('counts unspent ability and proficiency points from character data', () => {
    const pools = computeSheetPointPools({
      character: baseCharacter,
      characterSpeciesSkills: [],
      featsDb: [],
      rules: undefined,
    });

    expect(pools.abilityRemaining).toBeGreaterThan(0);
    expect(pools.profRemaining).toBeGreaterThan(0);
  });

  it('reads legacy aliases the same as post-load normalization for point pools (LIB1-033)', () => {
    const baseWithoutCanonicalProf = { ...baseCharacter };
    delete baseWithoutCanonicalProf.mart_prof;
    delete baseWithoutCanonicalProf.pow_prof;
    const rawLegacy = {
      ...baseWithoutCanonicalProf,
      defenseSkills: { might: 0, reflex: 0, will: 0, fortitude: 0 },
      martialProficiency: 1,
      powerProficiency: 1,
      archetype: { id: 'a', type: 'mixed' },
    } as unknown as Character;
    const normalized = normalizeCharacterOnLoad(
      rawLegacy as unknown as Record<string, unknown>,
    ) as Character;

    const legacyPools = computeSheetPointPools({
      character: rawLegacy,
      characterSpeciesSkills: [],
      featsDb: [],
      rules: undefined,
    });
    const normalizedPools = computeSheetPointPools({
      character: normalized,
      characterSpeciesSkills: [],
      featsDb: [],
      rules: undefined,
    });

    expect(legacyPools).toEqual(normalizedPools);
  });

  it('uses core_rules characterFeatsPerLevel for feat slot budgets', () => {
    const rules = {
      PROGRESSION_PLAYER: { characterFeatsPerLevel: 2 },
    } as Partial<CoreRulesMap>;
    const pools = computeSheetPointPools({
      character: { ...baseCharacter, level: 1 },
      characterSpeciesSkills: [],
      featsDb: [],
      rules,
    });
    expect(pools.characterFeatRemaining).toBe(2);
  });
});
