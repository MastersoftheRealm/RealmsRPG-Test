'use client';

import { useMemo, useState } from 'react';
import {
  CodexBrowseListShell,
  ErrorDisplay as ErrorState,
  GridListRow,
} from '@/components/patterns';
import { useToast } from '@/components/ui';
import { SelectFilter } from '@/components/patterns/filters';
import { useItemProperties, type ItemProperty } from '@/hooks';
import { useSort } from '@/hooks/use-sort';
import { formatListCellLabel } from '@/lib/utils';
import { COPY_NAME_SUFFIX } from './admin-codex-copy-suffix';
import {
  EMPTY_PROPERTY_FORM,
  optionSlotCountFromPropertyForm,
  propertyFormToSavePayload,
  propertyToFormState,
  savedPropertyFromPayload,
  type PropertyFormState,
} from './admin-property-form';
import { AdminPropertyEditModal } from './admin-property-edit-modal';
import { useAdminCodexEntity } from './use-admin-codex-entity';
import { AdminCodexRowActions } from './admin-codex-row-actions';

const PROPERTY_GRID_COLUMNS = '1.5fr 1fr 0.8fr 0.8fr 0.8fr';

interface PropertyFilters {
  search: string;
  typeFilter: string;
}

export function AdminPropertiesTab() {
  const { showToast } = useToast();
  const { data: properties, isLoading, error, refetch } = useItemProperties();
  const {
    modalOpen,
    editing,
    saving,
    copySourceName,
    queryClient,
    openAdd: beginAdd,
    openDuplicate: beginDuplicate,
    openEdit: beginEdit,
    closeModal,
    save,
    askDelete,
    deleteModals,
  } = useAdminCodexEntity<ItemProperty>({
    collection: 'codex_properties',
    entityLabel: 'property',
  });
  const { sortState, handleSort } = useSort('name');
  const [filters, setFilters] = useState<PropertyFilters>({ search: '', typeFilter: '' });
  const [optionSlotCount, setOptionSlotCount] = useState(0);
  const [form, setForm] = useState<PropertyFormState>(EMPTY_PROPERTY_FORM);

  const clearOption = () => {
    setForm((f) => ({
      ...f,
      op_1_desc: '',
      op_1_ip: undefined,
      op_1_tp: undefined,
      op_1_c: undefined,
    }));
    setOptionSlotCount(0);
  };

  const typeOptions = useMemo(() => {
    if (!properties) return [] as string[];
    const types = new Set<string>();
    properties.forEach((p: ItemProperty) => p.type && types.add(p.type));
    return Array.from(types).sort();
  }, [properties]);

  const filteredProperties = useMemo(() => {
    if (!properties) return [];

    const filtered = properties.filter((p: ItemProperty) => {
      if (
        filters.search &&
        !p.name.toLowerCase().includes(filters.search.toLowerCase()) &&
        !p.description?.toLowerCase().includes(filters.search.toLowerCase())
      ) {
        return false;
      }
      if (filters.typeFilter && p.type !== filters.typeFilter) return false;
      return true;
    });

    return filtered.sort((a: ItemProperty, b: ItemProperty) => {
      const { col, dir } = sortState;
      if (col === 'name') return dir * a.name.localeCompare(b.name);
      if (col === 'type') return dir * (a.type || 'general').localeCompare(b.type || 'general');
      if (col === 'ip') return dir * ((a.base_ip ?? 0) - (b.base_ip ?? 0));
      if (col === 'tp')
        return dir * ((a.base_tp ?? a.tp_cost ?? 0) - (b.base_tp ?? b.tp_cost ?? 0));
      if (col === 'cost')
        return dir * ((a.base_c ?? a.gold_cost ?? 0) - (b.base_c ?? b.gold_cost ?? 0));
      return 0;
    });
  }, [properties, filters, sortState]);

  const openAdd = () =>
    beginAdd(() => {
      setOptionSlotCount(0);
      setForm(EMPTY_PROPERTY_FORM);
    });

  const openDuplicate = (p: ItemProperty) =>
    beginDuplicate(p, () => {
      const nextForm = propertyToFormState(p, (p.name || '').trim() + COPY_NAME_SUFFIX);
      setOptionSlotCount(optionSlotCountFromPropertyForm(nextForm));
      setForm(nextForm);
    });

  const openEdit = (p: ItemProperty) =>
    beginEdit(p, () => {
      const nextForm = propertyToFormState(p);
      setOptionSlotCount(optionSlotCountFromPropertyForm(nextForm));
      setForm(nextForm);
    });

  const handleSave = async () => {
    if (!form.name.trim()) return;
    const data = propertyFormToSavePayload(form);
    await save({
      payload: data,
      expectedUpdatedAt: editing?.updated_at,
      onSuccess: async ({ id }) => {
        const savedId = editing ? editing.id : id;
        if (!savedId) {
          showToast('Save succeeded but no ID was returned. Please refresh.', 'warning');
          return;
        }
        const savedProperty = savedPropertyFromPayload(savedId, data);
        queryClient.setQueryData(['codex'], (prev: unknown) => {
          if (!prev || typeof prev !== 'object') return prev;
          const prevCodex = prev as Record<string, unknown>;
          const prevProps = (prevCodex.itemProperties as ItemProperty[] | undefined) ?? [];
          const nextProps = prevProps.some((row) => row.id === savedId)
            ? prevProps.map((row) => (row.id === savedId ? { ...row, ...savedProperty } : row))
            : [...prevProps, savedProperty];
          return { ...prevCodex, itemProperties: nextProps };
        });
      },
    });
  };

  if (error)
    return (
      <ErrorState
        message="Failed to load properties"
        onRetry={() => {
          void refetch();
        }}
      />
    );

  return (
    <div>
      <CodexBrowseListShell
        sectionTitle="Armament Properties"
        onAdd={openAdd}
        search={filters.search}
        onSearchChange={(v) => setFilters((f) => ({ ...f, search: v }))}
        searchPlaceholder="Search properties..."
        filters={
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <SelectFilter
              label="Type"
              value={filters.typeFilter}
              options={typeOptions.map((t) => {
                const lower = t.toLowerCase();
                const label =
                  lower === 'armor'
                    ? 'Armor'
                    : lower === 'shield'
                      ? 'Shield'
                      : lower === 'weapon'
                        ? 'Weapon'
                        : t;
                return { value: label, label };
              })}
              onChange={(v) => setFilters((f) => ({ ...f, typeFilter: v }))}
              placeholder="All Types"
            />
          </div>
        }
        headerColumns={[
          { key: 'name', label: 'NAME' },
          { key: 'type', label: 'TYPE' },
          { key: 'ip', label: 'ITEM PTS' },
          { key: 'tp', label: 'TP' },
          { key: 'cost', label: 'COST MULT' },
        ]}
        gridColumns={PROPERTY_GRID_COLUMNS}
        sortState={sortState}
        onSort={handleSort}
        rowChrome={{ rightSlot: true }}
        isLoading={isLoading}
        isEmpty={filteredProperties.length === 0}
        emptyTitle="No properties found"
        emptyMessage="No properties match your filters."
        emptyAction={{ label: 'Add Property', onClick: openAdd }}
      >
        {filteredProperties.map((p: ItemProperty) => {
          const typeLabel = formatListCellLabel(p.type || 'general');
          const optionChips =
            p.op_1_desc && p.op_1_desc.length > 0
              ? [
                  {
                    name: (() => {
                      const parts: string[] = [];
                      if (p.op_1_ip !== undefined) parts.push(`IP ${p.op_1_ip}`);
                      if (p.op_1_tp !== undefined) parts.push(`TP ${p.op_1_tp}`);
                      if (p.op_1_c !== undefined) parts.push(`C ${p.op_1_c}`);
                      return parts.length ? `Option (${parts.join(', ')})` : 'Option';
                    })(),
                    description: p.op_1_desc,
                    category: 'default' as const,
                  },
                ]
              : [];
          const detailSections =
            optionChips.length > 0 ? [{ label: 'Options', chips: optionChips }] : undefined;

          return (
            <GridListRow
              key={p.id}
              id={p.id}
              name={p.name}
              description={p.description || ''}
              gridColumns={PROPERTY_GRID_COLUMNS}
              columns={[
                { key: 'Type', value: typeLabel },
                {
                  key: 'IP',
                  value:
                    typeof p.base_ip === 'number' && !Number.isNaN(p.base_ip)
                      ? String(p.base_ip)
                      : '-',
                  className: 'text-info-fg',
                },
                {
                  key: 'TP',
                  value: (() => {
                    const v = p.base_tp ?? p.tp_cost;
                    return typeof v === 'number' && !Number.isNaN(v) ? String(v) : '-';
                  })(),
                  className: 'text-tp',
                },
                {
                  key: 'Cost',
                  value: (() => {
                    const v = p.base_c ?? p.gold_cost;
                    return typeof v === 'number' && !Number.isNaN(v) ? `×${v}` : '-';
                  })(),
                },
              ]}
              detailSections={detailSections}
              rightSlot={
                <AdminCodexRowActions
                  entity={p}
                  onEdit={openEdit}
                  onDuplicate={openDuplicate}
                  onDelete={askDelete}
                />
              }
            />
          );
        })}
      </CodexBrowseListShell>

      <AdminPropertyEditModal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editing ? 'Edit Property' : 'Add Property'}
        copySourceName={copySourceName}
        editingId={editing?.id ?? null}
        form={form}
        setForm={setForm}
        optionSlotCount={optionSlotCount}
        setOptionSlotCount={setOptionSlotCount}
        clearOption={clearOption}
        saving={saving}
        onDelete={editing ? () => askDelete(editing) : undefined}
        onSave={handleSave}
      />

      {deleteModals}
    </div>
  );
}
