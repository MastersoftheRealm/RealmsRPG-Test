import { describe, expect, it } from 'vitest';
import { libraryDocumentDiceShapeError, LIBRARY_DICE_SHAPE_ERROR } from './library-dice-shape';

describe('libraryDocumentDiceShapeError', () => {
  it('rejects invalid die size and count shapes', () => {
    expect(libraryDocumentDiceShapeError({ damage: [{ amount: 1, size: 2 }] })).toBe(
      LIBRARY_DICE_SHAPE_ERROR,
    );
    expect(libraryDocumentDiceShapeError({ damage: [{ amount: 1, size: 20 }] })).toBe(
      LIBRARY_DICE_SHAPE_ERROR,
    );
    expect(libraryDocumentDiceShapeError({ damage: [{ amount: 1.5, size: 6 }] })).toBe(
      LIBRARY_DICE_SHAPE_ERROR,
    );
    expect(libraryDocumentDiceShapeError({ damage: [{ amount: '4', size: 6 }] })).toBe(
      LIBRARY_DICE_SHAPE_ERROR,
    );
    expect(libraryDocumentDiceShapeError({ damage: [{ amount: 0, size: 6 }] })).toBe(
      LIBRARY_DICE_SHAPE_ERROR,
    );
  });

  it('accepts legal dice, empty damage, null shield damage, and large counts', () => {
    expect(libraryDocumentDiceShapeError({ damage: [] })).toBeNull();
    expect(libraryDocumentDiceShapeError({ shieldDamage: null, damage: [] })).toBeNull();
    expect(libraryDocumentDiceShapeError({ damage: [{ amount: 25, size: 8 }] })).toBeNull();
    expect(
      libraryDocumentDiceShapeError({ damage: [{ amount: 9007199254740991, size: 12 }] }),
    ).toBeNull();
  });
});
