import { describe, expect, it } from 'vitest';
import { traitUsesAfterDelta } from './use-sheet-feat-actions';

describe('traitUsesAfterDelta (86e3jv9gu)', () => {
  const traitName = 'Lucky';
  const maxUses = 3;

  it('first decrement from untouched trait goes to max − 1', () => {
    expect(traitUsesAfterDelta(undefined, traitName, -1, maxUses)).toEqual({
      [traitName]: 2,
    });
    expect(traitUsesAfterDelta({}, traitName, -1, maxUses)).toEqual({
      [traitName]: 2,
    });
  });

  it('first increment from untouched trait stays at max', () => {
    expect(traitUsesAfterDelta(undefined, traitName, 1, maxUses)).toEqual({
      [traitName]: 3,
    });
  });

  it('respects stored uses and clamps at 0 and max', () => {
    expect(traitUsesAfterDelta({ [traitName]: 1 }, traitName, -1, maxUses)).toEqual({
      [traitName]: 0,
    });
    expect(traitUsesAfterDelta({ [traitName]: 3 }, traitName, 1, maxUses)).toEqual({
      [traitName]: 3,
    });
  });
});
