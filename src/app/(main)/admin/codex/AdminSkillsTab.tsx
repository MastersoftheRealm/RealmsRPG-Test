'use client';

import { useMemo, useState } from 'react';
import { CodexBrowseListShell, ErrorDisplay as ErrorState } from '@/components/patterns';
import { Modal, Button, Input, Textarea, IconButton, useToast } from '@/components/ui';
import { ChipSelect, SelectFilter, ArchetypePathFilter } from '@/components/patterns/filters';
import { CodexSkillRow } from '@/components/codex';
import { useCodexSkills, usePathListFilter, type Skill } from '@/hooks';
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

/** Skills are governed by abilities only (not defenses). */
const ABILITY_OPTIONS_SKILLS = ABILITIES_AND_DEFENSES.slice(0, 6);
import { useSort } from '@/hooks/use-sort';
import {
  pathChipLabelsForEntity,
  pathFilterEmptyTitle,
} from '@/lib/game/path-recommendation-index';
import { useQueryClient } from '@tanstack/react-query';
import { createCodexDoc, updateCodexDoc } from './actions';
import { AdminCodexDeleteReferenceModal, useAdminCodexDelete } from './use-admin-codex-delete';
import { Pencil, Copy, X } from 'lucide-react';
const COPY_NAME_SUFFIX = ' copy';

interface SkillFilters extends SkillListFilters {
  subSkillMode: '' | 'only' | 'hide';
}

export function AdminSkillsTab() {
  const { showToast } = useToast();
  const { data: skills, isLoading, error, refetch } = useCodexSkills();
  const queryClient = useQueryClient();
  const { sortState, handleSort, sortItems } = useSort('name');
  const [filters, setFilters] = useState<SkillFilters>({
    search: '',
    abilities: [],
    baseSkill: '',
    subSkillMode: '',
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Skill | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [copySourceName, setCopySourceName] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    description: '',
    abilities: [] as string[],
    baseSkillName: '',
    success_desc: '',
    failure_desc: '',
    ds_calc: '',
    craft_success_desc: '',
    craft_failure_desc: '',
  });

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

  const openAdd = () => {
    setEditing(null);
    setCopySourceName(null);
    setForm({
      name: '',
      description: '',
      abilities: [],
      baseSkillName: '',
      success_desc: '',
      failure_desc: '',
      ds_calc: '',
      craft_success_desc: '',
      craft_failure_desc: '',
    });
    setModalOpen(true);
  };

  const openDuplicate = (s: Skill) => {
    setEditing(null);
    setCopySourceName(s.name);
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
    setForm({
      name: (s.name || '').trim() + COPY_NAME_SUFFIX,
      description: s.description || '',
      abilities: abilityArr,
      baseSkillName,
      success_desc: s.success_desc ?? '',
      failure_desc: s.failure_desc ?? '',
      ds_calc: s.ds_calc ?? '',
      craft_success_desc: s.craft_success_desc ?? '',
      craft_failure_desc: s.craft_failure_desc ?? '',
    });
    setModalOpen(true);
  };

  const openEdit = (s: Skill) => {
    setEditing(s);
    setCopySourceName(null);
    // Resolve base skill name from id (including 0 meaning "Any")
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
    setForm({
      name: s.name,
      description: s.description || '',
      abilities: abilityArr,
      baseSkillName,
      success_desc: s.success_desc ?? '',
      failure_desc: s.failure_desc ?? '',
      ds_calc: s.ds_calc ?? '',
      craft_success_desc: s.craft_success_desc ?? '',
      craft_failure_desc: s.craft_failure_desc ?? '',
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

    // Resolve base_skill_id from selected baseSkillName
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

    const data: Record<string, unknown> = {
      name: form.name.trim(),
      description: form.description.trim(),
      // Save as single string or array, depending on count
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
    };

    const result = editing
      ? await updateCodexDoc('codex_skills', editing.id, data, {
          expectedUpdatedAt: editing.updated_at,
        })
      : await createCodexDoc('codex_skills', undefined, data);

    setSaving(false);
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ['codex'] });
      await queryClient.refetchQueries({ queryKey: ['codex'] });
      closeModal();
    } else {
      showToast(result.error ?? 'Operation failed', 'error');
    }
  };

  const codexDelete = useAdminCodexDelete({
    collection: 'codex_skills',
    onDeleted: async () => {
      queryClient.invalidateQueries({ queryKey: ['codex'] });
      await queryClient.refetchQueries({ queryKey: ['codex'] });
      setPendingDeleteId(null);
      closeModal();
    },
    onError: (message) => {
      setPendingDeleteId(null);
      showToast(message, 'error');
    },
  });

  const handleDelete = async (id: string) => {
    if (deleteConfirm !== id) {
      setDeleteConfirm(id);
      return;
    }
    await codexDelete.requestDelete(id);
  };

  const handleInlineDelete = async (id: string) => {
    if (pendingDeleteId !== id) {
      setPendingDeleteId(id);
      return;
    }
    await codexDelete.requestDelete(id);
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
              <div className="flex items-center gap-1 pr-2">
                {pendingDeleteId === s.id ? (
                  <div className="flex items-center gap-1 text-xs">
                    <span className="font-medium whitespace-nowrap text-danger-700 dark:text-danger-400">
                      Remove?
                    </span>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleInlineDelete(s.id)}
                      className="h-6 px-2 py-0.5 text-xs"
                    >
                      Yes
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setPendingDeleteId(null)}
                      className="h-6 px-2 py-0.5 text-xs"
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
                      <Pencil className="h-4 w-4" />
                    </IconButton>
                    <IconButton
                      variant="ghost"
                      size="sm"
                      onClick={() => openDuplicate(s)}
                      label="Duplicate"
                      aria-label="Duplicate"
                    >
                      <Copy className="h-4 w-4" />
                    </IconButton>
                    <IconButton
                      variant="ghost"
                      size="sm"
                      onClick={() => setPendingDeleteId(s.id)}
                      label="Delete"
                      className="text-danger-fg hover:bg-transparent hover:opacity-80"
                    >
                      <X className="h-4 w-4" />
                    </IconButton>
                  </>
                )}
              </div>
            }
          />
        ))}
      </CodexBrowseListShell>

      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editing ? 'Edit Skill' : 'Add Skill'}
        size="full"
        fullScreenOnMobile
        footer={
          <div className="flex justify-between">
            <div>
              {editing && (
                <Button
                  variant="outline"
                  onClick={() => handleDelete(editing.id)}
                  className={
                    deleteConfirm === editing.id
                      ? 'border-danger-500 text-danger-700 dark:text-danger-400'
                      : ''
                  }
                >
                  {deleteConfirm === editing.id ? 'Click again to confirm delete' : 'Delete'}
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={closeModal}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving || !form.name.trim()}>
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-4">
          {copySourceName && (
            <p className="rounded-md border border-border-light bg-surface-alt px-3 py-2 text-sm text-text-secondary">
              Creating a copy of <strong className="text-text-primary">{copySourceName}</strong>.
              Change the name and details as needed, then save to add the new skill.
            </p>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium text-text-secondary">Name *</label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Skill name"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text-secondary">
              Description
            </label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Skill description"
              className="min-h-[120px] resize-y"
              rows={4}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text-secondary">
              Success outcome description
            </label>
            <Textarea
              value={form.success_desc}
              onChange={(e) => setForm((f) => ({ ...f, success_desc: e.target.value }))}
              placeholder="What happens on successes (expandable chip)"
              className="min-h-[100px] resize-y"
              rows={3}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text-secondary">
              Failure outcome description
            </label>
            <Textarea
              value={form.failure_desc}
              onChange={(e) => setForm((f) => ({ ...f, failure_desc: e.target.value }))}
              placeholder="What happens on failures (expandable chip)"
              className="min-h-[100px] resize-y"
              rows={3}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text-secondary">
              Difficulty score (DS) guidance
            </label>
            <Textarea
              value={form.ds_calc}
              onChange={(e) => setForm((f) => ({ ...f, ds_calc: e.target.value }))}
              placeholder="RM guidance for DS calculation (expandable chip)"
              className="min-h-[100px] resize-y"
              rows={3}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text-secondary">
              Craft success description (Craft sub-skills)
            </label>
            <Textarea
              value={form.craft_success_desc}
              onChange={(e) => setForm((f) => ({ ...f, craft_success_desc: e.target.value }))}
              placeholder="Crafting success results"
              className="min-h-[100px] resize-y"
              rows={3}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text-secondary">
              Craft failure description (Craft sub-skills)
            </label>
            <Textarea
              value={form.craft_failure_desc}
              onChange={(e) => setForm((f) => ({ ...f, craft_failure_desc: e.target.value }))}
              placeholder="Crafting failure results"
              className="min-h-[100px] resize-y"
              rows={3}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text-secondary">Ability</label>
            <ChipSelect
              label=""
              placeholder="Choose governing ability"
              options={ABILITY_OPTIONS}
              selectedValues={form.abilities}
              onSelect={(v) => setForm((f) => ({ ...f, abilities: [...f.abilities, v] }))}
              onRemove={(v) =>
                setForm((f) => ({ ...f, abilities: f.abilities.filter((a) => a !== v) }))
              }
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text-secondary">
              Base skill (for sub-skills)
            </label>
            <select
              value={form.baseSkillName}
              onChange={(e) => setForm((f) => ({ ...f, baseSkillName: e.target.value }))}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-text-primary"
              aria-label="Base skill"
            >
              <option value="">None (base skill)</option>
              <option value="Any">Any base skill (id 0)</option>
              {baseSkillOptions.map((opt) => (
                <option key={opt.id} value={opt.name}>
                  {opt.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Modal>

      <AdminCodexDeleteReferenceModal state={codexDelete} entityLabel="skill" />
    </div>
  );
}
