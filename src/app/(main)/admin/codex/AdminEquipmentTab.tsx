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
import { useEquipment } from '@/hooks';
import { useSort } from '@/hooks/use-sort';
import { useQueryClient } from '@tanstack/react-query';
import { createCodexDoc, updateCodexDoc, deleteCodexDoc } from './actions';
import { Pencil, X } from 'lucide-react';
import { IconButton } from '@/components/ui';

const EQUIPMENT_GRID_COLUMNS = '1.5fr 1fr 0.8fr 1fr 40px';

interface EquipmentListItem {
  id: string;
  name: string;
  description?: string;
  type?: string;
  category?: string;
  gold_cost?: number;
  currency?: number;
  rarity?: string;
}

interface EquipmentFilters {
  search: string;
  categoryFilter: string;
  rarityFilter: string;
}

export function AdminEquipmentTab() {
  const { data: equipment, isLoading, error } = useEquipment();
  const queryClient = useQueryClient();
  const { sortState, handleSort, sortItems } = useSort('name');
  const [filters, setFilters] = useState<EquipmentFilters>({
    search: '',
    categoryFilter: '',
    rarityFilter: '',
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<EquipmentListItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    description: '',
    category: '',
    currency: 0,
    rarity: 'Common',
  });
  const [categoryIsNew, setCategoryIsNew] = useState(false);

  const filterOptions = useMemo(() => {
    if (!equipment) return { categories: [] as string[], rarities: [] as string[] };
    const categories = new Set<string>();
    const rarities = new Set<string>();
    equipment.forEach((e: EquipmentListItem) => {
      if (e.category) categories.add(e.category);
      if (e.rarity) rarities.add(e.rarity);
    });
    return {
      categories: Array.from(categories).sort(),
      rarities: Array.from(rarities).sort(),
    };
  }, [equipment]);

  const filteredEquipment = useMemo(() => {
    if (!equipment) return [];

    const filtered = equipment.filter((e: EquipmentListItem) => {
      if (
        filters.search &&
        !e.name.toLowerCase().includes(filters.search.toLowerCase()) &&
        !e.description?.toLowerCase().includes(filters.search.toLowerCase())
      ) {
        return false;
      }
      if (filters.categoryFilter && e.category !== filters.categoryFilter) return false;
      if (filters.rarityFilter && e.rarity !== filters.rarityFilter) return false;
      return true;
    });

    type FilteredItem = EquipmentListItem & { category: string; cost: number; rarity: string };
    return sortItems<FilteredItem>(
      filtered.map((e: EquipmentListItem) => ({
        ...e,
        category: e.category || '',
        cost: e.currency ?? e.gold_cost ?? 0,
        rarity: e.rarity || '',
      })),
    );
  }, [equipment, filters, sortItems]);

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', description: '', category: '', currency: 0, rarity: 'Common' });
    setCategoryIsNew(false);
    setModalOpen(true);
  };

  const openEdit = (e: EquipmentListItem & { category?: string; currency?: number; rarity?: string }) => {
    setEditing(e);
    const cat = e.category || '';
    setForm({
      name: e.name,
      description: e.description || '',
      category: cat,
      currency: e.currency ?? e.gold_cost ?? 0,
      rarity: e.rarity || 'Common',
    });
    const existingCats = new Set((equipment || []).map((eq: EquipmentListItem) => eq.category).filter(Boolean));
    setCategoryIsNew(cat !== '' && !existingCats.has(cat));
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
      // Equipment items are generic equipment, not weapons/armor
      type: 'equipment',
      category: form.category.trim() || undefined,
      currency: form.currency,
      rarity: form.rarity.trim() || undefined,
    };

    const id = form.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_-]/g, '').slice(0, 100) || `equip_${Date.now()}`;

    const result = editing ? await updateCodexDoc('codex_equipment', editing.id, data) : await createCodexDoc('codex_equipment', id, data);

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
    const result = await deleteCodexDoc('codex_equipment', id);
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
    const result = await deleteCodexDoc('codex_equipment', id);
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ['codex'] });
      setPendingDeleteId(null);
    } else {
      alert(result.error);
      setPendingDeleteId(null);
    }
  };

  if (error) return <ErrorState message="Failed to load equipment" />;

  return (
    <div>
      <SectionHeader title="Equipment" onAdd={openAdd} size="md" />
      <div className="mb-4 mt-2">
        <SearchInput
          value={filters.search}
          onChange={(v) => setFilters(f => ({ ...f, search: v }))}
          placeholder="Search equipment..."
        />
      </div>

      <FilterSection>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <SelectFilter
            label="Category"
            value={filters.categoryFilter}
            options={filterOptions.categories.map(c => ({ value: c, label: c }))}
            onChange={(v) => setFilters(f => ({ ...f, categoryFilter: v }))}
            placeholder="All Categories"
          />
          <SelectFilter
            label="Rarity"
            value={filters.rarityFilter}
            options={filterOptions.rarities.map(r => ({ value: r, label: r }))}
            onChange={(v) => setFilters(f => ({ ...f, rarityFilter: v }))}
            placeholder="All Rarities"
          />
        </div>
      </FilterSection>

      <div
        className="hidden lg:grid gap-2 px-4 py-3 bg-primary-50 border-b border-border-light rounded-t-lg font-semibold text-sm text-primary-700"
        style={{ gridTemplateColumns: EQUIPMENT_GRID_COLUMNS }}
      >
        <SortHeader label="NAME" col="name" sortState={sortState} onSort={handleSort} />
        <SortHeader label="CATEGORY" col="category" sortState={sortState} onSort={handleSort} />
        <SortHeader label="COST" col="cost" sortState={sortState} onSort={handleSort} />
        <SortHeader label="RARITY" col="rarity" sortState={sortState} onSort={handleSort} />
      </div>

      {isLoading ? (
        <LoadingState />
      ) : (
        <div className="flex flex-col gap-1 mt-2">
          {filteredEquipment.length === 0 ? (
            <EmptyState
              title="No equipment found"
              description="No equipment matches your filters."
              action={{ label: 'Add Equipment', onClick: openAdd }}
              size="sm"
            />
          ) : (
            filteredEquipment.map((e: EquipmentListItem & { category: string; cost: number; rarity: string }) => (
              <GridListRow
                key={e.id}
                id={e.id}
                name={e.name}
                description={e.description || ''}
                gridColumns={EQUIPMENT_GRID_COLUMNS}
                columns={[
                  { key: 'Category', value: (e.category || 'Equipment') as string },
                  { key: 'Cost', value: e.cost > 0 ? `${e.cost} c` : '-', highlight: true },
                  { key: 'Rarity', value: e.rarity || '-' },
                ]}
                rightSlot={
                  <div className="flex items-center gap-1 pr-2">
                    {pendingDeleteId === e.id ? (
                      <div className="flex items-center gap-1 text-xs">
                        <span className="text-red-600 font-medium whitespace-nowrap">Remove?</span>
                        <Button size="sm" variant="danger" onClick={() => handleInlineDelete(e.id, e.name)} className="text-xs px-2 py-0.5 h-6">Yes</Button>
                        <Button size="sm" variant="secondary" onClick={() => setPendingDeleteId(null)} className="text-xs px-2 py-0.5 h-6">No</Button>
                      </div>
                    ) : (
                      <>
                        <IconButton variant="ghost" size="sm" onClick={() => openEdit(e)} label="Edit">
                          <Pencil className="w-4 h-4" />
                        </IconButton>
                        <IconButton
                          variant="ghost"
                          size="sm"
                          onClick={() => setPendingDeleteId(e.id)}
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
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Equipment name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Equipment description"
              className="w-full min-h-[80px] px-3 py-2 rounded-md border border-border bg-background text-text-primary"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1">
              <label className="block text-sm font-medium text-text-secondary mb-1">Category</label>
              <select
                value={categoryIsNew ? '__new__' : (form.category || '')}
                onChange={(e) => {
                  const v = e.target.value;
                  setCategoryIsNew(v === '__new__');
                  setForm((f) => ({ ...f, category: v === '__new__' ? '' : v }));
                }}
                className="w-full px-3 py-2 rounded-md border border-border bg-background text-text-primary"
              >
                <option value="">— None —</option>
                {filterOptions.categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
                <option value="__new__">Add new category...</option>
              </select>
              {categoryIsNew && (
                <Input
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  placeholder="Type new category"
                  className="mt-2"
                />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Currency Cost</label>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={form.currency}
                onChange={(e) => setForm((f) => ({ ...f, currency: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Rarity</label>
              <select
                value={form.rarity}
                onChange={(e) => setForm((f) => ({ ...f, rarity: e.target.value }))}
                className="w-full px-3 py-2 rounded-md border border-border bg-background text-text-primary"
              >
                {['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythic', 'Ascended'].map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
