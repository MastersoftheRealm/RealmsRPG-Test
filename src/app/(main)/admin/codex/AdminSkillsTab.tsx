'use client';

import { useMemo, useState } from 'react';
import {
  SectionHeader,
  SearchInput,
  LoadingState,
  ErrorDisplay as ErrorState,
  GridListRow,
  ListEmptyState as EmptyState,
  SortHeader,
} from '@/components/shared';
import { Modal, Button, Input } from '@/components/ui';
import { ChipSelect, SelectFilter, FilterSection } from '@/components/codex';
import { useCodexSkills, type Skill } from '@/hooks';
import { useSort } from '@/hooks/use-sort';
import { useQueryClient } from '@tanstack/react-query';
import { createCodexDoc, updateCodexDoc, deleteCodexDoc } from './actions';
import { Pencil, Trash2 } from 'lucide-react';
import { IconButton } from '@/components/ui';

const SKILL_GRID_COLUMNS = '1.5fr 1fr 1fr 40px';

interface SkillFilters {
  search: string;
  abilities: string[];
  baseSkill: string;
  subSkillMode: 'all' | 'only' | 'hide';
}

export function AdminSkillsTab() {
  const { data: skills, isLoading, error } = useCodexSkills();
  const queryClient = useQueryClient();
  const { sortState, handleSort, sortItems } = useSort('name');
  const [filters, setFilters] = useState<SkillFilters>({
    search: '',
    abilities: [],
    baseSkill: '',
    subSkillMode: 'all',
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<{ id: string; name: string; description: string; ability: string; base_skill_id?: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [form, setForm] = useState({ name: '', description: '', ability: '', baseSkillName: '' });

  const baseSkillOptions = useMemo(() => {
    if (!skills) return [] as { id: string; name: string }[];
    // Base skills are those without a base_skill_id (or with base_skill_id === 0 meaning can be a base for any)
    const baseSkills = (skills as Skill[]).filter((s) => s.base_skill_id === undefined || s.base_skill_id === 0);
    return baseSkills
      .map((s) => ({ id: String(s.id), name: s.name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [skills]);

  const skillIdToName = useMemo((): Map<string, string> => {
    if (!skills) return new Map<string, string>();
    return new Map(skills.map((s: Skill) => [String(s.id), s.name] as [string, string]));
  }, [skills]);

  const filterOptions = useMemo(() => {
    if (!skills) return { abilities: [] as string[], baseSkills: [] as string[] };

    const abilities = new Set<string>();
    const baseSkills = new Set<string>();

    skills.forEach((s: Skill) => {
      if (s.ability && typeof s.ability === 'string') {
        s.ability.split(',').forEach((ab: string) => {
          const trimmed = ab.trim();
          if (trimmed) abilities.add(trimmed);
        });
      }
      if (s.base_skill_id !== undefined) {
        const baseSkillName: string | undefined = skillIdToName.get(String(s.base_skill_id));
        if (typeof baseSkillName === 'string') baseSkills.add(baseSkillName);
      }
    });

    return {
      abilities: Array.from(abilities).sort(),
      baseSkills: Array.from(baseSkills).sort(),
    };
  }, [skills, skillIdToName]);

  const filteredSkills = useMemo(() => {
    if (!skills) return [];

    const filtered = skills.filter((s: Skill) => {
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        if (
          !s.name.toLowerCase().includes(searchLower) &&
          !s.description?.toLowerCase().includes(searchLower)
        ) {
          return false;
        }
      }

      if (filters.abilities.length > 0) {
        const skillAbilities = s.ability?.split(',').map((a: string) => a.trim()) || [];
        const hasMatchingAbility = filters.abilities.some(filterAb =>
          skillAbilities.includes(filterAb)
        );
        if (!hasMatchingAbility) return false;
      }

      if (filters.baseSkill) {
        const isThisBaseSkill = s.name === filters.baseSkill;
        const baseSkillName = s.base_skill_id !== undefined ? skillIdToName.get(String(s.base_skill_id)) : undefined;
        const hasThisBaseSkill = baseSkillName === filters.baseSkill;
        if (!isThisBaseSkill && !hasThisBaseSkill) return false;
      }

      const isSubSkill = s.base_skill_id !== undefined;
      if (filters.subSkillMode === 'only' && !isSubSkill) return false;
      if (filters.subSkillMode === 'hide' && isSubSkill) return false;

      return true;
    });

    if (filters.baseSkill) {
      return filtered.sort((a: Skill, b: Skill) => {
        const aIsBase = a.name === filters.baseSkill;
        const bIsBase = b.name === filters.baseSkill;
        if (aIsBase && !bIsBase) return -1;
        if (!aIsBase && bIsBase) return 1;
        return a.name.localeCompare(b.name);
      });
    }

    return sortItems<Skill>(filtered);
  }, [skills, filters, sortItems, skillIdToName]);

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', description: '', ability: '', baseSkillName: '' });
    setModalOpen(true);
  };

  const openEdit = (s: { id: string; name: string; description: string; ability: string; base_skill_id?: number }) => {
    setEditing(s);
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
    setForm({
      name: s.name,
      description: s.description || '',
      ability: s.ability || '',
      baseSkillName,
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

    const data = {
      name: form.name.trim(),
      description: form.description.trim(),
      ability: form.ability.trim(),
      base_skill_id,
    };

    const id = form.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_-]/g, '').slice(0, 100) || `skill_${Date.now()}`;

    const result = editing
      ? await updateCodexDoc('codex_skills', editing.id, data)
      : await createCodexDoc('codex_skills', id, data);

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
    const result = await deleteCodexDoc('codex_skills', id);
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ['codex'] });
      closeModal();
    } else {
      alert(result.error);
    }
  };

  if (error) return <ErrorState message="Failed to load skills" />;

  return (
    <div>
      <SectionHeader title="Skills" onAdd={openAdd} size="md" />
      <div className="mb-4 mt-2">
        <SearchInput
          value={filters.search}
          onChange={(v) => setFilters(f => ({ ...f, search: v }))}
          placeholder="Search names, descriptions..."
        />
      </div>

      <FilterSection>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <ChipSelect
            label="Ability"
            placeholder="Choose ability"
            options={filterOptions.abilities.map(a => ({
              value: a,
              label: typeof a === 'string' && a.length > 0 ? a.charAt(0).toUpperCase() + a.slice(1) : String(a),
            }))}
            selectedValues={filters.abilities}
            onSelect={(v) => setFilters(f => ({ ...f, abilities: [...f.abilities, v] }))}
            onRemove={(v) => setFilters(f => ({ ...f, abilities: f.abilities.filter(a => a !== v) }))}
          />

          <SelectFilter
            label="Base Skill"
            value={filters.baseSkill}
            options={filterOptions.baseSkills.map(s => ({ value: s, label: s }))}
            onChange={(v) => setFilters(f => ({ ...f, baseSkill: v }))}
            placeholder="Any"
          />

          <SelectFilter
            label="Skill Type"
            value={filters.subSkillMode}
            options={[
              { value: 'all', label: 'All Skills' },
              { value: 'only', label: 'Only Sub-Skills' },
              { value: 'hide', label: 'Hide Sub-Skills' },
            ]}
            onChange={(v) => setFilters(f => ({ ...f, subSkillMode: v as 'all' | 'only' | 'hide' }))}
            placeholder="All Skills"
          />
        </div>
      </FilterSection>

      <div
        className="hidden lg:grid gap-2 px-4 py-3 bg-primary-50 border-b border-border-light rounded-t-lg font-semibold text-sm text-primary-700"
        style={{ gridTemplateColumns: SKILL_GRID_COLUMNS }}
      >
        <SortHeader label="NAME" col="name" sortState={sortState} onSort={handleSort} />
        <SortHeader label="ABILITIES" col="ability" sortState={sortState} onSort={handleSort} />
        <SortHeader label="BASE SKILL" col="base_skill" sortState={sortState} onSort={handleSort} />
      </div>

      {isLoading ? (
        <LoadingState />
      ) : (
        <div className="flex flex-col gap-1 mt-2">
          {filteredSkills.length === 0 ? (
            <EmptyState
              title="No skills found"
              description="No skills match your filters."
              action={{ label: 'Add Skill', onClick: openAdd }}
              size="sm"
            />
          ) : (
            filteredSkills.map((s: Skill) => (
              <GridListRow
                key={s.id}
                id={s.id}
                name={s.name}
                description={s.description || ''}
                gridColumns={SKILL_GRID_COLUMNS}
                columns={[
                  { key: 'Ability', value: s.ability || '-' },
                  {
                    key: 'Base Skill',
                    value:
                      s.base_skill_id !== undefined
                        ? (skillIdToName.get(String(s.base_skill_id)) || '-')
                        : '-',
                  },
                ]}
                rightSlot={
                  <div className="flex gap-1 pr-2">
                    <IconButton variant="ghost" size="sm" onClick={() => openEdit(s)} label="Edit">
                      <Pencil className="w-4 h-4" />
                    </IconButton>
                    <IconButton
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(s)}
                      label="Delete"
                      className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30"
                    >
                      <Trash2 className="w-4 h-4" />
                    </IconButton>
                  </div>
                }
              />
            ))
          )}
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editing ? 'Edit Skill' : 'Add Skill'}
        size="lg"
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
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Skill name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Skill description" className="w-full min-h-[80px] px-3 py-2 rounded-md border border-border bg-background text-text-primary" rows={3} />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Ability</label>
            <Input value={form.ability} onChange={(e) => setForm((f) => ({ ...f, ability: e.target.value }))} placeholder="e.g. Agility" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Base skill (for sub-skills)</label>
            <select
              value={form.baseSkillName}
              onChange={(e) => setForm((f) => ({ ...f, baseSkillName: e.target.value }))}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-text-primary text-sm"
            >
              <option value="">— None (base skill)</option>
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
    </div>
  );
}
