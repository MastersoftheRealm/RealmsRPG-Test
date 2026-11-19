import { describe, expect, it } from 'vitest';
import type { Character } from '@/types';
import {
  mergeCharacterDetailQueryData,
  mergeCharacterSaveResultIntoDetailQuery,
  nextCharacterDetailQueryData,
} from './use-characters';

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

describe('mergeCharacterSaveResultIntoDetailQuery (library gear add)', () => {
  it('keeps equipment from applied dirty and stamps new inventoryRowId from save result', () => {
    const cached = {
      ...hero,
      equipment: {
        weapons: [{ id: 'w1', name: 'Sword', type: 'weapon', properties: [] }],
        armor: null,
        shields: [],
      },
    } satisfies Character;
    const applied = {
      equipment: {
        weapons: [
          { id: 'w1', name: 'Sword' },
          { id: 'w2', name: 'Mace', inventoryRowId: 'row-new' },
        ],
        armor: [],
        shields: [],
      },
      updatedAt: 'T2',
    };
    const result = mergeCharacterSaveResultIntoDetailQuery(
      { character: cached },
      {
        applied,
        updatedAt: 'T2',
        inventoryPatchResult: {
          createdRows: [{ inventoryRowId: 'row-new', bucket: 'weapons', position: 2 }],
        },
      },
    );
    const weapons = result?.character?.equipment?.weapons as Array<{
      id: string;
      inventoryRowId?: string;
    }>;
    expect(weapons).toHaveLength(2);
    expect(weapons[1]?.id).toBe('w2');
    expect(weapons[1]?.inventoryRowId).toBe('row-new');
  });
});
