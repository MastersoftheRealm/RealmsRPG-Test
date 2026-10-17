import { describe, expect, it } from 'vitest';
import {
  getCharacterAllowedSizes,
  patchAncestrySizeChoice,
  resolveEffectiveCharacterSize,
} from './character-size';
import type { CharacterAncestry } from '@/types';

const speciesCatalog = [
  { id: 'human', name: 'Human', sizes: ['Medium', 'Large'] },
  { id: 'elf', name: 'Elf', size: 'Medium' },
  { id: 'giant', name: 'Giant', sizes: ['Huge'] },
];

describe('character size resolution', () => {
  it('reads allowed sizes from species sizes[] or legacy size', () => {
    const ancestry: CharacterAncestry = { id: 'human', name: 'Human' };
    expect(getCharacterAllowedSizes(ancestry, speciesCatalog)).toEqual(['Medium', 'Large']);
    expect(getCharacterAllowedSizes({ id: 'elf', name: 'Elf' }, speciesCatalog)).toEqual([
      'Medium',
    ]);
  });

  it('resolves stored selectedSize when still valid', () => {
    const ancestry: CharacterAncestry = {
      id: 'human',
      name: 'Human',
      selectedSize: 'Large',
    };
    const allowed = getCharacterAllowedSizes(ancestry, speciesCatalog);
    expect(resolveEffectiveCharacterSize(ancestry, allowed)).toBe('Large');
  });

  it('drops stale size when species options no longer include it', () => {
    const ancestry: CharacterAncestry = {
      id: 'human',
      name: 'Human',
      selectedSize: 'Huge',
    };
    const allowed = getCharacterAllowedSizes(ancestry, speciesCatalog);
    expect(resolveEffectiveCharacterSize(ancestry, allowed)).toBeUndefined();
  });

  it('auto-resolves single-option species without stored pick', () => {
    const ancestry: CharacterAncestry = { id: 'giant', name: 'Giant' };
    const allowed = getCharacterAllowedSizes(ancestry, speciesCatalog);
    expect(resolveEffectiveCharacterSize(ancestry, allowed)).toBe('Huge');
  });

  it('resolves legacy ancestry.size when species is not in the catalog', () => {
    const ancestry = {
      id: 'vanished',
      name: 'Vanished',
      size: 'miniscule',
    } as unknown as CharacterAncestry;
    expect(resolveEffectiveCharacterSize(ancestry, [])).toBe('miniscule');
  });
});

describe('patchAncestrySizeChoice', () => {
  it('drops legacy size when clearing the picker', () => {
    const ancestry = {
      id: 'x',
      name: 'X',
      size: 'miniscule',
      selectedSize: 'medium',
    } as unknown as CharacterAncestry;
    const next = patchAncestrySizeChoice(ancestry, '');
    expect((next as { size?: string }).size).toBeUndefined();
    expect(next.selectedSize).toBeUndefined();
  });

  it('drops legacy size when setting a new selectedSize', () => {
    const ancestry = {
      id: 'x',
      name: 'X',
      size: 'miniscule',
    } as unknown as CharacterAncestry;
    const next = patchAncestrySizeChoice(ancestry, 'Large');
    expect((next as { size?: string }).size).toBeUndefined();
    expect(next.selectedSize).toBe('Large');
  });
});
