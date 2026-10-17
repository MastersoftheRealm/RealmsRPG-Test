import { describe, expect, it } from 'vitest';
import { getCharacterAllowedSizes, resolveEffectiveCharacterSize } from './character-size';
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
});
