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

const ADMIN_PART_COLUMNS = [
  { key: 'name', label: 'NAME' },
  { key: 'category', label: 'CATEGORY' },
  { key: '_en', label: 'ENERGY', sortable: false as const },
  { key: '_tp', label: 'TP', sortable: false as const },
  { key: '_actions', label: '', sortable: false as const },
];
import { Modal, Button, Input, Textarea } from '@/components/ui';
import { ChipSelect, SelectFilter, FilterSection } from '@/components/codex';
import { useParts, type Part } from '@/hooks';
import { ABILITIES_AND_DEFENSES } from '@/lib/game/constants';
import { useSort } from '@/hooks/use-sort';
import { useQueryClient } from '@tanstack/react-query';
import { createCodexDoc, updateCodexDoc, deleteCodexDoc } from './actions';
import { Pencil, Copy, X, Plus } from 'lucide-react';
import { IconButton } from '@/components/ui';

const COPY_NAME_SUFFIX = ' copy';

const PART_GRID_COLUMNS = '1.5fr 1fr 0.8fr 0.8fr 40px';

/** Format number preserving decimals (no rounding); strip trailing zeros. */
function formatDecimalPreserve(n: number, maxDecimals = 10): string {
  if (n === 0) return '0';
  const s = n.toFixed(maxDecimals);
  return s.replace(/\.?0+$/, '') || '0';
}

function formatEnergyCost(en: number | undefined, isPercentage: boolean | undefined): string {
  if (en === undefined || en === 0) return '-';
  if (isPercentage) {
    const percentChange = (en - 1) * 100;
    const sign = percentChange >= 0 ? '+' : '';
    return `${sign}${formatDecimalPreserve(percentChange)}%`;
  }
  return formatDecimalPreserve(en);
}

/** Base EN when percentage: backend 1.125 = +12.5%, 0.875 = -12.5%. Display as percent (full precision). */
function baseEnToPercent(backend: number | undefined): string {
  if (backend == null) return '';
  const p = (backend - 1) * 100;
  return formatDecimalPreserve(p);
}
function percentToBaseEn(percentStr: string): number | undefined {
  if (percentStr === '') return undefined;
  const p = parseFloat(percentStr);
  if (Number.isNaN(p)) return undefined;
  return 1 + p / 100;
}

/** Option EN when percentage: backend -0.03125 = -3.125% modifier. Display as percent (full precision). */
function optionEnToPercent(backend: number | undefined): string {
  if (backend == null) return '';
  const p = (backend ?? 0) * 100;
  return formatDecimalPreserve(p);
}
function percentToOptionEn(percentStr: string): number | undefined {
  if (percentStr === '') return undefined;
  const p = parseFloat(percentStr);
  if (Number.isNaN(p)) return undefined;
  return p / 100;
}

interface PartFilters {
  search: string;
  categoryFilter: string;
  typeFilter: 'all' | 'power' | 'technique';
  mechanicMode: '' | 'only' | 'hide';
}

export function AdminPartsTab() {
  const { data: parts, isLoading, error } = useParts();
  const queryClient = useQueryClient();
  const { sortState, handleSort, sortItems } = useSort('name');
  const [filters, setFilters] = useState<PartFilters>({
    search: '',
    categoryFilter: '',
    typeFilter: 'all',
    mechanicMode: '',
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<{ id: string; name: string; description: string; category: string; type: string; base_en: number; base_tp: number; mechanic?: boolean; percentage?: boolean; duration?: boolean; defense?: string[]; op_1_desc?: string; op_1_en?: number; op_1_tp?: number; op_2_desc?: string; op_2_en?: number; op_2_tp?: number; op_3_desc?: string; op_3_en?: number; op_3_tp?: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [copySourceName, setCopySourceName] = useState<string | null>(null);
  /** Number of option rows to show (0 = none until user clicks +). */
  const [optionSlotCount, setOptionSlotCount] = useState(0);

  const DEFENSES = useMemo(() => ABILITIES_AND_DEFENSES.slice(6), []);

  const [form, setForm] = useState<{
    name: string;
    description: string;
    category: string;
    type: 'power' | 'technique';
    base_en: number | undefined;
    base_tp: number | undefined;
    mechanic: boolean;
    percentage: boolean;
    duration: boolean;
    defense: string[];
    op_1_desc: string;
    op_1_en: number | undefined;
    op_1_tp: number | undefined;
    op_2_desc: string;
    op_2_en: number | undefined;
    op_2_tp: number | undefined;
    op_3_desc: string;
    op_3_en: number | undefined;
    op_3_tp: number | undefined;
  }>({
    name: '',
    description: '',
    category: '',
    type: 'power',
    base_en: undefined,
    base_tp: undefined,
    mechanic: false,
    percentage: false,
    duration: false,
    defense: [],
    op_1_desc: '',
    op_1_en: undefined,
    op_1_tp: undefined,
    op_2_desc: '',
    op_2_en: undefined,
    op_2_tp: undefined,
    op_3_desc: '',
    op_3_en: undefined,
    op_3_tp: undefined,
  });

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
    setCopySourceName(null);
    setOptionSlotCount(0);
    setForm({
      name: '',
      description: '',
      category: '',
      type: 'power',
      base_en: undefined,
      base_tp: undefined,
      mechanic: false,
      percentage: false,
      duration: false,
      defense: [],
      op_1_desc: '',
      op_1_en: undefined,
      op_1_tp: undefined,
      op_2_desc: '',
      op_2_en: undefined,
      op_2_tp: undefined,
      op_3_desc: '',
      op_3_en: undefined,
      op_3_tp: undefined,
    });
    setModalOpen(true);
  };

  const openDuplicate = (p: Part & { defense?: string[] }) => {
    setEditing(null);
    setCopySourceName(p.name);
    const raw = (v: unknown) => (v != null && v !== '' ? v : undefined);
    const op1 = (p as any).op_1_desc?.trim();
    const op2 = (p as any).op_2_desc?.trim();
    const op3 = (p as any).op_3_desc?.trim();
    setOptionSlotCount([op1, op2, op3].filter(Boolean).length || 0);
    setForm({
      name: (p.name || '').trim() + COPY_NAME_SUFFIX,
      description: p.description || '',
      category: p.category || '',
      type: ((p.type || 'power').toLowerCase() === 'technique' ? 'technique' : 'power') as 'power' | 'technique',
      base_en: p.base_en,
      base_tp: p.base_tp,
      mechanic: Boolean((p as any).mechanic),
      percentage: Boolean((p as any).percentage),
      duration: Boolean((p as any).duration),
      defense: Array.isArray(p.defense) ? [...p.defense] : [],
      op_1_desc: op1 || '',
      op_1_en: op1 ? raw((p as any).op_1_en) as number | undefined : undefined,
      op_1_tp: op1 ? raw((p as any).op_1_tp) as number | undefined : undefined,
      op_2_desc: op2 || '',
      op_2_en: op2 ? raw((p as any).op_2_en) as number | undefined : undefined,
      op_2_tp: op2 ? raw((p as any).op_2_tp) as number | undefined : undefined,
      op_3_desc: op3 || '',
      op_3_en: op3 ? raw((p as any).op_3_en) as number | undefined : undefined,
      op_3_tp: op3 ? raw((p as any).op_3_tp) as number | undefined : undefined,
    });
    setModalOpen(true);
  };

  const openEdit = (p: Part & { defense?: string[] }) => {
    setEditing(p);
    setCopySourceName(null);
    const raw = (v: unknown) => (v != null && v !== '' ? v : undefined);
    const op1 = (p as any).op_1_desc?.trim();
    const op2 = (p as any).op_2_desc?.trim();
    const op3 = (p as any).op_3_desc?.trim();
    setOptionSlotCount([op1, op2, op3].filter(Boolean).length || 0);
    setForm({
      name: p.name,
      description: p.description || '',
      category: p.category || '',
      type: ((p.type || 'power').toLowerCase() === 'technique' ? 'technique' : 'power') as 'power' | 'technique',
      base_en: p.base_en,
      base_tp: p.base_tp,
      mechanic: Boolean((p as any).mechanic),
      percentage: Boolean((p as any).percentage),
      duration: Boolean((p as any).duration),
      defense: Array.isArray(p.defense) ? [...p.defense] : [],
      op_1_desc: op1 || '',
      op_1_en: op1 ? raw((p as any).op_1_en) as number | undefined : undefined,
      op_1_tp: op1 ? raw((p as any).op_1_tp) as number | undefined : undefined,
      op_2_desc: op2 || '',
      op_2_en: op2 ? raw((p as any).op_2_en) as number | undefined : undefined,
      op_2_tp: op2 ? raw((p as any).op_2_tp) as number | undefined : undefined,
      op_3_desc: op3 || '',
      op_3_en: op3 ? raw((p as any).op_3_en) as number | undefined : undefined,
      op_3_tp: op3 ? raw((p as any).op_3_tp) as number | undefined : undefined,
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
      category: form.category.trim(),
      type: form.type,
      base_en: form.base_en ?? undefined,
      base_tp: form.base_tp ?? undefined,
      mechanic: form.mechanic,
      percentage: form.percentage,
      duration: form.duration,
      defense: form.defense.length > 0 ? form.defense : undefined,
      op_1_desc: form.op_1_desc.trim() || undefined,
      op_1_en: form.op_1_desc.trim() ? (form.op_1_en ?? undefined) : undefined,
      op_1_tp: form.op_1_desc.trim() ? (form.op_1_tp ?? undefined) : undefined,
      op_2_desc: form.op_2_desc.trim() || undefined,
      op_2_en: form.op_2_desc.trim() ? (form.op_2_en ?? undefined) : undefined,
      op_2_tp: form.op_2_desc.trim() ? (form.op_2_tp ?? undefined) : undefined,
      op_3_desc: form.op_3_desc.trim() || undefined,
      op_3_en: form.op_3_desc.trim() ? (form.op_3_en ?? undefined) : undefined,
      op_3_tp: form.op_3_desc.trim() ? (form.op_3_tp ?? undefined) : undefined,
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
      setDeleteConfirm(null);
    } else {
      alert(result.error);
    }
  };

  const handleInlineDelete = async (id: string, name: string) => {
    if (pendingDeleteId !== id) {
      setPendingDeleteId(id);
      return;
    }
    const result = await deleteCodexDoc('codex_parts', id);
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ['codex'] });
      setPendingDeleteId(null);
    } else {
      alert(result.error);
      setPendingDeleteId(null);
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
              { value: 'only', label: 'Only Mechanics' },
              { value: 'hide', label: 'Hide Mechanics' },
            ]}
            onChange={(v) => setFilters(f => ({ ...f, mechanicMode: (v || '') as '' | 'only' | 'hide' }))}
            placeholder="All parts"
          />
        </div>
      </FilterSection>

      <ListHeader
        columns={ADMIN_PART_COLUMNS}
        gridColumns={PART_GRID_COLUMNS}
        sortState={sortState}
        onSort={handleSort}
      />

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
            filteredParts.map((p: Part) => {
              const optionChips: { name: string; description?: string; category?: 'default' }[] = [];
              if (p.op_1_desc) {
                optionChips.push({
                  name: 'Option 1',
                  description: p.op_1_desc,
                  category: 'default',
                });
              }
              if (p.op_2_desc) {
                optionChips.push({
                  name: 'Option 2',
                  description: p.op_2_desc,
                  category: 'default',
                });
              }
              if (p.op_3_desc) {
                optionChips.push({
                  name: 'Option 3',
                  description: p.op_3_desc,
                  category: 'default',
                });
              }

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
                  gridColumns={PART_GRID_COLUMNS}
                  columns={[
                    { key: 'Type', value: (p.type || 'power').charAt(0).toUpperCase() + (p.type || 'power').slice(1) },
                    {
                      key: 'EN',
                      value: formatEnergyCost(p.base_en, p.percentage),
                      className: 'text-blue-600',
                    },
                    { key: 'TP', value: p.base_tp != null ? String(p.base_tp) : '-', className: 'text-tp' },
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

      <Modal isOpen={modalOpen} onClose={closeModal} title={editing ? 'Edit Part' : 'Add Part'} size="lg" fullScreenOnMobile
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
              Creating a copy of <strong className="text-text-primary">{copySourceName}</strong>. Change the name and details as needed, then save to add the new part.
            </p>
          )}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Name *</label>
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Part name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Description</label>
            <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Part description" className="min-h-[120px] resize-y" rows={4} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Category</label>
              <select
                value={form.category && filterOptions.categories.includes(form.category) ? form.category : (form.category ? '__new__' : '')}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === '__new__') setForm((f) => ({ ...f, category: f.category || '' }));
                  else setForm((f) => ({ ...f, category: v }));
                }}
                className="w-full px-3 py-2 rounded-md border border-border bg-background text-text-primary"
                aria-label="Part category"
              >
                <option value="">— None —</option>
                {filterOptions.categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
                <option value="__new__">Add new category...</option>
              </select>
              {form.category && !filterOptions.categories.includes(form.category) && (
                <Input
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  placeholder="Type new category"
                  className="mt-2"
                />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Type</label>
              <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as 'power' | 'technique' }))} className="w-full px-3 py-2 rounded-md border border-border bg-background text-text-primary" aria-label="Part type (power or technique)">
                <option value="power">Power</option>
                <option value="technique">Technique</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Base EN {form.percentage ? '(%)' : ''}
              </label>
              {form.percentage ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    step="any"
                    value={baseEnToPercent(form.base_en)}
                    onChange={(e) => setForm((f) => ({ ...f, base_en: percentToBaseEn(e.target.value) }))}
                    placeholder="e.g. -12.5 or 12.5"
                  />
                  <span className="text-sm text-text-muted shrink-0">%</span>
                </div>
              ) : (
                <Input
                  type="number"
                  min={0}
                  step="any"
                  value={form.base_en ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, base_en: e.target.value === '' ? undefined : (parseFloat(e.target.value) || 0) }))}
                />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Base TP</label>
              <Input type="number" min={0} step="any" value={form.base_tp ?? ''} onChange={(e) => setForm((f) => ({ ...f, base_tp: e.target.value === '' ? undefined : (parseFloat(e.target.value) || 0) }))} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.mechanic}
                onChange={(e) => setForm((f) => ({ ...f, mechanic: e.target.checked }))}
              />
              <span className="text-sm text-text-secondary">Mechanic Part</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.percentage}
                onChange={(e) => setForm((f) => ({ ...f, percentage: e.target.checked }))}
              />
              <span className="text-sm text-text-secondary">Percentage Cost</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.duration}
                onChange={(e) => setForm((f) => ({ ...f, duration: e.target.checked }))}
              />
              <span className="text-sm text-text-secondary">Affects Duration</span>
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Targeted defenses (optional)</label>
            <ChipSelect
              label=""
              placeholder="Choose defenses this part targets"
              options={DEFENSES.map((d) => ({ value: d, label: d }))}
              selectedValues={form.defense}
              onSelect={(v) => setForm((f) => ({ ...f, defense: [...f.defense, v] }))}
              onRemove={(v) => setForm((f) => ({ ...f, defense: f.defense.filter((x) => x !== v) }))}
            />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-text-secondary">Options</h4>
              {optionSlotCount < 3 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOptionSlotCount((n) => Math.min(3, n + 1))}
                  aria-label="Add option"
                >
                  <Plus className="w-4 h-4 mr-1 inline" />
                  Add option
                </Button>
              )}
            </div>
            {optionSlotCount === 0 ? (
              <p className="text-sm text-text-muted">No options. Click &quot;Add option&quot; to add cost options for this part.</p>
            ) : (
              <div className="space-y-4">
                {[1, 2, 3].slice(0, optionSlotCount).map((n) => (
                  <div key={n} className="rounded-lg border border-border-light bg-surface-alt/50 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-text-secondary">Option {n}</span>
                      {n === optionSlotCount && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-text-muted hover:text-danger"
                          onClick={() => setOptionSlotCount((prev) => Math.max(0, prev - 1))}
                          aria-label={`Remove option ${n}`}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">Description</label>
                      <textarea
                        value={n === 1 ? form.op_1_desc : n === 2 ? form.op_2_desc : form.op_3_desc}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (n === 1) setForm((f) => ({ ...f, op_1_desc: val }));
                          else if (n === 2) setForm((f) => ({ ...f, op_2_desc: val }));
                          else setForm((f) => ({ ...f, op_3_desc: val }));
                        }}
                        placeholder={`What option ${n} does`}
                        className="w-full min-h-[80px] resize-y px-3 py-2 rounded-md border border-border bg-background text-text-primary"
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4 max-w-xs">
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">
                          EN cost {form.percentage ? '(±% modifier)' : ''}
                        </label>
                        {form.percentage ? (
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              step="any"
                              value={n === 1 ? optionEnToPercent(form.op_1_en) : n === 2 ? optionEnToPercent(form.op_2_en) : optionEnToPercent(form.op_3_en)}
                              onChange={(e) => {
                                const v = percentToOptionEn(e.target.value);
                                if (n === 1) setForm((f) => ({ ...f, op_1_en: v }));
                                else if (n === 2) setForm((f) => ({ ...f, op_2_en: v }));
                                else setForm((f) => ({ ...f, op_3_en: v }));
                              }}
                              className="w-full"
                              placeholder="e.g. -12.5"
                            />
                            <span className="text-sm text-text-muted shrink-0">%</span>
                          </div>
                        ) : (
                          <Input
                            type="number"
                            step="any"
                            value={n === 1 ? (form.op_1_en ?? '') : n === 2 ? (form.op_2_en ?? '') : (form.op_3_en ?? '')}
                            onChange={(e) => {
                              const v = e.target.value === '' ? undefined : (parseFloat(e.target.value) || 0);
                              if (n === 1) setForm((f) => ({ ...f, op_1_en: v }));
                              else if (n === 2) setForm((f) => ({ ...f, op_2_en: v }));
                              else setForm((f) => ({ ...f, op_3_en: v }));
                            }}
                            className="w-full"
                            placeholder="—"
                          />
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">TP cost</label>
                        <Input
                          type="number"
                          step="any"
                          value={n === 1 ? (form.op_1_tp ?? '') : n === 2 ? (form.op_2_tp ?? '') : (form.op_3_tp ?? '')}
                          onChange={(e) => {
                            const v = e.target.value === '' ? undefined : (parseFloat(e.target.value) || 0);
                            if (n === 1) setForm((f) => ({ ...f, op_1_tp: v }));
                            else if (n === 2) setForm((f) => ({ ...f, op_2_tp: v }));
                            else setForm((f) => ({ ...f, op_3_tp: v }));
                          }}
                          className="w-full"
                          placeholder="—"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
