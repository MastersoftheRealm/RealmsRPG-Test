/**
 * Admin Codex — shared add/edit/duplicate/save/delete chrome (TASK-842 / F-18).
 * Co-located with the nine entity tabs. Not CodexBrowseListShell (ADR-0005) and
 * not OfficialEntityList (ADR-0001).
 */

'use client';

import { useCallback, useState, type ReactNode } from 'react';
import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui';
import { createCodexDoc, updateCodexDoc } from './actions';
import type { CodexCollection } from '@/lib/codex/collections';
import { codexKeys } from '@/hooks/use-codex';
import { AdminCodexDeleteModals, useAdminCodexDelete } from './use-admin-codex-delete';
import { resolveAdminCodexSaveTargetId } from './admin-codex-save-target';

export type AdminCodexNamedEntity = {
  id: string;
  name?: string | undefined;
  updated_at?: string | undefined;
};

export function useAdminCodexEntity<TEntity extends AdminCodexNamedEntity>(options: {
  collection: CodexCollection;
  entityLabel: string;
}): {
  modalOpen: boolean;
  editing: TEntity | null;
  saving: boolean;
  setSaving: (value: boolean) => void;
  copySourceName: string | null;
  queryClient: QueryClient;
  openAdd: (prepare?: (() => void) | undefined) => void;
  openDuplicate: (entity: TEntity, prepare?: (() => void) | undefined) => void;
  openEdit: (entity: TEntity, prepare?: (() => void) | undefined) => void;
  closeModal: () => void;
  save: (args: {
    payload: Record<string, unknown>;
    expectedUpdatedAt?: string | undefined;
    editId?: string | null | undefined;
    closeOnSuccess?: boolean | undefined;
    onSuccess?:
      | ((result: { success: true; id?: string | undefined }) => void | Promise<void>)
      | undefined;
  }) => Promise<boolean>;
  refreshCodex: () => Promise<void>;
  askDelete: (entity: Pick<TEntity, 'id' | 'name'>) => void;
  deleteModals: ReactNode;
} {
  const { collection, entityLabel } = options;
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<TEntity | null>(null);
  const [saving, setSaving] = useState(false);
  const [copySourceName, setCopySourceName] = useState<string | null>(null);

  const refreshCodex = useCallback(async () => {
    queryClient.invalidateQueries({ queryKey: codexKeys.all });
    await queryClient.refetchQueries({ queryKey: codexKeys.all });
  }, [queryClient]);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setEditing(null);
    setCopySourceName(null);
  }, []);

  const openAdd = useCallback((prepare?: (() => void) | undefined) => {
    setEditing(null);
    setCopySourceName(null);
    prepare?.();
    setModalOpen(true);
  }, []);

  const openDuplicate = useCallback((entity: TEntity, prepare?: (() => void) | undefined) => {
    setEditing(null);
    setCopySourceName(entity.name ?? null);
    prepare?.();
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((entity: TEntity, prepare?: (() => void) | undefined) => {
    setEditing(entity);
    setCopySourceName(null);
    prepare?.();
    setModalOpen(true);
  }, []);

  const codexDelete = useAdminCodexDelete({
    collection,
    onDeleted: async () => {
      await refreshCodex();
      closeModal();
    },
    onError: (message) => {
      showToast(message, 'error');
    },
  });
  const { askDelete: askDeleteById } = codexDelete;

  const save = useCallback(
    async (args: {
      payload: Record<string, unknown>;
      expectedUpdatedAt?: string | undefined;
      editId?: string | null | undefined;
      closeOnSuccess?: boolean | undefined;
      onSuccess?:
        | ((result: { success: true; id?: string | undefined }) => void | Promise<void>)
        | undefined;
    }): Promise<boolean> => {
      const targetId = resolveAdminCodexSaveTargetId(args.editId, editing?.id);
      setSaving(true);
      const result = targetId
        ? await updateCodexDoc(collection, targetId, args.payload, {
            expectedUpdatedAt: args.expectedUpdatedAt,
          })
        : await createCodexDoc(collection, undefined, args.payload);
      setSaving(false);
      if (!result.success) {
        showToast(result.error ?? 'Operation failed', 'error');
        return false;
      }
      const createdId = 'id' in result ? result.id : undefined;
      await args.onSuccess?.({ success: true, id: createdId ?? targetId ?? undefined });
      await refreshCodex();
      if (args.closeOnSuccess !== false) closeModal();
      return true;
    },
    [collection, editing, closeModal, refreshCodex, showToast],
  );

  const askDelete = useCallback(
    (entity: Pick<TEntity, 'id' | 'name'>) => {
      askDeleteById(entity.id, entity.name?.trim() || entity.id);
    },
    [askDeleteById],
  );

  return {
    modalOpen,
    editing,
    saving,
    setSaving,
    copySourceName,
    queryClient,
    openAdd,
    openDuplicate,
    openEdit,
    closeModal,
    save,
    refreshCodex,
    askDelete,
    deleteModals: <AdminCodexDeleteModals state={codexDelete} entityLabel={entityLabel} />,
  };
}
