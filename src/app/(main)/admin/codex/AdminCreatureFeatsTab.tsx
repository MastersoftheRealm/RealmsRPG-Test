'use client';

import { useState } from 'react';
import {
  SectionHeader,
  SearchInput,
  LoadingState,
  ErrorDisplay as ErrorState,
  GridListRow,
  ListEmptyState as EmptyState,
  SortHeader,
} from '@/components/shared';
import { Modal, Button, Input } from '@/components/ui';
import { useCreatureFeats, type CreatureFeat } from '@/hooks';
import { useSort } from '@/hooks/use-sort';
import { useQueryClient } from '@tanstack/react-query';
import { createCodexDoc, updateCodexDoc, deleteCodexDoc } from './actions';
import { Pencil, Trash2 } from 'lucide-react';
import { IconButton } from '@/components/ui';

export function AdminCreatureFeatsTab() {
  const { data: creatureFeats, isLoading, error } = useCreatureFeats();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const { sortState, handleSort, sortItems } = useSort('name');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<{ id: string; name: string; description: string; points: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [form, setForm] = useState({ name: '', description: '', points: 0 });

  const filtered = sortItems<CreatureFeat>(
    (creatureFeats || []).filter(
      (f: CreatureFeat) =>
        !search ||
        f.name.toLowerCase().includes(search.toLowerCase()) ||
        f.description?.toLowerCase().includes(search.toLowerCase()),
    ),
  );

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', description: '', points: 0 });
    setModalOpen(true);
  };

  const openEdit = (f: { id: string; name: string; description: string; points: number }) => {
    setEditing(f);
    setForm({ name: f.name, description: f.description || '', points: f.points ?? 0 });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setDeleteConfirm(null);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    const data = { name: form.name.trim(), description: form.description.trim(), points: form.points };

    const id = form.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_-]/g, '').slice(0, 100) || `cf_${Date.now()}`;

    const result = editing ? await updateCodexDoc('codex_creature_feats', editing.id, data) : await createCodexDoc('codex_creature_feats', id, data);

    setSaving(false);
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ['codex'] });
      closeModal();
    } else {
      alert(result.error);
    }
  };

  const handleDelete = async (id: string) => {
    if (deleteConfirm !== id) {
      setDeleteConfirm(id);
      return;
    }
    const result = await deleteCodexDoc('codex_creature_feats', id);
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ['codex'] });
      closeModal();
    } else {
      alert(result.error);
    }
  };

  if (error) return <ErrorState message="Failed to load creature feats" />;

  return (
    <div>
      <SectionHeader title="Creature Feats" onAdd={openAdd} size="md" />
      <div className="mb-4 mt-2">
        <SearchInput value={search} onChange={setSearch} placeholder="Search creature feats..." />
      </div>

      <div
        className="hidden lg:grid gap-2 px-4 py-3 bg-primary-50 border-b border-border-light rounded-t-lg font-semibold text-sm text-primary-700"
        style={{ gridTemplateColumns: '1.5fr 0.8fr 40px' }}
      >
        <SortHeader label="NAME" col="name" sortState={sortState} onSort={handleSort} />
        <SortHeader label="POINTS" col="points" sortState={sortState} onSort={handleSort} />
      </div>

      {isLoading ? (
        <LoadingState />
      ) : (
        <div className="flex flex-col gap-1 mt-2">
          {filtered.length === 0 ? (
            <EmptyState
              title="No creature feats found"
              description="Add one to get started."
              action={{ label: 'Add Creature Feat', onClick: openAdd }}
              size="sm"
            />
          ) : (
            filtered.map((f: CreatureFeat) => (
              <GridListRow
                key={f.id}
                id={f.id}
                name={f.name}
                description={f.description || ''}
                gridColumns="1.5fr 0.8fr 40px"
                columns={[
                  { key: 'Points', value: String(f.points ?? '-') },
                ]}
                rightSlot={
                  <div className="flex gap-1 pr-2">
                    <IconButton variant="ghost" size="sm" onClick={() => openEdit(f)} label="Edit">
                      <Pencil className="w-4 h-4" />
                    </IconButton>
                    <IconButton
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(f)}
                      label="Delete"
                      className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30"
                    >
                      <Trash2 className="w-4 h-4" />
                    </IconButton>
                  </div>
                }
              />
            ))
          )}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={closeModal} title={editing ? 'Edit Creature Feat' : 'Add Creature Feat'} size="lg"
        footer={
          <div className="flex justify-between">
            <div>
              {editing && (
                <Button variant="outline" onClick={() => handleDelete(editing.id)} className={deleteConfirm === editing.id ? 'border-red-500 text-red-600' : ''}>
                  {deleteConfirm === editing.id ? 'Click again to confirm delete' : 'Delete'}
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={closeModal}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving || !form.name.trim()}>
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Name *</label>
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Creature feat name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Feat description" className="w-full min-h-[80px] px-3 py-2 rounded-md border border-border bg-background text-text-primary" rows={3} />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Points (cost in feat points)</label>
            <Input type="number" value={form.points} onChange={(e) => setForm((f) => ({ ...f, points: parseInt(e.target.value) || 0 }))} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
