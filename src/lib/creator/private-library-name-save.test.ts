import { describe, expect, it } from 'vitest';
import {
  decidePrivateLibraryNameSave,
  libraryItemId,
} from '@/lib/creator/private-library-name-save';

describe('private library name save', () => {
  it('creates when the name is new', () => {
    expect(decidePrivateLibraryNameSave([], null)).toEqual({ kind: 'create' });
    expect(decidePrivateLibraryNameSave([], 'loaded-1')).toEqual({ kind: 'create' });
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

  it('reads the library id from a loaded row', () => {
    expect(libraryItemId({ id: 'row-1', docId: 'doc-1' })).toBe('row-1');
    expect(libraryItemId({ docId: 'doc-1' })).toBe('doc-1');
    expect(libraryItemId({ name: 'Only a name' })).toBeNull();
  });
});
