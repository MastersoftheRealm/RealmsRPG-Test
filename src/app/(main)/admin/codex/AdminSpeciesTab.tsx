'use client';

import { useState, useMemo } from 'react';
import { ChipSelect, FilterSection } from '@/components/shared/filters';
import {
  CodexBrowseListShell,
  ErrorDisplay as ErrorState,
  GridListRow,
  type ChipData,
} from '@/components/shared';
import { Button, IconButton, useToast } from '@/components/ui';
import { useSpecies, useCodexSkills, useTraits, type Species, type Trait, type Skill } from '@/hooks';
import { useQueryClient } from '@tanstack/react-query';
import { createCodexDoc, updateCodexDoc, deleteCodexDoc } from './actions';
import { Pencil, Copy, X } from 'lucide-react';
import { formatListCellLabel } from '@/lib/utils';
import { resolveSpeciesListRowThumbnail } from '@/lib/list-row-image';
import { speciesSkillToChipData } from '@/lib/chip/species-skill-chips';
import { useSort } from '@/hooks/use-sort';
import {
  COPY_NAME_SUFFIX,
  EMPTY_SPECIES_FORM,
  speciesFormToSavePayload,
  speciesToFormState,
  type SpeciesFormState,
} from './admin-species-form';
import { AdminSpeciesEditModal } from './admin-species-edit-modal';

export function AdminSpeciesTab() {
  const { showToast } = useToast();
  const { data: species, isLoading, error, refetch } = useSpecies();
  const { data: skills = [] } = useCodexSkills();
  const { data: traits = [] } = useTraits();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const { sortState, handleSort, sortItems } = useSort('name');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Species | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [copySourceName, setCopySourceName] = useState<string | null>(null);
  const [form, setForm] = useState<SpeciesFormState>(EMPTY_SPECIES_FORM);
  const [typeFilters, setTypeFilters] = useState<string[]>([]);
  const [sizeFilters, setSizeFilters] = useState<string[]>([]);

  const skillsArr = skills as Skill[];
  const traitsArr = traits as Trait[];

  const filterOptions = useMemo(() => {
    if (!species) return { types: [] as string[], sizes: [] as string[] };
    const types = new Set<string>();
    const sizes = new Set<string>();
    species.forEach((s: Species) => {
      if (s.type) types.add(s.type);
      s.sizes?.forEach((sz: string) => sizes.add(sz));
    });
    return {
      types: Array.from(types).sort(),
      sizes: Array.from(sizes).sort(),
    };
  }, [species]);

  const filtered = sortItems<Species>(
    (species || []).filter((s: Species) => {
      if (
        search &&
        !s.name.toLowerCase().includes(search.toLowerCase()) &&
        !s.description?.toLowerCase().includes(search.toLowerCase())
      ) {
        return false;
      }
      if (typeFilters.length > 0 && !typeFilters.includes(s.type)) return false;
      if (sizeFilters.length > 0 && !s.sizes?.some((sz: string) => sizeFilters.includes(sz)))
        return false;
      return true;
    }),
  );

  const openAdd = () => {
    setEditing(null);
    setCopySourceName(null);
    setForm(EMPTY_SPECIES_FORM);
    setModalOpen(true);
  };

  const openDuplicate = (s: Species) => {
    setEditing(null);
    setCopySourceName(s.name);
    setForm(
      speciesToFormState(s, skillsArr, traitsArr, (s.name || '').trim() + COPY_NAME_SUFFIX),
    );
    setModalOpen(true);
  };

  const openEdit = (s: Species) => {
    setEditing(s);
    setCopySourceName(null);
    setForm(speciesToFormState(s, skillsArr, traitsArr));
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
    const data = speciesFormToSavePayload(form);
    const result = editing
      ? await updateCodexDoc('codex_species', editing.id, data)
      : await createCodexDoc('codex_species', undefined, data);

    if (!result.success) {
      setSaving(false);
      showToast(result.error ?? 'Operation failed', 'error');
      return;
    }

    setSaving(false);
    queryClient.invalidateQueries({ queryKey: ['codex'] });
    await queryClient.refetchQueries({ queryKey: ['codex'] });
    closeModal();
  };

  const handleDelete = async (id: string) => {
    if (deleteConfirm !== id) {
      setDeleteConfirm(id);
      return;
    }
    const result = await deleteCodexDoc('codex_species', id);
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
    const result = await deleteCodexDoc('codex_species', id);
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ['codex'] });
      await queryClient.refetchQueries({ queryKey: ['codex'] });
      setPendingDeleteId(null);
    } else {
      showToast(result.error ?? 'Operation failed', 'error');
      setPendingDeleteId(null);
    }
  };

  if (error) return <ErrorState message="Failed to load species" onRetry={() => { void refetch(); }} />;

  return (
    <div>
      <CodexBrowseListShell
        sectionTitle="Species"
        onAdd={openAdd}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search species..."
        filters={
          <FilterSection>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ChipSelect
                label="Type"
                placeholder="Choose type"
                options={filterOptions.types.map((t) => ({ value: t, label: t }))}
                selectedValues={typeFilters}
                onSelect={(v) => setTypeFilters((prev) => [...prev, v])}
                onRemove={(v) => setTypeFilters((prev) => prev.filter((t) => t !== v))}
              />
              <ChipSelect
                label="Size"
                placeholder="Choose size"
                options={filterOptions.sizes.map((s) => ({ value: s, label: s }))}
                selectedValues={sizeFilters}
                onSelect={(v) => setSizeFilters((prev) => [...prev, v])}
                onRemove={(v) => setSizeFilters((prev) => prev.filter((s) => s !== v))}
              />
            </div>
          </FilterSection>
        }
        headerColumns={[
          { key: 'name', label: 'NAME' },
          { key: 'type', label: 'TYPE' },
          { key: 'sizes', label: 'SIZES' },
          { key: '_actions', label: '', sortable: false as const },
        ]}
        gridColumns="1.5fr 1fr 0.8fr 40px"
        hasThumbnailColumn
        sortState={sortState}
        onSort={handleSort}
        isLoading={isLoading}
        isEmpty={filtered.length === 0}
        emptyTitle="No species found"
        emptyMessage="Add one to get started."
        emptyAction={{ label: 'Add Species', onClick: openAdd }}
      >
        {filtered.map((s: Species) => {
          const traitIdToTrait = new Map<string, Trait>(traitsArr.map((t) => [String(t.id), t]));

          const makeTraitChips = (ids: (string | number)[] | undefined) =>
            (ids || []).map((id) => {
              const key = String(id);
              const trait = traitIdToTrait.get(key);
              return {
                name: trait?.name ?? key,
                description: trait?.description,
                category: 'default' as const,
              };
            });

          const skillsChips = (s.skills || []).map((id) => speciesSkillToChipData(id, skillsArr));
          const speciesTraitChips = makeTraitChips(s.species_traits as string[] | undefined);
          const ancestryTraitChips = makeTraitChips(s.ancestry_traits as string[] | undefined);
          const flawChips = makeTraitChips(s.flaws as string[] | undefined);
          const characteristicChips = makeTraitChips(s.characteristics as string[] | undefined);

          const detailSections: Array<{
            label: string;
            chips: ChipData[];
            hideLabelIfSingle?: boolean;
          }> = [];

          if (skillsChips.length > 0) {
            detailSections.push({ label: 'Skills', chips: skillsChips, hideLabelIfSingle: true });
          }
          if (speciesTraitChips.length > 0) {
            detailSections.push({ label: 'Species Traits', chips: speciesTraitChips });
          }
          if (ancestryTraitChips.length > 0) {
            detailSections.push({ label: 'Ancestry Traits', chips: ancestryTraitChips });
          }
          if (flawChips.length > 0) {
            detailSections.push({ label: 'Flaws', chips: flawChips });
          }
          if (characteristicChips.length > 0) {
            detailSections.push({ label: 'Characteristics', chips: characteristicChips });
          }

          return (
            <GridListRow
              key={s.id}
              id={s.id}
              name={s.name}
              thumbnail={resolveSpeciesListRowThumbnail(s)}
              description={s.description || ''}
              gridColumns="1.5fr 1fr 0.8fr 40px"
              columns={[
                { key: 'Type', value: formatListCellLabel(s.type) },
                { key: 'Sizes', value: (s.sizes || []).join(', ') || s.size || '-' },
              ]}
              detailSections={detailSections.length > 0 ? detailSections : undefined}
              rightSlot={
                <div className="flex items-center gap-1 pr-2">
                  {pendingDeleteId === s.id ? (
                    <div className="flex items-center gap-1 text-xs">
                      <span className="text-danger-700 dark:text-danger-400 font-medium whitespace-nowrap">
                        Remove?
                      </span>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleInlineDelete(s.id)}
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
                        onClick={() => openEdit(s)}
                        label="Edit"
                        aria-label="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </IconButton>
                      <IconButton
                        variant="ghost"
                        size="sm"
                        onClick={() => openDuplicate(s)}
                        label="Duplicate"
                        aria-label="Duplicate"
                      >
                        <Copy className="w-4 h-4" />
                      </IconButton>
                      <IconButton
                        variant="ghost"
                        size="sm"
                        onClick={() => setPendingDeleteId(s.id)}
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

      <AdminSpeciesEditModal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editing ? 'Edit Species' : 'Add Species'}
        copySourceName={copySourceName}
        editingId={editing?.id ?? null}
        form={form}
        setForm={setForm}
        skills={skillsArr}
        traits={traitsArr}
        saving={saving}
        deleteConfirm={deleteConfirm}
        onRequestDelete={() => editing && handleDelete(editing.id)}
        onSave={handleSave}
      />
    </div>
  );
}
