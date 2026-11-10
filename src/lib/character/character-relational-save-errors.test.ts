import { describe, expect, it } from 'vitest';
import { parseCharacterUnmappedFieldDbError } from './character-relational-save-errors';

describe('parseCharacterUnmappedFieldDbError', () => {
  it('maps a top-level unmapped document key', () => {
    const parsed = parseCharacterUnmappedFieldDbError({
      code: '22023',
      message: 'Unmapped character key: ancestryTraits',
    });
    expect(parsed).toEqual({
      field: 'ancestryTraits',
      message: 'Character save rejected unknown field: ancestryTraits.',
    });
  });

  it('maps nested collection keys', () => {
    const parsed = parseCharacterUnmappedFieldDbError({
      message: 'Unmapped character ancestry.staleNested',
    });
    expect(parsed?.field).toBe('ancestry.staleNested');
  });

  it('ignores unrelated SQL failures', () => {
    expect(
      parseCharacterUnmappedFieldDbError({
        code: '22023',
        message: 'Character patch must be an object',
      }),
    ).toBeNull();
  });
});
