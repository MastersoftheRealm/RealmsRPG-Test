'use client';

import { useState, useMemo } from 'react';
import { ChipSelect } from '@/components/patterns/filters';
import {
  CodexBrowseListShell,
  ErrorDisplay as ErrorState,
  GridListRow,
  type ChipData,
} from '@/components/patterns';
import {
  useSpecies,
  useCodexSkills,
  useTraits,
  type Species,
  type Trait,
  type Skill,
} from '@/hooks';
import { formatListCellLabel } from '@/lib/utils';
import { resolveSpeciesListRowThumbnail } from '@/lib/list-row-image';
import { speciesSkillToChipData } from '@/lib/chip/species-skill-chips';
import { useSort } from '@/hooks/use-sort';
import { COPY_NAME_SUFFIX } from './admin-codex-copy-suffix';
import {
  EMPTY_SPECIES_FORM,
  speciesFormToSavePayload,
  speciesToFormState,
  type SpeciesFormState,
} from './admin-species-form';
import { AdminSpeciesEditModal } from './admin-species-edit-modal';
import { useAdminCodexEntity } from './use-admin-codex-entity';
import { AdminCodexRowActions } from './admin-codex-row-actions';

export function AdminSpeciesTab() {
  const { data: species, isLoading, error, refetch } = useSpecies();
  const { data: skills = [] } = useCodexSkills();
  const { data: traits = [] } = useTraits();
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
  } = useAdminCodexEntity<Species>({
    collection: 'codex_species',
    entityLabel: 'species',
  });
  const [search, setSearch] = useState('');
  const { sortState, handleSort, sortItems } = useSort('name');
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

  const openAdd = () => beginAdd(() => setForm(EMPTY_SPECIES_FORM));

  const openDuplicate = (s: Species) =>
    beginDuplicate(s, () =>
      setForm(
        speciesToFormState(s, skillsArr, traitsArr, (s.name || '').trim() + COPY_NAME_SUFFIX),
      ),
    );

  const openEdit = (s: Species) =>
    beginEdit(s, () => setForm(speciesToFormState(s, skillsArr, traitsArr)));

  const handleSave = async () => {
    if (!form.name.trim()) return;
    await save({
      payload: speciesFormToSavePayload(form),
      expectedUpdatedAt: editing?.updated_at,
    });
  };

  if (error)
    return (
      <ErrorState
        message="Failed to load species"
        onRetry={() => {
          void refetch();
        }}
      />
    );

  return (
    <div>
      <CodexBrowseListShell
        sectionTitle="Species"
        onAdd={openAdd}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search species..."
        filters={
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
        }
        headerColumns={[
          { key: 'name', label: 'NAME' },
          { key: 'type', label: 'TYPE' },
          { key: 'sizes', label: 'SIZES' },
        ]}
        gridColumns="1.5fr 1fr 0.8fr"
        hasThumbnailColumn
        rowChrome={{ rightSlot: true }}
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
            hideLabelIfSingle?: boolean | undefined;
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
              gridColumns="1.5fr 1fr 0.8fr"
              columns={[
                { key: 'Type', value: formatListCellLabel(s.type) },
                { key: 'Sizes', value: (s.sizes || []).join(', ') || s.size || '-' },
              ]}
              detailSections={detailSections.length > 0 ? detailSections : undefined}
              rightSlot={
                <AdminCodexRowActions
                  entity={s}
                  onEdit={openEdit}
                  onDuplicate={openDuplicate}
                  onDelete={askDelete}
                />
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
        onDelete={editing ? () => askDelete(editing) : undefined}
        onSave={handleSave}
      />

      {deleteModals}
    </div>
  );
}
