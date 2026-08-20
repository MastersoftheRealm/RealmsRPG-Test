'use client';

import { useMemo, useState } from 'react';
import {
  CodexBrowseListShell,
  ErrorDisplay as ErrorState,
  GridListRow,
} from '@/components/patterns';
import { SelectFilter, ArchetypePathFilter } from '@/components/patterns/filters';
import { useEquipment, useItemProperties, usePathListFilter } from '@/hooks';
import { useSort } from '@/hooks/use-sort';
import { COPY_NAME_SUFFIX } from './admin-codex-copy-suffix';
import { useAdminCodexEntity } from './use-admin-codex-entity';
import { AdminCodexRowActions } from './admin-codex-row-actions';
import {
  AdminEquipmentEditModal,
  EMPTY_EQUIPMENT_FORM,
  type EquipmentFormState,
} from './admin-equipment-edit-modal';
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

export function AdminEquipmentTab() {
  const { data: equipment, isLoading, error, refetch } = useEquipment();
  const { data: propertiesDb = [] } = useItemProperties();
  const {
    modalOpen,
    editing,
    saving,
    copySourceName,
    openAdd: beginAdd,
    openDuplicate: beginDuplicate,
    openEdit: beginEdit,
    closeModal,
    save,
    askDelete,
    deleteModals,
  } = useAdminCodexEntity<CodexEquipmentItem>({
    collection: 'codex_equipment',
    entityLabel: 'equipment entry',
  });
  const { sortState, handleSort, sortItems } = useSort('name');
  const [filters, setFilters] = useState<CodexEquipmentListFilters>({
    search: '',
    categoryFilter: '',
    rarityFilter: '',
  });

  const [form, setForm] = useState<EquipmentFormState>(EMPTY_EQUIPMENT_FORM);
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

  const openAdd = () =>
    beginAdd(() => {
      setForm(EMPTY_EQUIPMENT_FORM);
      setCategoryIsNew(false);
    });

  const openDuplicate = (e: CodexEquipmentItem) =>
    beginDuplicate(e, () => {
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
    });

  const openEdit = (e: CodexEquipmentItem) =>
    beginEdit(e, () => {
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
    });

  const handleSave = async () => {
    if (!form.name.trim()) return;
    await save({
      payload: {
        name: form.name.trim(),
        description: form.description.trim(),
        category: form.category.trim() || undefined,
        currency: form.currency,
        rarity: form.rarity.trim() || undefined,
        imageId: form.imageId,
        imageUrl: form.imageUrl,
      },
      expectedUpdatedAt: editing?.updated_at,
    });
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
          const detailSections = buildCodexEquipmentDetailSections(e, propertiesDb);
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
                <AdminCodexRowActions
                  entity={e}
                  onEdit={openEdit}
                  onDuplicate={openDuplicate}
                  onDelete={askDelete}
                />
              }
            />
          );
        })}
      </CodexBrowseListShell>

      <AdminEquipmentEditModal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editing ? 'Edit Equipment' : 'Add Equipment'}
        copySourceName={copySourceName}
        editingId={editing?.id ?? null}
        form={form}
        setForm={setForm}
        categoryIsNew={categoryIsNew}
        setCategoryIsNew={setCategoryIsNew}
        categories={filterOptions.categories}
        saving={saving}
        onDelete={editing ? () => askDelete(editing) : undefined}
        onSave={handleSave}
      />

      {deleteModals}
    </div>
  );
}
