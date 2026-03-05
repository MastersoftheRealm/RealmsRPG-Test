'use client';

import { useState, useMemo } from 'react';
import { ChipSelect, FilterSection } from '@/components/codex';
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
import { useSpecies, useCodexSkills, useTraits, type Species, type Trait, type Skill } from '@/hooks';
import { useQueryClient } from '@tanstack/react-query';
import { createCodexDoc, updateCodexDoc, deleteCodexDoc } from './actions';
import { Pencil, Copy, X, Plus } from 'lucide-react';
import { IconButton } from '@/components/ui';
import { useModalListState } from '@/hooks/use-modal-list-state';

const COPY_NAME_SUFFIX = ' copy';
const TRAIT_PICKER_GRID = '1.5fr 0.6fr 0.6fr 60px';
import { useSort } from '@/hooks/use-sort';

export function AdminSpeciesTab() {
  const { data: species, isLoading, error } = useSpecies();
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

  const [form, setForm] = useState({
    name: '',
    description: '',
    type: '',
    // Primary size is derived from sizes; keep in state for convenience but do not expose as a separate field
    size: 'Medium',
    sizes: 'Medium',
    skillIds: [] as string[],
    speciesTraitIds: [] as string[],
    ancestryTraitIds: [] as string[],
    flawIds: [] as string[],
    characteristicIds: [] as string[],
    aveHeight: '',
    aveWeight: '',
    adultAge: '',
    maxAge: '',
    languages: '',
  });

  const skillOptions = useMemo(
    () => (skills as Skill[]).map((s) => ({ value: String(s.id), label: s.name })),
    [skills],
  );

  const traitOptions = useMemo(
    () => (traits as Trait[]).map((t) => ({ value: String(t.id), label: t.name })),
    [traits],
  );

  const normalizeIds = (values: string[] = [], all: Array<{ id: string; name: string }>): string[] =>
    values.map((val) => {
      const byId = all.find((it) => String(it.id) === String(val));
      if (byId) return String(byId.id);
      const byName = all.find((it) => it.name === val);
      return byName ? String(byName.id) : String(val);
    });

  const [typeFilters, setTypeFilters] = useState<string[]>([]);
  const [sizeFilters, setSizeFilters] = useState<string[]>([]);
  const [traitPickerFor, setTraitPickerFor] = useState<null | 'speciesTraitIds' | 'ancestryTraitIds' | 'flawIds' | 'characteristicIds'>(null);

  const traitPickerList = useModalListState({
    items: (traits as Trait[]) || [],
    searchFields: ['name', 'description'],
    initialSortKey: 'name',
  });

  const traitIdToTrait = useMemo(() => new Map((traits as Trait[]).map((t) => [String(t.id), t])), [traits]);

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
      if (sizeFilters.length > 0 && !s.sizes?.some((sz: string) => sizeFilters.includes(sz))) return false;
      return true;
    }),
  );

  const openAdd = () => {
    setEditing(null);
    setCopySourceName(null);
    setForm({
      name: '',
      description: '',
      type: '',
      size: 'Medium',
      sizes: 'Medium',
      skillIds: [],
      speciesTraitIds: [],
      ancestryTraitIds: [],
      flawIds: [],
      characteristicIds: [],
      aveHeight: '',
      aveWeight: '',
      adultAge: '',
      maxAge: '',
      languages: '',
    });
    setModalOpen(true);
  };

  const openDuplicate = (s: Species) => {
    setEditing(null);
    setCopySourceName(s.name);
    const allSkillsArr = skills as Skill[];
    const allTraitsArr = traits as Trait[];
    const skillIds = normalizeIds((s.skills || []) as string[], allSkillsArr);
    const speciesTraitIds = normalizeIds((s.species_traits || []) as string[], allTraitsArr);
    const ancestryTraitIds = normalizeIds((s.ancestry_traits || []) as string[], allTraitsArr);
    const flawIds = normalizeIds((s.flaws || []) as string[], allTraitsArr);
    const characteristicIds = normalizeIds((s.characteristics || []) as string[], allTraitsArr);
    const adult = s.adulthood_lifespan && s.adulthood_lifespan[0] != null ? String(s.adulthood_lifespan[0]) : '';
    const max = s.adulthood_lifespan && s.adulthood_lifespan[1] != null ? String(s.adulthood_lifespan[1]) : '';
    setForm({
      name: (s.name || '').trim() + COPY_NAME_SUFFIX,
      description: s.description || '',
      type: s.type || '',
      size: s.size || (s.sizes && s.sizes[0]) || 'Medium',
      sizes: (s.sizes || []).join(', ') || s.size || 'Medium',
      skillIds,
      speciesTraitIds,
      ancestryTraitIds,
      flawIds,
      characteristicIds,
      aveHeight: s.ave_height != null ? String(s.ave_height) : '',
      aveWeight: s.ave_weight != null ? String(s.ave_weight) : '',
      adultAge: adult,
      maxAge: max,
      languages: (s.languages || []).join(', '),
    });
    setModalOpen(true);
  };

  const openEdit = (s: Species) => {
    setEditing(s);
    setCopySourceName(null);
    const allSkillsArr = skills as Skill[];
    const allTraitsArr = traits as Trait[];
    const skillIds = normalizeIds((s.skills || []) as string[], allSkillsArr);
    const speciesTraitIds = normalizeIds((s.species_traits || []) as string[], allTraitsArr);
    const ancestryTraitIds = normalizeIds((s.ancestry_traits || []) as string[], allTraitsArr);
    const flawIds = normalizeIds((s.flaws || []) as string[], allTraitsArr);
    const characteristicIds = normalizeIds((s.characteristics || []) as string[], allTraitsArr);
    const adult = s.adulthood_lifespan && s.adulthood_lifespan[0] != null ? String(s.adulthood_lifespan[0]) : '';
    const max = s.adulthood_lifespan && s.adulthood_lifespan[1] != null ? String(s.adulthood_lifespan[1]) : '';
    setForm({
      name: s.name,
      description: s.description || '',
      type: s.type || '',
      // Derive primary size from sizes array; kept internal only
      size: s.size || (s.sizes && s.sizes[0]) || 'Medium',
      sizes: (s.sizes || []).join(', ') || s.size || 'Medium',
      skillIds,
      speciesTraitIds,
      ancestryTraitIds,
      flawIds,
      characteristicIds,
      aveHeight: s.ave_height != null ? String(s.ave_height) : '',
      aveWeight: s.ave_weight != null ? String(s.ave_weight) : '',
      adultAge: adult,
      maxAge: max,
      languages: (s.languages || []).join(', '),
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setCopySourceName(null);
    setDeleteConfirm(null);
    setTraitPickerFor(null);
  };

  const addTraitTo = (traitId: string) => {
    if (!traitPickerFor) return;
    setForm((f) => {
      const arr = f[traitPickerFor];
      if (arr.includes(traitId)) return f;
      return { ...f, [traitPickerFor]: [...arr, traitId] };
    });
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    const sizes = form.sizes.split(',').map((x) => x.trim()).filter(Boolean);
    const adult = form.adultAge ? parseInt(form.adultAge, 10) || 0 : 0;
    const max = form.maxAge ? parseInt(form.maxAge, 10) || 0 : 0;
    const adulthood_lifespan = adult > 0 && max > 0 ? [adult, max] : undefined;
    const ave_height = form.aveHeight ? parseInt(form.aveHeight, 10) || 0 : undefined;
    const ave_weight = form.aveWeight ? parseInt(form.aveWeight, 10) || 0 : undefined;
    const languages = form.languages
      .split(',')
      .map((l) => l.trim())
      .filter(Boolean);
    // Only sizes is stored in DB; size is form-only fallback. Do not send size.
    const data = {
      name: form.name.trim(),
      description: form.description.trim(),
      type: form.type.trim(),
      sizes: sizes.length ? sizes : [sizes[0] || form.size || 'Medium'],
      skills: form.skillIds,
      species_traits: form.speciesTraitIds,
      ancestry_traits: form.ancestryTraitIds,
      flaws: form.flawIds,
      characteristics: form.characteristicIds,
      ave_height,
      ave_weight,
      adulthood_lifespan,
      languages,
    };

    const id = form.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_-]/g, '').slice(0, 100) || `species_${Date.now()}`;

    const result = editing ? await updateCodexDoc('codex_species', editing.id, data) : await createCodexDoc('codex_species', id, data);

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
    const result = await deleteCodexDoc('codex_species', id);
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
    const result = await deleteCodexDoc('codex_species', id);
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ['codex'] });
      setPendingDeleteId(null);
    } else {
      alert(result.error);
      setPendingDeleteId(null);
    }
  };

  if (error) return <ErrorState message="Failed to load species" />;

  return (
    <div>
      <SectionHeader title="Species" onAdd={openAdd} size="md" />
      <div className="mb-4 mt-2">
        <SearchInput value={search} onChange={setSearch} placeholder="Search species..." />
      </div>

      <FilterSection>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ChipSelect
            label="Type"
            placeholder="Choose type"
            options={filterOptions.types.map(t => ({ value: t, label: t }))}
            selectedValues={typeFilters}
            onSelect={(v) => setTypeFilters((prev) => [...prev, v])}
            onRemove={(v) => setTypeFilters((prev) => prev.filter(t => t !== v))}
          />

          <ChipSelect
            label="Size"
            placeholder="Choose size"
            options={filterOptions.sizes.map(s => ({ value: s, label: s }))}
            selectedValues={sizeFilters}
            onSelect={(v) => setSizeFilters((prev) => [...prev, v])}
            onRemove={(v) => setSizeFilters((prev) => prev.filter(s => s !== v))}
          />
        </div>
      </FilterSection>

      <ListHeader
        columns={[
          { key: 'name', label: 'NAME' },
          { key: 'type', label: 'TYPE' },
          { key: 'sizes', label: 'SIZES' },
          { key: '_actions', label: '', sortable: false as const },
        ]}
        gridColumns="1.5fr 1fr 0.8fr 40px"
        sortState={sortState}
        onSort={handleSort}
      />

      {isLoading ? (
        <LoadingState />
      ) : (
        <div className="flex flex-col gap-1 mt-2">
          {filtered.length === 0 ? (
            <EmptyState
              title="No species found"
              description="Add one to get started."
              action={{ label: 'Add Species', onClick: openAdd }}
              size="sm"
            />
          ) : (
            filtered.map((s: Species) => {
              // Build expandable chips for skills and traits so RMs can read descriptions inline
              const skillIdToName = new Map<string, string>(
                (skills as Skill[]).map((sk) => [String(sk.id), sk.name]),
              );
              const traitIdToTrait = new Map<string, Trait>(
                (traits as Trait[]).map((t) => [String(t.id), t]),
              );

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

              const skillsChips =
                (s.skills || []).map((id) => {
                  const key = String(id);
                  const name = skillIdToName.get(key) || key;
                  return { name, category: 'skill' as const };
                });

              const speciesTraitChips = makeTraitChips(s.species_traits as string[] | undefined);
              const ancestryTraitChips = makeTraitChips(s.ancestry_traits as string[] | undefined);
              const flawChips = makeTraitChips(s.flaws as string[] | undefined);
              const characteristicChips = makeTraitChips(s.characteristics as string[] | undefined);

              const detailSections: Array<{
                label: string;
                chips: { name: string; description?: string; category?: 'default' | 'skill' | 'tag' | 'archetype' }[];
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
                  description={s.description || ''}
                  gridColumns="1.5fr 1fr 0.8fr 40px"
                  columns={[
                    { key: 'Type', value: s.type || '-' },
                    { key: 'Sizes', value: (s.sizes || []).join(', ') || s.size || '-' },
                  ]}
                  detailSections={detailSections.length > 0 ? detailSections : undefined}
                  rightSlot={
                    <div className="flex items-center gap-1 pr-2">
                      {pendingDeleteId === s.id ? (
                        <div className="flex items-center gap-1 text-xs">
                          <span className="text-red-600 font-medium whitespace-nowrap">Remove?</span>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleInlineDelete(s.id, s.name)}
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
                          <IconButton variant="ghost" size="sm" onClick={() => openEdit(s)} label="Edit" aria-label="Edit">
                            <Pencil className="w-4 h-4" />
                          </IconButton>
                          <IconButton variant="ghost" size="sm" onClick={() => openDuplicate(s)} label="Duplicate" aria-label="Duplicate">
                            <Copy className="w-4 h-4" />
                          </IconButton>
                          <IconButton
                            variant="ghost"
                            size="sm"
                            onClick={() => setPendingDeleteId(s.id)}
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

      <Modal isOpen={modalOpen} onClose={closeModal} title={editing ? 'Edit Species' : 'Add Species'} size="lg" fullScreenOnMobile
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
              Creating a copy of <strong className="text-text-primary">{copySourceName}</strong>. Change the name and details as needed, then save to add the new species.
            </p>
          )}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Name *</label>
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Species name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Description</label>
            <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Species description" className="min-h-[120px] resize-y" rows={4} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Type</label>
              <Input value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} placeholder="e.g. Humanoid" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">All Sizes (comma-separated)</label>
              <Input value={form.sizes} onChange={(e) => setForm((f) => ({ ...f, sizes: e.target.value }))} placeholder="Small, Medium, Large" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Languages (comma-separated)</label>
              <Input value={form.languages} onChange={(e) => setForm((f) => ({ ...f, languages: e.target.value }))} placeholder="Universal, Any, ..." />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Average Height (cm)</label>
              <Input
                type="number"
                min={0}
                value={form.aveHeight}
                onChange={(e) => setForm((f) => ({ ...f, aveHeight: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Average Weight (kg)</label>
              <Input
                type="number"
                min={0}
                value={form.aveWeight}
                onChange={(e) => setForm((f) => ({ ...f, aveWeight: e.target.value }))}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Adulthood Age</label>
              <Input
                type="number"
                min={0}
                value={form.adultAge}
                onChange={(e) => setForm((f) => ({ ...f, adultAge: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Max Age</label>
              <Input
                type="number"
                min={0}
                value={form.maxAge}
                onChange={(e) => setForm((f) => ({ ...f, maxAge: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Species Skills</label>
            <ChipSelect
              label=""
              placeholder="Choose skills"
              options={skillOptions}
              selectedValues={form.skillIds}
              onSelect={(v) => setForm((f) => ({ ...f, skillIds: [...f.skillIds, v] }))}
              onRemove={(v) => setForm((f) => ({ ...f, skillIds: f.skillIds.filter((id) => id !== v) }))}
            />
          </div>
          {(['speciesTraitIds', 'ancestryTraitIds', 'flawIds', 'characteristicIds'] as const).map((key) => {
            const label = key === 'speciesTraitIds' ? 'Species Traits' : key === 'ancestryTraitIds' ? 'Ancestry Traits' : key === 'flawIds' ? 'Flaws' : 'Characteristics';
            const ids = form[key];
            return (
              <div key={key}>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <label className="block text-sm font-medium text-text-secondary">{label}</label>
                  <Button variant="outline" size="sm" onClick={() => setTraitPickerFor(key)} aria-label={`Add ${label}`}>
                    <Plus className="w-4 h-4 mr-1 inline" />
                    Add
                  </Button>
                </div>
                <div className="border border-border-light rounded-lg overflow-hidden bg-surface-alt min-h-[44px]">
                  {ids.length === 0 ? (
                    <p className="text-sm text-text-muted p-3">None. Click Add to choose traits.</p>
                  ) : (
                    ids.map((id) => {
                      const t = traitIdToTrait.get(id);
                      return (
                        <GridListRow
                          key={id}
                          id={id}
                          name={t?.name ?? id}
                          description={t?.description ?? ''}
                          gridColumns="1fr 44px"
                          columns={[]}
                          rightSlot={
                            <IconButton
                              variant="ghost"
                              size="sm"
                              onClick={() => setForm((f) => ({ ...f, [key]: f[key].filter((x) => x !== id) }))}
                              label={`Remove ${t?.name ?? id}`}
                              aria-label={`Remove ${t?.name ?? id}`}
                            >
                              <X className="w-4 h-4" />
                            </IconButton>
                          }
                        />
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Modal>

      <Modal
        isOpen={traitPickerFor !== null}
        onClose={() => setTraitPickerFor(null)}
        title={traitPickerFor === 'speciesTraitIds' ? 'Add Species Trait' : traitPickerFor === 'ancestryTraitIds' ? 'Add Ancestry Trait' : traitPickerFor === 'flawIds' ? 'Add Flaw' : 'Add Characteristic'}
        size="lg"
        fullScreenOnMobile
        footer={
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setTraitPickerFor(null)}>Done</Button>
          </div>
        }
      >
        <div className="space-y-2">
          <SearchInput
            value={traitPickerList.search}
            onChange={traitPickerList.setSearch}
            placeholder="Search traits..."
          />
          <ListHeader
            columns={[
              { key: 'name', label: 'NAME' },
              { key: 'uses_per_rec', label: 'USES' },
              { key: 'rec_period', label: 'RECOVERY' },
              { key: '_actions', label: '', sortable: false as const },
            ]}
            gridColumns={TRAIT_PICKER_GRID}
            sortState={traitPickerList.sortState}
            onSort={traitPickerList.handleSort}
          />
          <div className="max-h-64 overflow-y-auto border border-border rounded-lg">
            {traitPickerList.sortedItems.length === 0 ? (
              <p className="text-sm text-text-muted p-4 text-center">No traits match. Adjust search.</p>
            ) : (
              traitPickerList.sortedItems.map((t: Trait) => {
                const alreadyAdded = traitPickerFor ? form[traitPickerFor].includes(t.id) : false;
                return (
                  <GridListRow
                    key={t.id}
                    id={t.id}
                    name={t.name}
                    description={t.description || ''}
                    gridColumns={TRAIT_PICKER_GRID}
                    columns={[
                      { key: 'Uses', value: t.uses_per_rec != null && t.uses_per_rec > 0 ? String(t.uses_per_rec) : '-' },
                      { key: 'Recovery', value: t.rec_period || '-' },
                    ]}
                    rightSlot={
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={alreadyAdded}
                        onClick={() => addTraitTo(t.id)}
                        aria-label={alreadyAdded ? 'Already added' : `Add ${t.name}`}
                      >
                        {alreadyAdded ? 'Added' : 'Add'}
                      </Button>
                    }
                  />
                );
              })
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
