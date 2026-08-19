/**
 * Admin Codex — delete with a referential-integrity gate.
 * Codex ids are referenced as plain strings in CSV columns, so deleting an entity that is
 * still in use leaves archetype paths, feats and species pointing at nothing. The action
 * refuses such a delete and returns what points at the row; this hook surfaces that once
 * for all nine entity tabs instead of nine copies of the same handler.
 */

'use client';

import { useCallback, useState } from 'react';
import { ConfirmActionModal, DeleteConfirmModal } from '@/components/patterns';
import { deleteCodexDoc } from './actions';
import type { CodexCollection } from '@/lib/codex/collections';

const REFERENCES_SHOWN = 8;

type BlockedDelete = { id: string; references: string[] };
type PendingConfirm = { id: string; name: string };

export type AdminCodexDelete = {
  deleting: boolean;
  blocked: BlockedDelete | null;
  pendingConfirm: PendingConfirm | null;
  askDelete: (id: string, name: string) => void;
  /** HEAD-tab alias while TASK-799 tabs are re-wired; name falls back to id. */
  requestDelete: (id: string) => void;
  confirmPendingDelete: () => Promise<boolean>;
  cancelPendingDelete: () => void;
  confirmBlockedDelete: () => Promise<boolean>;
  cancelBlockedDelete: () => void;
};

export function useAdminCodexDelete(options: {
  collection: CodexCollection;
  onDeleted: () => void | Promise<void>;
  onError: (message: string) => void;
}): AdminCodexDelete {
  const { collection, onDeleted, onError } = options;
  const [blocked, setBlocked] = useState<BlockedDelete | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(null);
  const [deleting, setDeleting] = useState(false);

  const runDelete = useCallback(
    async (id: string, acknowledgeReferences: boolean): Promise<boolean> => {
      setDeleting(true);
      const result = await deleteCodexDoc(
        collection,
        id,
        acknowledgeReferences ? { acknowledgeReferences: true } : undefined,
      );
      setDeleting(false);
      if (result.success) {
        setBlocked(null);
        setPendingConfirm(null);
        await onDeleted();
        return true;
      }
      if (result.references && result.references.length > 0) {
        setPendingConfirm(null);
        setBlocked({ id, references: result.references });
        return false;
      }
      onError(result.error ?? 'Operation failed');
      return false;
    },
    [collection, onDeleted, onError],
  );

  return {
    deleting,
    blocked,
    pendingConfirm,
    askDelete: useCallback((id: string, name: string) => {
      setBlocked(null);
      setPendingConfirm({ id, name });
    }, []),
    requestDelete: useCallback((id: string) => {
      setBlocked(null);
      setPendingConfirm({ id, name: id });
    }, []),
    confirmPendingDelete: useCallback(
      () => (pendingConfirm ? runDelete(pendingConfirm.id, false) : Promise.resolve(false)),
      [pendingConfirm, runDelete],
    ),
    cancelPendingDelete: useCallback(() => setPendingConfirm(null), []),
    confirmBlockedDelete: useCallback(
      () => (blocked ? runDelete(blocked.id, true) : Promise.resolve(false)),
      [blocked, runDelete],
    ),
    cancelBlockedDelete: useCallback(() => setBlocked(null), []),
  };
}

export function AdminCodexDeleteConfirmModal({
  state,
  entityLabel,
}: {
  state: AdminCodexDelete;
  entityLabel: string;
}) {
  const pending = state.pendingConfirm;
  return (
    <DeleteConfirmModal
      isOpen={pending !== null}
      itemName={pending?.name ?? ''}
      itemType={entityLabel}
      deleteContext="Codex"
      isDeleting={state.deleting}
      onConfirm={() => {
        void state.confirmPendingDelete();
      }}
      onClose={state.cancelPendingDelete}
    />
  );
}

export function AdminCodexDeleteReferenceModal({
  state,
  entityLabel,
}: {
  state: AdminCodexDelete;
  entityLabel: string;
}) {
  const references = state.blocked?.references ?? [];
  const shown = references.slice(0, REFERENCES_SHOWN).join('; ');
  const extra =
    references.length > REFERENCES_SHOWN ? ` and ${references.length - REFERENCES_SHOWN} more` : '';

  return (
    <ConfirmActionModal
      isOpen={state.blocked !== null}
      title={`This ${entityLabel} is still referenced`}
      description={`${shown}${extra}. Deleting it leaves those references pointing at an entry that no longer exists.`}
      confirmLabel="Delete anyway"
      cancelLabel="Keep it"
      confirmVariant="danger"
      isLoading={state.deleting}
      loadingLabel="Deleting..."
      onConfirm={() => {
        void state.confirmBlockedDelete();
      }}
      onClose={state.cancelBlockedDelete}
    />
  );
}
