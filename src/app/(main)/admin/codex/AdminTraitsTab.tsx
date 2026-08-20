'use client';

import { useState, useMemo } from 'react';
import {
  CodexBrowseListShell,
  ErrorDisplay as ErrorState,
  GridListRow,
} from '@/components/patterns';
import { traitsByIdMap, choiceTraitOptionIdsToChipData } from '@/lib/choice-trait';
import { useToast } from '@/components/ui';
import { useTraits, type Trait } from '@/hooks';
import { useSort } from '@/hooks/use-sort';
import { useModalListState } from '@/hooks/use-modal-list-state';
import { createCodexDoc } from './actions';
import { useAdminCodexEntity } from './use-admin-codex-entity';
import { AdminCodexRowActions } from './admin-codex-row-actions';
import { COPY_NAME_SUFFIX } from './admin-codex-copy-suffix';
import {
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
  const {
    modalOpen,
    editing,
    saving,
    copySourceName,
    openAdd: beginAdd,
    openDuplicate: beginDuplicate,
    openEdit: beginEdit,
    closeModal,
    save,
    refreshCodex,
    askDelete,
    deleteModals,
  } = useAdminCodexEntity<Trait>({
    collection: 'codex_traits',
    entityLabel: 'trait',
  });
  const [search, setSearch] = useState('');
  const { sortState, handleSort, sortItems } = useSort('name');
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

  const openAdd = () => beginAdd(() => setForm(EMPTY_TRAIT_FORM));

  const openDuplicate = (t: Trait) =>
    beginDuplicate(t, () => setForm(traitToFormState(t, (t.name || '').trim() + COPY_NAME_SUFFIX)));

  const openEdit = (t: Trait) => beginEdit(t, () => setForm(traitToFormState(t)));

  const handleCloseModal = () => {
    closeModal();
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
      await refreshCodex();
      setForm((f) => ({ ...f, option_trait_ids: [...f.option_trait_ids, id] }));
      setCreateTraitForm({ name: '', description: '' });
      setCreateTraitOpen(false);
    } else {
      showToast(result.error ?? 'Operation failed', 'error');
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    await save({
      payload: traitFormToSavePayload(form),
      expectedUpdatedAt: editing?.updated_at,
    });
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
                <AdminCodexRowActions
                  entity={t}
                  onEdit={openEdit}
                  onDuplicate={openDuplicate}
                  onDelete={askDelete}
                />
              }
            />
          );
        })}
      </CodexBrowseListShell>

      <AdminTraitEditModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
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
        onDelete={editing ? () => askDelete(editing) : undefined}
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

      {deleteModals}
    </div>
  );
}
