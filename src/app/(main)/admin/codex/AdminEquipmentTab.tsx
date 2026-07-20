'use client';

import { useMemo, useState } from 'react';
import {
  CodexBrowseListShell,
  ErrorDisplay as ErrorState,
  GridListRow,
  RealmsImageField,
} from '@/components/shared';
import { Modal, Button, Input, Textarea, IconButton, useToast } from '@/components/ui';
import { SelectFilter, FilterSection } from '@/components/shared/filters';
import { useEquipment } from '@/hooks';
import { useSort } from '@/hooks/use-sort';
import { useQueryClient } from '@tanstack/react-query';
import { createCodexDoc, updateCodexDoc, deleteCodexDoc } from './actions';
import { Pencil, Copy, X } from 'lucide-react';
import { formatDamageDisplay, formatListCellLabel } from '@/lib/utils';
import { metadataDescriptorChip } from '@/lib/chip/list-row-metadata';
import type { ChipData } from '@/components/shared/grid-list-row';
import { resolveListRowThumbnail } from '@/lib/list-row-image';

const COPY_NAME_SUFFIX = ' copy';

const EQUIPMENT_GRID_COLUMNS = '1.3fr 0.9fr 0.65fr 0.75fr 1fr 0.7fr 40px';

interface EquipmentListItem {
  id: string;
  name: string;
  description?: string;
  type?: string;
  category?: string;
  gold_cost?: number;
  currency?: number;
  rarity?: string;
  damage?: string;
  armor_value?: number;
  weight?: number;
  image_id?: string | null;
  image_url?: string | null;
}

interface EquipmentFilters {
  search: string;
  categoryFilter: string;
  rarityFilter: string;
}

export function AdminEquipmentTab() {
  const { showToast } = useToast();
  const { data: equipment, isLoading, error, refetch } = useEquipment();
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
  const [copySourceName, setCopySourceName] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    description: '',
    category: '',
    currency: 0,
    rarity: 'Common',
    imageId: null as string | null,
    imageUrl: null as string | null,
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
    setCopySourceName(null);
    setForm({ name: '', description: '', category: '', currency: 0, rarity: 'Common', imageId: null, imageUrl: null });
    setCategoryIsNew(false);
    setModalOpen(true);
  };

  const openDuplicate = (e: EquipmentListItem & { category?: string; currency?: number; rarity?: string }) => {
    setEditing(null);
    setCopySourceName(e.name);
    const cat = e.category || '';
    setForm({
      name: (e.name || '').trim() + COPY_NAME_SUFFIX,
      description: e.description || '',
      category: cat,
      currency: e.currency ?? e.gold_cost ?? 0,
      rarity: e.rarity || 'Common',
      imageId: e.image_id ?? null,
      imageUrl: e.image_url ?? null,
    });
    const existingCats = new Set((equipment || []).map((eq: EquipmentListItem) => eq.category).filter(Boolean));
    setCategoryIsNew(cat !== '' && !existingCats.has(cat));
    setModalOpen(true);
  };

  const openEdit = (e: EquipmentListItem & { category?: string; currency?: number; rarity?: string }) => {
    setEditing(e);
    setCopySourceName(null);
    const cat = e.category || '';
    setForm({
      name: e.name,
      description: e.description || '',
      category: cat,
      currency: e.currency ?? e.gold_cost ?? 0,
      rarity: e.rarity || 'Common',
      imageId: e.image_id ?? null,
      imageUrl: e.image_url ?? null,
    });
    const existingCats = new Set((equipment || []).map((eq: EquipmentListItem) => eq.category).filter(Boolean));
    setCategoryIsNew(cat !== '' && !existingCats.has(cat));
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
    // No type column in codex_equipment; do not send type.
    const data = {
      name: form.name.trim(),
      description: form.description.trim(),
      category: form.category.trim() || undefined,
      currency: form.currency,
      rarity: form.rarity.trim() || undefined,
      imageId: form.imageId,
      imageUrl: form.imageUrl,
    };

    const result = editing
      ? await updateCodexDoc('codex_equipment', editing.id, data)
      : await createCodexDoc('codex_equipment', undefined, data);

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
    const result = await deleteCodexDoc('codex_equipment', id);
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
    const result = await deleteCodexDoc('codex_equipment', id);
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ['codex'] });
      await queryClient.refetchQueries({ queryKey: ['codex'] });
      setPendingDeleteId(null);
    } else {
      showToast(result.error ?? 'Operation failed', 'error');
      setPendingDeleteId(null);
    }
  };

  if (error) return <ErrorState message="Failed to load equipment" onRetry={() => { void refetch(); }} />;

  return (
    <div>
      <CodexBrowseListShell
        sectionTitle="Equipment"
        onAdd={openAdd}
        search={filters.search}
        onSearchChange={(v) => setFilters((f) => ({ ...f, search: v }))}
        searchPlaceholder="Search equipment..."
        filters={
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
        }
        headerColumns={[
          { key: 'name', label: 'NAME' },
          { key: 'category', label: 'CATEGORY' },
          { key: 'cost', label: 'COST' },
          { key: 'rarity', label: 'RARITY' },
          { key: 'damage', label: 'DAMAGE' },
          { key: 'dr', label: 'DMG. RED.' },
          { key: '_actions', label: '', sortable: false as const },
        ]}
        gridColumns={EQUIPMENT_GRID_COLUMNS}
        sortState={sortState}
        onSort={handleSort}
        hasThumbnailColumn
        isLoading={isLoading}
        isEmpty={filteredEquipment.length === 0}
        emptyTitle="No equipment found"
        emptyMessage="No equipment matches your filters."
        emptyAction={{ label: 'Add Equipment', onClick: openAdd }}
      >
        {filteredEquipment.map((e: EquipmentListItem & { category: string; cost: number; rarity: string }) => {
              const detailSections: Array<{ label: string; chips: ChipData[]; hideLabelIfSingle?: boolean }> = [];
              if (e.weight !== undefined) {
                detailSections.push({
                  label: 'Details',
                  chips: [metadataDescriptorChip(`Weight ${e.weight} kg`)],
                  hideLabelIfSingle: true,
                });
              }
              return (
              <GridListRow
                key={e.id}
                id={e.id}
                name={e.name}
                description={e.description || ''}
                thumbnail={resolveListRowThumbnail('equipment', e, e.name)}
                gridColumns={EQUIPMENT_GRID_COLUMNS}
                columns={[
                  { key: 'Category', value: formatListCellLabel(e.category || 'equipment') },
                  {
                    key: 'Cost',
                    value: typeof e.cost === 'number' && !Number.isNaN(e.cost) ? `${e.cost} c` : '-',
                    highlight: true,
                  },
                  { key: 'Rarity', value: formatListCellLabel(e.rarity) },
                  {
                    key: 'Damage',
                    value: e.damage ? formatDamageDisplay(e.damage) : '-',
                    align: 'center' as const,
                  },
                  {
                    key: 'Dmg. Red.',
                    value: e.armor_value != null ? String(e.armor_value) : '-',
                    align: 'center' as const,
                  },
                ]}
                detailSections={detailSections.length > 0 ? detailSections : undefined}
                rightSlot={
                  <div className="flex items-center gap-1 pr-2">
                    {pendingDeleteId === e.id ? (
                      <div className="flex items-center gap-1 text-xs">
                        <span className="text-danger-700 dark:text-danger-400 font-medium whitespace-nowrap">Remove?</span>
                        <Button size="sm" variant="danger" onClick={() => handleInlineDelete(e.id)} className="text-xs px-2 py-0.5 h-6">Yes</Button>
                        <Button size="sm" variant="secondary" onClick={() => setPendingDeleteId(null)} className="text-xs px-2 py-0.5 h-6">No</Button>
                      </div>
                    ) : (
                      <>
                        <IconButton variant="ghost" size="sm" onClick={() => openEdit(e)} label="Edit" aria-label="Edit">
                          <Pencil className="w-4 h-4" />
                        </IconButton>
                        <IconButton variant="ghost" size="sm" onClick={() => openDuplicate(e)} label="Duplicate" aria-label="Duplicate">
                          <Copy className="w-4 h-4" />
                        </IconButton>
                        <IconButton
                          variant="ghost"
                          size="sm"
                          onClick={() => setPendingDeleteId(e.id)}
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
              );
            })}
      </CodexBrowseListShell>

      <Modal isOpen={modalOpen} onClose={closeModal} title={editing ? 'Edit Equipment' : 'Add Equipment'} size="full" fullScreenOnMobile
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
              Creating a copy of <strong className="text-text-primary">{copySourceName}</strong>. Change the name and details as needed, then save to add the new equipment.
            </p>
          )}
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
            <Textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Equipment description"
              className="min-h-[120px] resize-y"
              rows={4}
            />
          </div>
          <RealmsImageField
            categories="equipment"
            imageId={form.imageId}
            imageUrl={form.imageUrl}
            onChange={({ imageId, imageUrl }) =>
              setForm((f) => ({ ...f, imageId, imageUrl }))
            }
            entityName={form.name}
            label="Equipment card art"
          />
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
                aria-label="Category"
              >
                <option value="">None</option>
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
                step="any"
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
                aria-label="Rarity"
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
