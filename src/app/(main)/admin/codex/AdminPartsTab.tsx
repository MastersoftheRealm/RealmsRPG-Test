'use client';

import { useState } from 'react';
import { SectionHeader, SearchInput, LoadingState, ErrorDisplay as ErrorState, GridListRow, ListEmptyState as EmptyState } from '@/components/shared';
import { Modal, Button, Input } from '@/components/ui';
import { useParts, type Part } from '@/hooks';
import { useQueryClient } from '@tanstack/react-query';
import { createCodexDoc, updateCodexDoc, deleteCodexDoc } from './actions';
import { Pencil, Trash2 } from 'lucide-react';
import { IconButton } from '@/components/ui';

export function AdminPartsTab() {
  const { data: parts, isLoading, error } = useParts();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'power' | 'technique'>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<{ id: string; name: string; description: string; category: string; type: string; base_en: number; base_tp: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [form, setForm] = useState({ name: '', description: '', category: '', type: 'power' as 'power' | 'technique', base_en: 0, base_tp: 0 });

  const filtered = (parts || [])
    .filter(
      (p: Part) =>
        (!search || p.name.toLowerCase().includes(search.toLowerCase()) || p.description?.toLowerCase().includes(search.toLowerCase())) &&
        (typeFilter === 'all' || (p.type || 'power').toLowerCase() === typeFilter)
    );

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', description: '', category: '', type: 'power', base_en: 0, base_tp: 0 });
    setModalOpen(true);
  };

  const openEdit = (p: { id: string; name: string; description: string; category: string; type: string; base_en: number; base_tp: number }) => {
    setEditing(p);
    setForm({
      name: p.name,
      description: p.description || '',
      category: p.category || '',
      type: ((p.type || 'power').toLowerCase() === 'technique' ? 'technique' : 'power') as 'power' | 'technique',
      base_en: p.base_en ?? 0,
      base_tp: p.base_tp ?? 0,
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
      type: form.type,
      base_en: form.base_en,
      base_tp: form.base_tp,
    };

    const id = form.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_-]/g, '').slice(0, 100) || `part_${Date.now()}`;

    const result = editing ? await updateCodexDoc('codex_parts', editing.id, data) : await createCodexDoc('codex_parts', id, data);

    setSaving(false);
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ['codex', 'parts'] });
      queryClient.invalidateQueries({ queryKey: ['codex', 'power-parts'] });
      queryClient.invalidateQueries({ queryKey: ['codex', 'technique-parts'] });
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
    const result = await deleteCodexDoc('codex_parts', id);
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ['codex', 'parts'] });
      queryClient.invalidateQueries({ queryKey: ['codex', 'power-parts'] });
      queryClient.invalidateQueries({ queryKey: ['codex', 'technique-parts'] });
      closeModal();
    } else {
      alert(result.error);
    }
  };

  if (error) return <ErrorState message="Failed to load parts" />;

  return (
    <div>
      <SectionHeader title="Power & Technique Parts" onAdd={openAdd} size="md" />
      <div className="mb-4 mt-2 flex gap-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Search parts..." />
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as 'all' | 'power' | 'technique')} className="px-3 py-2 rounded-md border border-border bg-background text-text-primary">
          <option value="all">All Types</option>
          <option value="power">Power</option>
          <option value="technique">Technique</option>
        </select>
      </div>

      {isLoading ? (
        <LoadingState />
      ) : (
        <div className="border border-border rounded-lg overflow-hidden bg-surface">
          {filtered.map((p: Part) => (
            <div key={p.id} className="flex items-center border-t border-border first:border-t-0 hover:bg-surface-alt/50">
              <div className="flex-1 min-w-0">
                <GridListRow id={p.id} name={p.name} description={p.description || ''} columns={[{ key: 'Type', value: (p.type || 'power').charAt(0).toUpperCase() + (p.type || 'power').slice(1) }, { key: 'EN', value: String(p.base_en ?? '-') }, { key: 'TP', value: String(p.base_tp ?? '-') }]} />
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
            <EmptyState title="No parts found" description="Add one to get started." action={{ label: 'Add Part', onClick: openAdd }} size="sm" />
          )}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={closeModal} title={editing ? 'Edit Part' : 'Add Part'} size="lg"
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
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Part name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Part description" className="w-full min-h-[80px] px-3 py-2 rounded-md border border-border bg-background text-text-primary" rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Category</label>
              <Input value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} placeholder="e.g. Damage" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Type</label>
              <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as 'power' | 'technique' }))} className="w-full px-3 py-2 rounded-md border border-border bg-background text-text-primary">
                <option value="power">Power</option>
                <option value="technique">Technique</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Base EN</label>
              <Input type="number" min={0} step={0.5} value={form.base_en} onChange={(e) => setForm((f) => ({ ...f, base_en: parseFloat(e.target.value) || 0 }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Base TP</label>
              <Input type="number" min={0} step={0.5} value={form.base_tp} onChange={(e) => setForm((f) => ({ ...f, base_tp: parseFloat(e.target.value) || 0 }))} />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
