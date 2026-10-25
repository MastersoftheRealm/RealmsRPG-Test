import { describe, expect, it } from 'vitest';
import { ApiError } from '@/lib/api-client';
import {
  CREATOR_DELETED_ROW_MESSAGE,
  creatorLibrarySaveErrorMessage,
} from '@/lib/creator/creator-save-error';

describe('creator library save errors', () => {
  it('warns when a save updates a row that was deleted, and does not describe a new item', () => {
    const text = creatorLibrarySaveErrorMessage(new ApiError('Item not found', 404), {
      updatingExisting: true,
    });
    expect(text).toBe(CREATOR_DELETED_ROW_MESSAGE);
    expect(text).not.toMatch(/saved successfully/i);
  });

  it('maps network failures to connection copy', () => {
    expect(
      creatorLibrarySaveErrorMessage(new TypeError('Failed to fetch'), {
        updatingExisting: true,
      }),
    ).toBe('Could not reach the server. Check your connection and try again.');
  });

  it('keeps other save failures, including a missing row on create', () => {
    expect(
      creatorLibrarySaveErrorMessage(new ApiError('Item not found', 404), {
        updatingExisting: false,
      }),
    ).toBe('Failed to save: Item not found');
    expect(
      creatorLibrarySaveErrorMessage(new ApiError('Name must be 100 characters or fewer.', 400), {
        updatingExisting: true,
      }),
    ).toBe('Name must be 100 characters or fewer.');
  });
});
