'use client';

import { useState } from 'react';
import {
  CodexBrowseListShell,
  ErrorDisplay as ErrorState,
  GridListRow,
} from '@/components/shared';
import { Modal, Button, Input, IconButton, useToast } from '@/components/ui';
import { useCreatureFeats, type CreatureFeat } from '@/hooks';
import { useSort } from '@/hooks/use-sort';
import { useQueryClient } from '@tanstack/react-query';
import { createCodexDoc, updateCodexDoc, deleteCodexDoc } from './actions';
import { formatCreatureLevel } from '@/lib/game';
import { Pencil, Copy, X } from 'lucide-react';

const COPY_NAME_SUFFIX = ' copy';

export function AdminCreatureFeatsTab() {
  const { showToast } = useToast();
  const { data: creatureFeats, isLoading, error, refetch } = useCreatureFeats();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const { sortState, handleSort, sortItems } = useSort('name');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CreatureFeat | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [copySourceName, setCopySourceName] = useState<string | null>(null);

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
    setCopySourceName(null);
    setForm({ name: '', description: '', points: undefined, feat_lvl: undefined, lvl_req: undefined, mechanic: false });
    setModalOpen(true);
  };

  const openDuplicate = (f: CreatureFeat) => {
    setEditing(null);
    setCopySourceName(f.name);
    setForm({
      name: (f.name || '').trim() + COPY_NAME_SUFFIX,
      description: f.description || '',
      points: toOptNum(f.points),
      feat_lvl: toOptNum(f.feat_lvl),
      lvl_req: toOptNum(f.lvl_req),
      mechanic: f.mechanic === true,
    });
    setModalOpen(true);
  };

  const toOptNum = (v: unknown): number | undefined => {
    if (v == null || v === '') return undefined;
    const n = Number(v);
    return Number.isNaN(n) ? undefined : n;
  };
  const openEdit = (f: CreatureFeat) => {
    setEditing(f);
    setCopySourceName(null);
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
    setCopySourceName(null);
    setDeleteConfirm(null);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    // Send only feat_points (DB column); form uses points for UX. Do not add redundant points key.
    const data: Record<string, unknown> = {
      name: form.name.trim(),
      description: form.description.trim(),
      feat_points: form.points ?? undefined,
      feat_lvl: form.feat_lvl ?? undefined,
      lvl_req: form.lvl_req ?? undefined,
      mechanic: form.mechanic,
    };

    const result = editing
      ? await updateCodexDoc('codex_creature_feats', editing.id, data)
      : await createCodexDoc('codex_creature_feats', undefined, data);

    setSaving(false);
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ['codex'] });
      await queryClient.refetchQueries({ queryKey: ['codex'] });
      closeModal();
    } else {
      showToast(result.error ?? 'Operation failed', 'error');
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
      await queryClient.refetchQueries({ queryKey: ['codex'] });
      closeModal();
    } else {
      showToast(result.error ?? 'Operation failed', 'error');
    }
  };

  const handleInlineDelete = async (id: string) => {
    if (pendingDeleteId !== id) {
      setPendingDeleteId(id);
      return;
    }
    const result = await deleteCodexDoc('codex_creature_feats', id);
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ['codex'] });
      await queryClient.refetchQueries({ queryKey: ['codex'] });
      setPendingDeleteId(null);
    } else {
      showToast(result.error ?? 'Operation failed', 'error');
      setPendingDeleteId(null);
    }
  };

  if (error) return <ErrorState message="Failed to load creature feats" onRetry={() => { void refetch(); }} />;

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
                  <div className="flex items-center gap-1 pr-2">
                    {pendingDeleteId === f.id ? (
                      <div className="flex items-center gap-1 text-xs">
                        <span className="text-danger-700 dark:text-danger-400 font-medium whitespace-nowrap">Remove?</span>
                        <Button size="sm" variant="danger" onClick={() => handleInlineDelete(f.id)} className="text-xs px-2 py-0.5 h-6">Yes</Button>
                        <Button size="sm" variant="secondary" onClick={() => setPendingDeleteId(null)} className="text-xs px-2 py-0.5 h-6">No</Button>
                      </div>
                    ) : (
                      <>
                        <IconButton variant="ghost" size="sm" onClick={() => openEdit(f)} label="Edit" aria-label="Edit">
                          <Pencil className="w-4 h-4" />
                        </IconButton>
                        <IconButton variant="ghost" size="sm" onClick={() => openDuplicate(f)} label="Duplicate" aria-label="Duplicate">
                          <Copy className="w-4 h-4" />
                        </IconButton>
                        <IconButton
                          variant="ghost"
                          size="sm"
                          onClick={() => setPendingDeleteId(f.id)}
                          label="Delete"
                          className="text-danger-fg hover:opacity-80 hover:bg-transparent"
                        >
                          <X className="w-4 h-4" />
                        </IconButton>
                      </>
                    )}
                  </div>
                }
              />
            ))}
      </CodexBrowseListShell>

      <Modal isOpen={modalOpen} onClose={closeModal} title={editing ? 'Edit Creature Feat' : 'Add Creature Feat'} size="full" fullScreenOnMobile
        footer={
          <div className="flex justify-between">
            <div>
              {editing && (
                <Button variant="outline" onClick={() => handleDelete(editing.id)} className={deleteConfirm === editing.id ? 'border-danger-500 text-danger-700 dark:text-danger-400' : ''}>
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
          {copySourceName && (
            <p className="text-sm text-text-secondary rounded-md bg-surface-alt px-3 py-2 border border-border-light">
              Creating a copy of <strong className="text-text-primary">{copySourceName}</strong>. Change the name and details as needed, then save to add the new creature feat.
            </p>
          )}
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
