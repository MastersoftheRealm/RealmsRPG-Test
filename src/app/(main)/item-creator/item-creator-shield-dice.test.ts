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

  it('loads block from Shield Amount when the stored shield field disagrees', () => {
    const form = itemLibraryRecordToFormState(
      {
        name: 'Tower Shield',
        type: 'shield',
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

  it('keeps a stored die when there is no Shield Amount property', () => {
    const form = itemLibraryRecordToFormState(
      { name: 'Shield', type: 'shield', shieldDR: { amount: 1, size: 10 } },
      [],
    );
    expect(form.shieldDR).toEqual({ amount: 1, size: 10 });
  });
});
