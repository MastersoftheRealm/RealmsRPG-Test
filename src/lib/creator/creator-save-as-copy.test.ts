import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  CREATOR_SAVE_AS_COPY_LABEL,
  creatorCanSaveMyLibraryCopy,
  creatorPrivateReplaceOffersSaveAsCopy,
  creatorPublishSaveAsCopyActions,
  creatorToolbarSaveAsCopyHandler,
} from '@/lib/creator/creator-save-as-copy';

describe('creator save as copy (86e3mm3ax)', () => {
  it('offers copy on private replace confirm only', () => {
    expect(creatorPrivateReplaceOffersSaveAsCopy('private', true)).toBe(true);
    expect(creatorPrivateReplaceOffersSaveAsCopy('private', false)).toBe(false);
    expect(creatorPrivateReplaceOffersSaveAsCopy('public', true)).toBe(false);
  });

  it('shows toolbar copy when a My library row is open', () => {
    expect(creatorCanSaveMyLibraryCopy('private', 'row-1')).toBe(true);
    expect(creatorCanSaveMyLibraryCopy('private', null)).toBe(false);
    expect(creatorCanSaveMyLibraryCopy('public', 'row-1')).toBe(false);
  });

  it('wires publish secondary action when replace offers copy', () => {
    const save = {
      canSaveAsCopy: true,
      handleSaveAsCopy: async () => {},
      offerSaveAsCopyOnConfirm: true,
      confirmSaveAsCopy: async () => {},
    };
    expect(creatorPublishSaveAsCopyActions(save)).toEqual({
      secondaryConfirmLabel: CREATOR_SAVE_AS_COPY_LABEL,
      onSecondaryConfirm: expect.any(Function),
    });
    expect(creatorPublishSaveAsCopyActions({ ...save, offerSaveAsCopyOnConfirm: false })).toEqual(
      {},
    );
  });

  it('returns a toolbar handler only when copy is allowed', () => {
    const save = {
      canSaveAsCopy: true,
      handleSaveAsCopy: async () => {},
      offerSaveAsCopyOnConfirm: false,
      confirmSaveAsCopy: async () => {},
    };
    expect(creatorToolbarSaveAsCopyHandler(save)).toEqual(expect.any(Function));
    expect(creatorToolbarSaveAsCopyHandler({ ...save, canSaveAsCopy: false })).toBeUndefined();
  });

  it('skips onSaveSuccess when executeSave runs as copy', () => {
    const hook = readFileSync(
      path.join(import.meta.dirname, '../../hooks/use-creator-save.ts'),
      'utf8',
    );
    expect(hook).toContain('options?: { asCopy?: boolean }');
    expect(hook).toContain('if (!asCopy)');
    expect(hook).toContain('handleSaveAsCopy');
    expect(hook).toContain('confirmSaveAsCopy');
  });

  it('wires power, item, technique, and creature creator pages', () => {
    const pages = [
      'power-creator/page.tsx',
      'item-creator/page.tsx',
      'technique-creator/page.tsx',
      'creature-creator/page.tsx',
    ];
    for (const page of pages) {
      const source = readFileSync(path.join(import.meta.dirname, '../../app/(main)', page), 'utf8');
      expect(source).toContain('creatorToolbarSaveAsCopyHandler');
      expect(source).toContain('creatorPublishSaveAsCopyActions');
    }
  });
});
