'use client';

import { useState } from 'react';
import { SectionHeader, SearchInput, LoadingState, ErrorDisplay as ErrorState, GridListRow, ListEmptyState as EmptyState } from '@/components/shared';
import { Modal, Button, Input } from '@/components/ui';
import { useRTDBSkills } from '@/hooks';
import { useQueryClient } from '@tanstack/react-query';
import { createCodexDoc, updateCodexDoc, deleteCodexDoc } from './actions';
import { Pencil, Trash2 } from 'lucide-react';
import { IconButton } from '@/components/ui';

export function AdminSkillsTab() {
  const { data: skills, isLoading, error } = useRTDBSkills();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<{ id: string; name: string; description: string; ability: string; category: string; base_skill_id?: number; trained_only?: boolean } | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [form, setForm] = useState({ name: '', description: '', ability: '', category: '', base_skill_id: '', trained_only: false });

  const filtered = (skills || []).filter(
    (s) =>
      !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.description?.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', description: '', ability: '', category: '', base_skill_id: '', trained_only: false });
    setModalOpen(true);
  };

  const openEdit = (s: { id: string; name: string; description: string; ability: string; category: string; base_skill_id?: number; trained_only?: boolean }) => {
    setEditing(s);
    setForm({
      name: s.name,
      description: s.description || '',
      ability: s.ability || '',
      category: s.category || '',
      base_skill_id: s.base_skill_id != null ? String(s.base_skill_id) : '',
      trained_only: s.trained_only ?? false,
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
      ability: form.ability.trim(),
      category: form.category.trim(),
      base_skill_id: form.base_skill_id ? parseInt(form.base_skill_id) : undefined,
      trained_only: form.trained_only,
    };

    const id = form.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_-]/g, '').slice(0, 100) || `skill_${Date.now()}`;

    const result = editing
      ? await updateCodexDoc('codex_skills', editing.id, data)
      : await createCodexDoc('codex_skills', id, data);

    setSaving(false);
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ['codex', 'skills'] });
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
    const result = await deleteCodexDoc('codex_skills', id);
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ['codex', 'skills'] });
      closeModal();
    } else {
      alert(result.error);
    }
  };

  if (error) return <ErrorState message="Failed to load skills" />;

  return (
    <div>
      <SectionHeader title="Skills" onAdd={openAdd} size="md" />
      <div className="mb-4 mt-2">
        <SearchInput value={search} onChange={setSearch} placeholder="Search skills..." />
      </div>

      {isLoading ? (
        <LoadingState />
      ) : (
        <div className="border border-border rounded-lg overflow-hidden bg-surface">
          {filtered.map((s) => (
            <div key={s.id} className="flex items-center border-t border-border first:border-t-0 hover:bg-surface-alt/50">
              <div className="flex-1 min-w-0">
                <GridListRow id={s.id} name={s.name} description={s.description || ''} columns={[{ key: 'Ability', value: s.ability || '-' }, { key: 'Category', value: s.category || '-' }]} />
              </div>
              <div className="flex gap-1 pr-2">
                <IconButton variant="ghost" size="sm" onClick={() => openEdit(s)} label="Edit">
                  <Pencil className="w-4 h-4" />
                </IconButton>
                <IconButton variant="ghost" size="sm" onClick={() => openEdit(s)} label="Delete" className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30">
                  <Trash2 className="w-4 h-4" />
                </IconButton>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <EmptyState title="No skills found" description="Add one to get started." action={{ label: 'Add Skill', onClick: openAdd }} size="sm" />
          )}
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editing ? 'Edit Skill' : 'Add Skill'}
        size="lg"
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
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Skill name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Skill description" className="w-full min-h-[80px] px-3 py-2 rounded-md border border-border bg-background text-text-primary" rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Ability</label>
              <Input value={form.ability} onChange={(e) => setForm((f) => ({ ...f, ability: e.target.value }))} placeholder="e.g. Dexterity" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Category</label>
              <Input value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} placeholder="e.g. Physical" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Base skill ID (for sub-skills)</label>
              <Input value={form.base_skill_id} onChange={(e) => setForm((f) => ({ ...f, base_skill_id: e.target.value }))} placeholder="Number or empty" />
            </div>
            <label className="flex items-center gap-2 pt-8">
              <input type="checkbox" checked={form.trained_only} onChange={(e) => setForm((f) => ({ ...f, trained_only: e.target.checked }))} />
              <span className="text-sm text-text-secondary">Trained only</span>
            </label>
          </div>
        </div>
      </Modal>
    </div>
  );
}
