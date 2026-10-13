import { describe, expect, it } from 'vitest';
import { itemLibraryRecordToFormState } from './item-creator-bootstrap';

describe('weapon damage default (86e3jrnc3)', () => {
  it('uses 1d4 when a library item has no damage dice', () => {
    const form = itemLibraryRecordToFormState({ name: 'Club', type: 'weapon', damage: [] }, []);
    expect(form.damage).toEqual({ amount: 1, size: 4, type: 'slashing' });
  });

  it('uses 1d4 when damage is missing', () => {
    const form = itemLibraryRecordToFormState({ name: 'Club', type: 'weapon' }, []);
    expect(form.damage).toEqual({ amount: 1, size: 4, type: 'slashing' });
  });
});
