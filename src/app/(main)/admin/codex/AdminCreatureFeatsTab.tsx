'use client';

import { useState } from 'react';
import {
  SectionHeader,
  SearchInput,
  LoadingState,
  ErrorDisplay as ErrorState,
  GridListRow,
  ListEmptyState as EmptyState,
  ListHeader,
} from '@/components/shared';
import { Modal, Button, Input } from '@/components/ui';
import { useCreatureFeats, type CreatureFeat } from '@/hooks';
import { useSort } from '@/hooks/use-sort';
import { useQueryClient } from '@tanstack/react-query';
import { createCodexDoc, updateCodexDoc, deleteCodexDoc } from './actions';
import { Pencil, X } from 'lucide-react';
import { IconButton } from '@/components/ui';

export function AdminCreatureFeatsTab() {
  const { data: creatureFeats, isLoading, error } = useCreatureFeats();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const { sortState, handleSort, sortItems } = useSort('name');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CreatureFeat | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const [form, setForm] = useState<{
    name: string;
    description: string;
    points: number | undefined;
    feat_lvl: number | undefined;
    lvl_req: number | undefined;
    mechanic: boolean;
  }>({
    name: '',
    description: '',
    points: undefined,
    feat_lvl: undefined,
    lvl_req: undefined,
    mechanic: false,
  });

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
    setForm({ name: '', description: '', points: undefined, feat_lvl: undefined, lvl_req: undefined, mechanic: false });
    setModalOpen(true);
  };

  const toOptNum = (v: unknown): number | undefined => {
    if (v == null || v === '') return undefined;
    const n = Number(v);
    return Number.isNaN(n) ? undefined : n;
  };
  const openEdit = (f: CreatureFeat) => {
    setEditing(f);
    setForm({
      name: f.name,
      description: f.description || '',
      points: toOptNum(f.points),
      feat_lvl: toOptNum(f.feat_lvl),
      lvl_req: toOptNum(f.lvl_req),
      mechanic: f.mechanic === true,
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
    const data: Record<string, unknown> = {
      name: form.name.trim(),
      description: form.description.trim(),
      // Store both points and feat_points for compatibility with existing data/CSV
      points: form.points ?? undefined,
      feat_points: form.points ?? undefined,
      feat_lvl: form.feat_lvl ?? undefined,
      lvl_req: form.lvl_req ?? undefined,
      mechanic: form.mechanic,
    };

    const id = form.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_-]/g, '').slice(0, 100) || `cf_${Date.now()}`;

    const result = editing
      ? await updateCodexDoc('codex_creature_feats', editing.id, data)
      : await createCodexDoc('codex_creature_feats', id, data);

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

  const handleInlineDelete = async (id: string, name: string) => {
    if (pendingDeleteId !== id) {
      setPendingDeleteId(id);
      return;
    }
    const result = await deleteCodexDoc('codex_creature_feats', id);
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ['codex'] });
      setPendingDeleteId(null);
    } else {
      alert(result.error);
      setPendingDeleteId(null);
    }
  };

  if (error) return <ErrorState message="Failed to load creature feats" />;

  return (
    <div>
      <SectionHeader title="Creature Feats" onAdd={openAdd} size="md" />
      <div className="mb-4 mt-2">
        <SearchInput value={search} onChange={setSearch} placeholder="Search creature feats..." />
      </div>

      <ListHeader
        columns={[
          { key: 'name', label: 'NAME' },
          { key: 'points', label: 'PTS' },
          { key: 'feat_lvl', label: 'FEAT LVL' },
          { key: 'lvl_req', label: 'REQ. LVL' },
          { key: '_actions', label: '', sortable: false as const },
        ]}
        gridColumns="1.5fr 0.5fr 0.5fr 0.5fr 40px"
        sortState={sortState}
        onSort={handleSort}
      />

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
                gridColumns="1.5fr 0.5fr 0.5fr 0.5fr 40px"
                columns={[
                  { key: 'Pts', value: String(f.points ?? '-') },
                  { key: 'Feat Lvl', value: f.feat_lvl != null && f.feat_lvl > 0 ? String(f.feat_lvl) : '-' },
                  { key: 'Req. Lvl', value: f.lvl_req != null && f.lvl_req > 0 ? String(f.lvl_req) : '-' },
                ]}
                rightSlot={
                  <div className="flex items-center gap-1 pr-2">
                    {pendingDeleteId === f.id ? (
                      <div className="flex items-center gap-1 text-xs">
                        <span className="text-red-600 font-medium whitespace-nowrap">Remove?</span>
                        <Button size="sm" variant="danger" onClick={() => handleInlineDelete(f.id, f.name)} className="text-xs px-2 py-0.5 h-6">Yes</Button>
                        <Button size="sm" variant="secondary" onClick={() => setPendingDeleteId(null)} className="text-xs px-2 py-0.5 h-6">No</Button>
                      </div>
                    ) : (
                      <>
                        <IconButton variant="ghost" size="sm" onClick={() => openEdit(f)} label="Edit">
                          <Pencil className="w-4 h-4" />
                        </IconButton>
                        <IconButton
                          variant="ghost"
                          size="sm"
                          onClick={() => setPendingDeleteId(f.id)}
                          label="Delete"
                          className="text-danger hover:text-danger-600 hover:bg-transparent"
                        >
                          <X className="w-4 h-4" />
                        </IconButton>
                      </>
                    )}
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
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Creature feat name"
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
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Feat Points</label>
              <Input
                type="number"
                min={0}
                value={form.points ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, points: e.target.value === '' ? undefined : parseInt(e.target.value, 10) ?? undefined }))}
                placeholder="No value"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Feat Level</label>
              <Input
                type="number"
                min={0}
                value={form.feat_lvl ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, feat_lvl: e.target.value === '' ? undefined : parseInt(e.target.value, 10) ?? undefined }))}
                placeholder="No value"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Required Creature Level</label>
              <Input
                type="number"
                min={0}
                value={form.lvl_req ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, lvl_req: e.target.value === '' ? undefined : parseInt(e.target.value, 10) ?? undefined }))}
                placeholder="No value"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 mt-2">
            <input
              type="checkbox"
              checked={form.mechanic}
              onChange={(e) => setForm((f) => ({ ...f, mechanic: e.target.checked }))}
            />
            <span className="text-sm text-text-secondary">Mechanic-only feat (not a normal selectable feat)</span>
          </label>
        </div>
      </Modal>
    </div>
  );
}
