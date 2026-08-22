import { describe, expect, it } from 'vitest';
import {
  isMixedSpeciesHeaderLine,
  resolveSheetHeaderSpeciesLabel,
} from './sheet-header-species-label';
import type { Character } from '@/types';

describe('resolveSheetHeaderSpeciesLabel', () => {
  it('uses speciesNames for mixed ancestry instead of the slash-combined name field', () => {
    const character = {
      ancestry: {
        id: 'mixed:a+b',
        name: 'Very Long First Species / Very Long Second Species',
        mixed: true,
        speciesNames: ['Elf', 'Human'],
      },
    } as Character;

    expect(resolveSheetHeaderSpeciesLabel(character)).toBe('Elf / Human');
    expect(isMixedSpeciesHeaderLine(character)).toBe(true);
  });

  it('falls back to ancestry.name for mixed when speciesNames are missing', () => {
    const character = {
      ancestry: {
        id: 'mixed:a+b',
        name: 'Dwarf / Orc',
        mixed: true,
      },
    } as Character;

    expect(resolveSheetHeaderSpeciesLabel(character)).toBe('Dwarf / Orc');
    expect(isMixedSpeciesHeaderLine(character)).toBe(true);
  });

  it('uses single-species ancestry name', () => {
    const character = {
      ancestry: { id: 'elf', name: 'Elf' },
    } as Character;

    expect(resolveSheetHeaderSpeciesLabel(character)).toBe('Elf');
    expect(isMixedSpeciesHeaderLine(character)).toBe(false);
  });
});
