import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { applySpeciesCreatorReset } from './species-creator-reset';

describe('species creator reset (86e3jp7e1)', () => {
  it('drops the loaded library id', () => {
    let loadedId: string | null = 'species-row';
    let formReset = false;
    applySpeciesCreatorReset({
      clearDraftCache: () => {},
      resetForm: () => {
        formReset = true;
      },
      forgetLoadedLibraryItem: () => {
        loadedId = null;
      },
      clearSaveMessage: () => {},
    });
    expect(formReset).toBe(true);
    expect(loadedId).toBeNull();

    const workspace = readFileSync(
      path.join(import.meta.dirname, 'use-species-creator-workspace.ts'),
      'utf8',
    );
    const start = workspace.indexOf('const handleReset = useCallback');
    const end = workspace.indexOf('const loadSpeciesIntoForm');
    expect(start).toBeGreaterThan(-1);
    expect(end).toBeGreaterThan(start);
    const reset = workspace.slice(start, end);
    expect(reset).toContain('applySpeciesCreatorReset');
    expect(reset).toContain('save.forgetLoadedLibraryItem()');
  });
});
