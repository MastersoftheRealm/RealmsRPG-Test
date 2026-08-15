'use client';

import { useMemo, useState } from 'react';
import {
  CodexBrowseListShell,
  ErrorDisplay as ErrorState,
  GridListRow,
  RealmsImageField,
} from '@/components/shared';
import { Modal, Button, Input, Textarea, IconButton, useToast } from '@/components/ui';
import { SelectFilter, ArchetypePathFilter } from '@/components/shared/filters';
import { useEquipment, usePathListFilter } from '@/hooks';
import { useSort } from '@/hooks/use-sort';
import { useQueryClient } from '@tanstack/react-query';
import { createCodexDoc, updateCodexDoc } from './actions';
import { AdminCodexDeleteReferenceModal, useAdminCodexDelete } from './use-admin-codex-delete';
import { Pencil, Copy, X } from 'lucide-react';
import { resolveListRowThumbnail } from '@/lib/list-row-image';
import {
  buildCodexEquipmentColumns,
  buildCodexEquipmentDetailSections,
  collectCodexEquipmentFilterOptions,
  CODEX_EQUIPMENT_HEADER_COLUMNS,
  EQUIPMENT_GRID_COLUMNS,
  filterCodexEquipment,
  type CodexEquipmentListFilters,
} from '@/lib/codex/equipment-list';
import type { CodexEquipmentItem } from '@/types/codex';
import { EMPTY_ARMAMENT_FILTERS } from '@/lib/library/armament-filters';
import {
  EQUIPMENT_LIST_PATH_KINDS,
  pathChipLabelsForEntity,
  pathFilterEmptyTitle,
} from '@/lib/game/path-recommendation-index';

const COPY_NAME_SUFFIX = ' copy';

export function AdminEquipmentTab() {
  const { showToast } = useToast();
  const { data: equipment, isLoading, error, refetch } = useEquipment();
  const queryClient = useQueryClient();
  const { sortState, handleSort, sortItems } = useSort('name');
  const [filters, setFilters] = useState<CodexEquipmentListFilters>({
    search: '',
    categoryFilter: '',
    rarityFilter: '',
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CodexEquipmentItem | null>(null);
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

  const filterOptions = useMemo(() => collectCodexEquipmentFilterOptions(equipment), [equipment]);
  const { selectedPathIds, setSelectedPathIds, pathIndex, pathRecommendedIds, pathFilterActive } =
    usePathListFilter({ entities: equipment, kind: EQUIPMENT_LIST_PATH_KINDS });

  const filteredEquipment = useMemo(() => {
    if (!equipment) return [];
    return sortItems(
      filterCodexEquipment(equipment, filters, EMPTY_ARMAMENT_FILTERS, null, pathRecommendedIds),
    );
  }, [equipment, filters, sortItems, pathRecommendedIds]);

  const openAdd = () => {
    setEditing(null);
    setCopySourceName(null);
    setForm({
      name: '',
      description: '',
      category: '',
      currency: 0,
      rarity: 'Common',
      imageId: null,
      imageUrl: null,
    });
    setCategoryIsNew(false);
    setModalOpen(true);
  };

  const openDuplicate = (e: CodexEquipmentItem) => {
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
    const existingCats = new Set((equipment || []).map((eq) => eq.category).filter(Boolean));
    setCategoryIsNew(cat !== '' && !existingCats.has(cat));
    setModalOpen(true);
  };

  const openEdit = (e: CodexEquipmentItem) => {
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
    const existingCats = new Set((equipment || []).map((eq) => eq.category).filter(Boolean));
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
      ? await updateCodexDoc('codex_equipment', editing.id, data, {
          expectedUpdatedAt: editing.updated_at,
        })
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

  const codexDelete = useAdminCodexDelete({
    collection: 'codex_equipment',
    onDeleted: async () => {
      queryClient.invalidateQueries({ queryKey: ['codex'] });
      await queryClient.refetchQueries({ queryKey: ['codex'] });
      setPendingDeleteId(null);
      closeModal();
    },
    onError: (message) => {
      setPendingDeleteId(null);
      showToast(message, 'error');
    },
  });

  const handleDelete = async (id: string) => {
    if (deleteConfirm !== id) {
      setDeleteConfirm(id);
      return;
    }
    await codexDelete.requestDelete(id);
  };

  const handleInlineDelete = async (id: string) => {
    if (pendingDeleteId !== id) {
      setPendingDeleteId(id);
      return;
    }
    await codexDelete.requestDelete(id);
  };

  if (error)
    return (
      <ErrorState
        message="Failed to load equipment"
        onRetry={() => {
          void refetch();
        }}
      />
    );

  return (
    <div>
      <CodexBrowseListShell
        sectionTitle="Equipment"
        onAdd={openAdd}
        search={filters.search}
        onSearchChange={(v) => setFilters((f) => ({ ...f, search: v }))}
        searchPlaceholder="Search equipment..."
        filters={
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <SelectFilter
              label="Category"
              value={filters.categoryFilter}
              options={filterOptions.categories.map((c) => ({ value: c, label: c }))}
              onChange={(v) => setFilters((f) => ({ ...f, categoryFilter: v }))}
              placeholder="All Categories"
            />
            <SelectFilter
              label="Rarity"
              value={filters.rarityFilter}
              options={filterOptions.rarities.map((r) => ({ value: r, label: r }))}
              onChange={(v) => setFilters((f) => ({ ...f, rarityFilter: v }))}
              placeholder="All Rarities"
            />
            <ArchetypePathFilter
              options={pathIndex.options}
              selectedPathIds={selectedPathIds}
              onChange={setSelectedPathIds}
            />
          </div>
        }
        headerColumns={CODEX_EQUIPMENT_HEADER_COLUMNS}
        gridColumns={EQUIPMENT_GRID_COLUMNS}
        sortState={sortState}
        onSort={handleSort}
        hasThumbnailColumn
        rowChrome={{ rightSlot: true }}
        isLoading={isLoading}
        isEmpty={filteredEquipment.length === 0}
        emptyTitle={pathFilterActive ? pathFilterEmptyTitle('equipment') : 'No equipment found'}
        emptyMessage="No equipment matches your filters."
        emptyAction={{ label: 'Add Equipment', onClick: openAdd }}
      >
        {filteredEquipment.map((e) => {
          const detailSections = buildCodexEquipmentDetailSections(e);
          const nameChips = pathFilterActive
            ? pathChipLabelsForEntity(pathIndex, e.id, selectedPathIds)?.map((label) => ({
                label,
              }))
            : undefined;
          return (
            <GridListRow
              key={e.id}
              id={e.id}
              name={e.name}
              description={e.description || ''}
              thumbnail={resolveListRowThumbnail('equipment', e, e.name)}
              gridColumns={EQUIPMENT_GRID_COLUMNS}
              columns={buildCodexEquipmentColumns(e)}
              detailSections={detailSections.length > 0 ? detailSections : undefined}
              badges={nameChips}
              showBadgesInName={Boolean(nameChips)}
              rightSlot={
                <div className="flex items-center gap-1 pr-2">
                  {pendingDeleteId === e.id ? (
                    <div className="flex items-center gap-1 text-xs">
                      <span className="font-medium whitespace-nowrap text-danger-700 dark:text-danger-400">
                        Remove?
                      </span>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleInlineDelete(e.id)}
                        className="h-6 px-2 py-0.5 text-xs"
                      >
                        Yes
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setPendingDeleteId(null)}
                        className="h-6 px-2 py-0.5 text-xs"
                      >
                        No
                      </Button>
                    </div>
                  ) : (
                    <>
                      <IconButton
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(e)}
                        label="Edit"
                        aria-label="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </IconButton>
                      <IconButton
                        variant="ghost"
                        size="sm"
                        onClick={() => openDuplicate(e)}
                        label="Duplicate"
                        aria-label="Duplicate"
                      >
                        <Copy className="h-4 w-4" />
                      </IconButton>
                      <IconButton
                        variant="ghost"
                        size="sm"
                        onClick={() => setPendingDeleteId(e.id)}
                        label="Delete"
                        className="text-danger-fg hover:bg-transparent hover:opacity-80"
                      >
                        <X className="h-4 w-4" />
                      </IconButton>
                    </>
                  )}
                </div>
              }
            />
          );
        })}
      </CodexBrowseListShell>

      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editing ? 'Edit Equipment' : 'Add Equipment'}
        size="full"
        fullScreenOnMobile
        footer={
          <div className="flex justify-between">
            <div>
              {editing && (
                <Button
                  variant="outline"
                  onClick={() => handleDelete(editing.id)}
                  className={
                    deleteConfirm === editing.id
                      ? 'border-danger-500 text-danger-700 dark:text-danger-400'
                      : ''
                  }
                >
                  {deleteConfirm === editing.id ? 'Click again to confirm delete' : 'Delete'}
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={closeModal}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving || !form.name.trim()}>
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-4">
          {copySourceName && (
            <p className="rounded-md border border-border-light bg-surface-alt px-3 py-2 text-sm text-text-secondary">
              Creating a copy of <strong className="text-text-primary">{copySourceName}</strong>.
              Change the name and details as needed, then save to add the new equipment.
            </p>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium text-text-secondary">Name *</label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Equipment name"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text-secondary">
              Description
            </label>
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
            onChange={({ imageId, imageUrl }) => setForm((f) => ({ ...f, imageId, imageUrl }))}
            entityName={form.name}
            label="Equipment card art"
          />
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1">
              <label className="mb-1 block text-sm font-medium text-text-secondary">Category</label>
              <select
                value={categoryIsNew ? '__new__' : form.category || ''}
                onChange={(e) => {
                  const v = e.target.value;
                  setCategoryIsNew(v === '__new__');
                  setForm((f) => ({ ...f, category: v === '__new__' ? '' : v }));
                }}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-text-primary"
                aria-label="Category"
              >
                <option value="">None</option>
                {filterOptions.categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
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
              <label className="mb-1 block text-sm font-medium text-text-secondary">
                Currency Cost
              </label>
              <Input
                type="number"
                min={0}
                step="any"
                value={form.currency}
                onChange={(e) =>
                  setForm((f) => ({ ...f, currency: parseFloat(e.target.value) || 0 }))
                }
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-text-secondary">Rarity</label>
              <select
                value={form.rarity}
                onChange={(e) => setForm((f) => ({ ...f, rarity: e.target.value }))}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-text-primary"
                aria-label="Rarity"
              >
                {['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythic', 'Ascended'].map(
                  (r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ),
                )}
              </select>
            </div>
          </div>
        </div>
      </Modal>

      <AdminCodexDeleteReferenceModal state={codexDelete} entityLabel="equipment entry" />
    </div>
  );
}
