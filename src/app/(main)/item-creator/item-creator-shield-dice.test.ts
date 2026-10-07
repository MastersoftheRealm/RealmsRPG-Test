import { describe, expect, it } from 'vitest';
import { deriveShieldAmountFromProperties } from '@/lib/calculators';
import { PROPERTY_IDS } from '@/lib/id-constants';
import { itemLibraryRecordToFormState } from './item-creator-bootstrap';

describe('official shield copy uses the Shield Amount ladder (86e3jx7xx)', () => {
  it('shows Shield Amount level 3 as 2d4, matching the library', () => {
    expect(
      deriveShieldAmountFromProperties([{ id: PROPERTY_IDS.SHIELD_AMOUNT, op_1_lvl: 3 }]),
    ).toBe('2d4');
  });

  it('opens an official shield on the Shield Amount ladder when the stored die disagrees', () => {
    const form = itemLibraryRecordToFormState(
      {
        name: 'Tower Shield',
        type: 'shield',
        _source: 'official',
        shieldDR: { amount: 1, size: 10 },
        properties: [
          { id: 15, name: 'Shield Base', op_1_lvl: 0 },
          { id: PROPERTY_IDS.SHIELD_AMOUNT, name: 'Shield Amount', op_1_lvl: 3 },
          { id: 6, name: 'Weapon Strength Requirement', op_1_lvl: 1 },
        ],
      },
      [],
    );
    expect(form.shieldDR).toEqual({ amount: 2, size: 4 });
  });

  it('reopens a user 1d10 shield on the stored die when Shield Amount is level 3', () => {
    const form = itemLibraryRecordToFormState(
      {
        name: 'User Shield',
        type: 'shield',
        _source: 'user',
        shieldDR: { amount: 1, size: 10 },
        properties: [
          { id: 15, name: 'Shield Base', op_1_lvl: 0 },
          { id: PROPERTY_IDS.SHIELD_AMOUNT, name: 'Shield Amount', op_1_lvl: 3 },
          { id: 6, name: 'Weapon Strength Requirement', op_1_lvl: 1 },
        ],
      },
      [],
    );
    expect(form.shieldDR).toEqual({ amount: 1, size: 10 });
  });

  it('reopens a user 1d12 shield on the stored die when Shield Amount is level 4', () => {
    const form = itemLibraryRecordToFormState(
      {
        name: 'User Shield',
        type: 'shield',
        _source: 'user',
        shieldDR: { amount: 1, size: 12 },
        properties: [{ id: PROPERTY_IDS.SHIELD_AMOUNT, name: 'Shield Amount', op_1_lvl: 4 }],
      },
      [],
    );
    expect(form.shieldDR).toEqual({ amount: 1, size: 12 });
  });

  it('keeps a stored 2d4 on a user shield', () => {
    const form = itemLibraryRecordToFormState(
      {
        name: 'User Shield',
        type: 'shield',
        _source: 'user',
        shieldDR: { amount: 2, size: 4 },
        properties: [{ id: PROPERTY_IDS.SHIELD_AMOUNT, name: 'Shield Amount', op_1_lvl: 2 }],
      },
      [],
    );
    expect(form.shieldDR).toEqual({ amount: 2, size: 4 });
  });

  it('keeps a stored die when there is no Shield Amount property', () => {
    const form = itemLibraryRecordToFormState(
      { name: 'Shield', type: 'shield', shieldDR: { amount: 1, size: 10 } },
      [],
    );
    expect(form.shieldDR).toEqual({ amount: 1, size: 10 });
  });
});
