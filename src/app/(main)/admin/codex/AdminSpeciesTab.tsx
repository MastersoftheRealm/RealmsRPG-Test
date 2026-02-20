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
import { Modal, Button, Input } from '@/components/ui';
import { useSpecies, useCodexSkills, useTraits, type Species, type Trait, type Skill } from '@/hooks';
import { useQueryClient } from '@tanstack/react-query';
import { createCodexDoc, updateCodexDoc, deleteCodexDoc } from './actions';
import { Pencil, X } from 'lucide-react';
import { IconButton } from '@/components/ui';
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

  const openEdit = (s: Species) => {
    setEditing(s);
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
    setDeleteConfirm(null);
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
    const data = {
      name: form.name.trim(),
      description: form.description.trim(),
      type: form.type.trim(),
      // Primary size is derived from sizes; do not treat it as a separate editable field
      size: sizes[0] || form.size.trim() || 'Medium',
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
                          <IconButton variant="ghost" size="sm" onClick={() => openEdit(s)} label="Edit">
                            <Pencil className="w-4 h-4" />
                          </IconButton>
                          <IconButton
                            variant="ghost"
                            size="sm"
                            onClick={() => setPendingDeleteId(s.id)}
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

      <Modal isOpen={modalOpen} onClose={closeModal} title={editing ? 'Edit Species' : 'Add Species'} size="lg"
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
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Species name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Species description" className="w-full min-h-[80px] px-3 py-2 rounded-md border border-border bg-background text-text-primary" rows={3} />
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Species Traits</label>
              <ChipSelect
                label=""
                placeholder="Choose traits"
                options={traitOptions}
                selectedValues={form.speciesTraitIds}
                onSelect={(v) => setForm((f) => ({ ...f, speciesTraitIds: [...f.speciesTraitIds, v] }))}
                onRemove={(v) => setForm((f) => ({ ...f, speciesTraitIds: f.speciesTraitIds.filter((id) => id !== v) }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Ancestry Traits</label>
              <ChipSelect
                label=""
                placeholder="Choose traits"
                options={traitOptions}
                selectedValues={form.ancestryTraitIds}
                onSelect={(v) => setForm((f) => ({ ...f, ancestryTraitIds: [...f.ancestryTraitIds, v] }))}
                onRemove={(v) => setForm((f) => ({ ...f, ancestryTraitIds: f.ancestryTraitIds.filter((id) => id !== v) }))}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Flaws</label>
              <ChipSelect
                label=""
                placeholder="Choose flaw traits"
                options={traitOptions}
                selectedValues={form.flawIds}
                onSelect={(v) => setForm((f) => ({ ...f, flawIds: [...f.flawIds, v] }))}
                onRemove={(v) => setForm((f) => ({ ...f, flawIds: f.flawIds.filter((id) => id !== v) }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Characteristics</label>
              <ChipSelect
                label=""
                placeholder="Choose characteristic traits"
                options={traitOptions}
                selectedValues={form.characteristicIds}
                onSelect={(v) => setForm((f) => ({ ...f, characteristicIds: [...f.characteristicIds, v] }))}
                onRemove={(v) => setForm((f) => ({ ...f, characteristicIds: f.characteristicIds.filter((id) => id !== v) }))}
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
