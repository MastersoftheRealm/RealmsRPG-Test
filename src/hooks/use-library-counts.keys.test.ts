import { describe, expect, it } from 'vitest';
import { officialLibraryKeys } from './use-official-library';
import { userLibraryAfterMutationKeys, userLibraryKeys } from './use-user-library';

describe('library count query keys (TASK-774)', () => {
  it('scopes My Library counts by user id so prefix invalidation works', () => {
    expect(userLibraryKeys.countsRoot).toEqual(['user-library-counts']);
    expect(userLibraryKeys.counts('user-1')).toEqual(['user-library-counts', 'user-1']);
  });

  it('invalidates the collection and counts together after delete/duplicate', () => {
    expect(userLibraryAfterMutationKeys('powers', 'user-1')).toEqual([
      ['user-powers', 'user-1'],
      ['user-library-counts', 'user-1'],
    ]);
  });

  it('keeps official counts on a single public key', () => {
    expect(officialLibraryKeys.counts).toEqual(['official-library-counts']);
    expect(officialLibraryKeys.byType('powers')).toEqual(['official-library', 'powers']);
  });
});
