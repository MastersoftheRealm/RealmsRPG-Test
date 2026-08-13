'use client';

import { useMemo, useState } from 'react';
import {
  CodexBrowseListShell,
  ErrorDisplay as ErrorState,
  GridListRow,
} from '@/components/shared';
import { Button, IconButton, useToast } from '@/components/ui';
import { SelectFilter } from '@/components/shared/filters';
import { useItemProperties, type ItemProperty } from '@/hooks';
import { useSort } from '@/hooks/use-sort';
import { useQueryClient } from '@tanstack/react-query';
import { createCodexDoc, updateCodexDoc, deleteCodexDoc } from './actions';
import { Pencil, Copy, X } from 'lucide-react';
import { formatListCellLabel } from '@/lib/utils';
import {
  COPY_NAME_SUFFIX,
  EMPTY_PROPERTY_FORM,
  optionSlotCountFromPropertyForm,
  propertyFormToSavePayload,
  propertyToFormState,
  savedPropertyFromPayload,
  type PropertyFormState,
} from './admin-property-form';
import { AdminPropertyEditModal } from './admin-property-edit-modal';

const PROPERTY_GRID_COLUMNS = '1.5fr 1fr 0.8fr 0.8fr 0.8fr';

interface PropertyFilters {
  search: string;
  typeFilter: string;
}

export function AdminPropertiesTab() {
  const { showToast } = useToast();
  const { data: properties, isLoading, error, refetch } = useItemProperties();
  const queryClient = useQueryClient();
  const { sortState, handleSort } = useSort('name');
  const [filters, setFilters] = useState<PropertyFilters>({ search: '', typeFilter: '' });
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ItemProperty | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [copySourceName, setCopySourceName] = useState<string | null>(null);
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
      if (col === 'tp') return dir * ((a.base_tp ?? a.tp_cost ?? 0) - (b.base_tp ?? b.tp_cost ?? 0));
      if (col === 'cost') return dir * ((a.base_c ?? a.gold_cost ?? 0) - (b.base_c ?? b.gold_cost ?? 0));
      return 0;
    });
  }, [properties, filters, sortState]);

  const openAdd = () => {
    setEditing(null);
    setCopySourceName(null);
    setOptionSlotCount(0);
    setForm(EMPTY_PROPERTY_FORM);
    setModalOpen(true);
  };

  const openDuplicate = (p: ItemProperty) => {
    setEditing(null);
    setCopySourceName(p.name);
    const nextForm = propertyToFormState(p, (p.name || '').trim() + COPY_NAME_SUFFIX);
    setOptionSlotCount(optionSlotCountFromPropertyForm(nextForm));
    setForm(nextForm);
    setModalOpen(true);
  };

  const openEdit = (p: ItemProperty) => {
    setEditing(p);
    setCopySourceName(null);
    const nextForm = propertyToFormState(p);
    setOptionSlotCount(optionSlotCountFromPropertyForm(nextForm));
    setForm(nextForm);
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
    const data = propertyFormToSavePayload(form);

    const result = editing
      ? await updateCodexDoc('codex_properties', editing.id, data)
      : await createCodexDoc('codex_properties', undefined, data);

    setSaving(false);
    if (result.success) {
      const savedId = editing ? editing.id : (result as { id?: string }).id;
      if (!savedId) {
        showToast('Save succeeded but no ID was returned. Please refresh.', 'warning');
        closeModal();
        return;
      }
      const savedProperty = savedPropertyFromPayload(savedId, data);

      queryClient.setQueryData(['codex'], (prev: unknown) => {
        if (!prev || typeof prev !== 'object') return prev;
        const prevCodex = prev as Record<string, unknown>;
        const prevProps = (prevCodex.itemProperties as ItemProperty[] | undefined) ?? [];
        const nextProps = prevProps.some((p) => p.id === savedId)
          ? prevProps.map((p) => (p.id === savedId ? { ...p, ...savedProperty } : p))
          : [...prevProps, savedProperty];
        return { ...prevCodex, itemProperties: nextProps };
      });
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
    const result = await deleteCodexDoc('codex_properties', id);
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
    const result = await deleteCodexDoc('codex_properties', id);
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ['codex'] });
      await queryClient.refetchQueries({ queryKey: ['codex'] });
      setPendingDeleteId(null);
    } else {
      showToast(result.error ?? 'Operation failed', 'error');
      setPendingDeleteId(null);
    }
  };

  if (error) return <ErrorState message="Failed to load properties" onRetry={() => { void refetch(); }} />;

  return (
    <div>
      <CodexBrowseListShell
        sectionTitle="Armament Properties"
        onAdd={openAdd}
        search={filters.search}
        onSearchChange={(v) => setFilters((f) => ({ ...f, search: v }))}
        searchPlaceholder="Search properties..."
        filters={
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                <div className="flex items-center gap-1 pr-2">
                  {pendingDeleteId === p.id ? (
                    <div className="flex items-center gap-1 text-xs">
                      <span className="text-danger-700 dark:text-danger-400 font-medium whitespace-nowrap">
                        Remove?
                      </span>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleInlineDelete(p.id)}
                        className="text-xs px-2 py-0.5 h-6"
                      >
                        Yes
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setPendingDeleteId(null)}
                        className="text-xs px-2 py-0.5 h-6"
                      >
                        No
                      </Button>
                    </div>
                  ) : (
                    <>
                      <IconButton
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(p)}
                        label="Edit"
                        aria-label="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </IconButton>
                      <IconButton
                        variant="ghost"
                        size="sm"
                        onClick={() => openDuplicate(p)}
                        label="Duplicate"
                        aria-label="Duplicate"
                      >
                        <Copy className="w-4 h-4" />
                      </IconButton>
                      <IconButton
                        variant="ghost"
                        size="sm"
                        onClick={() => setPendingDeleteId(p.id)}
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
        deleteConfirm={deleteConfirm}
        onRequestDelete={() => editing && handleDelete(editing.id)}
        onSave={handleSave}
      />
    </div>
  );
}
