import { describe, expect, it } from 'vitest';
import {
  isSpeciesFormSaveReady,
  speciesLibraryRecordToFormState,
} from './species-creator-bootstrap';

describe('speciesLibraryRecordToFormState height and weight', () => {
  const officialHuman = {
    id: '4',
    name: 'Human',
    description: '',
    type: 'Humanoid',
    sizes: ['Small', 'Medium'],
    skills: ['0', '21'],
    languages: ['Universal', 'Any'],
    ave_hgt_cm: 175,
    ave_wgt_kg: 70,
    adulthood_lifespan: [18, 100],
  };

  it('fills height and weight from official centimetre and kilogram columns', () => {
    const form = speciesLibraryRecordToFormState(officialHuman, [], []);
    expect(form.ave_height).toBe(175);
    expect(form.ave_weight).toBe(70);
    expect(form.adulthood_lifespan).toEqual([18, 100]);
    expect(isSpeciesFormSaveReady(form)).toBe(true);
  });

  it('keeps creator ave_height and ave_weight when those fields are set', () => {
    const form = speciesLibraryRecordToFormState(
      { ...officialHuman, ave_height: 160, ave_weight: 55, ave_hgt_cm: 175, ave_wgt_kg: 70 },
      [],
      [],
    );
    expect(form.ave_height).toBe(160);
    expect(form.ave_weight).toBe(55);
  });

  it('leaves height and weight empty when neither shape is present', () => {
    const form = speciesLibraryRecordToFormState(
      { ...officialHuman, ave_hgt_cm: undefined, ave_wgt_kg: undefined },
      [],
      [],
    );
    expect(form.ave_height).toBe('');
    expect(form.ave_weight).toBe('');
    expect(isSpeciesFormSaveReady(form)).toBe(false);
  });
});
