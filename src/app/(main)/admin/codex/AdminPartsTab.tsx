'use client';

import { useMemo, useState } from 'react';
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
import { SelectFilter, FilterSection } from '@/components/codex';
import { useParts, type Part } from '@/hooks';
import { useSort } from '@/hooks/use-sort';
import { useQueryClient } from '@tanstack/react-query';
import { createCodexDoc, updateCodexDoc, deleteCodexDoc } from './actions';
import { Pencil, Trash2 } from 'lucide-react';
import { IconButton } from '@/components/ui';

const PART_GRID_COLUMNS = '1.5fr 1fr 0.8fr 0.8fr 40px';

interface PartFilters {
  search: string;
  categoryFilter: string;
  typeFilter: 'all' | 'power' | 'technique';
  mechanicMode: 'all' | 'only' | 'hide';
}

export function AdminPartsTab() {
  const { data: parts, isLoading, error } = useParts();
  const queryClient = useQueryClient();
  const { sortState, handleSort, sortItems } = useSort('name');
  const [filters, setFilters] = useState<PartFilters>({
    search: '',
    categoryFilter: '',
    typeFilter: 'all',
    mechanicMode: 'hide',
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<{ id: string; name: string; description: string; category: string; type: string; base_en: number; base_tp: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [form, setForm] = useState({ name: '', description: '', category: '', type: 'power' as 'power' | 'technique', base_en: 0, base_tp: 0 });

  const filterOptions = useMemo(() => {
    if (!parts) return { categories: [] as string[] };
    const categories = new Set<string>();
    parts.forEach((p: Part) => {
      if (p.category) categories.add(p.category);
    });
    return {
      categories: Array.from(categories).sort(),
    };
  }, [parts]);

  const filteredParts = useMemo(() => {
    if (!parts) return [];

    const filtered = parts.filter((p: Part) => {
      if (
        filters.search &&
        !p.name.toLowerCase().includes(filters.search.toLowerCase()) &&
        !p.description?.toLowerCase().includes(filters.search.toLowerCase())
      ) {
        return false;
      }
      if (filters.categoryFilter && p.category !== filters.categoryFilter) return false;

      if (filters.typeFilter !== 'all' && (p.type || 'power') !== filters.typeFilter) return false;

      if (filters.mechanicMode === 'only' && !p.mechanic) return false;
      if (filters.mechanicMode === 'hide' && p.mechanic) return false;

      return true;
    });

    type FilteredPart = Part & { category: string };
    return sortItems<FilteredPart>(filtered.map((p: Part) => ({ ...p, category: p.category || '' })));
  }, [parts, filters, sortItems]);

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
    const result = await deleteCodexDoc('codex_parts', id);
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ['codex'] });
      closeModal();
    } else {
      alert(result.error);
    }
  };

  if (error) return <ErrorState message="Failed to load parts" />;

  return (
    <div>
      <SectionHeader title="Power & Technique Parts" onAdd={openAdd} size="md" />
      <div className="mb-4 mt-2">
        <SearchInput
          value={filters.search}
          onChange={(v) => setFilters(f => ({ ...f, search: v }))}
          placeholder="Search parts..."
        />
      </div>

      <FilterSection>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <SelectFilter
            label="Category"
            value={filters.categoryFilter}
            options={filterOptions.categories.map(c => ({ value: c, label: c }))}
            onChange={(v) => setFilters(f => ({ ...f, categoryFilter: v }))}
            placeholder="All Categories"
          />

          <SelectFilter
            label="Type"
            value={filters.typeFilter}
            options={[
              { value: 'all', label: 'All' },
              { value: 'power', label: 'Power' },
              { value: 'technique', label: 'Technique' },
            ]}
            onChange={(v) => setFilters(f => ({ ...f, typeFilter: v as 'all' | 'power' | 'technique' }))}
            placeholder="All"
          />

          <SelectFilter
            label="Mechanics"
            value={filters.mechanicMode}
            options={[
              { value: 'all', label: 'All Parts' },
              { value: 'only', label: 'Only Mechanics' },
              { value: 'hide', label: 'Hide Mechanics' },
            ]}
            onChange={(v) => setFilters(f => ({ ...f, mechanicMode: v as 'all' | 'only' | 'hide' }))}
            placeholder="Hide Mechanics"
          />
        </div>
      </FilterSection>

      <div
        className="hidden lg:grid gap-2 px-4 py-3 bg-primary-50 border-b border-border-light rounded-t-lg font-semibold text-sm text-primary-700"
        style={{ gridTemplateColumns: PART_GRID_COLUMNS }}
      >
        <SortHeader label="NAME" col="name" sortState={sortState} onSort={handleSort} />
        <SortHeader label="CATEGORY" col="category" sortState={sortState} onSort={handleSort} />
        <span>ENERGY</span>
        <span>TP</span>
      </div>

      {isLoading ? (
        <LoadingState />
      ) : (
        <div className="flex flex-col gap-1 mt-2">
          {filteredParts.length === 0 ? (
            <EmptyState
              title="No parts found"
              description="No parts match your filters."
              action={{ label: 'Add Part', onClick: openAdd }}
              size="sm"
            />
          ) : (
            filteredParts.map((p: Part) => (
              <GridListRow
                key={p.id}
                id={p.id}
                name={p.name}
                description={p.description || ''}
                gridColumns={PART_GRID_COLUMNS}
                columns={[
                  { key: 'Type', value: (p.type || 'power').charAt(0).toUpperCase() + (p.type || 'power').slice(1) },
                  { key: 'EN', value: p.base_en != null ? String(p.base_en) : '-', className: 'text-blue-600' },
                  { key: 'TP', value: p.base_tp != null ? String(p.base_tp) : '-', className: 'text-tp' },
                ]}
                rightSlot={
                  <div className="flex gap-1 pr-2">
                    <IconButton variant="ghost" size="sm" onClick={() => openEdit(p)} label="Edit">
                      <Pencil className="w-4 h-4" />
                    </IconButton>
                    <IconButton
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(p)}
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
