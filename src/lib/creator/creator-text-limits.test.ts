import { describe, expect, it } from 'vitest';
import { libraryItemCreateSchema, libraryItemUpdateSchema } from '@/lib/api-validation';
import {
  CREATOR_DESCRIPTION_MAX_LENGTH,
  CREATOR_DESCRIPTION_TOO_LONG_MESSAGE,
  CREATOR_DESCRIPTION_TRUNCATED_MESSAGE,
  CREATOR_NAME_MAX_LENGTH,
  CREATOR_NAME_TOO_LONG_MESSAGE,
  clampCreatorText,
  formatCreatorTextCounter,
  insertCreatorText,
} from './creator-text-limits';

describe('creator text limits', () => {
  it('shows the description counter with the same thousands separator as the paste note', () => {
    expect(
      formatCreatorTextCounter(CREATOR_DESCRIPTION_MAX_LENGTH, CREATOR_DESCRIPTION_MAX_LENGTH),
    ).toBe('10,000 of 10,000 characters');
    expect(formatCreatorTextCounter(9_000, CREATOR_DESCRIPTION_MAX_LENGTH)).toBe(
      '9,000 of 10,000 characters',
    );
    expect(CREATOR_DESCRIPTION_TRUNCATED_MESSAGE).toBe(
      'Pasted description was shortened to 10,000 characters.',
    );
    expect(formatCreatorTextCounter(CREATOR_NAME_MAX_LENGTH, CREATOR_NAME_MAX_LENGTH)).toBe(
      '100 of 100 characters',
    );
  });

  it('stops a pasted creator name at 100 characters', () => {
    const pasted = insertCreatorText('', 'n'.repeat(101), 0, 0, CREATOR_NAME_MAX_LENGTH);
    expect(pasted.truncated).toBe(true);
    expect(pasted.value).toHaveLength(100);
    expect(clampCreatorText('n'.repeat(100), CREATOR_NAME_MAX_LENGTH).truncated).toBe(false);
  });

  it('rejects a 101-character name and accepts a 10,000-character description', () => {
    const rejected = libraryItemCreateSchema.safeParse({
      name: 'a'.repeat(CREATOR_NAME_MAX_LENGTH + 1),
      description: 'short',
    });
    expect(rejected.success).toBe(false);
    if (!rejected.success) {
      expect(
        rejected.error.issues.some((issue) => issue.message === CREATOR_NAME_TOO_LONG_MESSAGE),
      ).toBe(true);
    }

    const saved = libraryItemCreateSchema.safeParse({
      name: 'a'.repeat(CREATOR_NAME_MAX_LENGTH),
      description: 'd'.repeat(CREATOR_DESCRIPTION_MAX_LENGTH),
    });
    expect(saved.success).toBe(true);

    const longDescription = libraryItemUpdateSchema.safeParse({
      description: 'd'.repeat(CREATOR_DESCRIPTION_MAX_LENGTH + 1),
    });
    expect(longDescription.success).toBe(false);
    if (!longDescription.success) {
      expect(
        longDescription.error.issues.some(
          (issue) => issue.message === CREATOR_DESCRIPTION_TOO_LONG_MESSAGE,
        ),
      ).toBe(true);
    }
  });
});
