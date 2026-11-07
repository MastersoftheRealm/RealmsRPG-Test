import { describe, expect, it } from 'vitest';
import {
  decidePrivateLibraryNameSave,
  libraryItemId,
  officialLibraryItemId,
  readPrivateLibraryNameMatches,
} from '@/lib/creator/private-library-name-save';

describe('private library name save', () => {
  it('creates when the name is new and no row is open', () => {
    expect(decidePrivateLibraryNameSave([], null)).toEqual({ kind: 'create' });
  });

  it('renames the open row when the new name is unused', () => {
    expect(decidePrivateLibraryNameSave([], 'loaded-1')).toEqual({
      kind: 'update',
      id: 'loaded-1',
    });
  });

  it('asks before a new save overwrites an older item with the same name', () => {
    expect(decidePrivateLibraryNameSave(['older-1'], null)).toEqual({
      kind: 'confirm-replace',
      id: 'older-1',
      matchCount: 1,
    });
  });

  it('updates the open item when the name still matches that row', () => {
    expect(decidePrivateLibraryNameSave(['loaded-1', 'other-1'], 'loaded-1')).toEqual({
      kind: 'update',
      id: 'loaded-1',
    });
  });

  it('asks before an open item is saved onto a different existing name', () => {
    expect(decidePrivateLibraryNameSave(['other-1'], 'loaded-1')).toEqual({
      kind: 'confirm-replace',
      id: 'other-1',
      matchCount: 1,
    });
  });

  it('counts every other row that shares the name', () => {
    expect(decidePrivateLibraryNameSave(['a', 'b'], null)).toEqual({
      kind: 'confirm-replace',
      id: 'a',
      matchCount: 2,
    });
  });

  it('reads the library id from a loaded user row', () => {
    expect(libraryItemId({ id: 'row-1', docId: 'doc-1' })).toBe('row-1');
    expect(libraryItemId({ docId: 'doc-1' })).toBe('doc-1');
    expect(libraryItemId({ name: 'Only a name' })).toBeNull();
    expect(libraryItemId({ id: 'official-1', _source: 'official' })).toBeNull();
  });

  it('reads the library id from a loaded official row', () => {
    expect(
      officialLibraryItemId({ id: '5cd97532-0396-4bef-904d-b022df2434e4', _source: 'official' }),
    ).toBe('5cd97532-0396-4bef-904d-b022df2434e4');
    expect(officialLibraryItemId({ id: 'row-1' })).toBeNull();
  });

  it('turns a thrown My library name lookup into the save error toast', async () => {
    const result = await readPrivateLibraryNameMatches(async () => {
      throw new Error('library unavailable');
    });
    expect(result).toEqual({ errorText: 'Failed to save: library unavailable' });
  });
});
