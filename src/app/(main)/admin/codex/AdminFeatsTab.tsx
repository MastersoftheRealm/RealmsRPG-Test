'use client';

import { useState, useMemo, useTransition, useCallback } from 'react';
import {
  ChipSelect,
  AbilityRequirementFilter,
  TagFilter,
  SelectFilter,
  FilterSection,
  type AbilityRequirement,
} from '@/components/codex';
import {
  SectionHeader,
  SearchInput,
  ListHeader,
  LoadingState,
  ErrorDisplay as ErrorState,
  GridListRow,
  ListEmptyState as EmptyState,
} from '@/components/shared';
import { Modal, Button, Input, Textarea } from '@/components/ui';
import { useCodexFeats, useCodexSkills, type Feat, type Skill } from '@/hooks';
import { useSort } from '@/hooks/use-sort';
import { useQueryClient } from '@tanstack/react-query';
import { createCodexDoc, updateCodexDoc, deleteCodexDoc } from './actions';
import { Pencil, Plus, Copy, X, Layers } from 'lucide-react';
import { IconButton } from '@/components/ui';

const COPY_NAME_SUFFIX = ' copy';
import { ABILITIES_AND_DEFENSES } from '@/lib/game/constants';
import { formatAbilityList } from '@/lib/utils';

const FEAT_GRID_COLUMNS = '1.5fr 0.8fr 1fr 0.8fr 0.8fr 1fr 40px';
const ADMIN_FEAT_COLUMNS = [
  { key: 'name', label: 'NAME' },
  { key: 'lvl_req', label: 'REQ. LEVEL' },
  { key: 'category', label: 'CATEGORY' },
  { key: 'ability', label: 'ABILITY' },
  { key: 'rec_period', label: 'RECOVERY' },
  { key: 'uses_per_rec', label: 'USES' },
  { key: '_actions', label: '', sortable: false as const },
];

interface FeatFilters {
  search: string;
  maxLevel: number | null;
  abilityRequirements: AbilityRequirement[];
  categories: string[];
  abilities: string[];
  tags: string[];
  tagMode: 'any' | 'all';
  featTypeMode: '' | 'archetype' | 'character';
  stateFeatMode: '' | 'only' | 'hide';
}

export function AdminFeatsTab() {
  const { data: feats, isLoading, error } = useCodexFeats();
  const { data: skills = [] } = useCodexSkills();
  const { sortState, handleSort, sortItems } = useSort('name');
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Feat | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [copySourceName, setCopySourceName] = useState<string | null>(null);
  const [filters, setFilters] = useState<FeatFilters>({
    search: '',
    maxLevel: null,
    abilityRequirements: [],
    categories: [],
    abilities: [],
    tags: [],
    tagMode: 'all',
    featTypeMode: '',
    stateFeatMode: '',
  });

  const filterOptions = useMemo(() => {
    if (!feats) return { levels: [], abilities: [], categories: [], tags: [], abilReqAbilities: [] };
    const levels = new Set<number>();
    const abilities = new Set<string>();
    const categories = new Set<string>();
    const tags = new Set<string>();
    const abilReqAbilities = new Set<string>();
    feats.forEach((f: Feat) => {
      if (f.lvl_req && f.lvl_req > 0) levels.add(f.lvl_req);
      if (Array.isArray(f.ability)) {
        f.ability.forEach((a: string) => abilities.add(a));
      } else if (f.ability) {
        abilities.add(f.ability);
      }
      if (f.category) categories.add(f.category);
      f.tags?.forEach((t: string) => tags.add(t));
      f.ability_req?.forEach((a: string) => abilReqAbilities.add(a));
    });
    return {
      levels: Array.from(levels).sort((a, b) => a - b),
      abilities: Array.from(abilities).sort(),
      categories: Array.from(categories).sort(),
      tags: Array.from(tags).sort(),
      abilReqAbilities: Array.from(abilReqAbilities).sort(),
    };
  }, [feats]);

  const filteredFeats = useMemo(() => {
    if (!feats) return [];
    const filtered = feats.filter((f: Feat) => {
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch =
          f.name.toLowerCase().includes(searchLower) ||
          f.description?.toLowerCase().includes(searchLower) ||
          f.tags?.some(t => t.toLowerCase().includes(searchLower));
        if (!matchesSearch) return false;
      }
      if (filters.maxLevel !== null && (f.lvl_req ?? 0) > filters.maxLevel) return false;
      if (filters.featTypeMode === 'archetype' && f.char_feat) return false;
      if (filters.featTypeMode === 'character' && !f.char_feat) return false;
      if (filters.stateFeatMode === 'only' && !f.state_feat) return false;
      if (filters.stateFeatMode === 'hide' && f.state_feat) return false;
      for (const req of filters.abilityRequirements) {
        const index = f.ability_req?.indexOf(req.ability) ?? -1;
        if (index !== -1) {
          const val = f.abil_req_val?.[index];
          if (typeof val === 'number' && val > req.maxValue) return false;
        }
      }
      if (filters.categories.length > 0 && !filters.categories.includes(f.category || '')) return false;
      if (filters.abilities.length > 0) {
        const featAbilities = Array.isArray(f.ability)
          ? f.ability
          : f.ability
            ? [f.ability]
            : [];
        if (!featAbilities.some(a => filters.abilities.includes(a))) return false;
      }
      if (filters.tags.length > 0) {
        if (filters.tagMode === 'all') {
          if (!filters.tags.every(t => f.tags?.includes(t))) return false;
        } else {
          if (!filters.tags.some(t => f.tags?.includes(t))) return false;
        }
      }
      return true;
    });
    return sortItems<Feat>(filtered);
  }, [feats, filters, sortItems]);

  const formDefaults = {
    name: '',
    description: '',
    req_desc: '',
    category: '',
    ability: [] as string[],
    ability_req: [] as string[],
    abil_req_val: [] as number[],
    tags: [] as string[],
    // Skill requirement IDs (string IDs from codex_skills)
    skill_req: [] as string[],
    skill_req_val: [] as number[],
    feat_cat_req: '',
    pow_abil_req: undefined as number | undefined,
    mart_abil_req: undefined as number | undefined,
    pow_prof_req: undefined as number | undefined,
    mart_prof_req: undefined as number | undefined,
    speed_req: undefined as number | undefined,
    feat_lvl: undefined as number | undefined,
    lvl_req: undefined as number | undefined,
    uses_per_rec: undefined as number | undefined,
    rec_period: '',
    char_feat: false,
    state_feat: false,
    base_feat_id: '' as string,
  };

  const ABILITY_OPTIONS = ABILITIES_AND_DEFENSES.map(a => ({ value: a, label: a }));

  const [form, setForm] = useState(formDefaults);
  const [, startTransition] = useTransition();
  const scheduleFormUpdate = useCallback((updater: React.SetStateAction<typeof formDefaults>) => {
    startTransition(() => setForm(updater));
  }, []);

  // Map skill ID -> name for display
  const skillIdToName = useMemo(() => {
    const map = new Map<string, string>();
    (skills as Skill[]).forEach((s) => {
      map.set(String(s.id), s.name);
    });
    return map;
  }, [skills]);

  const openAdd = () => {
    setEditing(null);
    setCopySourceName(null);
    setForm(formDefaults);
    setModalOpen(true);
  };

  const toOptNum = (v: unknown): number | undefined => {
    if (v == null || v === '') return undefined;
    const n = Number(v);
    return Number.isNaN(n) ? undefined : n;
  };
  const openDuplicate = (feat: Feat) => {
    setEditing(null);
    setCopySourceName(feat.name);
    const ext = feat as unknown as Record<string, unknown>;
    const abilityArr = Array.isArray(feat.ability) ? feat.ability : (feat.ability ? [String(feat.ability)] : []);
    setForm({
      name: (feat.name || '').trim() + COPY_NAME_SUFFIX,
      description: feat.description || '',
      req_desc: String(ext.req_desc || ''),
      category: feat.category || '',
      ability: abilityArr,
      ability_req: feat.ability_req || [],
      abil_req_val: feat.abil_req_val || [],
      tags: feat.tags || [],
      skill_req: feat.skill_req || [],
      skill_req_val: feat.skill_req_val || [],
      feat_cat_req: String(ext.feat_cat_req || ''),
      pow_abil_req: toOptNum(ext.pow_abil_req),
      mart_abil_req: toOptNum(ext.mart_abil_req),
      pow_prof_req: toOptNum(ext.pow_prof_req),
      mart_prof_req: toOptNum(ext.mart_prof_req),
      speed_req: toOptNum(ext.speed_req),
      feat_lvl: toOptNum(ext.feat_lvl),
      lvl_req: toOptNum(feat.lvl_req),
      uses_per_rec: toOptNum(feat.uses_per_rec),
      rec_period: feat.rec_period || '',
      char_feat: feat.char_feat ?? false,
      state_feat: feat.state_feat ?? false,
      base_feat_id: String((feat as { base_feat_id?: string }).base_feat_id ?? ''),
    });
    setModalOpen(true);
  };

  const openEdit = (feat: Feat) => {
    setEditing(feat);
    setCopySourceName(null);
    const ext = feat as unknown as Record<string, unknown>;
    const abilityArr = Array.isArray(feat.ability) ? feat.ability : (feat.ability ? [String(feat.ability)] : []);
    setForm({
      name: feat.name,
      description: feat.description || '',
      req_desc: String(ext.req_desc || ''),
      category: feat.category || '',
      ability: abilityArr,
      ability_req: feat.ability_req || [],
      abil_req_val: feat.abil_req_val || [],
      tags: feat.tags || [],
      skill_req: feat.skill_req || [],
      skill_req_val: feat.skill_req_val || [],
      feat_cat_req: String(ext.feat_cat_req || ''),
      pow_abil_req: toOptNum(ext.pow_abil_req),
      mart_abil_req: toOptNum(ext.mart_abil_req),
      pow_prof_req: toOptNum(ext.pow_prof_req),
      mart_prof_req: toOptNum(ext.mart_prof_req),
      speed_req: toOptNum(ext.speed_req),
      feat_lvl: toOptNum(ext.feat_lvl),
      lvl_req: toOptNum(feat.lvl_req),
      uses_per_rec: toOptNum(feat.uses_per_rec),
      rec_period: feat.rec_period || '',
      char_feat: feat.char_feat ?? false,
      state_feat: feat.state_feat ?? false,
      base_feat_id: String((feat as { base_feat_id?: string }).base_feat_id ?? ''),
    });
    setModalOpen(true);
  };

  /** Open add modal pre-filled to add the next level of this feat (level-1 base). */
  const openAddLevel = (baseFeat: Feat) => {
    setEditing(null);
    setCopySourceName(null);
    const ext = baseFeat as unknown as Record<string, unknown>;
    const abilityArr = Array.isArray(baseFeat.ability) ? baseFeat.ability : (baseFeat.ability ? [String(baseFeat.ability)] : []);
    const nextLevel = (baseFeat.feat_lvl ?? 1) + 1;
    setForm({
      name: (baseFeat.name || '').trim(),
      description: baseFeat.description || '',
      req_desc: String(ext.req_desc || ''),
      category: baseFeat.category || '',
      ability: abilityArr,
      ability_req: baseFeat.ability_req || [],
      abil_req_val: baseFeat.abil_req_val || [],
      tags: baseFeat.tags || [],
      skill_req: baseFeat.skill_req || [],
      skill_req_val: baseFeat.skill_req_val || [],
      feat_cat_req: String(ext.feat_cat_req || ''),
      pow_abil_req: toOptNum(ext.pow_abil_req),
      mart_abil_req: toOptNum(ext.mart_abil_req),
      pow_prof_req: toOptNum(ext.pow_prof_req),
      mart_prof_req: toOptNum(ext.mart_prof_req),
      speed_req: toOptNum(ext.speed_req),
      feat_lvl: nextLevel,
      lvl_req: toOptNum(baseFeat.lvl_req),
      uses_per_rec: toOptNum(baseFeat.uses_per_rec),
      rec_period: baseFeat.rec_period || '',
      char_feat: baseFeat.char_feat ?? false,
      state_feat: baseFeat.state_feat ?? false,
      base_feat_id: String(baseFeat.id),
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
      req_desc: form.req_desc.trim() || undefined,
      category: form.category.trim() || undefined,
      ability: form.ability.length > 0 ? (form.ability.length === 1 ? form.ability[0] : form.ability) : undefined,
      ability_req: form.ability_req,
      abil_req_val: form.abil_req_val,
      tags: form.tags,
      skill_req: form.skill_req,
      skill_req_val: form.skill_req_val,
      feat_cat_req: form.feat_cat_req.trim() || undefined,
      pow_abil_req: form.pow_abil_req ?? undefined,
      mart_abil_req: form.mart_abil_req ?? undefined,
      pow_prof_req: form.pow_prof_req ?? undefined,
      mart_prof_req: form.mart_prof_req ?? undefined,
      speed_req: form.speed_req ?? undefined,
      feat_lvl: form.feat_lvl ?? undefined,
      lvl_req: form.lvl_req ?? undefined,
      uses_per_rec: form.uses_per_rec ?? undefined,
      rec_period: form.rec_period.trim() || undefined,
      char_feat: form.char_feat,
      state_feat: form.state_feat,
      base_feat_id: form.base_feat_id.trim() || undefined,
    };

    const id = (form.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_-]/g, '') || `feat_${Date.now()}`).slice(0, 100);

    const result = editing
      ? await updateCodexDoc('codex_feats', editing.id, data)
      : await createCodexDoc('codex_feats', id, data);

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
    const result = await deleteCodexDoc('codex_feats', id);
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
    const result = await deleteCodexDoc('codex_feats', id);
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ['codex'] });
      setPendingDeleteId(null);
    } else {
      alert(result.error);
      setPendingDeleteId(null);
    }
  };

  if (error) return <ErrorState message="Failed to load feats" />;

  return (
    <div>
      <SectionHeader title="Feats" onAdd={openAdd} size="md" />
      <div className="mb-4">
        <SearchInput
          value={filters.search}
          onChange={(v) => setFilters(f => ({ ...f, search: v }))}
          placeholder="Search names, tags, descriptions..."
        />
      </div>

      <FilterSection>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <div className="filter-group">
            <label className="block text-sm font-medium text-text-secondary mb-1">Max Required Level</label>
            <Input
              type="number"
              min={0}
              value={filters.maxLevel ?? ''}
              onChange={(e) => setFilters(f => ({ ...f, maxLevel: e.target.value ? parseInt(e.target.value) : null }))}
              placeholder="No limit"
            />
          </div>
          <div className="md:col-span-2">
            <AbilityRequirementFilter
              label="Ability/Defense Requirement"
              abilities={filterOptions.abilReqAbilities}
              requirements={filters.abilityRequirements}
              onAdd={(req) => setFilters(f => ({ ...f, abilityRequirements: [...f.abilityRequirements, req] }))}
              onRemove={(ability) => setFilters(f => ({ ...f, abilityRequirements: f.abilityRequirements.filter(r => r.ability !== ability) }))}
            />
          </div>
          <ChipSelect
            label="Category"
            placeholder="Choose category"
            options={filterOptions.categories.map(c => ({ value: c, label: c }))}
            selectedValues={filters.categories}
            onSelect={(v) => setFilters(f => ({ ...f, categories: [...f.categories, v] }))}
            onRemove={(v) => setFilters(f => ({ ...f, categories: f.categories.filter(c => c !== v) }))}
          />
          <ChipSelect
            label="Ability"
            placeholder="Choose ability"
            options={filterOptions.abilities.map(a => ({ value: a, label: a }))}
            selectedValues={filters.abilities}
            onSelect={(v) => setFilters(f => ({ ...f, abilities: [...f.abilities, v] }))}
            onRemove={(v) => setFilters(f => ({ ...f, abilities: f.abilities.filter(a => a !== v) }))}
          />
          <div className="md:col-span-2">
            <TagFilter
              tags={filterOptions.tags}
              selectedTags={filters.tags}
              tagMode={filters.tagMode}
              onSelect={(t) => setFilters(f => ({ ...f, tags: [...f.tags, t] }))}
              onRemove={(t) => setFilters(f => ({ ...f, tags: f.tags.filter(tag => tag !== t) }))}
              onModeChange={(mode) => setFilters(f => ({ ...f, tagMode: mode }))}
            />
          </div>
          <SelectFilter
            label="Feat Type"
            value={filters.featTypeMode}
            options={[
              { value: 'archetype', label: 'Archetype feats' },
              { value: 'character', label: 'Character feats' },
            ]}
            onChange={(v) => setFilters(f => ({ ...f, featTypeMode: (v || '') as '' | 'archetype' | 'character' }))}
            placeholder="All types"
          />
          <SelectFilter
            label="State Feats"
            value={filters.stateFeatMode}
            options={[
              { value: 'only', label: 'Only state feats' },
              { value: 'hide', label: 'Hide state feats' },
            ]}
            onChange={(v) => setFilters(f => ({ ...f, stateFeatMode: (v || '') as '' | 'only' | 'hide' }))}
            placeholder="All states"
          />
        </div>
      </FilterSection>

      <ListHeader
        columns={ADMIN_FEAT_COLUMNS}
        gridColumns={FEAT_GRID_COLUMNS}
        sortState={sortState}
        onSort={handleSort}
      />

      <div className="flex flex-col gap-1 mt-2">
        {isLoading ? (
          <LoadingState />
        ) : filteredFeats.length === 0 ? (
          <EmptyState
            title="No feats match your filters"
            description="Add one to get started."
            action={{ label: 'Add Feat', onClick: openAdd }}
            size="sm"
          />
        ) : (
          filteredFeats.map((feat) => {
            const detailSections: Array<{ label: string; chips: { name: string; category?: 'default' | 'tag' | 'skill' | 'archetype' }[]; hideLabelIfSingle?: boolean }> = [];
            const typeChips: { name: string; category: 'skill' | 'archetype' }[] = [];
            if (feat.char_feat) typeChips.push({ name: 'Character Feat', category: 'skill' });
            else typeChips.push({ name: 'Archetype Feat', category: 'archetype' });
            if (feat.state_feat) typeChips.push({ name: 'State Feat', category: 'archetype' });
            if (typeChips.length > 0) detailSections.push({ label: 'Type', chips: typeChips, hideLabelIfSingle: true });
            if (feat.category) detailSections.push({ label: 'Category', chips: [{ name: feat.category, category: 'default' }], hideLabelIfSingle: true });
            const tagChips = feat.tags?.map(tag => ({ name: tag, category: 'tag' as const })) || [];
            if (tagChips.length > 0) detailSections.push({ label: 'Tags', chips: tagChips, hideLabelIfSingle: true });
            const abilityReqChips = (feat.ability_req || []).map((a, i) => {
              const val = feat.abil_req_val?.[i];
              return { name: `${a}${typeof val === 'number' ? ` ${val}+` : ''}`, category: 'default' as const };
            });
            if (abilityReqChips.length > 0) detailSections.push({ label: 'Ability Requirements', chips: abilityReqChips });
            const skillReqChips = (feat.skill_req || []).map((id, i) => {
              const label = skillIdToName.get(String(id)) || String(id);
              const val = feat.skill_req_val?.[i];
              return { name: `${label}${typeof val === 'number' ? ` ${val}+` : ''}`, category: 'skill' as const };
            });
            if (skillReqChips.length > 0) detailSections.push({ label: 'Skill Requirements', chips: skillReqChips });
            return (
              <GridListRow
                key={feat.id}
                id={feat.id}
                name={feat.name}
                description={feat.description}
                gridColumns={FEAT_GRID_COLUMNS}
                columns={[
                  { key: 'Req. Level', value: (feat.lvl_req === 0 || feat.lvl_req == null) ? '-' : String(feat.lvl_req) },
                  { key: 'Category', value: feat.category || '-' },
                  { key: 'Ability', value: formatAbilityList(feat.ability) },
                  { key: 'Recovery', value: feat.rec_period || '-' },
                  { key: 'Uses', value: (feat.uses_per_rec === 0 || feat.uses_per_rec == null) ? '-' : String(feat.uses_per_rec) },
                ]}
                detailSections={detailSections.length > 0 ? detailSections : undefined}
                rightSlot={
                  <div className="flex items-center gap-1 pr-2">
                    {pendingDeleteId === feat.id ? (
                      <div className="flex items-center gap-1 text-xs">
                        <span className="text-red-600 font-medium whitespace-nowrap">Remove?</span>
                        <Button size="sm" variant="danger" onClick={() => handleInlineDelete(feat.id, feat.name)} className="text-xs px-2 py-0.5 h-6">Yes</Button>
                        <Button size="sm" variant="secondary" onClick={() => setPendingDeleteId(null)} className="text-xs px-2 py-0.5 h-6">No</Button>
                      </div>
                    ) : (
                      <>
                        {!(feat as Feat & { base_feat_id?: string }).base_feat_id && (feat.feat_lvl == null || feat.feat_lvl === 1) && (
                          <IconButton variant="ghost" size="sm" onClick={() => openAddLevel(feat)} label="Add level" aria-label="Add level">
                            <Layers className="w-4 h-4" />
                          </IconButton>
                        )}
                        <IconButton variant="ghost" size="sm" onClick={() => openEdit(feat)} label="Edit" aria-label="Edit">
                          <Pencil className="w-4 h-4" />
                        </IconButton>
                        <IconButton variant="ghost" size="sm" onClick={() => openDuplicate(feat)} label="Duplicate" aria-label="Duplicate">
                          <Copy className="w-4 h-4" />
                        </IconButton>
                        <IconButton
                          variant="ghost"
                          size="sm"
                          onClick={() => setPendingDeleteId(feat.id)}
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

      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editing ? 'Edit Feat' : 'Add Feat'}
        size="xl"
        fullScreenOnMobile
        footer={
          <div className="flex justify-between">
            <div>
              {editing && (
                <Button
                  variant="outline"
                  onClick={() => handleDelete(editing.id)}
                  className={deleteConfirm === editing.id ? 'border-red-500 text-red-600' : ''}
                >
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
              Creating a copy of <strong className="text-text-primary">{copySourceName}</strong>. Change the name and details as needed, then save to add the new feat.
            </p>
          )}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Name *</label>
            <Input
              value={form.name}
              onChange={(e) => scheduleFormUpdate((f) => ({ ...f, name: e.target.value }))}
              placeholder="Feat name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Description</label>
            <Textarea
              value={form.description}
              onChange={(e) => scheduleFormUpdate((f) => ({ ...f, description: e.target.value }))}
              placeholder="Feat description"
              className="min-h-[120px] resize-y"
              rows={4}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Requirement Description (req_desc)</label>
            <Input
              value={form.req_desc}
              onChange={(e) => scheduleFormUpdate((f) => ({ ...f, req_desc: e.target.value }))}
              placeholder="Human-readable requirement text"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Category</label>
              <select
                value={form.category && filterOptions.categories.includes(form.category) ? form.category : (form.category ? '__new__' : '')}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === '__new__') scheduleFormUpdate((f) => ({ ...f, category: f.category || '' }));
                  else scheduleFormUpdate((f) => ({ ...f, category: v }));
                }}
                className="w-full px-3 py-2 rounded-md border border-border bg-background text-text-primary"
                aria-label="Feat category"
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
                  onChange={(e) => scheduleFormUpdate((f) => ({ ...f, category: e.target.value }))}
                  placeholder="Type new category"
                  className="mt-2"
                />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Feat Category Required (feat_cat_req)</label>
              <select
                value={form.feat_cat_req && filterOptions.categories.includes(form.feat_cat_req) ? form.feat_cat_req : (form.feat_cat_req ? '__new__' : '')}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === '__new__') scheduleFormUpdate((f) => ({ ...f, feat_cat_req: f.feat_cat_req || '' }));
                  else scheduleFormUpdate((f) => ({ ...f, feat_cat_req: v }));
                }}
                className="w-full px-3 py-2 rounded-md border border-border bg-background text-text-primary"
                aria-label="Feat category required"
              >
                <option value="">— None —</option>
                {filterOptions.categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
                <option value="__new__">Add new category...</option>
              </select>
              {form.feat_cat_req && !filterOptions.categories.includes(form.feat_cat_req) && (
                <Input
                  value={form.feat_cat_req}
                  onChange={(e) => scheduleFormUpdate((f) => ({ ...f, feat_cat_req: e.target.value }))}
                  placeholder="Type new category"
                  className="mt-2"
                />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Character Level Required (lvl_req)</label>
              <Input
                type="number"
                min={0}
                value={form.lvl_req ?? ''}
                onChange={(e) => scheduleFormUpdate((f) => ({ ...f, lvl_req: e.target.value === '' ? undefined : parseInt(e.target.value, 10) ?? undefined }))}
                placeholder="No value"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Feat Level (feat_lvl)</label>
              <Input
                type="number"
                min={0}
                value={form.feat_lvl ?? ''}
                onChange={(e) => scheduleFormUpdate((f) => ({ ...f, feat_lvl: e.target.value === '' ? undefined : parseInt(e.target.value, 10) ?? undefined }))}
                placeholder="No value"
              />
            </div>
            <div>
              <label htmlFor="admin-feat-base-feat-id" className="block text-sm font-medium text-text-secondary mb-1">Base feat (level 1)</label>
              <select
                id="admin-feat-base-feat-id"
                value={form.base_feat_id}
                onChange={(e) => scheduleFormUpdate((f) => ({ ...f, base_feat_id: e.target.value }))}
                className="w-full px-3 py-2 rounded-md border border-border bg-background text-text-primary"
                aria-label="Base feat (level 1) — leave empty for level-1 feats"
              >
                <option value="">None (this is level 1)</option>
                {(feats ?? [])
                  .filter((f) => !(f as Feat & { base_feat_id?: string }).base_feat_id && ((f as Feat).feat_lvl == null || (f as Feat).feat_lvl === 1))
                  .map((f) => (
                    <option key={f.id} value={String(f.id)}>{f.name} (id: {f.id})</option>
                  ))}
              </select>
              <p className="text-xs text-text-muted dark:text-text-secondary mt-1">For level 2+ feats, select the level-1 feat. Same name as base; ids differentiate levels.</p>
            </div>
          </div>
          <div>
            <ChipSelect
              label="Ability (sorting)"
              placeholder="Choose ability/defense"
              options={ABILITY_OPTIONS}
              selectedValues={form.ability}
              onSelect={(v) => scheduleFormUpdate((f) => ({ ...f, ability: [...f.ability, v] }))}
              onRemove={(v) => scheduleFormUpdate((f) => ({ ...f, ability: f.ability.filter(a => a !== v) }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Ability Requirements (ability/defense + min value)</label>
            <div className="space-y-2">
              {form.ability_req.map((abil, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <select
                    value={abil}
                    onChange={(e) => {
                      const next = [...form.ability_req];
                      next[i] = e.target.value;
                      scheduleFormUpdate((f) => ({ ...f, ability_req: next }));
                    }}
                    className="flex-1 px-3 py-2 border border-border rounded-md bg-background text-text-primary text-sm"
                    aria-label={`Ability requirement ${i + 1}`}
                  >
                    {abil && !(ABILITIES_AND_DEFENSES as readonly string[]).includes(abil) && (
                      <option value={abil}>{abil}</option>
                    )}
                    {ABILITIES_AND_DEFENSES.map(a => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                  <Input
                    type="number"
                    min={0}
                    value={form.abil_req_val[i] ?? ''}
                    onChange={(e) => {
                      const next = [...form.abil_req_val];
                      const v = e.target.value;
                      next[i] = v === '' ? 0 : parseInt(v, 10) || 0;
                      scheduleFormUpdate((f) => ({ ...f, abil_req_val: next }));
                    }}
                    className="w-20"
                    placeholder="Min"
                  />
                  <IconButton variant="ghost" size="sm" onClick={() => {
                    scheduleFormUpdate((f) => ({
                      ...f,
                      ability_req: f.ability_req.filter((_, j) => j !== i),
                      abil_req_val: f.abil_req_val.filter((_, j) => j !== i),
                    }));
                  }} label="Remove">
                    <X className="w-4 h-4" />
                  </IconButton>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => scheduleFormUpdate((f) => ({
                  ...f,
                  ability_req: [...f.ability_req, ABILITIES_AND_DEFENSES[0]],
                  abil_req_val: [...f.abil_req_val, 0],
                }))}
              >
                <Plus className="w-4 h-4 mr-1 inline" />
                Add ability requirement
              </Button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Skill Requirements (skill ID + min bonus)</label>
            <div className="space-y-2">
              {form.skill_req.map((skillId, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <select
                    value={skillId}
                    onChange={(e) => {
                      const next = [...form.skill_req];
                      next[i] = e.target.value;
                      scheduleFormUpdate((f) => ({ ...f, skill_req: next }));
                    }}
                    className="flex-1 px-3 py-2 border border-border rounded-md bg-background text-text-primary text-sm"
                    aria-label={`Skill requirement ${i + 1}`}
                  >
                    {skillId && !(skills as Skill[]).some((s) => String(s.id) === String(skillId)) && (
                      <option value={skillId}>{skillId}</option>
                    )}
                    {(skills as Skill[]).map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  <Input
                    type="number"
                    min={0}
                    value={form.skill_req_val[i] ?? 0}
                    onChange={(e) => {
                      const next = [...form.skill_req_val];
                      next[i] = parseInt(e.target.value) || 0;
                      scheduleFormUpdate((f) => ({ ...f, skill_req_val: next }));
                    }}
                    className="w-20"
                    placeholder="Min"
                  />
                  <IconButton variant="ghost" size="sm" onClick={() => {
                    scheduleFormUpdate((f) => ({
                      ...f,
                      skill_req: f.skill_req.filter((_, j) => j !== i),
                      skill_req_val: f.skill_req_val.filter((_, j) => j !== i),
                    }));
                  }} label="Remove">
                    <X className="w-4 h-4" />
                  </IconButton>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const firstSkill = (skills as Skill[])[0];
                  scheduleFormUpdate((f) => ({
                    ...f,
                    skill_req: [...f.skill_req, firstSkill ? String(firstSkill.id) : ''],
                    skill_req_val: [...f.skill_req_val, 0],
                  }));
                }}
              >
                <Plus className="w-4 h-4 mr-1 inline" />
                Add skill requirement
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Uses per recovery</label>
              <Input
                type="number"
                min={0}
                value={form.uses_per_rec ?? ''}
                onChange={(e) => scheduleFormUpdate((f) => ({ ...f, uses_per_rec: e.target.value === '' ? undefined : parseInt(e.target.value, 10) ?? undefined }))}
                placeholder="No value"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Recovery Period</label>
              <select
                value={form.rec_period}
                onChange={(e) => scheduleFormUpdate((f) => ({ ...f, rec_period: e.target.value }))}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-text-primary text-sm"
                aria-label="Recovery period"
              >
                <option value="">—</option>
                <option value="Full">Full</option>
                <option value="Partial">Partial</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Power Ability Req</label>
              <Input
                type="number"
                min={0}
                value={form.pow_abil_req ?? ''}
                onChange={(e) => scheduleFormUpdate((f) => ({ ...f, pow_abil_req: e.target.value === '' ? undefined : parseInt(e.target.value, 10) ?? undefined }))}
                placeholder="No value"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Martial Ability Req</label>
              <Input
                type="number"
                min={0}
                value={form.mart_abil_req ?? ''}
                onChange={(e) => scheduleFormUpdate((f) => ({ ...f, mart_abil_req: e.target.value === '' ? undefined : parseInt(e.target.value, 10) ?? undefined }))}
                placeholder="No value"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Power Prof Req</label>
              <Input
                type="number"
                min={0}
                value={form.pow_prof_req ?? ''}
                onChange={(e) => scheduleFormUpdate((f) => ({ ...f, pow_prof_req: e.target.value === '' ? undefined : parseInt(e.target.value, 10) ?? undefined }))}
                placeholder="No value"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Martial Prof Req</label>
              <Input
                type="number"
                min={0}
                value={form.mart_prof_req ?? ''}
                onChange={(e) => scheduleFormUpdate((f) => ({ ...f, mart_prof_req: e.target.value === '' ? undefined : parseInt(e.target.value, 10) ?? undefined }))}
                placeholder="No value"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Speed Req</label>
              <Input
                type="number"
                min={0}
                value={form.speed_req ?? ''}
                onChange={(e) => scheduleFormUpdate((f) => ({ ...f, speed_req: e.target.value === '' ? undefined : parseInt(e.target.value, 10) ?? undefined }))}
                placeholder="No value"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Tags</label>
            <div className="flex flex-wrap gap-1 mb-2">
              {form.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface-alt border border-border-light text-sm"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => scheduleFormUpdate((f) => ({ ...f, tags: f.tags.filter((t) => t !== tag) }))}
                    className="p-0.5 rounded hover:bg-surface text-text-muted hover:text-text-primary"
                    aria-label={`Remove tag ${tag}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2 flex-wrap items-center">
              <select
                defaultValue=""
                onChange={(e) => {
                  const v = e.target.value;
                  e.target.value = '';
                  if (v && !form.tags.includes(v)) scheduleFormUpdate((f) => ({ ...f, tags: [...f.tags, v] }));
                }}
                className="px-3 py-2 rounded-md border border-border bg-background text-text-primary text-sm"
                aria-label="Add tag from existing"
              >
                <option value="">Add tag from list...</option>
                {filterOptions.tags.filter((t) => !form.tags.includes(t)).map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="mt-2">
              <label htmlFor="new-tag-input" className="sr-only">New tag name</label>
              <Input
                id="new-tag-input"
                placeholder="Or type new tag and press Enter"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const v = (e.target as HTMLInputElement).value.trim();
                    if (v && !form.tags.includes(v)) {
                      scheduleFormUpdate((f) => ({ ...f, tags: [...f.tags, v] }));
                      (e.target as HTMLInputElement).value = '';
                    }
                  }
                }}
                onBlur={(e) => {
                  const v = e.target.value.trim();
                  if (v && !form.tags.includes(v)) {
                    scheduleFormUpdate((f) => ({ ...f, tags: [...f.tags, v] }));
                    e.target.value = '';
                  }
                }}
              />
            </div>
          </div>
          <div className="flex gap-6">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.char_feat}
                onChange={(e) => scheduleFormUpdate((f) => ({ ...f, char_feat: e.target.checked }))}
              />
              <span className="text-sm text-text-secondary">Character Feat</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.state_feat}
                onChange={(e) => scheduleFormUpdate((f) => ({ ...f, state_feat: e.target.checked }))}
              />
              <span className="text-sm text-text-secondary">State Feat</span>
            </label>
          </div>
        </div>
      </Modal>
    </div>
  );
}
