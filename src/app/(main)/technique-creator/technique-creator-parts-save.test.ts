import { describe, expect, it } from 'vitest';
import type { TechniquePart } from '@/hooks';
import {
  techniqueLibraryRecordToFormState,
  techniquePartsForSave,
  type TechniqueSelectedPart,
} from './technique-creator-bootstrap';

describe('identical technique parts on save (86e3jx8wv)', () => {
  const potency = {
    id: '4',
    name: 'Potency Increase',
    mechanic: false,
    category: 'Attack',
  } as TechniquePart;
  const reaction = {
    id: '9',
    name: 'Reaction',
    mechanic: true,
    category: 'Action',
  } as TechniquePart;

  function potencyRow(): TechniqueSelectedPart {
    return {
      part: potency,
      op_1_lvl: 0,
      op_2_lvl: 0,
      op_3_lvl: 0,
      selectedCategory: 'Attack',
    };
  }

  it('keeps thirty identical parts and still appends the auto mechanic', () => {
    const saved = techniquePartsForSave(
      Array.from({ length: 30 }, () => potencyRow()),
      [{ id: reaction.id, name: reaction.name, op_1_lvl: 0, op_2_lvl: 0, op_3_lvl: 0 }],
    );
    expect(saved).toHaveLength(31);
    expect(saved.filter((part) => part.name === 'Potency Increase')).toHaveLength(30);
    expect(saved.filter((part) => part.name === 'Reaction')).toHaveLength(1);

    const reloaded = techniqueLibraryRecordToFormState({ name: 'QA technique', parts: saved }, [
      potency,
      reaction,
    ]);
    expect(reloaded.selectedParts).toHaveLength(30);
    expect(reloaded.selectedParts.every((row) => row.part.name === 'Potency Increase')).toBe(true);
  });
});
