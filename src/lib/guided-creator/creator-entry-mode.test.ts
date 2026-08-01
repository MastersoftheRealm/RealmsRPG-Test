import { describe, expect, it } from 'vitest';
import { prefersDeepCatalogEntry } from '@/lib/guided-creator/creator-entry-mode';

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
