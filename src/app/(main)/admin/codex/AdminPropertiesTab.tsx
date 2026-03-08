'use client';

import { useMemo, useState } from 'react';
import {
  SectionHeader,
  SearchInput,
  LoadingState,
  ErrorDisplay as ErrorState,
  GridListRow,
  ListEmptyState as EmptyState,
  ListHeader,
} from '@/components/shared';
import { Modal, Button, Input, Textarea } from '@/components/ui';
import { SelectFilter, FilterSection } from '@/components/codex';
import { useItemProperties, type ItemProperty } from '@/hooks';
import { useSort } from '@/hooks/use-sort';
import { useQueryClient } from '@tanstack/react-query';
import { createCodexDoc, updateCodexDoc, deleteCodexDoc } from './actions';
import { Pencil, Copy, X, Plus } from 'lucide-react';
import { IconButton } from '@/components/ui';

const COPY_NAME_SUFFIX = ' copy';

const PROPERTY_GRID_COLUMNS = '1.5fr 1fr 0.8fr 0.8fr 0.8fr 40px';

interface PropertyFilters {
  search: string;
  typeFilter: string;
}

export function AdminPropertiesTab() {
  const { data: properties, isLoading, error } = useItemProperties();
  const queryClient = useQueryClient();
  const { sortState, handleSort } = useSort('name');
  const [filters, setFilters] = useState<PropertyFilters>({
    search: '',
    typeFilter: '',
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<{ id: string; name: string; description: string; type?: string; base_ip?: number; base_tp?: number; base_c?: number; op_1_desc?: string; op_1_ip?: number; op_1_tp?: number; op_1_c?: number; mechanic?: boolean } | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [copySourceName, setCopySourceName] = useState<string | null>(null);
  const [optionSlotCount, setOptionSlotCount] = useState(0);

  const [form, setForm] = useState<{
    name: string;
    description: string;
    type: string;
    base_ip: number | undefined;
    base_tp: number | undefined;
    base_c: number | undefined;
    op_1_desc: string;
    op_1_ip: number | undefined;
    op_1_tp: number | undefined;
    op_1_c: number | undefined;
    mechanic: boolean;
  }>({
    name: '',
    description: '',
    type: 'Armor',
    base_ip: undefined,
    base_tp: undefined,
    base_c: undefined,
    op_1_desc: '',
    op_1_ip: undefined,
    op_1_tp: undefined,
    op_1_c: undefined,
    mechanic: false,
  });

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
    setForm({
      name: '',
      description: '',
      type: 'Armor',
      base_ip: undefined,
      base_tp: undefined,
      base_c: undefined,
      op_1_desc: '',
      op_1_ip: undefined,
      op_1_tp: undefined,
      op_1_c: undefined,
      mechanic: false,
    });
    setModalOpen(true);
  };

  const openDuplicate = (p: ItemProperty) => {
    setEditing(null);
    setCopySourceName(p.name);
    const rawType = (p.type as string | undefined) || '';
    const normalizedType =
      rawType.toLowerCase() === 'armor'
        ? 'Armor'
        : rawType.toLowerCase() === 'shield'
          ? 'Shield'
          : rawType.toLowerCase() === 'weapon'
            ? 'Weapon'
            : 'Armor';
    const op1 = (p as any).op_1_desc?.trim();
    const raw = (v: unknown) => (v != null && v !== '' ? v : undefined);
    setOptionSlotCount(op1 ? 1 : 0);
    setForm({
      name: (p.name || '').trim() + COPY_NAME_SUFFIX,
      description: p.description || '',
      type: normalizedType,
      base_ip: p.base_ip,
      base_tp: p.base_tp,
      base_c: p.base_c,
      op_1_desc: op1 || '',
      op_1_ip: op1 ? (raw((p as any).op_1_ip) as number | undefined) : undefined,
      op_1_tp: op1 ? (raw((p as any).op_1_tp) as number | undefined) : undefined,
      op_1_c: op1 ? (raw((p as any).op_1_c) as number | undefined) : undefined,
      mechanic: Boolean((p as any).mechanic),
    });
    setModalOpen(true);
  };

  const openEdit = (p: { id: string; name: string; description: string; type?: string; base_ip?: number; base_tp?: number; base_c?: number; op_1_desc?: string; op_1_ip?: number; op_1_tp?: number; op_1_c?: number; mechanic?: boolean }) => {
    setEditing(p);
    setCopySourceName(null);
    const rawType = (p.type as string | undefined) || '';
    const normalizedType =
      rawType.toLowerCase() === 'armor'
        ? 'Armor'
        : rawType.toLowerCase() === 'shield'
          ? 'Shield'
          : rawType.toLowerCase() === 'weapon'
            ? 'Weapon'
            : 'Armor';
    const op1 = (p as any).op_1_desc?.trim();
    const raw = (v: unknown) => (v != null && v !== '' ? v : undefined);
    setOptionSlotCount(op1 ? 1 : 0);
    setForm({
      name: p.name,
      description: p.description || '',
      type: normalizedType,
      base_ip: p.base_ip,
      base_tp: p.base_tp,
      base_c: p.base_c,
      op_1_desc: op1 || '',
      op_1_ip: op1 ? (raw((p as any).op_1_ip) as number | undefined) : undefined,
      op_1_tp: op1 ? (raw((p as any).op_1_tp) as number | undefined) : undefined,
      op_1_c: op1 ? (raw((p as any).op_1_c) as number | undefined) : undefined,
      mechanic: Boolean((p as any).mechanic),
    });
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
    const data: Record<string, unknown> = {
      name: form.name.trim(),
      description: form.description.trim(),
      type: form.type,
      base_ip: form.base_ip ?? undefined,
      base_tp: form.base_tp ?? undefined,
      base_c: form.base_c ?? undefined,
      op_1_desc: form.op_1_desc.trim() || undefined,
      op_1_ip: form.op_1_desc.trim() ? (form.op_1_ip ?? undefined) : undefined,
      op_1_tp: form.op_1_desc.trim() ? (form.op_1_tp ?? undefined) : undefined,
      op_1_c: form.op_1_desc.trim() ? (form.op_1_c ?? undefined) : undefined,
      mechanic: form.mechanic,
    };

    const id = form.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_-]/g, '').slice(0, 100) || `prop_${Date.now()}`;

    const result = editing ? await updateCodexDoc('codex_properties', editing.id, data) : await createCodexDoc('codex_properties', id, data);

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
    const result = await deleteCodexDoc('codex_properties', id);
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
    const result = await deleteCodexDoc('codex_properties', id);
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ['codex'] });
      setPendingDeleteId(null);
    } else {
      alert(result.error);
      setPendingDeleteId(null);
    }
  };

  if (error) return <ErrorState message="Failed to load properties" />;

  return (
    <div>
      <SectionHeader title="Armament Properties" onAdd={openAdd} size="md" />
      <div className="mb-4 mt-2">
        <SearchInput
          value={filters.search}
          onChange={(v) => setFilters(f => ({ ...f, search: v }))}
          placeholder="Search properties..."
        />
      </div>

      <FilterSection>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <SelectFilter
            label="Type"
            value={filters.typeFilter}
            options={typeOptions.map(t => {
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
            onChange={(v) => setFilters(f => ({ ...f, typeFilter: v }))}
            placeholder="All Types"
          />
        </div>
      </FilterSection>

      <ListHeader
        columns={[
          { key: 'name', label: 'NAME' },
          { key: 'type', label: 'TYPE' },
          { key: 'ip', label: 'ITEM PTS' },
          { key: 'tp', label: 'TP' },
          { key: 'cost', label: 'COST MULT' },
          { key: '_actions', label: '', sortable: false as const },
        ]}
        gridColumns={PROPERTY_GRID_COLUMNS}
        sortState={sortState}
        onSort={handleSort}
      />

      {isLoading ? (
        <LoadingState />
      ) : (
        <div className="flex flex-col gap-1 mt-2">
          {filteredProperties.length === 0 ? (
            <EmptyState
              title="No properties found"
              description="No properties match your filters."
              action={{ label: 'Add Property', onClick: openAdd }}
              size="sm"
            />
          ) : (
            filteredProperties.map((p: ItemProperty) => {
              const typeLabel = p.type
                ? p.type.charAt(0).toUpperCase() + p.type.slice(1).toLowerCase()
                : 'Armor';

              const optionChips =
                p.op_1_desc && p.op_1_desc.length > 0
                  ? [
                      {
                        name: 'Option',
                        description: p.op_1_desc,
                        category: 'default' as const,
                      },
                    ]
                  : [];

              const detailSections =
                optionChips.length > 0
                  ? [
                      {
                        label: 'Options',
                        chips: optionChips,
                      },
                    ]
                  : undefined;

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
                      value: p.base_ip && p.base_ip > 0 ? String(p.base_ip) : '-',
                      className: 'text-blue-600',
                    },
                    {
                      key: 'TP',
                      value: (p.base_tp ?? p.tp_cost ?? 0) > 0 ? String(p.base_tp ?? p.tp_cost ?? 0) : '-',
                      className: 'text-tp',
                    },
                    {
                      key: 'Cost',
                      value: (p.base_c ?? p.gold_cost ?? 0) > 0 ? `×${p.base_c ?? p.gold_cost ?? 0}` : '-',
                    },
                  ]}
                  detailSections={detailSections}
                  rightSlot={
                    <div className="flex items-center gap-1 pr-2">
                      {pendingDeleteId === p.id ? (
                        <div className="flex items-center gap-1 text-xs">
                          <span className="text-red-600 font-medium whitespace-nowrap">Remove?</span>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleInlineDelete(p.id, p.name)}
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
                          <IconButton variant="ghost" size="sm" onClick={() => openEdit(p)} label="Edit" aria-label="Edit">
                            <Pencil className="w-4 h-4" />
                          </IconButton>
                          <IconButton variant="ghost" size="sm" onClick={() => openDuplicate(p)} label="Duplicate" aria-label="Duplicate">
                            <Copy className="w-4 h-4" />
                          </IconButton>
                          <IconButton
                            variant="ghost"
                            size="sm"
                            onClick={() => setPendingDeleteId(p.id)}
                            label="Delete"
                            className="text-danger dark:text-danger-400 hover:text-danger-600 dark:hover:text-danger-300 hover:bg-transparent"
                          >
                            <X className="w-4 h-4" />
                          </IconButton>
                        </>
                      )}
                    </div>
                  }
                />
              );
            })
          )}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={closeModal} title={editing ? 'Edit Property' : 'Add Property'} size="lg" fullScreenOnMobile
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
          {copySourceName && (
            <p className="text-sm text-text-secondary rounded-md bg-surface-alt px-3 py-2 border border-border-light">
              Creating a copy of <strong className="text-text-primary">{copySourceName}</strong>. Change the name and details as needed, then save to add the new property.
            </p>
          )}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Name *</label>
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Property name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Description</label>
            <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Property description" className="min-h-[140px] resize-y" rows={5} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Type</label>
              <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} className="w-full px-3 py-2 rounded-md border border-border bg-background text-text-primary" aria-label="Property type">
                <option value="Armor">Armor</option>
                <option value="Shield">Shield</option>
                <option value="Weapon">Weapon</option>
              </select>
            </div>
            <label className="flex items-center gap-2 mt-6">
              <input
                type="checkbox"
                checked={form.mechanic}
                onChange={(e) => setForm((f) => ({ ...f, mechanic: e.target.checked }))}
              />
              <span className="text-sm text-text-secondary">Mechanic Property</span>
            </label>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Base IP</label>
              <Input
                type="number"
                min={0}
                step="any"
                value={form.base_ip ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, base_ip: e.target.value === '' ? undefined : (parseFloat(e.target.value) || 0) }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Base TP</label>
              <Input
                type="number"
                min={0}
                step="any"
                value={form.base_tp ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, base_tp: e.target.value === '' ? undefined : (parseFloat(e.target.value) || 0) }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Base Cost Multiplier</label>
              <Input
                type="number"
                min={0}
                step="any"
                value={form.base_c ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, base_c: e.target.value === '' ? undefined : (parseFloat(e.target.value) || 0) }))}
              />
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-text-secondary">Option</h4>
              {optionSlotCount === 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOptionSlotCount(1)}
                  aria-label="Add option"
                >
                  <Plus className="w-4 h-4 mr-1 inline" />
                  Add option
                </Button>
              )}
            </div>
            {optionSlotCount === 0 ? (
              <p className="text-sm text-text-muted">No option. Click &quot;Add option&quot; if this property has a cost option.</p>
            ) : (
              <div className="rounded-lg border border-border-light bg-surface-alt/50 p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-text-secondary">Option</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-text-muted hover:text-danger"
                    onClick={() => setOptionSlotCount(0)}
                    aria-label="Remove option"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Description</label>
                  <textarea
                    value={form.op_1_desc}
                    onChange={(e) => setForm((f) => ({ ...f, op_1_desc: e.target.value }))}
                    placeholder="What this option does"
                    className="w-full min-h-[80px] resize-y px-3 py-2 rounded-md border border-border bg-background text-text-primary"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4 max-w-sm">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">IP (Item Points)</label>
                    <Input
                      type="number"
                      min={0}
                      step="any"
                      value={form.op_1_ip ?? ''}
                      onChange={(e) => setForm((f) => ({ ...f, op_1_ip: e.target.value === '' ? undefined : (parseFloat(e.target.value) || 0) }))}
                      placeholder="—"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">TP (Training Points)</label>
                    <Input
                      type="number"
                      min={0}
                      step="any"
                      value={form.op_1_tp ?? ''}
                      onChange={(e) => setForm((f) => ({ ...f, op_1_tp: e.target.value === '' ? undefined : (parseFloat(e.target.value) || 0) }))}
                      placeholder="—"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Cost multiplier</label>
                    <Input
                      type="number"
                      min={0}
                      step="any"
                      value={form.op_1_c ?? ''}
                      onChange={(e) => setForm((f) => ({ ...f, op_1_c: e.target.value === '' ? undefined : (parseFloat(e.target.value) || 0) }))}
                      placeholder="—"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
