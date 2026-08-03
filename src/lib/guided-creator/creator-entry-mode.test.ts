import { describe, expect, it } from 'vitest';
import {
  canContinueGuidedAbilitiesStep,
  prefersDeepCatalogEntry,
} from '@/lib/guided-creator/creator-entry-mode';

describe('prefersDeepCatalogEntry', () => {
  it('is true for custom chooser without a path pick', () => {
    expect(
      prefersDeepCatalogEntry({ creatorEntryMode: 'custom', archetypePathId: null })
    ).toBe(true);
  });

  it('is false for guided entry', () => {
    expect(
      prefersDeepCatalogEntry({ creatorEntryMode: 'guided', archetypePathId: null })
    ).toBe(false);
  });

  it('is false when custom entry later picks a path', () => {
    expect(
      prefersDeepCatalogEntry({ creatorEntryMode: 'custom', archetypePathId: '1' })
    ).toBe(false);
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
      })
    ).toBe(true);

    expect(
      canContinueGuidedAbilitiesStep({
        customizeOnly: true,
        abilitiesMode: 'recommended',
        showCustomizePanel: true,
        spentPoints: 0,
        totalPoints: total,
      })
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
      })
    ).toBe(true);

    expect(
      canContinueGuidedAbilitiesStep({
        customizeOnly: true,
        abilitiesMode: null,
        showCustomizePanel: true,
        spentPoints: 3,
        totalPoints: total,
      })
    ).toBe(false);
  });
});
