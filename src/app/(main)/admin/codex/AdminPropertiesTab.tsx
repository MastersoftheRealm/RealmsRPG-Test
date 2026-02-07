'use client';

import { useState } from 'react';
import { SectionHeader, SearchInput, LoadingState, ErrorDisplay as ErrorState, GridListRow, ListEmptyState as EmptyState } from '@/components/shared';
import { Modal, Button, Input } from '@/components/ui';
import { useItemProperties } from '@/hooks';
import { useQueryClient } from '@tanstack/react-query';
import { createCodexDoc, updateCodexDoc, deleteCodexDoc } from './actions';
import { Pencil, Trash2 } from 'lucide-react';
import { IconButton } from '@/components/ui';

export function AdminPropertiesTab() {
  const { data: properties, isLoading, error } = useItemProperties();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<{ id: string; name: string; description: string; type?: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [form, setForm] = useState({ name: '', description: '', type: 'general' });

  const filtered = (properties || []).filter(
    (p) =>
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', description: '', type: 'general' });
    setModalOpen(true);
  };

  const openEdit = (p: { id: string; name: string; description: string; type?: string }) => {
    setEditing(p);
    setForm({ name: p.name, description: p.description || '', type: (p.type as string) || 'general' });
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
    const data = { name: form.name.trim(), description: form.description.trim(), type: form.type };

    const id = form.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_-]/g, '').slice(0, 100) || `prop_${Date.now()}`;

    const result = editing ? await updateCodexDoc('codex_properties', editing.id, data) : await createCodexDoc('codex_properties', id, data);

    setSaving(false);
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ['codex', 'properties'] });
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
    const result = await deleteCodexDoc('codex_properties', id);
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ['codex', 'properties'] });
      closeModal();
    } else {
      alert(result.error);
    }
  };

  if (error) return <ErrorState message="Failed to load properties" />;

  return (
    <div>
      <SectionHeader title="Armament Properties" onAdd={openAdd} size="md" />
      <div className="mb-4 mt-2">
        <SearchInput value={search} onChange={setSearch} placeholder="Search properties..." />
      </div>

      {isLoading ? (
        <LoadingState />
      ) : (
        <div className="border border-border rounded-lg overflow-hidden bg-surface">
          {filtered.map((p) => (
            <div key={p.id} className="flex items-center border-t border-border first:border-t-0 hover:bg-surface-alt/50">
              <div className="flex-1 min-w-0">
                <GridListRow id={p.id} name={p.name} description={p.description || ''} columns={[{ key: 'Type', value: (p.type || 'general') as string }]} />
              </div>
              <div className="flex gap-1 pr-2">
                <IconButton variant="ghost" size="sm" onClick={() => openEdit(p)} label="Edit">
                  <Pencil className="w-4 h-4" />
                </IconButton>
                <IconButton variant="ghost" size="sm" onClick={() => openEdit(p)} label="Delete" className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30">
                  <Trash2 className="w-4 h-4" />
                </IconButton>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <EmptyState title="No properties found" description="Add one to get started." action={{ label: 'Add Property', onClick: openAdd }} size="sm" />
          )}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={closeModal} title={editing ? 'Edit Property' : 'Add Property'} size="lg"
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
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Property name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Property description" className="w-full min-h-[80px] px-3 py-2 rounded-md border border-border bg-background text-text-primary" rows={3} />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Type</label>
            <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} className="w-full px-3 py-2 rounded-md border border-border bg-background text-text-primary">
              <option value="general">General</option>
              <option value="weapon">Weapon</option>
              <option value="armor">Armor</option>
              <option value="shield">Shield</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
}
