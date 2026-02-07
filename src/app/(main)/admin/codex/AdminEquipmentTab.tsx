'use client';

import { useState } from 'react';
import { SectionHeader, SearchInput, LoadingState, ErrorDisplay as ErrorState, GridListRow, ListEmptyState as EmptyState } from '@/components/shared';
import { Modal, Button, Input } from '@/components/ui';
import { useEquipment } from '@/hooks';
import { useQueryClient } from '@tanstack/react-query';
import { createCodexDoc, updateCodexDoc, deleteCodexDoc } from './actions';
import { Pencil, Trash2 } from 'lucide-react';
import { IconButton } from '@/components/ui';

export function AdminEquipmentTab() {
  const { data: equipment, isLoading, error } = useEquipment();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'weapon' | 'armor' | 'equipment'>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<{ id: string; name: string; description?: string; type?: string; gold_cost?: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [form, setForm] = useState({ name: '', description: '', type: 'equipment' as 'weapon' | 'armor' | 'equipment', gold_cost: 0 });

  const filtered = (equipment || []).filter(
    (e: { id: string; name: string; description?: string; type?: string }) =>
      (!search || e.name.toLowerCase().includes(search.toLowerCase()) || e.description?.toLowerCase().includes(search.toLowerCase())) &&
      (typeFilter === 'all' || (e.type || 'equipment') === typeFilter)
  );

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', description: '', type: 'equipment', gold_cost: 0 });
    setModalOpen(true);
  };

  const openEdit = (e: { id: string; name: string; description?: string; type?: string; gold_cost?: number }) => {
    setEditing(e);
    setForm({
      name: e.name,
      description: e.description || '',
      type: (e.type || 'equipment') as 'weapon' | 'armor' | 'equipment',
      gold_cost: e.gold_cost ?? 0,
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
      type: form.type,
      gold_cost: form.gold_cost,
      currency: form.gold_cost,
      properties: [],
    };

    const id = form.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_-]/g, '').slice(0, 100) || `equip_${Date.now()}`;

    const result = editing ? await updateCodexDoc('codex_equipment', editing.id, data) : await createCodexDoc('codex_equipment', id, data);

    setSaving(false);
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ['codex', 'equipment'] });
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
    const result = await deleteCodexDoc('codex_equipment', id);
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ['codex', 'equipment'] });
      closeModal();
    } else {
      alert(result.error);
    }
  };

  if (error) return <ErrorState message="Failed to load equipment" />;

  return (
    <div>
      <SectionHeader title="Equipment" onAdd={openAdd} size="md" />
      <div className="mb-4 mt-2 flex gap-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Search equipment..." />
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as 'all' | 'weapon' | 'armor' | 'equipment')} className="px-3 py-2 rounded-md border border-border bg-background text-text-primary">
          <option value="all">All Types</option>
          <option value="weapon">Weapon</option>
          <option value="armor">Armor</option>
          <option value="equipment">Equipment</option>
        </select>
      </div>

      {isLoading ? (
        <LoadingState />
      ) : (
        <div className="border border-border rounded-lg overflow-hidden bg-surface">
          {filtered.map((e: { id: string; name: string; description?: string; type?: string; gold_cost?: number }) => (
            <div key={e.id} className="flex items-center border-t border-border first:border-t-0 hover:bg-surface-alt/50">
              <div className="flex-1 min-w-0">
                <GridListRow id={e.id} name={e.name} description={e.description || ''} columns={[{ key: 'Type', value: (e.type || 'equipment') as string }, { key: 'Cost', value: `${e.gold_cost ?? 0} c` }]} />
              </div>
              <div className="flex gap-1 pr-2">
                <IconButton variant="ghost" size="sm" onClick={() => openEdit(e)} label="Edit">
                  <Pencil className="w-4 h-4" />
                </IconButton>
                <IconButton variant="ghost" size="sm" onClick={() => openEdit(e)} label="Delete" className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30">
                  <Trash2 className="w-4 h-4" />
                </IconButton>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <EmptyState title="No equipment found" description="Add one to get started." action={{ label: 'Add Equipment', onClick: openAdd }} size="sm" />
          )}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={closeModal} title={editing ? 'Edit Equipment' : 'Add Equipment'} size="lg"
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
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Equipment name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Equipment description" className="w-full min-h-[80px] px-3 py-2 rounded-md border border-border bg-background text-text-primary" rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Type</label>
              <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as 'weapon' | 'armor' | 'equipment' }))} className="w-full px-3 py-2 rounded-md border border-border bg-background text-text-primary">
                <option value="weapon">Weapon</option>
                <option value="armor">Armor</option>
                <option value="equipment">Equipment</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Currency Cost</label>
              <Input type="number" min={0} value={form.gold_cost} onChange={(e) => setForm((f) => ({ ...f, gold_cost: parseInt(e.target.value) || 0 }))} />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
