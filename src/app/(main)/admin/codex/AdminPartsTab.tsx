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
import { Modal, Button, Input } from '@/components/ui';
import { ChipSelect, SelectFilter, FilterSection } from '@/components/codex';
import { useParts, type Part } from '@/hooks';
import { ABILITIES_AND_DEFENSES } from '@/lib/game/constants';
import { useSort } from '@/hooks/use-sort';
import { useQueryClient } from '@tanstack/react-query';
import { createCodexDoc, updateCodexDoc, deleteCodexDoc } from './actions';
import { Pencil, X } from 'lucide-react';
import { IconButton } from '@/components/ui';

const PART_GRID_COLUMNS = '1.5fr 1fr 0.8fr 0.8fr 40px';

function formatEnergyCost(en: number | undefined, isPercentage: boolean | undefined): string {
  if (en === undefined || en === 0) return '-';
  if (isPercentage) {
    const percentChange = (en - 1) * 100;
    const sign = percentChange >= 0 ? '+' : '';
    return `${sign}${percentChange.toFixed(percentChange % 1 === 0 ? 0 : 1)}%`;
  }
  return String(en);
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

  const DEFENSES = useMemo(() => ABILITIES_AND_DEFENSES.slice(6), []);

  const [form, setForm] = useState({
    name: '',
    description: '',
    category: '',
    type: 'power' as 'power' | 'technique',
    base_en: 0,
    base_tp: 0,
    mechanic: false,
    percentage: false,
    duration: false,
    defense: [] as string[],
    op_1_desc: '',
    op_1_en: 0,
    op_1_tp: 0,
    op_2_desc: '',
    op_2_en: 0,
    op_2_tp: 0,
    op_3_desc: '',
    op_3_en: 0,
    op_3_tp: 0,
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
    setForm({
      name: '',
      description: '',
      category: '',
      type: 'power',
      base_en: 0,
      base_tp: 0,
      mechanic: false,
      percentage: false,
      duration: false,
      defense: [],
      op_1_desc: '',
      op_1_en: 0,
      op_1_tp: 0,
      op_2_desc: '',
      op_2_en: 0,
      op_2_tp: 0,
      op_3_desc: '',
      op_3_en: 0,
      op_3_tp: 0,
    });
    setModalOpen(true);
  };

  const openEdit = (p: Part & { defense?: string[] }) => {
    setEditing(p);
    setForm({
      name: p.name,
      description: p.description || '',
      category: p.category || '',
      type: ((p.type || 'power').toLowerCase() === 'technique' ? 'technique' : 'power') as 'power' | 'technique',
      base_en: p.base_en ?? 0,
      base_tp: p.base_tp ?? 0,
      mechanic: Boolean((p as any).mechanic),
      percentage: Boolean((p as any).percentage),
      duration: Boolean((p as any).duration),
      defense: Array.isArray(p.defense) ? [...p.defense] : [],
      op_1_desc: (p as any).op_1_desc || '',
      op_1_en: (p as any).op_1_en ?? 0,
      op_1_tp: (p as any).op_1_tp ?? 0,
      op_2_desc: (p as any).op_2_desc || '',
      op_2_en: (p as any).op_2_en ?? 0,
      op_2_tp: (p as any).op_2_tp ?? 0,
      op_3_desc: (p as any).op_3_desc || '',
      op_3_en: (p as any).op_3_en ?? 0,
      op_3_tp: (p as any).op_3_tp ?? 0,
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
    const data: Record<string, unknown> = {
      name: form.name.trim(),
      description: form.description.trim(),
      category: form.category.trim(),
      type: form.type,
      base_en: form.base_en,
      base_tp: form.base_tp,
      mechanic: form.mechanic,
      percentage: form.percentage,
      duration: form.duration,
      defense: form.defense.length > 0 ? form.defense : undefined,
      op_1_desc: form.op_1_desc.trim() || undefined,
      op_1_en: form.op_1_desc.trim() ? form.op_1_en || 0 : 0,
      op_1_tp: form.op_1_desc.trim() ? form.op_1_tp || 0 : 0,
      op_2_desc: form.op_2_desc.trim() || undefined,
      op_2_en: form.op_2_desc.trim() ? form.op_2_en || 0 : 0,
      op_2_tp: form.op_2_desc.trim() ? form.op_2_tp || 0 : 0,
      op_3_desc: form.op_3_desc.trim() || undefined,
      op_3_en: form.op_3_desc.trim() ? form.op_3_en || 0 : 0,
      op_3_tp: form.op_3_desc.trim() ? form.op_3_tp || 0 : 0,
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
                          <IconButton variant="ghost" size="sm" onClick={() => openEdit(p)} label="Edit">
                            <Pencil className="w-4 h-4" />
                          </IconButton>
                          <IconButton
                            variant="ghost"
                            size="sm"
                            onClick={() => setPendingDeleteId(p.id)}
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
              );
            })
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
              <span className="text-xs text-text-muted">Leave empty to omit</span>
            </div>
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-3 items-center">
                <Input
                  value={form.op_1_desc}
                  onChange={(e) => setForm((f) => ({ ...f, op_1_desc: e.target.value }))}
                  placeholder="Option 1 description"
                />
                <Input
                  type="number"
                  min={0}
                  step={0.5}
                  value={form.op_1_en}
                  onChange={(e) => setForm((f) => ({ ...f, op_1_en: parseFloat(e.target.value) || 0 }))}
                  placeholder="EN"
                />
                <Input
                  type="number"
                  min={0}
                  step={0.5}
                  value={form.op_1_tp}
                  onChange={(e) => setForm((f) => ({ ...f, op_1_tp: parseFloat(e.target.value) || 0 }))}
                  placeholder="TP"
                />
              </div>
              <div className="grid grid-cols-3 gap-3 items-center">
                <Input
                  value={form.op_2_desc}
                  onChange={(e) => setForm((f) => ({ ...f, op_2_desc: e.target.value }))}
                  placeholder="Option 2 description"
                />
                <Input
                  type="number"
                  min={0}
                  step={0.5}
                  value={form.op_2_en}
                  onChange={(e) => setForm((f) => ({ ...f, op_2_en: parseFloat(e.target.value) || 0 }))}
                  placeholder="EN"
                />
                <Input
                  type="number"
                  min={0}
                  step={0.5}
                  value={form.op_2_tp}
                  onChange={(e) => setForm((f) => ({ ...f, op_2_tp: parseFloat(e.target.value) || 0 }))}
                  placeholder="TP"
                />
              </div>
              <div className="grid grid-cols-3 gap-3 items-center">
                <Input
                  value={form.op_3_desc}
                  onChange={(e) => setForm((f) => ({ ...f, op_3_desc: e.target.value }))}
                  placeholder="Option 3 description"
                />
                <Input
                  type="number"
                  min={0}
                  step={0.5}
                  value={form.op_3_en}
                  onChange={(e) => setForm((f) => ({ ...f, op_3_en: parseFloat(e.target.value) || 0 }))}
                  placeholder="EN"
                />
                <Input
                  type="number"
                  min={0}
                  step={0.5}
                  value={form.op_3_tp}
                  onChange={(e) => setForm((f) => ({ ...f, op_3_tp: parseFloat(e.target.value) || 0 }))}
                  placeholder="TP"
                />
              </div>
              <p className="text-xs text-text-muted">
                Only options with a description are saved; leave rows blank if this part has fewer options.
              </p>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
