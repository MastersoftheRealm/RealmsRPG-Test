import { describe, expect, it } from 'vitest';
import { PROPERTY_IDS } from '@/lib/id-constants';
import { itemLibraryRecordToFormState } from './item-creator-bootstrap';

describe('item creator weapon attack ability on load (1dfe8wf3xev)', () => {
  it('opens Thrown plus Range rows as thrown range and Strength', () => {
    const form = itemLibraryRecordToFormState(
      {
        name: 'Throwing axe',
        type: 'weapon',
        properties: [
          { id: PROPERTY_IDS.THROWN, name: 'Thrown', op_1_lvl: 0 },
          { id: PROPERTY_IDS.RANGE, name: 'Range', op_1_lvl: 1 },
        ],
      },
      [],
    );
    expect(form.rangeType).toBe('thrown');
    expect(form.attackAbility).toBe('strength');
  });

  it('opens legacy rangeLevel with non-range properties as ranged and Acuity', () => {
    const form = itemLibraryRecordToFormState(
      {
        name: 'Longbow',
        type: 'weapon',
        rangeLevel: 2,
        properties: [{ id: PROPERTY_IDS.WEAPON_DAMAGE, name: 'Weapon Damage', op_1_lvl: 0 }],
      },
      [],
    );
    expect(form.rangeType).toBe('ranged');
    expect(form.attackAbility).toBe('acuity');
  });
});
