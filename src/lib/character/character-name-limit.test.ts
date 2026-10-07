import { describe, expect, it } from 'vitest';
import { characterCreateSchema, characterUpdateSchema } from '@/lib/api-validation';
import {
  CHARACTER_NAME_MAX_LENGTH,
  CHARACTER_NAME_TOO_LONG_MESSAGE,
  characterSaveWithoutOverlongName,
  clampCharacterNameInput,
  insertCharacterNameText,
} from './character-name-limit';

const OVER = 'a'.repeat(CHARACTER_NAME_MAX_LENGTH + 1);
const EXACT = 'b'.repeat(CHARACTER_NAME_MAX_LENGTH);

describe('character name limit', () => {
  it('stops a pasted name at 100 characters', () => {
    const pasted = insertCharacterNameText('', OVER, 0, 0);
    expect(pasted.truncated).toBe(true);
    expect(pasted.value).toHaveLength(CHARACTER_NAME_MAX_LENGTH);
    expect(clampCharacterNameInput(EXACT)).toEqual({ value: EXACT, truncated: false });
  });

  it('keeps a notes edit when the name is 101 characters (sheet save repro)', () => {
    const baseline = { name: 'Ada', notes: 'old notes' };
    const cleaned = { name: OVER, notes: 'General notes edited' };
    const prepared = characterSaveWithoutOverlongName(cleaned, baseline);

    expect(prepared.rejected).toBe(true);
    expect(prepared.dirty).toEqual({ notes: 'General notes edited' });
    expect(prepared.dirty).not.toHaveProperty('name');
    expect(prepared.cleaned.name).toBe('Ada');
  });

  it('still saves a name of exactly 100 characters', () => {
    const prepared = characterSaveWithoutOverlongName(
      { name: EXACT, notes: 'old notes' },
      { name: 'Ada', notes: 'old notes' },
    );
    expect(prepared.rejected).toBe(false);
    expect(prepared.dirty).toEqual({ name: EXACT });
  });

  it('rejects a 101-character name on create and update with a clear message', () => {
    const update = characterUpdateSchema.safeParse({ name: OVER, notes: 'kept' });
    const create = characterCreateSchema.safeParse({ name: OVER });
    expect(update.success).toBe(false);
    expect(create.success).toBe(false);
    if (!update.success) {
      expect(update.error.issues.some((issue) => issue.message === CHARACTER_NAME_TOO_LONG_MESSAGE)).toBe(
        true,
      );
    }
    if (!create.success) {
      expect(create.error.issues.some((issue) => issue.message === CHARACTER_NAME_TOO_LONG_MESSAGE)).toBe(
        true,
      );
    }
    expect(characterUpdateSchema.safeParse({ name: EXACT }).success).toBe(true);
  });
});
