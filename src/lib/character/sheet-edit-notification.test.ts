import { describe, expect, it } from 'vitest';
import type { Character } from '@/types';
import {
  buildSheetEditNotification,
  computeSheetPointPools,
  resolveFeatLibraryEditState,
} from './sheet-edit-notification';

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
    expect(notification.title).toContain('archetype feat slot');
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

describe('resolveFeatLibraryEditState', () => {
  it('marks has-points when feat slots remain', () => {
    expect(
      resolveFeatLibraryEditState({ archetypeFeatRemaining: 2, characterFeatRemaining: 0 }),
    ).toBe('has-points');
  });

  it('marks over-budget when feat slots are exceeded', () => {
    expect(
      resolveFeatLibraryEditState({ archetypeFeatRemaining: -1, characterFeatRemaining: 0 }),
    ).toBe('over-budget');
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
});
