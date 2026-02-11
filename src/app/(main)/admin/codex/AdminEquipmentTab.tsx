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
import { Pencil, Trash2 } from 'lucide-react';
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
  const [editing, setEditing] = useState<{ id: string; name: string; description?: string; type?: string; gold_cost?: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [form, setForm] = useState({ name: '', description: '', type: 'equipment' as 'weapon' | 'armor' | 'equipment', gold_cost: 0 });

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
                  { key: 'Category', value: (e.category || e.type || 'equipment') as string },
                  { key: 'Cost', value: e.cost > 0 ? `${e.cost} c` : '-', highlight: true },
                  { key: 'Rarity', value: e.rarity || '-' },
                ]}
                rightSlot={
                  <div className="flex gap-1 shrink-0 pr-2">
                    <IconButton variant="ghost" size="sm" onClick={() => openEdit(e)} label="Edit">
                      <Pencil className="w-4 h-4" />
                    </IconButton>
                    <IconButton
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(e)}
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
