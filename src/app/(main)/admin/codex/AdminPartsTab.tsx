'use client';

import { useMemo, useState } from 'react';
import {
  CodexBrowseListShell,
  ErrorDisplay as ErrorState,
  GridListRow,
} from '@/components/patterns';
import { useToast } from '@/components/ui';
import { SelectFilter } from '@/components/patterns/filters';
import { useParts, type Part } from '@/hooks';
import { ABILITIES_AND_DEFENSES } from '@/lib/game/constants';
import { formatListCellLabel } from '@/lib/utils';
import { useSort } from '@/hooks/use-sort';
import { COPY_NAME_SUFFIX } from './admin-codex-copy-suffix';
import {
  EMPTY_PART_FORM,
  formatDecimalPreserve,
  formatEnergyCost,
  optionSlotCountFromForm,
  partFormToSavePayload,
  partToFormState,
  savedPartFromPayload,
  type PartFormState,
  type PartOption,
} from './admin-part-form';
import { AdminPartEditModal } from './admin-part-edit-modal';
import { useAdminCodexEntity } from './use-admin-codex-entity';
import { AdminCodexRowActions } from './admin-codex-row-actions';

const ADMIN_PART_COLUMNS = [
  { key: 'name', label: 'NAME' },
  { key: 'category', label: 'CATEGORY' },
  { key: '_en', label: 'ENERGY' },
  { key: '_tp', label: 'TP' },
];

const PART_GRID_COLUMNS = '1.5fr 1fr 0.8fr 0.8fr';

interface PartFilters {
  search: string;
  categoryFilter: string;
  typeFilter: 'all' | 'power' | 'technique';
  mechanicMode: '' | 'only' | 'hide';
}

export function AdminPartsTab() {
  const { showToast } = useToast();
  const { data: parts, isLoading, error, refetch } = useParts();
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
  } = useAdminCodexEntity<Part>({
    collection: 'codex_parts',
    entityLabel: 'part',
  });
  const { sortState, handleSort } = useSort('name');
  const [filters, setFilters] = useState<PartFilters>({
    search: '',
    categoryFilter: '',
    typeFilter: 'all',
    mechanicMode: '',
  });
  const [optionSlotCount, setOptionSlotCount] = useState(0);
  const [form, setForm] = useState<PartFormState>(EMPTY_PART_FORM);

  const readOptionsFromForm = (): PartOption[] => {
    const opts: PartOption[] = [];
    const op1Desc = form.op_1_desc.trim();
    const op2Desc = form.op_2_desc.trim();
    const op3Desc = form.op_3_desc.trim();
    if (optionSlotCount >= 1) opts.push({ desc: op1Desc, en: form.op_1_en, tp: form.op_1_tp });
    if (optionSlotCount >= 2) opts.push({ desc: op2Desc, en: form.op_2_en, tp: form.op_2_tp });
    if (optionSlotCount >= 3) opts.push({ desc: op3Desc, en: form.op_3_en, tp: form.op_3_tp });
    return opts;
  };

  const writeOptionsToForm = (opts: PartOption[]) => {
    const o1 = opts[0];
    const o2 = opts[1];
    const o3 = opts[2];
    setForm((f) => ({
      ...f,
      op_1_desc: o1?.desc ?? '',
      op_1_en: o1?.desc ? o1.en : undefined,
      op_1_tp: o1?.desc ? o1.tp : undefined,
      op_2_desc: o2?.desc ?? '',
      op_2_en: o2?.desc ? o2.en : undefined,
      op_2_tp: o2?.desc ? o2.tp : undefined,
      op_3_desc: o3?.desc ?? '',
      op_3_en: o3?.desc ? o3.en : undefined,
      op_3_tp: o3?.desc ? o3.tp : undefined,
    }));
    setOptionSlotCount(Math.min(3, Math.max(0, opts.length)));
  };

  const deleteOptionAndCompact = (index1Based: 1 | 2 | 3) => {
    const opts = readOptionsFromForm();
    const idx = index1Based - 1;
    if (idx < 0 || idx >= opts.length) return;
    writeOptionsToForm(opts.filter((_, i) => i !== idx));
  };

  const targetedDefenseOptions = useMemo(() => [...ABILITIES_AND_DEFENSES.slice(6), 'Evasion'], []);

  const filterOptions = useMemo(() => {
    if (!parts) return { categories: [] as string[] };
    const categories = new Set<string>();
    parts.forEach((p: Part) => {
      if (p.category) categories.add(p.category);
    });
    return { categories: Array.from(categories).sort() };
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
    const mapped = filtered.map((p: Part) => ({ ...p, category: p.category || '' }));
    return mapped.sort((a: FilteredPart, b: FilteredPart) => {
      const { col, dir } = sortState;
      if (col === 'name') return dir * a.name.localeCompare(b.name);
      if (col === 'category') return dir * (a.category || '').localeCompare(b.category || '');
      if (col === '_en') return dir * ((a.base_en ?? 0) - (b.base_en ?? 0));
      if (col === '_tp') return dir * ((a.base_tp ?? 0) - (b.base_tp ?? 0));
      return 0;
    });
  }, [parts, filters, sortState]);

  const openAdd = () =>
    beginAdd(() => {
      setOptionSlotCount(0);
      setForm(EMPTY_PART_FORM);
    });

  const openDuplicate = (p: Part & { defense?: string[] | undefined }) =>
    beginDuplicate(p, () => {
      const next = partToFormState(p);
      setOptionSlotCount(optionSlotCountFromForm(next));
      setForm({ ...next, name: (p.name || '').trim() + COPY_NAME_SUFFIX });
    });

  const openEdit = (p: Part & { defense?: string[] | undefined }) =>
    beginEdit(p, () => {
      const next = partToFormState(p);
      setOptionSlotCount(optionSlotCountFromForm(next));
      setForm(next);
    });

  const handleSave = async () => {
    if (!form.name.trim()) return;
    const data = partFormToSavePayload(form);
    await save({
      payload: data,
      expectedUpdatedAt: editing?.updated_at,
      onSuccess: async ({ id }) => {
        const savedId = editing ? editing.id : id;
        if (!savedId) {
          showToast('Save succeeded but no ID was returned. Please refresh.', 'warning');
          return;
        }
        const savedPart = savedPartFromPayload(savedId, data);
        queryClient.setQueryData(['codex'], (prev: unknown) => {
          if (!prev || typeof prev !== 'object') return prev;
          const prevCodex = prev as Record<string, unknown>;
          const prevParts = (prevCodex.parts as Part[] | undefined) ?? [];
          const nextParts = prevParts.some((row) => row.id === savedId)
            ? prevParts.map((row) => (row.id === savedId ? { ...row, ...savedPart } : row))
            : [...prevParts, savedPart];
          return { ...prevCodex, parts: nextParts };
        });
      },
    });
  };

  if (error)
    return (
      <ErrorState
        message="Failed to load parts"
        onRetry={() => {
          void refetch();
        }}
      />
    );

  return (
    <div>
      <CodexBrowseListShell
        sectionTitle="Power & Technique Parts"
        onAdd={openAdd}
        search={filters.search}
        onSearchChange={(v) => setFilters((f) => ({ ...f, search: v }))}
        searchPlaceholder="Search parts..."
        filters={
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <SelectFilter
              label="Category"
              value={filters.categoryFilter}
              options={filterOptions.categories.map((c) => ({ value: c, label: c }))}
              onChange={(v) => setFilters((f) => ({ ...f, categoryFilter: v }))}
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
              onChange={(v) =>
                setFilters((f) => ({ ...f, typeFilter: v as 'all' | 'power' | 'technique' }))
              }
              placeholder={null}
            />
            <SelectFilter
              label="Mechanics"
              value={filters.mechanicMode}
              options={[
                { value: 'only', label: 'Only Mechanics' },
                { value: 'hide', label: 'Hide Mechanics' },
              ]}
              onChange={(v) =>
                setFilters((f) => ({ ...f, mechanicMode: (v || '') as '' | 'only' | 'hide' }))
              }
              placeholder="All parts"
            />
          </div>
        }
        headerColumns={ADMIN_PART_COLUMNS}
        gridColumns={PART_GRID_COLUMNS}
        sortState={sortState}
        onSort={handleSort}
        rowChrome={{ rightSlot: true }}
        isLoading={isLoading}
        isEmpty={filteredParts.length === 0}
        emptyTitle="No parts found"
        emptyMessage="No parts match your filters."
        emptyAction={{ label: 'Add Part', onClick: openAdd }}
      >
        {filteredParts.map((p: Part) => {
          const formatEnergyCostAllowZero = (en: number | undefined): string | null => {
            if (en === undefined || Number.isNaN(en)) return null;
            if (p.percentage) {
              const percentChange = (en - 1) * 100;
              const sign = percentChange >= 0 ? '+' : '';
              return `${sign}${formatDecimalPreserve(percentChange)}%`;
            }
            return formatDecimalPreserve(en);
          };

          const optionChips: {
            name: string;
            description?: string | undefined;
            category?: 'default' | undefined;
          }[] = [];
          if (p.op_1_desc) {
            const chipParts: string[] = [];
            const enStr = formatEnergyCostAllowZero(p.op_1_en);
            if (enStr != null) chipParts.push(`EN: ${enStr}`);
            if (p.op_1_tp !== undefined && !Number.isNaN(p.op_1_tp))
              chipParts.push(`TP: ${formatDecimalPreserve(p.op_1_tp)}`);
            optionChips.push({
              name: chipParts.length ? `Option 1 (${chipParts.join(', ')})` : 'Option 1',
              description: p.op_1_desc,
              category: 'default',
            });
          }
          if (p.op_2_desc) {
            const chipParts: string[] = [];
            const enStr = formatEnergyCostAllowZero(p.op_2_en);
            if (enStr != null) chipParts.push(`EN: ${enStr}`);
            if (p.op_2_tp !== undefined && !Number.isNaN(p.op_2_tp))
              chipParts.push(`TP: ${formatDecimalPreserve(p.op_2_tp)}`);
            optionChips.push({
              name: chipParts.length ? `Option 2 (${chipParts.join(', ')})` : 'Option 2',
              description: p.op_2_desc,
              category: 'default',
            });
          }
          if (p.op_3_desc) {
            const chipParts: string[] = [];
            const enStr = formatEnergyCostAllowZero(p.op_3_en);
            if (enStr != null) chipParts.push(`EN: ${enStr}`);
            if (p.op_3_tp !== undefined && !Number.isNaN(p.op_3_tp))
              chipParts.push(`TP: ${formatDecimalPreserve(p.op_3_tp)}`);
            optionChips.push({
              name: chipParts.length ? `Option 3 (${chipParts.join(', ')})` : 'Option 3',
              description: p.op_3_desc,
              category: 'default',
            });
          }

          const detailSections =
            optionChips.length > 0 ? [{ label: 'Options', chips: optionChips }] : undefined;

          return (
            <GridListRow
              key={p.id}
              id={p.id}
              name={p.name}
              description={p.description || ''}
              gridColumns={PART_GRID_COLUMNS}
              columns={[
                { key: 'Type', value: formatListCellLabel(p.type || 'power') },
                {
                  key: 'EN',
                  value: formatEnergyCost(p.base_en, p.percentage),
                  className: 'text-energy-text',
                },
                {
                  key: 'TP',
                  value: p.base_tp != null ? String(p.base_tp) : '-',
                  className: 'text-tp',
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

      <AdminPartEditModal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editing ? 'Edit Part' : 'Add Part'}
        copySourceName={copySourceName}
        editingId={editing?.id ?? null}
        form={form}
        setForm={setForm}
        filterCategories={filterOptions.categories}
        targetedDefenseOptions={targetedDefenseOptions}
        optionSlotCount={optionSlotCount}
        setOptionSlotCount={setOptionSlotCount}
        deleteOptionAndCompact={deleteOptionAndCompact}
        saving={saving}
        onDelete={editing ? () => askDelete(editing) : undefined}
        onSave={handleSave}
      />

      {deleteModals}
    </div>
  );
}
