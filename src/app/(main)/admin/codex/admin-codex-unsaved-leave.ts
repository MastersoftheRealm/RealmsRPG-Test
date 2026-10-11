/**
 * Unsaved Codex editor checks (86e3jthxr).
 * Same discard rule as a creator draft: a changed snapshot is dirty.
 * Back and close use the existing confirm. Refresh uses the existing beforeunload.
 */

import { creatorDraftIsDirty } from '@/lib/creator/creator-unsaved-guard';

export const CODEX_EDITOR_DISCARD_TITLE = 'Discard unsaved changes?';
export const CODEX_EDITOR_DISCARD_DESCRIPTION =
  'This Codex record has edits that are not saved. Continuing will discard them.';
export const CODEX_EDITOR_DISCARD_CONFIRM = 'Discard';
export const CODEX_EDITOR_DISCARD_CANCEL = 'Keep editing';

export type CodexEditorExit = 'back' | 'refresh' | 'close';

export function codexEditorSnapshot(value: unknown): string {
  return JSON.stringify(value);
}

/** Refresh keeps the browser warning. Back, X, and Escape use the confirm dialog. */
export function codexEditorWarning(
  dirty: boolean,
  exit: CodexEditorExit,
): 'confirm' | 'beforeunload' | 'allow' {
  if (!dirty) return 'allow';
  if (exit === 'refresh') return 'beforeunload';
  return 'confirm';
}

/** Confirm on Back leaves the page. Confirm on X or Escape closes the editor. */
export function codexEditorConfirmResult(navigationPending: boolean): 'leave' | 'close' {
  return navigationPending ? 'leave' : 'close';
}

export function codexEditorShouldAsk(input: {
  dirty: boolean;
  closeRequested: boolean;
  navigationPending: boolean;
}): boolean {
  return input.dirty && (input.closeRequested || input.navigationPending);
}

export function nextCodexEditorBaseline(input: {
  active: boolean;
  wasActive: boolean;
  snapshot: string;
  baseline: string;
}): { baseline: string; wasActive: boolean } {
  if (input.active && !input.wasActive) {
    return { baseline: input.snapshot, wasActive: true };
  }
  if (!input.active && input.wasActive) {
    return { baseline: input.baseline, wasActive: false };
  }
  return { baseline: input.baseline, wasActive: input.wasActive };
}

export function codexEditorDraftIsDirty(
  snapshot: string,
  baseline: string,
  active: boolean,
): boolean {
  return active && creatorDraftIsDirty(snapshot, baseline);
}

/**
 * A single feat compares the form to the form at open.
 * A leveled feat uses the existing per-level dirty set, so switching levels is not an edit.
 */
export function codexFeatEditorIsDirty(input: {
  hasLevels: boolean;
  dirtyLevelCount: number;
  form: unknown;
  initialForm: unknown;
}): boolean {
  if (input.hasLevels) return input.dirtyLevelCount > 0;
  return creatorDraftIsDirty(
    codexEditorSnapshot(input.form),
    codexEditorSnapshot(input.initialForm),
  );
}
