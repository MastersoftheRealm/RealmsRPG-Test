'use client';

import { useState } from 'react';
import {
  SectionHeader,
  SearchInput,
  ColumnHeaders,
  LoadingState,
  ErrorDisplay as ErrorState,
  GridListRow,
  ListEmptyState as EmptyState,
} from '@/components/shared';
import { Modal, Button, Input } from '@/components/ui';
import { useCodexFeats, type Feat } from '@/hooks';
import { useSort } from '@/hooks/use-sort';
import { useQueryClient } from '@tanstack/react-query';
import { createCodexDoc, updateCodexDoc, deleteCodexDoc } from './actions';
import { Pencil, Trash2 } from 'lucide-react';
import { IconButton } from '@/components/ui';

const FEAT_GRID_COLUMNS = '1.5fr 0.8fr 1fr 0.8fr 80px';

export function AdminFeatsTab() {
  const { data: feats, isLoading, error } = useCodexFeats();
  const { sortState, handleSort, sortItems } = useSort('name');
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Feat | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const filtered = (feats || []).filter(
    (f: Feat) =>
      !search ||
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.description?.toLowerCase().includes(search.toLowerCase())
  );
  const sorted = sortItems<Feat>(filtered);

  const formDefaults = {
    name: '',
    description: '',
    category: '',
    ability: '',
    ability_req: [] as string[],
    abil_req_val: [] as number[],
    tags: [] as string[],
    skill_req: [] as string[],
    skill_req_val: [] as number[],
    lvl_req: 0,
    uses_per_rec: 0,
    mart_abil_req: '',
    char_feat: false,
    state_feat: false,
    rec_period: '',
    prereq_text: '',
  };

  const [form, setForm] = useState(formDefaults);

  const openAdd = () => {
    setEditing(null);
    setForm(formDefaults);
    setModalOpen(true);
  };

  const openEdit = (feat: Feat) => {
    setEditing(feat);
    setForm({
      name: feat.name,
      description: feat.description || '',
      category: feat.category || '',
      ability: feat.ability || '',
      ability_req: feat.ability_req || [],
      abil_req_val: feat.abil_req_val || [],
      tags: feat.tags || [],
      skill_req: feat.skill_req || [],
      skill_req_val: feat.skill_req_val || [],
      lvl_req: feat.lvl_req ?? 0,
      uses_per_rec: feat.uses_per_rec ?? 0,
      mart_abil_req: feat.mart_abil_req || '',
      char_feat: feat.char_feat ?? false,
      state_feat: feat.state_feat ?? false,
      rec_period: feat.rec_period || '',
      prereq_text: feat.prereq_text || '',
    });
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
    const data = {
      name: form.name.trim(),
      description: form.description.trim(),
      category: form.category.trim(),
      ability: form.ability.trim() || undefined,
      ability_req: form.ability_req,
      abil_req_val: form.abil_req_val,
      tags: form.tags,
      skill_req: form.skill_req,
      skill_req_val: form.skill_req_val,
      lvl_req: form.lvl_req,
      uses_per_rec: form.uses_per_rec,
      mart_abil_req: form.mart_abil_req.trim() || undefined,
      char_feat: form.char_feat,
      state_feat: form.state_feat,
      rec_period: form.rec_period.trim() || undefined,
      prereq_text: form.prereq_text.trim() || undefined,
    };

    const id = (form.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_-]/g, '') || `feat_${Date.now()}`).slice(0, 100);

    const result = editing
      ? await updateCodexDoc('codex_feats', editing.id, data)
      : await createCodexDoc('codex_feats', id, data);

    setSaving(false);
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ['codex', 'feats'] });
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
    const result = await deleteCodexDoc('codex_feats', id);
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ['codex', 'feats'] });
      closeModal();
    } else {
      alert(result.error);
    }
  };

  if (error) return <ErrorState message="Failed to load feats" />;

  return (
    <div>
      <SectionHeader title="Feats" onAdd={openAdd} size="md" />
      <div className="mb-4 mt-2">
        <SearchInput value={search} onChange={setSearch} placeholder="Search feats..." />
      </div>

      {isLoading ? (
        <LoadingState />
      ) : (
        <div className="border border-border rounded-lg overflow-hidden bg-surface">
          <ColumnHeaders
            columns={[
              { key: 'name', label: 'Name' },
              { key: 'lvl_req', label: 'Level' },
              { key: 'category', label: 'Category' },
              { key: 'ability', label: 'Ability' },
            ]}
            sortState={sortState}
            onSort={handleSort}
            gridColumns={FEAT_GRID_COLUMNS}
          />
          {sorted.map((feat) => (
            <div key={feat.id} className="flex items-center border-t border-border hover:bg-surface-alt/50">
              <div className="flex-1 min-w-0">
                <GridListRow
                  id={feat.id}
                  name={feat.name}
                  description={feat.description}
                  gridColumns={FEAT_GRID_COLUMNS}
                  columns={[
                    { key: 'Req. Level', value: String(feat.lvl_req ?? '-') },
                    { key: 'Category', value: feat.category || '-' },
                    { key: 'Ability', value: feat.ability || '-' },
                  ]}
                />
              </div>
              <div className="flex gap-1 pr-2">
                <IconButton variant="ghost" size="sm" onClick={() => openEdit(feat)} label="Edit">
                  <Pencil className="w-4 h-4" />
                </IconButton>
                <IconButton
                  variant="ghost"
                  size="sm"
                  onClick={() => openEdit(feat)}
                  label="Delete"
                  className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30"
                >
                  <Trash2 className="w-4 h-4" />
                </IconButton>
              </div>
            </div>
          ))}
          {sorted.length === 0 && (
            <EmptyState
              title="No feats found"
              description="Add one to get started."
              action={{ label: 'Add Feat', onClick: openAdd }}
              size="sm"
            />
          )}
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editing ? 'Edit Feat' : 'Add Feat'}
        size="xl"
        footer={
          <div className="flex justify-between">
            <div>
              {editing && (
                <Button
                  variant="outline"
                  onClick={() => handleDelete(editing.id)}
                  className={deleteConfirm === editing.id ? 'border-red-500 text-red-600' : ''}
                >
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
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Feat name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Feat description"
              className="w-full min-h-[80px] px-3 py-2 rounded-md border border-border bg-background text-text-primary"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Category</label>
              <Input
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                placeholder="e.g. Combat"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Required Level</label>
              <Input
                type="number"
                min={0}
                value={form.lvl_req}
                onChange={(e) => setForm((f) => ({ ...f, lvl_req: parseInt(e.target.value) || 0 }))}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Ability</label>
              <Input
                value={form.ability}
                onChange={(e) => setForm((f) => ({ ...f, ability: e.target.value }))}
                placeholder="e.g. Strength"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Uses per recovery</label>
              <Input
                type="number"
                min={0}
                value={form.uses_per_rec}
                onChange={(e) => setForm((f) => ({ ...f, uses_per_rec: parseInt(e.target.value) || 0 }))}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Tags (comma-separated)</label>
            <Input
              value={form.tags.join(', ')}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean),
                }))
              }
              placeholder="Combat, Melee, ..."
            />
          </div>
          <div className="flex gap-6">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.char_feat}
                onChange={(e) => setForm((f) => ({ ...f, char_feat: e.target.checked }))}
              />
              <span className="text-sm text-text-secondary">Character Feat</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.state_feat}
                onChange={(e) => setForm((f) => ({ ...f, state_feat: e.target.checked }))}
              />
              <span className="text-sm text-text-secondary">State Feat</span>
            </label>
          </div>
        </div>
      </Modal>
    </div>
  );
}
