import { describe, expect, it } from 'vitest';
import { defaultLibraryTabVisibilityForArchetype } from '@/lib/character-library-tab-visibility';

describe('defaultLibraryTabVisibilityForArchetype', () => {
  it('hides techniques for power-only characters', () => {
    expect(defaultLibraryTabVisibilityForArchetype('power')).toEqual({ techniques: false });
  });

  it('hides powers for martial-only characters', () => {
    expect(defaultLibraryTabVisibilityForArchetype('martial')).toEqual({ powers: false });
  });

  it('leaves both tabs visible for powered-martial', () => {
    expect(defaultLibraryTabVisibilityForArchetype('powered-martial')).toBeUndefined();
  });

  it('returns undefined when type is missing', () => {
    expect(defaultLibraryTabVisibilityForArchetype(null)).toBeUndefined();
    expect(defaultLibraryTabVisibilityForArchetype(undefined)).toBeUndefined();
  });
});
