import { describe, expect, it } from 'vitest';
import { deriveShieldAmountFromProperties } from '@/lib/calculators';
import { PROPERTY_IDS } from '@/lib/id-constants';
import { itemLibraryRecordToFormState } from './item-creator-bootstrap';

const STORED_DICE = [
  { shieldDR: { amount: 1, size: 10 }, level: 3 },
  { shieldDR: { amount: 1, size: 12 }, level: 4 },
  { shieldDR: { amount: 2, size: 4 }, level: 2 },
] as const;

describe('shield reopen uses the stored block die (86e3jx7xx)', () => {
  it('shows Shield Amount level 3 as 2d4, matching the library', () => {
    expect(
      deriveShieldAmountFromProperties([{ id: PROPERTY_IDS.SHIELD_AMOUNT, op_1_lvl: 3 }]),
    ).toBe('2d4');
  });

  it.each(['official', 'user', undefined] as const)(
    'reopens a %s shield on the stored 1d10, 1d12, and 2d4',
    (source) => {
      for (const dice of STORED_DICE) {
        const form = itemLibraryRecordToFormState(
          {
            name: 'Shield',
            type: 'shield',
            ...(source ? { _source: source } : {}),
            shieldDR: dice.shieldDR,
            properties: [
              { id: PROPERTY_IDS.SHIELD_AMOUNT, name: 'Shield Amount', op_1_lvl: dice.level },
            ],
          },
          [],
        );
        expect(form.shieldDR).toEqual(dice.shieldDR);
      }
    },
  );

  it('keeps the default die when nothing is stored, even if Shield Amount is level 3', () => {
    for (const source of ['official', 'user'] as const) {
      const form = itemLibraryRecordToFormState(
        {
          name: 'Shield',
          type: 'shield',
          _source: source,
          properties: [{ id: PROPERTY_IDS.SHIELD_AMOUNT, name: 'Shield Amount', op_1_lvl: 3 }],
        },
        [],
      );
      expect(form.shieldDR).toEqual({ amount: 1, size: 4 });
    }
  });

  it('keeps a stored die when there is no Shield Amount property', () => {
    const form = itemLibraryRecordToFormState(
      { name: 'Shield', type: 'shield', shieldDR: { amount: 1, size: 10 } },
      [],
    );
    expect(form.shieldDR).toEqual({ amount: 1, size: 10 });
  });
});
