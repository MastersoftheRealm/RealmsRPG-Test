import { describe, expect, it } from 'vitest';
import {
  CHARACTER_SAVE_VALIDATION_ERROR,
  parseCharacterRelationalValidationError,
} from './character-relational-save-errors';

describe('parseCharacterRelationalValidationError', () => {
  it('maps a top-level unmapped document key on SQLSTATE 22023', () => {
    const parsed = parseCharacterRelationalValidationError({
      code: '22023',
      message: 'Unmapped character key: ancestryTraits',
    });
    expect(parsed).toEqual({
      error: CHARACTER_SAVE_VALIDATION_ERROR,
      details: ['Rejected field: ancestryTraits.'],
    });
  });

  it('maps nested collection entry keys with dots in the echoed path', () => {
    const parsed = parseCharacterRelationalValidationError({
      code: '22023',
      message: 'Unmapped character powers entry key cost',
    });
    expect(parsed?.details[0]).toBe('Rejected field: powers.cost.');
  });

  it('maps inventory property failures', () => {
    const parsed = parseCharacterRelationalValidationError({
      code: '22023',
      message: 'Non-empty inventory properties need a typed destination',
    });
    expect(parsed?.details[0]).toBe('Rejected field: equipment.properties.');
  });

  it('caps very long echoed field paths', () => {
    const longKey = 'x'.repeat(200);
    const parsed = parseCharacterRelationalValidationError({
      code: '22023',
      message: `Unmapped character key: ${longKey}`,
    });
    const detail = parsed?.details[0] ?? '';
    expect(detail.length).toBeLessThan(180);
    expect(detail.endsWith('….')).toBe(true);
  });

  it('falls back without echoing raw Postgres text for unknown 22023', () => {
    expect(
      parseCharacterRelationalValidationError({
        code: '22023',
        message: 'Owner id is required',
      }),
    ).toEqual({
      error: CHARACTER_SAVE_VALIDATION_ERROR,
      details: ['Character data failed relational validation.'],
    });
  });

  it('maps patch shape validation on SQLSTATE 22023', () => {
    expect(
      parseCharacterRelationalValidationError({
        code: '22023',
        message: 'Character patch must be an object',
      })?.details[0],
    ).toBe('Rejected field: patch.');
  });

  it('ignores non-22023 SQL codes', () => {
    expect(
      parseCharacterRelationalValidationError({
        code: '42501',
        message: 'Authentication required',
      }),
    ).toBeNull();
  });
});
