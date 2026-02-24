'use client';

import { useState } from 'react';
import {
  SectionHeader,
  SearchInput,
  ListHeader,
  LoadingState,
  ErrorDisplay as ErrorState,
  GridListRow,
  ListEmptyState as EmptyState,
} from '@/components/shared';
import { Modal, Button, Input } from '@/components/ui';
import { useTraits, type Trait } from '@/hooks';
import { useSort } from '@/hooks/use-sort';

const ADMIN_TRAIT_GRID = '1.5fr 0.6fr 0.6fr 0.6fr 40px';
const ADMIN_TRAIT_COLUMNS = [
  { key: 'name', label: 'NAME' },
  { key: 'uses_per_rec', label: 'USES' },
  { key: 'rec_period', label: 'RECOVERY' },
  { key: 'choice', label: 'CHOICE' },
  { key: '_actions', label: '', sortable: false as const },
];
import { useQueryClient } from '@tanstack/react-query';
import { createCodexDoc, updateCodexDoc, deleteCodexDoc } from './actions';
import { Pencil, X } from 'lucide-react';
import { IconButton } from '@/components/ui';

export function AdminTraitsTab() {
  const { data: traits, isLoading, error } = useTraits();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const { sortState, handleSort, sortItems } = useSort('name');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Trait | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    description: '',
    uses_per_rec: '',
    rec_period: '',
    flaw: false,
    characteristic: false,
    option_trait_ids: [] as string[],
  });

  const filtered = sortItems<Trait>(
    (traits || []).filter(
      (t: Trait) =>
        !search ||
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.description?.toLowerCase().includes(search.toLowerCase()),
    ),
  );

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', description: '', uses_per_rec: '', rec_period: '', flaw: false, characteristic: false, option_trait_ids: [] });
    setModalOpen(true);
  };

  const openEdit = (t: Trait) => {
    setEditing(t);
    setForm({
      name: t.name,
      description: t.description || '',
      uses_per_rec: t.uses_per_rec != null ? String(t.uses_per_rec) : '',
      rec_period: t.rec_period || '',
      flaw: t.flaw === true,
      characteristic: t.characteristic === true,
      option_trait_ids: Array.isArray(t.option_trait_ids) ? [...t.option_trait_ids] : [],
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
    const uses_per_rec = form.uses_per_rec ? parseInt(form.uses_per_rec, 10) || 0 : undefined;
    const rec_period = form.rec_period.trim() || undefined;
    const data: Record<string, unknown> = {
      name: form.name.trim(),
      description: form.description.trim(),
      uses_per_rec,
      rec_period,
      flaw: form.flaw,
      characteristic: form.characteristic,
      option_trait_ids: form.option_trait_ids.length > 0 ? form.option_trait_ids : undefined,
    };

    const id = form.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_-]/g, '').slice(0, 100) || `trait_${Date.now()}`;

    const result = editing
      ? await updateCodexDoc('codex_traits', editing.id, data)
      : await createCodexDoc('codex_traits', id, data);

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
    const result = await deleteCodexDoc('codex_traits', id);
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
    const result = await deleteCodexDoc('codex_traits', id);
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ['codex'] });
      setPendingDeleteId(null);
    } else {
      alert(result.error);
      setPendingDeleteId(null);
    }
  };

  if (error) return <ErrorState message="Failed to load traits" />;

  return (
    <div>
      <SectionHeader title="Traits" onAdd={openAdd} size="md" />
      <div className="mb-4 mt-2">
        <SearchInput value={search} onChange={setSearch} placeholder="Search traits..." />
      </div>

      <ListHeader
        columns={ADMIN_TRAIT_COLUMNS}
        gridColumns={ADMIN_TRAIT_GRID}
        sortState={sortState}
        onSort={handleSort}
      />

      {isLoading ? (
        <LoadingState />
      ) : (
        <div className="flex flex-col gap-1 mt-2">
          {filtered.length === 0 ? (
            <EmptyState
              title="No traits found"
              description="Add one to get started."
              action={{ label: 'Add Trait', onClick: openAdd }}
              size="sm"
            />
          ) : (
            filtered.map((t: Trait) => (
              <GridListRow
                key={t.id}
                id={t.id}
                name={t.name}
                description={t.description || ''}
                gridColumns="1.5fr 0.6fr 0.6fr 0.6fr 40px"
                columns={[
                  { key: 'Uses', value: t.uses_per_rec != null && t.uses_per_rec > 0 ? String(t.uses_per_rec) : '-' },
                  { key: 'Recovery', value: t.rec_period || '-' },
                  { key: 'Choice', value: t.option_trait_ids?.length ? `Yes (${t.option_trait_ids.length})` : '-' },
                ]}
                rightSlot={
                  <div className="flex items-center gap-1 pr-2">
                    {pendingDeleteId === t.id ? (
                      <div className="flex items-center gap-1 text-xs">
                        <span className="text-red-600 font-medium whitespace-nowrap">Remove?</span>
                        <Button size="sm" variant="danger" onClick={() => handleInlineDelete(t.id, t.name)} className="text-xs px-2 py-0.5 h-6">Yes</Button>
                        <Button size="sm" variant="secondary" onClick={() => setPendingDeleteId(null)} className="text-xs px-2 py-0.5 h-6">No</Button>
                      </div>
                    ) : (
                      <>
                        <IconButton variant="ghost" size="sm" onClick={() => openEdit(t)} label="Edit">
                          <Pencil className="w-4 h-4" />
                        </IconButton>
                        <IconButton
                          variant="ghost"
                          size="sm"
                          onClick={() => setPendingDeleteId(t.id)}
                          label="Delete"
                          className="text-danger dark:text-danger-400 hover:text-danger-600 dark:hover:text-danger-300 hover:bg-transparent"
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

      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editing ? 'Edit Trait' : 'Add Trait'}
        size="lg"
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
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Trait name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Trait description"
              className="w-full min-h-[80px] px-3 py-2 rounded-md border border-border bg-background text-text-primary"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Uses per Recovery</label>
              <Input
                type="number"
                min={0}
                value={form.uses_per_rec}
                onChange={(e) => setForm((f) => ({ ...f, uses_per_rec: e.target.value }))}
                placeholder="No value"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Recovery Period</label>
              <select
                value={form.rec_period}
                onChange={(e) => setForm((f) => ({ ...f, rec_period: e.target.value }))}
                className="w-full px-3 py-2 rounded-md border border-border bg-background text-text-primary"
                aria-label="Recovery period"
              >
                <option value="">—</option>
                <option value="Full">Full</option>
                <option value="Partial">Partial</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.flaw}
                onChange={(e) => setForm((f) => ({ ...f, flaw: e.target.checked }))}
              />
              <span className="text-sm text-text-secondary">Flaw</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.characteristic}
                onChange={(e) => setForm((f) => ({ ...f, characteristic: e.target.checked }))}
              />
              <span className="text-sm text-text-secondary">Characteristic</span>
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Choice trait options</label>
            <p className="text-xs text-text-muted dark:text-text-secondary mb-2">
              When set, this trait becomes a choice trait: the player selects it then picks one option from this list. Leave empty for a normal trait.
            </p>
            <div className="max-h-40 overflow-y-auto border border-border rounded-lg p-2 space-y-1 bg-surface-alt">
              {(traits || []).filter((other: Trait) => other.id !== (editing?.id ?? '')).map((other: Trait) => {
                const checked = form.option_trait_ids.includes(other.id);
                return (
                  <label key={other.id} className="flex items-center gap-2 cursor-pointer hover:bg-surface rounded px-2 py-1">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        if (e.target.checked) setForm((f) => ({ ...f, option_trait_ids: [...f.option_trait_ids, other.id] }));
                        else setForm((f) => ({ ...f, option_trait_ids: f.option_trait_ids.filter((id) => id !== other.id) }));
                      }}
                    />
                    <span className="text-sm text-text-primary">{other.name}</span>
                  </label>
                );
              })}
              {(traits || []).filter((other: Trait) => other.id !== (editing?.id ?? '')).length === 0 && (
                <p className="text-xs text-text-muted py-2">No other traits to add as options. Create traits first.</p>
              )}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
