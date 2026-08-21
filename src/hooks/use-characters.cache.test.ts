import { describe, expect, it } from 'vitest';
import type { Character } from '@/types';
import { mergeCharacterDetailQueryData, nextCharacterDetailQueryData } from './use-characters';

const hero = { id: 'c1', name: 'Hero', notes: 'old' } as Character;

describe('nextCharacterDetailQueryData', () => {
  it('applies a value update and keeps libraryForView and enrichment', () => {
    const next = { ...hero, notes: 'new' };
    expect(
      nextCharacterDetailQueryData(
        {
          character: hero,
          libraryForView: { powers: [], techniques: [], items: [], creatures: [] },
          enrichment: { feats: [] } as never,
        },
        next,
      ),
    ).toEqual({
      character: next,
      libraryForView: { powers: [], techniques: [], items: [], creatures: [] },
      enrichment: { feats: [] },
    });
  });

  it('applies a functional update from a missing cache entry', () => {
    expect(nextCharacterDetailQueryData(undefined, (prev) => (prev ? prev : hero))).toEqual({
      character: hero,
      libraryForView: undefined,
    });
  });

  it('can clear the character without dropping the wrapper', () => {
    expect(nextCharacterDetailQueryData({ character: hero }, null)).toEqual({
      character: null,
      libraryForView: undefined,
    });
  });
});

describe('mergeCharacterDetailQueryData', () => {
  it('merges dirty keys and leaves omitted keys', () => {
    expect(
      mergeCharacterDetailQueryData({ character: hero }, { notes: 'new', updatedAt: 'T1' }),
    ).toEqual({
      character: { id: 'c1', name: 'Hero', notes: 'new', updatedAt: 'T1' },
    });
  });

  it('is a no-op when the cache has no character', () => {
    expect(mergeCharacterDetailQueryData({ character: null }, { notes: 'x' })).toEqual({
      character: null,
    });
    expect(mergeCharacterDetailQueryData(undefined, { notes: 'x' })).toBeUndefined();
  });
});
