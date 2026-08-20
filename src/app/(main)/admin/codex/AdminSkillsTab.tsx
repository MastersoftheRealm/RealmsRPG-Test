'use client';

import { useMemo, useState } from 'react';
import { CodexBrowseListShell, ErrorDisplay as ErrorState } from '@/components/patterns';
import { ChipSelect, SelectFilter, ArchetypePathFilter } from '@/components/patterns/filters';
import { CodexSkillRow } from '@/components/codex';
import { useCodexSkills, usePathListFilter, type Skill } from '@/hooks';
import { useSort } from '@/hooks/use-sort';
import { ABILITIES_AND_DEFENSES } from '@/lib/game/constants';
import {
  SKILL_GRID_COLUMNS,
  SKILL_HEADER_COLUMNS,
  buildSkillFilterOptions,
  buildSkillIdToName,
  filterSkills,
  sortSkillsForBaseFilter,
  type SkillListFilters,
} from '@/lib/codex/skill-list';
import {
  pathChipLabelsForEntity,
  pathFilterEmptyTitle,
} from '@/lib/game/path-recommendation-index';
import { COPY_NAME_SUFFIX } from './admin-codex-copy-suffix';
import { useAdminCodexEntity } from './use-admin-codex-entity';
import { AdminCodexRowActions } from './admin-codex-row-actions';
import {
  AdminSkillEditModal,
  EMPTY_SKILL_FORM,
  type SkillFormState,
} from './admin-skill-edit-modal';

/** Skills are governed by abilities only (not defenses). */
const ABILITY_OPTIONS_SKILLS = ABILITIES_AND_DEFENSES.slice(0, 6);

interface SkillFilters extends SkillListFilters {
  subSkillMode: '' | 'only' | 'hide';
}

export function AdminSkillsTab() {
  const { data: skills, isLoading, error, refetch } = useCodexSkills();
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
  } = useAdminCodexEntity<Skill>({
    collection: 'codex_skills',
    entityLabel: 'skill',
  });
  const { sortState, handleSort, sortItems } = useSort('name');
  const [filters, setFilters] = useState<SkillFilters>({
    search: '',
    abilities: [],
    baseSkill: '',
    subSkillMode: '',
  });

  const [form, setForm] = useState<SkillFormState>(EMPTY_SKILL_FORM);

  const ABILITY_OPTIONS = useMemo(
    () => ABILITY_OPTIONS_SKILLS.map((a) => ({ value: a, label: a })),
    [],
  );

  const baseSkillOptions = useMemo(() => {
    if (!skills) return [] as { id: string; name: string }[];
    // Base skills are those without a base_skill_id (or with base_skill_id === 0 meaning can be a base for any)
    const baseSkills = (skills as Skill[]).filter(
      (s) => s.base_skill_id === undefined || s.base_skill_id === 0,
    );
    return baseSkills
      .map((s) => ({ id: String(s.id), name: s.name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [skills]);

  const skillIdToName = useMemo(() => buildSkillIdToName(skills), [skills]);
  const { selectedPathIds, setSelectedPathIds, pathIndex, pathRecommendedIds, pathFilterActive } =
    usePathListFilter({ entities: skills, kind: 'skills' });

  const filterOptions = useMemo(
    () => buildSkillFilterOptions(skills, skillIdToName),
    [skills, skillIdToName],
  );

  const filteredSkills = useMemo(() => {
    if (!skills) return [];
    const filtered = filterSkills(skills, filters, skillIdToName, null, pathRecommendedIds);
    if (filters.baseSkill) return sortSkillsForBaseFilter(filtered, filters.baseSkill);
    return sortItems<Skill>(filtered);
  }, [skills, filters, sortItems, skillIdToName, pathRecommendedIds]);

  const skillFormFromSkill = (s: Skill, name: string) => {
    let baseSkillName = '';
    if (s.base_skill_id != null) {
      if (s.base_skill_id === 0) {
        baseSkillName = 'Any';
      } else {
        const match = baseSkillOptions.find((opt) => String(opt.id) === String(s.base_skill_id));
        baseSkillName = match?.name ?? '';
      }
    }
    const abilityArr =
      typeof s.ability === 'string' && s.ability.length > 0
        ? s.ability
            .split(',')
            .map((a: string) => a.trim())
            .filter(Boolean)
        : [];
    return {
      name,
      description: s.description || '',
      abilities: abilityArr,
      baseSkillName,
      success_desc: s.success_desc ?? '',
      failure_desc: s.failure_desc ?? '',
      ds_calc: s.ds_calc ?? '',
      craft_success_desc: s.craft_success_desc ?? '',
      craft_failure_desc: s.craft_failure_desc ?? '',
    };
  };

  const openAdd = () => beginAdd(() => setForm(EMPTY_SKILL_FORM));

  const openDuplicate = (s: Skill) =>
    beginDuplicate(s, () =>
      setForm(skillFormFromSkill(s, (s.name || '').trim() + COPY_NAME_SUFFIX)),
    );

  const openEdit = (s: Skill) => beginEdit(s, () => setForm(skillFormFromSkill(s, s.name)));

  const handleSave = async () => {
    if (!form.name.trim()) return;

    let base_skill_id: number | undefined;
    const trimmedBase = form.baseSkillName.trim();
    if (trimmedBase) {
      if (trimmedBase === 'Any') {
        base_skill_id = 0;
      } else {
        const match = baseSkillOptions.find((opt) => opt.name === trimmedBase);
        if (match) {
          base_skill_id = parseInt(String(match.id), 10);
        }
      }
    }

    await save({
      payload: {
        name: form.name.trim(),
        description: form.description.trim(),
        ability:
          form.abilities.length === 0
            ? undefined
            : form.abilities.length === 1
              ? form.abilities[0]
              : form.abilities,
        base_skill_id,
        success_desc: form.success_desc.trim() || undefined,
        failure_desc: form.failure_desc.trim() || undefined,
        ds_calc: form.ds_calc.trim() || undefined,
        craft_success_desc: form.craft_success_desc.trim() || undefined,
        craft_failure_desc: form.craft_failure_desc.trim() || undefined,
      },
      expectedUpdatedAt: editing?.updated_at,
    });
  };

  if (error)
    return (
      <ErrorState
        message="Failed to load skills"
        onRetry={() => {
          void refetch();
        }}
      />
    );

  return (
    <div>
      <CodexBrowseListShell
        sectionTitle="Skills"
        onAdd={openAdd}
        search={filters.search}
        onSearchChange={(v) => setFilters((f) => ({ ...f, search: v }))}
        searchPlaceholder="Search names, descriptions..."
        filters={
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <ChipSelect
              label="Ability"
              placeholder="Choose ability"
              options={filterOptions.abilities.map((a) => ({
                value: a,
                label:
                  typeof a === 'string' && a.length > 0
                    ? a.charAt(0).toUpperCase() + a.slice(1)
                    : String(a),
              }))}
              selectedValues={filters.abilities}
              onSelect={(v) => setFilters((f) => ({ ...f, abilities: [...f.abilities, v] }))}
              onRemove={(v) =>
                setFilters((f) => ({ ...f, abilities: f.abilities.filter((a) => a !== v) }))
              }
            />

            <SelectFilter
              label="Base Skill"
              value={filters.baseSkill}
              options={filterOptions.baseSkills.map((s) => ({ value: s, label: s }))}
              onChange={(v) => setFilters((f) => ({ ...f, baseSkill: v }))}
              placeholder="Base skill (any)"
            />

            <SelectFilter
              label="Skill Type"
              value={filters.subSkillMode}
              options={[
                { value: 'only', label: 'Only Sub-Skills' },
                { value: 'hide', label: 'Hide Sub-Skills' },
              ]}
              onChange={(v) =>
                setFilters((f) => ({ ...f, subSkillMode: (v || '') as '' | 'only' | 'hide' }))
              }
              placeholder="All skills"
            />
            <ArchetypePathFilter
              options={pathIndex.options}
              selectedPathIds={selectedPathIds}
              onChange={setSelectedPathIds}
            />
          </div>
        }
        headerColumns={SKILL_HEADER_COLUMNS}
        gridColumns={SKILL_GRID_COLUMNS}
        rowChrome={{ rightSlot: true }}
        sortState={sortState}
        onSort={handleSort}
        isLoading={isLoading}
        isEmpty={filteredSkills.length === 0}
        emptyTitle={pathFilterActive ? pathFilterEmptyTitle('skills') : 'No skills found'}
        emptyMessage="No skills match your filters."
        emptyAction={{ label: 'Add Skill', onClick: openAdd }}
      >
        {filteredSkills.map((s: Skill) => (
          <CodexSkillRow
            key={s.id}
            skill={s}
            skillIdToName={skillIdToName}
            variant="admin"
            nameChipLabels={
              pathFilterActive
                ? pathChipLabelsForEntity(pathIndex, s.id, selectedPathIds)
                : undefined
            }
            rightSlot={
              <AdminCodexRowActions
                entity={s}
                onEdit={openEdit}
                onDuplicate={openDuplicate}
                onDelete={askDelete}
              />
            }
          />
        ))}
      </CodexBrowseListShell>

      <AdminSkillEditModal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editing ? 'Edit Skill' : 'Add Skill'}
        copySourceName={copySourceName}
        editingId={editing?.id ?? null}
        form={form}
        setForm={setForm}
        abilityOptions={ABILITY_OPTIONS}
        baseSkillOptions={baseSkillOptions}
        saving={saving}
        onDelete={editing ? () => askDelete(editing) : undefined}
        onSave={handleSave}
      />

      {deleteModals}
    </div>
  );
}
