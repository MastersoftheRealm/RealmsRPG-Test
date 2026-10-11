import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { shouldReleaseCreatorSentinel } from '@/lib/creator/creator-unsaved-guard';
import {
  CODEX_EDITOR_DISCARD_CANCEL,
  CODEX_EDITOR_DISCARD_CONFIRM,
  CODEX_EDITOR_DISCARD_DESCRIPTION,
  CODEX_EDITOR_DISCARD_TITLE,
  codexEditorConfirmResult,
  codexEditorShouldAsk,
  codexEditorWarning,
  codexFeatEditorIsDirty,
  nextCodexEditorBaseline,
  type CodexEditorExit,
} from './admin-codex-unsaved-leave';

const dir = import.meta.dirname;

const EDIT_MODALS = [
  'admin-feat-edit-modal.tsx',
  'admin-skill-edit-modal.tsx',
  'admin-species-edit-modal.tsx',
  'admin-trait-edit-modal.tsx',
  'admin-part-edit-modal.tsx',
  'admin-property-edit-modal.tsx',
  'admin-equipment-edit-modal.tsx',
  'admin-creature-feat-edit-modal.tsx',
  'AdminArchetypesTab.tsx',
] as const;

const savedFeat = { name: 'Alert', description: 'Ready' };
const editedFeat = { name: 'Alertness', description: 'Ready' };

describe('Codex editor unsaved edits (86e3jthxr)', () => {
  it('treats a changed feat field as dirty and an unchanged feat as clean', () => {
    expect(
      codexFeatEditorIsDirty({
        hasLevels: false,
        dirtyLevelCount: 0,
        form: editedFeat,
        initialForm: savedFeat,
      }),
    ).toBe(true);
    expect(
      codexFeatEditorIsDirty({
        hasLevels: false,
        dirtyLevelCount: 0,
        form: savedFeat,
        initialForm: savedFeat,
      }),
    ).toBe(false);
  });

  it('does not treat a level switch as an edit, and does treat a leveled field change as one', () => {
    expect(
      codexFeatEditorIsDirty({
        hasLevels: true,
        dirtyLevelCount: 0,
        form: editedFeat,
        initialForm: savedFeat,
      }),
    ).toBe(false);
    expect(
      codexFeatEditorIsDirty({
        hasLevels: true,
        dirtyLevelCount: 1,
        form: savedFeat,
        initialForm: savedFeat,
      }),
    ).toBe(true);
  });

  it('asks before Back, refresh, X, or Escape discard a dirty editor, and stays quiet when it is clean', () => {
    const exits: CodexEditorExit[] = ['back', 'refresh', 'close'];
    for (const exit of exits) {
      expect(codexEditorWarning(false, exit)).toBe('allow');
    }
    expect(codexEditorWarning(true, 'back')).toBe('confirm');
    expect(codexEditorWarning(true, 'close')).toBe('confirm');
    expect(codexEditorWarning(true, 'refresh')).toBe('beforeunload');
    expect(
      codexEditorShouldAsk({ dirty: true, closeRequested: true, navigationPending: false }),
    ).toBe(true);
    expect(
      codexEditorShouldAsk({ dirty: true, closeRequested: false, navigationPending: true }),
    ).toBe(true);
    expect(
      codexEditorShouldAsk({ dirty: false, closeRequested: true, navigationPending: true }),
    ).toBe(false);
    expect(codexEditorConfirmResult(true)).toBe('leave');
    expect(codexEditorConfirmResult(false)).toBe('close');
  });

  it('starts clean when the editor opens, asks after an edit, and starts clean on the next open', () => {
    const opened = nextCodexEditorBaseline({
      active: true,
      wasActive: false,
      snapshot: '{"name":"Alert"}',
      baseline: '',
    });
    expect(opened.baseline).toBe('{"name":"Alert"}');
    expect(opened.wasActive).toBe(true);

    const stillOpen = nextCodexEditorBaseline({
      active: true,
      wasActive: true,
      snapshot: '{"name":"Alertness"}',
      baseline: opened.baseline,
    });
    expect(stillOpen.baseline).toBe('{"name":"Alert"}');

    const closed = nextCodexEditorBaseline({
      active: false,
      wasActive: true,
      snapshot: '{"name":"Alertness"}',
      baseline: stillOpen.baseline,
    });
    expect(closed.wasActive).toBe(false);

    const reopened = nextCodexEditorBaseline({
      active: true,
      wasActive: false,
      snapshot: '{"name":"Alert"}',
      baseline: closed.baseline,
    });
    expect(reopened.baseline).toBe('{"name":"Alert"}');
  });

  it('releases the Back sentinel when a dirty editor unmounts, and not when the user is already leaving', () => {
    const sentinel = { creatorUnsavedGuard: true };
    expect(
      shouldReleaseCreatorSentinel({ unmounting: true, leaving: false, state: sentinel }),
    ).toBe(true);
    expect(shouldReleaseCreatorSentinel({ unmounting: true, leaving: true, state: sentinel })).toBe(
      false,
    );
    expect(
      shouldReleaseCreatorSentinel({ unmounting: false, leaving: false, state: sentinel }),
    ).toBe(false);
    expect(shouldReleaseCreatorSentinel({ unmounting: true, leaving: false, state: null })).toBe(
      false,
    );
  });

  it('wires X and Escape through the same close, and refresh through the existing beforeunload', () => {
    const modal = readFileSync(path.join(dir, '../../../../components/ui/modal.tsx'), 'utf8');
    expect(modal).toContain("if (e.key !== 'Escape') return;");
    expect(modal).toContain('onCloseRef.current()');
    expect(modal).toContain('onClick={onClose}');

    const copy = readFileSync(path.join(dir, 'admin-codex-unsaved-leave.ts'), 'utf8');
    expect(copy).toContain(CODEX_EDITOR_DISCARD_TITLE);
    expect(copy).toContain(CODEX_EDITOR_DISCARD_DESCRIPTION);
    expect(copy).toContain(CODEX_EDITOR_DISCARD_CONFIRM);
    expect(copy).toContain(CODEX_EDITOR_DISCARD_CANCEL);

    const guard = readFileSync(path.join(dir, 'admin-codex-unsaved-leave-guard.tsx'), 'utf8');
    expect(guard).toContain('useCreatorLeaveBlocker');
    expect(guard).toContain('ConfirmActionModal');
    expect(guard).toContain('codexEditorConfirmResult');
    expect(guard).toContain('title={CODEX_EDITOR_DISCARD_TITLE}');
    expect(guard).toContain('description={CODEX_EDITOR_DISCARD_DESCRIPTION}');
    expect(guard).toContain('confirmLabel={CODEX_EDITOR_DISCARD_CONFIRM}');
    expect(guard).toContain('cancelLabel={CODEX_EDITOR_DISCARD_CANCEL}');
    expect(guard).not.toContain('window.confirm');

    const leaveHook = readFileSync(
      path.join(dir, '../../../../hooks/use-creator-unsaved-guard.ts'),
      'utf8',
    );
    expect(leaveHook).toContain("addEventListener('beforeunload'");
    expect(leaveHook).toContain('shouldReleaseCreatorSentinel');

    const feat = readFileSync(path.join(dir, 'admin-feat-edit-modal.tsx'), 'utf8');
    expect(feat).toContain('codexFeatEditorIsDirty');
    expect(feat).toContain('onClose={leave.requestClose}');

    for (const name of EDIT_MODALS) {
      const src = readFileSync(path.join(dir, name), 'utf8');
      expect(src, name).toContain('useCodexEditorLeaveGuard');
      expect(src, name).toContain('onClose={leave.requestClose}');
      expect(src, name).toContain('{leave.prompt}');
    }
  });
});
