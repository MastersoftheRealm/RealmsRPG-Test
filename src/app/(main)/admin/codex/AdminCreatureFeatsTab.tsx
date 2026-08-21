'use client';

import { useState } from 'react';
import {
  CodexBrowseListShell,
  ErrorDisplay as ErrorState,
  GridListRow,
} from '@/components/patterns';
import { useCreatureFeats, type CreatureFeat } from '@/hooks';
import { useSort } from '@/hooks/use-sort';
import { COPY_NAME_SUFFIX } from './admin-codex-copy-suffix';
import { useAdminCodexEntity } from './use-admin-codex-entity';
import { AdminCodexRowActions } from './admin-codex-row-actions';
import {
  AdminCreatureFeatEditModal,
  EMPTY_CREATURE_FEAT_FORM,
  type CreatureFeatFormState,
} from './admin-creature-feat-edit-modal';
import { formatCreatureLevel } from '@/lib/game';

export function AdminCreatureFeatsTab() {
  const { data: creatureFeats, isLoading, error, refetch } = useCreatureFeats();
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
    askDelete,
    deleteModals,
  } = useAdminCodexEntity<CreatureFeat>({
    collection: 'codex_creature_feats',
    entityLabel: 'creature feat',
  });
  const [search, setSearch] = useState('');
  const { sortState, handleSort, sortItems } = useSort('name');

  const [form, setForm] = useState<CreatureFeatFormState>(EMPTY_CREATURE_FEAT_FORM);

  const filtered = sortItems<CreatureFeat>(
    (creatureFeats || []).filter(
      (f: CreatureFeat) =>
        !search ||
        f.name.toLowerCase().includes(search.toLowerCase()) ||
        f.description?.toLowerCase().includes(search.toLowerCase()),
    ),
  );

  const toOptNum = (v: unknown): number | undefined => {
    if (v == null || v === '') return undefined;
    const n = Number(v);
    return Number.isNaN(n) ? undefined : n;
  };

  const openAdd = () => beginAdd(() => setForm(EMPTY_CREATURE_FEAT_FORM));

  const openDuplicate = (f: CreatureFeat) =>
    beginDuplicate(f, () =>
      setForm({
        name: (f.name || '').trim() + COPY_NAME_SUFFIX,
        description: f.description || '',
        points: toOptNum(f.points),
        feat_lvl: toOptNum(f.feat_lvl),
        lvl_req: toOptNum(f.lvl_req),
        mechanic: f.mechanic === true,
      }),
    );

  const openEdit = (f: CreatureFeat) =>
    beginEdit(f, () =>
      setForm({
        name: f.name,
        description: f.description || '',
        points: toOptNum(f.points),
        feat_lvl: toOptNum(f.feat_lvl),
        lvl_req: toOptNum(f.lvl_req),
        mechanic: f.mechanic === true,
      }),
    );

  const handleSave = async () => {
    if (!form.name.trim()) return;
    await save({
      payload: {
        name: form.name.trim(),
        description: form.description.trim(),
        feat_points: form.points ?? undefined,
        feat_lvl: form.feat_lvl ?? undefined,
        lvl_req: form.lvl_req ?? undefined,
        mechanic: form.mechanic,
      },
      expectedUpdatedAt: editing?.updated_at,
    });
  };

  if (error)
    return (
      <ErrorState
        message="Failed to load creature feats"
        onRetry={() => {
          void refetch();
        }}
      />
    );

  return (
    <div>
      <CodexBrowseListShell
        sectionTitle="Creature Feats"
        onAdd={openAdd}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search creature feats..."
        headerColumns={[
          { key: 'name', label: 'NAME' },
          { key: 'points', label: 'PTS' },
          { key: 'feat_lvl', label: 'FEAT LVL' },
          { key: 'lvl_req', label: 'REQ. LVL' },
        ]}
        gridColumns="1.5fr 0.5fr 0.5fr 0.5fr"
        rowChrome={{ rightSlot: true }}
        sortState={sortState}
        onSort={handleSort}
        isLoading={isLoading}
        isEmpty={filtered.length === 0}
        emptyTitle="No creature feats found"
        emptyMessage="Add one to get started."
        emptyAction={{ label: 'Add Creature Feat', onClick: openAdd }}
      >
        {filtered.map((f: CreatureFeat) => (
          <GridListRow
            key={f.id}
            id={f.id}
            name={f.name}
            description={f.description || ''}
            gridColumns="1.5fr 0.5fr 0.5fr 0.5fr"
            columns={[
              { key: 'Pts', value: String(f.points ?? '-') },
              { key: 'Feat Lvl', value: f.feat_lvl != null ? String(f.feat_lvl) : '-' },
              { key: 'Req. Lvl', value: f.lvl_req != null ? formatCreatureLevel(f.lvl_req) : '-' },
            ]}
            rightSlot={
              <AdminCodexRowActions
                entity={f}
                onEdit={openEdit}
                onDuplicate={openDuplicate}
                onDelete={askDelete}
              />
            }
          />
        ))}
      </CodexBrowseListShell>

      <AdminCreatureFeatEditModal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editing ? 'Edit Creature Feat' : 'Add Creature Feat'}
        copySourceName={copySourceName}
        editingId={editing?.id ?? null}
        form={form}
        setForm={setForm}
        saving={saving}
        onDelete={editing ? () => askDelete(editing) : undefined}
        onSave={handleSave}
      />

      {deleteModals}
    </div>
  );
}
