import { describe, expect, it } from 'vitest';
import type { Character } from '@/types';
import { characterAutosaveDocumentsEqual } from './character-autosave-equal';

const base = { id: 'c1', name: 'Hero' } as Character;

describe('characterAutosaveDocumentsEqual (86e3jw5pw)', () => {
  it('ignores updatedAt when comparing documents', () => {
    const a = { ...base, notes: 'x', updatedAt: '2026-01-01T00:00:00.000Z' };
    const b = { ...base, notes: 'x', updatedAt: '2026-01-02T00:00:00.000Z' };
    expect(characterAutosaveDocumentsEqual(a, b)).toBe(true);
  });

  it('treats expanded library section visibility prefs as equal to sparse prefs', () => {
    const sparse = {
      ...base,
      librarySectionVisibility: { shields: false },
    };
    const expanded = {
      ...base,
      librarySectionVisibility: {
        stateFeats: true,
        weapons: true,
        shields: false,
        armor: true,
      },
    };
    expect(characterAutosaveDocumentsEqual(sparse, expanded)).toBe(true);
  });

  it('detects real field changes', () => {
    const a = { ...base, notes: 'before' };
    const b = { ...base, notes: 'after' };
    expect(characterAutosaveDocumentsEqual(a, b)).toBe(false);
  });
});
