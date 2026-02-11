'use client';

import { useState, useMemo } from 'react';
import { ChipSelect, FilterSection } from '@/components/codex';
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
import { useSpecies, useCodexSkills, type Species } from '@/hooks';
import { useQueryClient } from '@tanstack/react-query';
import { createCodexDoc, updateCodexDoc, deleteCodexDoc } from './actions';
import { Pencil, Trash2 } from 'lucide-react';
import { IconButton } from '@/components/ui';
import { useSort } from '@/hooks/use-sort';

type SpeciesEdit = { id: string; name: string; description: string; type: string; size: string; sizes: string[]; speed: number; skills?: string[] };

export function AdminSpeciesTab() {
  const { data: species, isLoading, error } = useSpecies();
  const { data: skills = [] } = useCodexSkills();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const { sortState, handleSort, sortItems } = useSort('name');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SpeciesEdit | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [form, setForm] = useState({ name: '', description: '', type: '', size: '', sizes: '', speed: 6, skills: [] as string[] });

  const skillOptions = useMemo(
    () => skills.map((s: { id: string; name: string }) => ({ value: s.name, label: s.name })),
    [skills],
  );

  const resolveSkillNames = (skillIdsOrNames: string[]): string[] =>
    skillIdsOrNames.map((s) => {
      const byId = skills.find((sk: { id: string }) => String(sk.id) === String(s));
      if (byId) return (byId as { name: string }).name;
      const byName = skills.find((sk: { name: string }) => sk.name === s);
      return byName ? (byName as { name: string }).name : s;
    });

  const [typeFilters, setTypeFilters] = useState<string[]>([]);
  const [sizeFilters, setSizeFilters] = useState<string[]>([]);

  const filterOptions = useMemo(() => {
    if (!species) return { types: [] as string[], sizes: [] as string[] };
    const types = new Set<string>();
    const sizes = new Set<string>();
    species.forEach((s: Species) => {
      if (s.type) types.add(s.type);
      s.sizes?.forEach((sz: string) => sizes.add(sz));
    });
    return {
      types: Array.from(types).sort(),
      sizes: Array.from(sizes).sort(),
    };
  }, [species]);

  const filtered = sortItems<Species>(
    (species || []).filter((s: Species) => {
      if (
        search &&
        !s.name.toLowerCase().includes(search.toLowerCase()) &&
        !s.description?.toLowerCase().includes(search.toLowerCase())
      ) {
        return false;
      }
      if (typeFilters.length > 0 && !typeFilters.includes(s.type)) return false;
      if (sizeFilters.length > 0 && !s.sizes?.some((sz: string) => sizeFilters.includes(sz))) return false;
      return true;
    }),
  );

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', description: '', type: '', size: 'Medium', sizes: 'Medium', speed: 6, skills: [] });
    setModalOpen(true);
  };

  const openEdit = (s: SpeciesEdit) => {
    setEditing(s);
    const rawSkills = (s as { skills?: string[] }).skills || [];
    const skillNames = resolveSkillNames(rawSkills);
    setForm({
      name: s.name,
      description: s.description || '',
      type: s.type || '',
      size: s.size || 'Medium',
      sizes: (s.sizes || []).join(', ') || s.size || 'Medium',
      speed: s.speed ?? 6,
      skills: skillNames,
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
    const sizes = form.sizes.split(',').map((x) => x.trim()).filter(Boolean);
    const data = {
      name: form.name.trim(),
      description: form.description.trim(),
      type: form.type.trim(),
      size: form.size.trim() || sizes[0] || 'Medium',
      sizes: sizes.length ? sizes : [form.size || 'Medium'],
      speed: form.speed,
      skills: form.skills,
    };

    const id = form.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_-]/g, '').slice(0, 100) || `species_${Date.now()}`;

    const result = editing ? await updateCodexDoc('codex_species', editing.id, data) : await createCodexDoc('codex_species', id, data);

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
    const result = await deleteCodexDoc('codex_species', id);
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ['codex'] });
      closeModal();
    } else {
      alert(result.error);
    }
  };

  if (error) return <ErrorState message="Failed to load species" />;

  return (
    <div>
      <SectionHeader title="Species" onAdd={openAdd} size="md" />
      <div className="mb-4 mt-2">
        <SearchInput value={search} onChange={setSearch} placeholder="Search species..." />
      </div>

      <FilterSection>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ChipSelect
            label="Type"
            placeholder="Choose type"
            options={filterOptions.types.map(t => ({ value: t, label: t }))}
            selectedValues={typeFilters}
            onSelect={(v) => setTypeFilters((prev) => [...prev, v])}
            onRemove={(v) => setTypeFilters((prev) => prev.filter(t => t !== v))}
          />

          <ChipSelect
            label="Size"
            placeholder="Choose size"
            options={filterOptions.sizes.map(s => ({ value: s, label: s }))}
            selectedValues={sizeFilters}
            onSelect={(v) => setSizeFilters((prev) => [...prev, v])}
            onRemove={(v) => setSizeFilters((prev) => prev.filter(s => s !== v))}
          />
        </div>
      </FilterSection>

      <div
        className="hidden lg:grid gap-2 px-4 py-3 bg-primary-50 border-b border-border-light rounded-t-lg font-semibold text-sm text-primary-700"
        style={{ gridTemplateColumns: '1.5fr 1fr 0.8fr 40px' }}
      >
        <SortHeader label="NAME" col="name" sortState={sortState} onSort={handleSort} />
        <SortHeader label="TYPE" col="type" sortState={sortState} onSort={handleSort} />
        <SortHeader label="SPEED" col="speed" sortState={sortState} onSort={handleSort} />
      </div>

      {isLoading ? (
        <LoadingState />
      ) : (
        <div className="flex flex-col gap-1 mt-2">
          {filtered.length === 0 ? (
            <EmptyState
              title="No species found"
              description="Add one to get started."
              action={{ label: 'Add Species', onClick: openAdd }}
              size="sm"
            />
          ) : (
            filtered.map((s: Species) => (
              <GridListRow
                key={s.id}
                id={s.id}
                name={s.name}
                description={s.description || ''}
                gridColumns="1.5fr 1fr 0.8fr 40px"
                columns={[
                  { key: 'Type', value: s.type || '-' },
                  { key: 'Speed', value: String(s.speed ?? '-') },
                ]}
                rightSlot={
                  <div className="flex gap-1 pr-2">
                    <IconButton variant="ghost" size="sm" onClick={() => openEdit(s)} label="Edit">
                      <Pencil className="w-4 h-4" />
                    </IconButton>
                    <IconButton
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(s)}
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

      <Modal isOpen={modalOpen} onClose={closeModal} title={editing ? 'Edit Species' : 'Add Species'} size="lg"
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
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Species name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Species description" className="w-full min-h-[80px] px-3 py-2 rounded-md border border-border bg-background text-text-primary" rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Type</label>
              <Input value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} placeholder="e.g. Humanoid" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Sizes (comma-separated)</label>
              <Input value={form.sizes} onChange={(e) => setForm((f) => ({ ...f, sizes: e.target.value }))} placeholder="Medium, Small" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Speed</label>
            <Input type="number" min={0} value={form.speed} onChange={(e) => setForm((f) => ({ ...f, speed: parseInt(e.target.value) || 0 }))} />
          </div>
          <div>
            <ChipSelect
              label="Skills"
              placeholder="Add skill"
              options={skillOptions}
              selectedValues={form.skills}
              onSelect={(v) => setForm((f) => ({ ...f, skills: [...f.skills, v] }))}
              onRemove={(v) => setForm((f) => ({ ...f, skills: f.skills.filter((s) => s !== v) }))}
            />
            <p className="text-xs text-text-muted mt-1">Species skills (by name). Add from dropdown.</p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
