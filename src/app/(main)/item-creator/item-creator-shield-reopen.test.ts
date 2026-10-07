import { describe, expect, it } from 'vitest';
import { itemLibraryRecordToFormState } from './item-creator-bootstrap';

describe('reopening a shield keeps its ability requirement (86e3jpr0q)', () => {
  it('restores a requirement that was stored only as a property', () => {
    const form = itemLibraryRecordToFormState(
      {
        name: 'QA Shield',
        type: 'shield',
        properties: [{ id: 6, name: 'Weapon Strength Requirement', op_1_lvl: 1 }],
      },
      [],
    );
    expect(form.armamentType).toBe('Shield');
    expect(form.abilityRequirement).toEqual({
      id: 6,
      name: 'Weapon Strength Requirement',
      level: 2,
    });
  });

  it('prefers the abilityRequirement field when it is present', () => {
    const form = itemLibraryRecordToFormState(
      {
        name: 'Saved Shield',
        type: 'shield',
        abilityRequirement: { id: 6, name: 'Weapon Strength Requirement', level: 2 },
        properties: [{ id: 6, name: 'Weapon Strength Requirement', op_1_lvl: 0 }],
      },
      [],
    );
    expect(form.abilityRequirement?.level).toBe(2);
  });

  it('leaves a shield with no requirement empty', () => {
    const form = itemLibraryRecordToFormState({ name: 'Buckler', type: 'shield' }, []);
    expect(form.abilityRequirement).toBeNull();
  });
});
