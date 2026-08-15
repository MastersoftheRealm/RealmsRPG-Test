'use client';

import { useState, useMemo } from 'react';
import { CodexBrowseListShell, ErrorDisplay as ErrorState, GridListRow } from '@/components/shared';
import { traitsByIdMap, choiceTraitOptionIdsToChipData } from '@/lib/choice-trait';
import { Button, IconButton, useToast } from '@/components/ui';
import { useTraits, type Trait } from '@/hooks';
import { useSort } from '@/hooks/use-sort';
import { useModalListState } from '@/hooks/use-modal-list-state';
import { useQueryClient } from '@tanstack/react-query';
import { createCodexDoc, updateCodexDoc } from './actions';
import { AdminCodexDeleteReferenceModal, useAdminCodexDelete } from './use-admin-codex-delete';
import { Pencil, Copy, X } from 'lucide-react';
import {
  COPY_NAME_SUFFIX,
  EMPTY_TRAIT_FORM,
  traitFormToSavePayload,
  traitToFormState,
  type TraitFormState,
} from './admin-trait-form';
import { AdminTraitCreateModal, AdminTraitEditModal } from './admin-trait-edit-modal';

const ADMIN_TRAIT_GRID = '1.5fr 0.6fr 0.6fr 0.6fr';
const ADMIN_TRAIT_COLUMNS = [
  { key: 'name', label: 'NAME' },
  { key: 'uses_per_rec', label: 'USES' },
  { key: 'rec_period', label: 'RECOVERY' },
  { key: 'choice', label: 'CHOICE' },
];

export function AdminTraitsTab() {
  const { showToast } = useToast();
  const { data: traits, isLoading, error, refetch } = useTraits();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const { sortState, handleSort, sortItems } = useSort('name');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Trait | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [copySourceName, setCopySourceName] = useState<string | null>(null);
  const [form, setForm] = useState<TraitFormState>(EMPTY_TRAIT_FORM);
  const [createTraitOpen, setCreateTraitOpen] = useState(false);
  const [createTraitForm, setCreateTraitForm] = useState({ name: '', description: '' });
  const [creatingTrait, setCreatingTrait] = useState(false);

  const choiceTraitCandidates = useMemo(
    () => (traits || []).filter((t: Trait) => t.id !== (editing?.id ?? '')),
    [traits, editing?.id],
  );
  const {
    search: choiceSearch,
    setSearch: setChoiceSearch,
    sortedItems: sortedChoiceTraits,
    sortState: choiceSortState,
    handleSort: handleChoiceSort,
  } = useModalListState({
    items: choiceTraitCandidates,
    searchFields: ['name', 'description'],
    initialSortKey: 'name',
  });

  const filtered = sortItems<Trait>(
    (traits || []).filter(
      (t: Trait) =>
        !search ||
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.description?.toLowerCase().includes(search.toLowerCase()),
    ),
  );

  const traitById = useMemo(() => traitsByIdMap(traits || []), [traits]);

  const openAdd = () => {
    setEditing(null);
    setCopySourceName(null);
    setForm(EMPTY_TRAIT_FORM);
    setModalOpen(true);
  };

  const openDuplicate = (t: Trait) => {
    setEditing(null);
    setCopySourceName(t.name);
    setForm(traitToFormState(t, (t.name || '').trim() + COPY_NAME_SUFFIX));
    setModalOpen(true);
  };

  const openEdit = (t: Trait) => {
    setEditing(t);
    setCopySourceName(null);
    setForm(traitToFormState(t));
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setCopySourceName(null);
    setDeleteConfirm(null);
    setCreateTraitOpen(false);
  };

  const handleCreateTraitAndAdd = async () => {
    if (!createTraitForm.name.trim()) return;
    setCreatingTrait(true);
    const result = await createCodexDoc('codex_traits', undefined, {
      name: createTraitForm.name.trim(),
      description: createTraitForm.description.trim(),
    });
    setCreatingTrait(false);
    if (result.success) {
      const id = result.id;
      if (!id) {
        showToast('Create succeeded but no ID was returned. Please refresh.', 'warning');
        return;
      }
      queryClient.invalidateQueries({ queryKey: ['codex'] });
      await queryClient.refetchQueries({ queryKey: ['codex'] });
      setForm((f) => ({ ...f, option_trait_ids: [...f.option_trait_ids, id] }));
      setCreateTraitForm({ name: '', description: '' });
      setCreateTraitOpen(false);
    } else {
      showToast(result.error ?? 'Operation failed', 'error');
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    const data = traitFormToSavePayload(form);
    const result = editing
      ? await updateCodexDoc('codex_traits', editing.id, data, {
          expectedUpdatedAt: editing.updated_at,
        })
      : await createCodexDoc('codex_traits', undefined, data);

    setSaving(false);
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ['codex'] });
      await queryClient.refetchQueries({ queryKey: ['codex'] });
      closeModal();
    } else {
      showToast(result.error ?? 'Operation failed', 'error');
    }
  };

  const codexDelete = useAdminCodexDelete({
    collection: 'codex_traits',
    onDeleted: async () => {
      queryClient.invalidateQueries({ queryKey: ['codex'] });
      await queryClient.refetchQueries({ queryKey: ['codex'] });
      setPendingDeleteId(null);
      closeModal();
    },
    onError: (message) => {
      setPendingDeleteId(null);
      showToast(message, 'error');
    },
  });

  const handleDelete = async (id: string) => {
    if (deleteConfirm !== id) {
      setDeleteConfirm(id);
      return;
    }
    await codexDelete.requestDelete(id);
  };

  const handleInlineDelete = async (id: string) => {
    if (pendingDeleteId !== id) {
      setPendingDeleteId(id);
      return;
    }
    await codexDelete.requestDelete(id);
  };

  if (error)
    return (
      <ErrorState
        message="Failed to load traits"
        onRetry={() => {
          void refetch();
        }}
      />
    );

  return (
    <div>
      <CodexBrowseListShell
        sectionTitle="Traits"
        onAdd={openAdd}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search traits..."
        headerColumns={ADMIN_TRAIT_COLUMNS}
        gridColumns={ADMIN_TRAIT_GRID}
        rowChrome={{ rightSlot: true }}
        sortState={sortState}
        onSort={handleSort}
        isLoading={isLoading}
        isEmpty={filtered.length === 0}
        emptyTitle="No traits found"
        emptyMessage="Add one to get started."
        emptyAction={{ label: 'Add Trait', onClick: openAdd }}
      >
        {filtered.map((t: Trait) => {
          const choiceOptionChips = choiceTraitOptionIdsToChipData(t.option_trait_ids, traitById);
          return (
            <GridListRow
              key={t.id}
              id={t.id}
              name={t.name}
              description={t.description || ''}
              gridColumns={ADMIN_TRAIT_GRID}
              columns={[
                { key: 'Uses', value: t.uses_per_rec != null ? String(t.uses_per_rec) : '-' },
                { key: 'Recovery', value: t.rec_period || '-' },
                {
                  key: 'Choice',
                  value: t.option_trait_ids?.length ? `Yes (${t.option_trait_ids.length})` : '-',
                },
              ]}
              detailSections={
                choiceOptionChips.length > 0
                  ? [{ label: 'Choice options', chips: choiceOptionChips }]
                  : undefined
              }
              rightSlot={
                <div className="flex items-center gap-1 pr-2">
                  {pendingDeleteId === t.id ? (
                    <div className="flex items-center gap-1 text-xs">
                      <span className="font-medium whitespace-nowrap text-danger-700 dark:text-danger-400">
                        Remove?
                      </span>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleInlineDelete(t.id)}
                        className="h-6 px-2 py-0.5 text-xs"
                      >
                        Yes
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setPendingDeleteId(null)}
                        className="h-6 px-2 py-0.5 text-xs"
                      >
                        No
                      </Button>
                    </div>
                  ) : (
                    <>
                      <IconButton
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(t)}
                        label="Edit"
                        aria-label="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </IconButton>
                      <IconButton
                        variant="ghost"
                        size="sm"
                        onClick={() => openDuplicate(t)}
                        label="Duplicate"
                        aria-label="Duplicate"
                      >
                        <Copy className="h-4 w-4" />
                      </IconButton>
                      <IconButton
                        variant="ghost"
                        size="sm"
                        onClick={() => setPendingDeleteId(t.id)}
                        label="Delete"
                        className="text-danger-fg hover:bg-transparent hover:opacity-80"
                      >
                        <X className="h-4 w-4" />
                      </IconButton>
                    </>
                  )}
                </div>
              }
            />
          );
        })}
      </CodexBrowseListShell>

      <AdminTraitEditModal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editing ? 'Edit Trait' : 'Add Trait'}
        copySourceName={copySourceName}
        editingId={editing?.id ?? null}
        form={form}
        setForm={setForm}
        sortedChoiceTraits={sortedChoiceTraits}
        choiceSearch={choiceSearch}
        setChoiceSearch={setChoiceSearch}
        choiceSortState={choiceSortState}
        handleChoiceSort={handleChoiceSort}
        saving={saving}
        deleteConfirm={deleteConfirm}
        onRequestDelete={() => editing && handleDelete(editing.id)}
        onSave={handleSave}
        onOpenCreateTrait={() => setCreateTraitOpen(true)}
      />

      <AdminTraitCreateModal
        isOpen={createTraitOpen}
        onClose={() => setCreateTraitOpen(false)}
        form={createTraitForm}
        setForm={setCreateTraitForm}
        creating={creatingTrait}
        onCreate={handleCreateTraitAndAdd}
      />

      <AdminCodexDeleteReferenceModal state={codexDelete} entityLabel="trait" />
    </div>
  );
}
