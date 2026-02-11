'use client';

import { useState, useMemo } from 'react';
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
  SortHeader,
  LoadingState,
  ErrorDisplay as ErrorState,
  GridListRow,
  ListEmptyState as EmptyState,
} from '@/components/shared';
import { Modal, Button, Input } from '@/components/ui';
import { useCodexFeats, useCodexSkills, type Feat } from '@/hooks';
import { useSort } from '@/hooks/use-sort';
import { useQueryClient } from '@tanstack/react-query';
import { createCodexDoc, updateCodexDoc, deleteCodexDoc } from './actions';
import { Pencil, Trash2, Plus, X } from 'lucide-react';
import { IconButton } from '@/components/ui';
import { ABILITIES_AND_DEFENSES } from '@/lib/game/constants';

const FEAT_GRID_COLUMNS = '1.5fr 0.8fr 1fr 0.8fr 0.8fr 1fr 80px';

interface FeatFilters {
  search: string;
  maxLevel: number | null;
  abilityRequirements: AbilityRequirement[];
  categories: string[];
  abilities: string[];
  tags: string[];
  tagMode: 'any' | 'all';
  featTypeMode: 'all' | 'archetype' | 'character';
  stateFeatMode: 'all' | 'only' | 'hide';
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
  const [filters, setFilters] = useState<FeatFilters>({
    search: '',
    maxLevel: null,
    abilityRequirements: [],
    categories: [],
    abilities: [],
    tags: [],
    tagMode: 'all',
    featTypeMode: 'all',
    stateFeatMode: 'all',
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
      if (f.ability) abilities.add(f.ability);
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
      if (filters.abilities.length > 0 && (!f.ability || !filters.abilities.includes(f.ability))) return false;
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
    skill_req: [] as string[],
    skill_req_val: [] as number[],
    feat_cat_req: '',
    pow_abil_req: 0,
    mart_abil_req: 0,
    pow_prof_req: 0,
    mart_prof_req: 0,
    speed_req: 0,
    feat_lvl: 0,
    lvl_req: 0,
    uses_per_rec: 0,
    rec_period: '',
    char_feat: false,
    state_feat: false,
  };

  const ABILITY_OPTIONS = ABILITIES_AND_DEFENSES.map(a => ({ value: a, label: a }));

  const [form, setForm] = useState(formDefaults);

  const openAdd = () => {
    setEditing(null);
    setForm(formDefaults);
    setModalOpen(true);
  };

  const openEdit = (feat: Feat) => {
    setEditing(feat);
    const ext = feat as unknown as Record<string, unknown>;
    const abilityArr = Array.isArray(feat.ability) ? feat.ability : (feat.ability ? [String(feat.ability)] : []);
    const martAbil = ext.mart_abil_req;
    const martAbilNum = typeof martAbil === 'number' ? martAbil : (typeof martAbil === 'string' && martAbil ? parseInt(martAbil, 10) : 0);
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
      pow_abil_req: Number(ext.pow_abil_req) || 0,
      mart_abil_req: martAbilNum || 0,
      pow_prof_req: Number(ext.pow_prof_req) || 0,
      mart_prof_req: Number(ext.mart_prof_req) || 0,
      speed_req: Number(ext.speed_req) || 0,
      feat_lvl: Number(ext.feat_lvl) || 0,
      lvl_req: feat.lvl_req ?? 0,
      uses_per_rec: feat.uses_per_rec ?? 0,
      rec_period: feat.rec_period || '',
      char_feat: feat.char_feat ?? false,
      state_feat: feat.state_feat ?? false,
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
      req_desc: form.req_desc.trim() || undefined,
      category: form.category.trim() || undefined,
      ability: form.ability.length > 0 ? (form.ability.length === 1 ? form.ability[0] : form.ability) : undefined,
      ability_req: form.ability_req,
      abil_req_val: form.abil_req_val,
      tags: form.tags,
      skill_req: form.skill_req,
      skill_req_val: form.skill_req_val,
      feat_cat_req: form.feat_cat_req.trim() || undefined,
      pow_abil_req: form.pow_abil_req || undefined,
      mart_abil_req: form.mart_abil_req || undefined,
      pow_prof_req: form.pow_prof_req || undefined,
      mart_prof_req: form.mart_prof_req || undefined,
      speed_req: form.speed_req || undefined,
      feat_lvl: form.feat_lvl || undefined,
      lvl_req: form.lvl_req,
      uses_per_rec: form.uses_per_rec,
      rec_period: form.rec_period.trim() || undefined,
      char_feat: form.char_feat,
      state_feat: form.state_feat,
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
              { value: 'all', label: 'All' },
              { value: 'archetype', label: 'Archetype' },
              { value: 'character', label: 'Character' },
            ]}
            onChange={(v) => setFilters(f => ({ ...f, featTypeMode: v as 'all' | 'archetype' | 'character' }))}
            placeholder="All"
          />
          <SelectFilter
            label="State Feats"
            value={filters.stateFeatMode}
            options={[
              { value: 'all', label: 'All Feats' },
              { value: 'only', label: 'Only State Feats' },
              { value: 'hide', label: 'Hide State Feats' },
            ]}
            onChange={(v) => setFilters(f => ({ ...f, stateFeatMode: v as 'all' | 'only' | 'hide' }))}
            placeholder="All Feats"
          />
        </div>
      </FilterSection>

      <div
        className="hidden lg:grid gap-2 px-4 py-3 bg-primary-50 dark:bg-primary-900/20 border-b border-border-light rounded-t-lg font-semibold text-sm text-primary-700"
        style={{ gridTemplateColumns: FEAT_GRID_COLUMNS }}
      >
        <SortHeader label="NAME" col="name" sortState={sortState} onSort={handleSort} />
        <SortHeader label="REQ. LEVEL" col="lvl_req" sortState={sortState} onSort={handleSort} />
        <SortHeader label="CATEGORY" col="category" sortState={sortState} onSort={handleSort} />
        <SortHeader label="ABILITY" col="ability" sortState={sortState} onSort={handleSort} />
        <SortHeader label="RECOVERY" col="rec_period" sortState={sortState} onSort={handleSort} />
        <SortHeader label="USES" col="uses_per_rec" sortState={sortState} onSort={handleSort} />
      </div>

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
            const skillReqChips = (feat.skill_req || []).map((s, i) => {
              const val = feat.skill_req_val?.[i];
              return { name: `${s}${typeof val === 'number' ? ` ${val}+` : ''}`, category: 'skill' as const };
            });
            if (skillReqChips.length > 0) detailSections.push({ label: 'Skill Requirements', chips: skillReqChips });
            return (
              <div key={feat.id} className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <GridListRow
                    id={feat.id}
                    name={feat.name}
                    description={feat.description}
                    gridColumns={FEAT_GRID_COLUMNS}
                    columns={[
                      { key: 'Req. Level', value: (feat.lvl_req === 0 || feat.lvl_req == null) ? '-' : String(feat.lvl_req) },
                      { key: 'Category', value: feat.category || '-' },
                      { key: 'Ability', value: Array.isArray(feat.ability) ? feat.ability.join(', ') : (feat.ability || '-') },
                      { key: 'Recovery', value: feat.rec_period || '-' },
                      { key: 'Uses', value: (feat.uses_per_rec === 0 || feat.uses_per_rec == null) ? '-' : String(feat.uses_per_rec) },
                    ]}
                    detailSections={detailSections.length > 0 ? detailSections : undefined}
                  />
                </div>
                <div className="flex gap-1 shrink-0">
                  <IconButton variant="ghost" size="sm" onClick={() => openEdit(feat)} label="Edit">
                    <Pencil className="w-4 h-4" />
                  </IconButton>
                  <IconButton
                    variant="ghost"
                    size="sm"
                    onClick={() => openEdit(feat)}
                    label="Delete"
                    className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30"
                  >
                    <Trash2 className="w-4 h-4" />
                  </IconButton>
                </div>
              </div>
            );
          })
        )}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editing ? 'Edit Feat' : 'Add Feat'}
        size="xl"
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
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Name *</label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Feat name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Feat description"
              className="w-full min-h-[80px] px-3 py-2 rounded-md border border-border bg-background text-text-primary"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Requirement Description (req_desc)</label>
            <Input
              value={form.req_desc}
              onChange={(e) => setForm((f) => ({ ...f, req_desc: e.target.value }))}
              placeholder="Human-readable requirement text"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Category</label>
              <Input
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                placeholder="e.g. Combat"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Feat Category Required (feat_cat_req)</label>
              <Input
                value={form.feat_cat_req}
                onChange={(e) => setForm((f) => ({ ...f, feat_cat_req: e.target.value }))}
                placeholder="e.g. Defense"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Character Level Required (lvl_req)</label>
              <Input
                type="number"
                min={0}
                value={form.lvl_req}
                onChange={(e) => setForm((f) => ({ ...f, lvl_req: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Feat Level (feat_lvl)</label>
              <Input
                type="number"
                min={0}
                value={form.feat_lvl}
                onChange={(e) => setForm((f) => ({ ...f, feat_lvl: parseInt(e.target.value) || 0 }))}
                placeholder="0 = no level"
              />
            </div>
          </div>
          <div>
            <ChipSelect
              label="Ability (sorting)"
              placeholder="Choose ability/defense"
              options={ABILITY_OPTIONS}
              selectedValues={form.ability}
              onSelect={(v) => setForm((f) => ({ ...f, ability: [...f.ability, v] }))}
              onRemove={(v) => setForm((f) => ({ ...f, ability: f.ability.filter(a => a !== v) }))}
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
                      setForm((f) => ({ ...f, ability_req: next }));
                    }}
                    className="flex-1 px-3 py-2 border border-border rounded-md bg-background text-text-primary text-sm"
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
                    value={form.abil_req_val[i] ?? 0}
                    onChange={(e) => {
                      const next = [...form.abil_req_val];
                      next[i] = parseInt(e.target.value) || 0;
                      setForm((f) => ({ ...f, abil_req_val: next }));
                    }}
                    className="w-20"
                    placeholder="Min"
                  />
                  <IconButton variant="ghost" size="sm" onClick={() => {
                    setForm((f) => ({
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
                onClick={() => setForm((f) => ({
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
            <label className="block text-sm font-medium text-text-secondary mb-1">Skill Requirements (skill + min bonus)</label>
            <div className="space-y-2">
              {form.skill_req.map((skillName, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <select
                    value={skillName}
                    onChange={(e) => {
                      const next = [...form.skill_req];
                      next[i] = e.target.value;
                      setForm((f) => ({ ...f, skill_req: next }));
                    }}
                    className="flex-1 px-3 py-2 border border-border rounded-md bg-background text-text-primary text-sm"
                  >
                    {skillName && !skills.some((s: { name: string }) => s.name === skillName) && (
                      <option value={skillName}>{skillName}</option>
                    )}
                    {skills.map((s: { id: string; name: string }) => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                  <Input
                    type="number"
                    min={0}
                    value={form.skill_req_val[i] ?? 0}
                    onChange={(e) => {
                      const next = [...form.skill_req_val];
                      next[i] = parseInt(e.target.value) || 0;
                      setForm((f) => ({ ...f, skill_req_val: next }));
                    }}
                    className="w-20"
                    placeholder="Min"
                  />
                  <IconButton variant="ghost" size="sm" onClick={() => {
                    setForm((f) => ({
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
                  const firstSkill = skills[0] as { name: string } | undefined;
                  setForm((f) => ({
                    ...f,
                    skill_req: [...f.skill_req, firstSkill?.name ?? ''],
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
                value={form.uses_per_rec}
                onChange={(e) => setForm((f) => ({ ...f, uses_per_rec: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Recovery Period</label>
              <select
                value={form.rec_period}
                onChange={(e) => setForm((f) => ({ ...f, rec_period: e.target.value }))}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-text-primary text-sm"
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
                value={form.pow_abil_req}
                onChange={(e) => setForm((f) => ({ ...f, pow_abil_req: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Martial Ability Req</label>
              <Input
                type="number"
                min={0}
                value={form.mart_abil_req}
                onChange={(e) => setForm((f) => ({ ...f, mart_abil_req: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Power Prof Req</label>
              <Input
                type="number"
                min={0}
                value={form.pow_prof_req}
                onChange={(e) => setForm((f) => ({ ...f, pow_prof_req: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Martial Prof Req</label>
              <Input
                type="number"
                min={0}
                value={form.mart_prof_req}
                onChange={(e) => setForm((f) => ({ ...f, mart_prof_req: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Speed Req</label>
              <Input
                type="number"
                min={0}
                value={form.speed_req}
                onChange={(e) => setForm((f) => ({ ...f, speed_req: parseInt(e.target.value) || 0 }))}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Tags (comma-separated)</label>
            <Input
              value={form.tags.join(', ')}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean),
                }))
              }
              placeholder="Combat, Melee, ..."
            />
          </div>
          <div className="flex gap-6">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.char_feat}
                onChange={(e) => setForm((f) => ({ ...f, char_feat: e.target.checked }))}
              />
              <span className="text-sm text-text-secondary">Character Feat</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.state_feat}
                onChange={(e) => setForm((f) => ({ ...f, state_feat: e.target.checked }))}
              />
              <span className="text-sm text-text-secondary">State Feat</span>
            </label>
          </div>
        </div>
      </Modal>
    </div>
  );
}
