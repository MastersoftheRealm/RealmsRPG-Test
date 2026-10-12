import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { applyTechniqueCreatorReset } from './technique-creator-reset';

describe('technique creator reset (86e3jywcr)', () => {
  it('clears form state and drops the loaded library row', () => {
    let loaded = true;
    let formReset = false;
    let draftAccepted = false;
    applyTechniqueCreatorReset({
      clearDraftCache: () => {},
      resetForm: () => {
        formReset = true;
      },
      forgetLoadedLibraryItem: () => {
        loaded = false;
      },
      clearSaveMessage: () => {},
      acceptDraft: () => {
        draftAccepted = true;
      },
    });
    expect(formReset).toBe(true);
    expect(loaded).toBe(false);
    expect(draftAccepted).toBe(true);
  });

  it('requires confirmation before reset runs', () => {
    const workspace = readFileSync(
      path.join(import.meta.dirname, 'use-technique-creator-workspace.ts'),
      'utf8',
    );
    expect(workspace).toContain('setShowResetConfirm(true)');
    expect(workspace).toContain('applyTechniqueCreatorReset');

    const page = readFileSync(path.join(import.meta.dirname, 'page.tsx'), 'utf8');
    expect(page).toContain('resetConfirm={{');
    expect(page).toContain('ws.confirmReset');
  });
});
