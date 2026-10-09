import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  decidePrivateLibraryNameSave,
  libraryItemId,
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

  it('turns a thrown My library name lookup into the save error toast', async () => {
    const result = await readPrivateLibraryNameMatches(async () => {
      throw new Error('library unavailable');
    });
    expect(result).toEqual({ errorText: 'Failed to save: library unavailable' });

    const hook = readFileSync(
      path.join(import.meta.dirname, '../../hooks/use-creator-save.ts'),
      'utf8',
    );
    const start = hook.indexOf('const handleSave = useCallback');
    const end = hook.indexOf('const confirmPublish = useCallback');
    const body = hook.slice(start, end);
    expect(body).toContain('readPrivateLibraryNameMatches');
    expect(body).toContain("setSaveMessage({ type: 'error', text: lookup.errorText })");
    expect(hook).toContain('const savedId = await saveToLibrary');
    expect(hook).toContain('setLoadedLibraryId(savedId)');
    expect(hook).toContain('creatorSaveFailureText(err)');
    expect(hook).not.toContain('Failed to save: ${message}');
    expect(body.indexOf('findOfficialLibraryItemByName')).toBeGreaterThan(-1);
    expect(body.indexOf('readPrivateLibraryNameMatches')).toBeGreaterThan(
      body.indexOf('findOfficialLibraryItemByName'),
    );
  });

  it('passes publishConfirmLabel and does not infer Replace from the title', () => {
    const shell = readFileSync(
      path.join(import.meta.dirname, '../../components/creator/CreatorPageShell.tsx'),
      'utf8',
    );
    expect(shell).toContain('publish.confirmLabel');
    expect(shell).not.toContain("startsWith('Replace ");

    const pages = [
      'power-creator/page.tsx',
      'item-creator/page.tsx',
      'technique-creator/page.tsx',
      'empowered-technique-creator/page.tsx',
      'creature-creator/page.tsx',
      'species-creator/page.tsx',
    ];
    for (const page of pages) {
      const source = readFileSync(path.join(import.meta.dirname, '../../app/(main)', page), 'utf8');
      expect(source).toContain('publishConfirmLabel');
    }
  });
});
