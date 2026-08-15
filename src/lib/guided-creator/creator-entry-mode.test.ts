import { describe, expect, it } from 'vitest';
import {
  canContinueGuidedAbilitiesStep,
  prefersDeepCatalogEntry,
  resolveGuidedRecommendedAbilitiesPatch,
} from '@/lib/guided-creator/creator-entry-mode';
import type { Abilities } from '@/types';

describe('prefersDeepCatalogEntry', () => {
  it('is true for custom chooser without a path pick', () => {
    expect(prefersDeepCatalogEntry({ creatorEntryMode: 'custom', archetypePathId: null })).toBe(
      true,
    );
  });

  it('is false for guided entry', () => {
    expect(prefersDeepCatalogEntry({ creatorEntryMode: 'guided', archetypePathId: null })).toBe(
      false,
    );
  });

  it('is false when custom entry later picks a path', () => {
    expect(prefersDeepCatalogEntry({ creatorEntryMode: 'custom', archetypePathId: '1' })).toBe(
      false,
    );
  });
});

describe('canContinueGuidedAbilitiesStep', () => {
  const total = 7;

  it('allows recommended bypass only when not customize-only', () => {
    expect(
      canContinueGuidedAbilitiesStep({
        customizeOnly: false,
        abilitiesMode: 'recommended',
        showCustomizePanel: false,
        spentPoints: 0,
        totalPoints: total,
      }),
    ).toBe(true);

    expect(
      canContinueGuidedAbilitiesStep({
        customizeOnly: true,
        abilitiesMode: 'recommended',
        showCustomizePanel: true,
        spentPoints: 0,
        totalPoints: total,
      }),
    ).toBe(false);
  });

  it('requires full point spend in customize panel', () => {
    expect(
      canContinueGuidedAbilitiesStep({
        customizeOnly: true,
        abilitiesMode: null,
        showCustomizePanel: true,
        spentPoints: total,
        totalPoints: total,
      }),
    ).toBe(true);

    expect(
      canContinueGuidedAbilitiesStep({
        customizeOnly: true,
        abilitiesMode: null,
        showCustomizePanel: true,
        spentPoints: 3,
        totalPoints: total,
      }),
    ).toBe(false);
  });
});

describe('resolveGuidedRecommendedAbilitiesPatch', () => {
  const abilities = (strength: number, vitality = 0): Abilities => ({
    strength,
    vitality,
    agility: 0,
    acuity: 0,
    intelligence: 0,
    charisma: 0,
  });

  const fallback = abilities(2);
  const fromPath = abilities(1, 2);

  const base = {
    recommended: fromPath,
    draftAbilities: abilities(0),
    abilitiesMode: null as 'recommended' | 'custom' | null,
    customizing: false,
    pathLoading: false,
  };

  it('applies the recommendation on first arrival', () => {
    expect(resolveGuidedRecommendedAbilitiesPatch(base)).toEqual({
      abilities: fromPath,
      abilitiesMode: 'recommended',
    });
  });

  it('writes nothing while the path is still loading, so no fallback is locked in', () => {
    expect(
      resolveGuidedRecommendedAbilitiesPatch({
        ...base,
        recommended: fallback,
        pathLoading: true,
      }),
    ).toBeNull();
  });

  it('re-syncs when the recommendation changes under an existing recommended mode', () => {
    expect(
      resolveGuidedRecommendedAbilitiesPatch({
        ...base,
        abilitiesMode: 'recommended',
        draftAbilities: fallback,
        recommended: fromPath,
      }),
    ).toEqual({ abilities: fromPath, abilitiesMode: 'recommended' });
  });

  it('is idempotent once the draft already holds the recommendation', () => {
    expect(
      resolveGuidedRecommendedAbilitiesPatch({
        ...base,
        abilitiesMode: 'recommended',
        draftAbilities: { ...fromPath },
      }),
    ).toBeNull();
  });

  it('never overwrites a custom point-buy', () => {
    expect(resolveGuidedRecommendedAbilitiesPatch({ ...base, abilitiesMode: 'custom' })).toBeNull();
  });

  it('writes nothing while the customize panel is open, or with no recommendation', () => {
    expect(resolveGuidedRecommendedAbilitiesPatch({ ...base, customizing: true })).toBeNull();
    expect(resolveGuidedRecommendedAbilitiesPatch({ ...base, recommended: null })).toBeNull();
  });
});
