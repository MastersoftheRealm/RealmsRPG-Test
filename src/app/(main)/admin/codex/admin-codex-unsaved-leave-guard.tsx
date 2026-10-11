'use client';

import { useCallback, useState, type ReactNode } from 'react';
import { ConfirmActionModal } from '@/components/patterns';
import { useCreatorLeaveBlocker } from '@/hooks/use-creator-unsaved-guard';
import {
  CODEX_EDITOR_DISCARD_CANCEL,
  CODEX_EDITOR_DISCARD_CONFIRM,
  CODEX_EDITOR_DISCARD_DESCRIPTION,
  CODEX_EDITOR_DISCARD_TITLE,
  codexEditorConfirmResult,
  codexEditorDraftIsDirty,
  codexEditorShouldAsk,
  codexEditorSnapshot,
  nextCodexEditorBaseline,
} from './admin-codex-unsaved-leave';

/** Captures the form when the editor opens. A later edit is dirty until it matches again. */
export function useCodexEditorDraftDirty(value: unknown, active: boolean): boolean {
  const snapshot = codexEditorSnapshot(value);
  const [baseline, setBaseline] = useState(snapshot);
  const [wasActive, setWasActive] = useState(false);
  const next = nextCodexEditorBaseline({ active, wasActive, snapshot, baseline });
  if (next.baseline !== baseline) setBaseline(next.baseline);
  if (next.wasActive !== wasActive) setWasActive(next.wasActive);
  return codexEditorDraftIsDirty(snapshot, next.baseline, active);
}

/**
 * X, Escape, Cancel, and the backdrop call requestClose.
 * Back and in-app links use the creator leave blocker. Refresh uses its beforeunload.
 */
export function useCodexEditorLeaveGuard(
  dirty: boolean,
  onClose: () => void,
): { requestClose: () => void; prompt: ReactNode } {
  const {
    request,
    dismiss: dismissNavigation,
    confirm: confirmNavigation,
  } = useCreatorLeaveBlocker(dirty);
  const [closeRequested, setCloseRequested] = useState(false);
  if (!dirty && closeRequested) setCloseRequested(false);

  const requestClose = useCallback(() => {
    if (dirty) {
      setCloseRequested(true);
      return;
    }
    onClose();
  }, [dirty, onClose]);

  const dismiss = useCallback(() => {
    setCloseRequested(false);
    dismissNavigation();
  }, [dismissNavigation]);

  const confirmDiscard = useCallback(() => {
    const result = codexEditorConfirmResult(request !== null);
    setCloseRequested(false);
    if (result === 'leave') {
      confirmNavigation();
      return;
    }
    onClose();
  }, [confirmNavigation, onClose, request]);

  const asking = codexEditorShouldAsk({
    dirty,
    closeRequested,
    navigationPending: request !== null,
  });

  const prompt = (
    <ConfirmActionModal
      isOpen={asking}
      onClose={dismiss}
      onConfirm={confirmDiscard}
      title={CODEX_EDITOR_DISCARD_TITLE}
      description={CODEX_EDITOR_DISCARD_DESCRIPTION}
      confirmLabel={CODEX_EDITOR_DISCARD_CONFIRM}
      cancelLabel={CODEX_EDITOR_DISCARD_CANCEL}
      confirmVariant="danger"
      icon="warning"
    />
  );

  return { requestClose, prompt };
}
