'use client';

import { useState } from 'react';
import { SectionHeader, SearchInput, LoadingState, ErrorDisplay as ErrorState, GridListRow, ListEmptyState as EmptyState } from '@/components/shared';
import { Modal, Button, Input } from '@/components/ui';
import { useCodexArchetypes } from '@/hooks/use-codex';
import { useQueryClient } from '@tanstack/react-query';
import { deleteCodexDoc, saveArchetypeWithPath } from './actions';
import { Pencil, Copy, X } from 'lucide-react';
import { IconButton } from '@/components/ui';

const COPY_NAME_SUFFIX = ' copy';
const ABILITY_OPTIONS = ['strength', 'vitality', 'agility', 'acuity', 'intelligence', 'charisma'] as const;

type PathLevelForm = {
  rowId: string;
  level: number;
  feats: string;
  skills: string;
  powers: string;
  techniques: string;
  armaments: string;
  equipment: string;
  removeFeats: string;
  removePowers: string;
  removeTechniques: string;
  removeArmaments: string;
  notes: string;
};

function csvToArray(value: string): string[] {
  return value
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
}

function toCsv(value: unknown): string {
  if (!Array.isArray(value)) return '';
  return value.map(String).filter(Boolean).join(', ');
}

function parsePathData(value: unknown): Record<string, unknown> | undefined {
  if (!value) return undefined;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (typeof parsed === 'object' && parsed !== null) return parsed as Record<string, unknown>;
      return undefined;
    } catch {
      return undefined;
    }
  }
  if (typeof value === 'object' && value !== null) return value as Record<string, unknown>;
  return undefined;
}

function makeLevelRow(level = 2): PathLevelForm {
  return {
    rowId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    level,
    feats: '',
    skills: '',
    powers: '',
    techniques: '',
    armaments: '',
    equipment: '',
    removeFeats: '',
    removePowers: '',
    removeTechniques: '',
    removeArmaments: '',
    notes: '',
  };
}

function toLevelForm(raw: Record<string, unknown>, level = 2): PathLevelForm {
  return {
    rowId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    level: Number(raw.level ?? level) || level,
    feats: toCsv(raw.feats),
    skills: toCsv(raw.skills),
    powers: toCsv(raw.powers),
    techniques: toCsv(raw.techniques),
    armaments: toCsv(raw.armaments),
    equipment: toCsv(raw.equipment),
    removeFeats: toCsv(raw.removeFeats),
    removePowers: toCsv(raw.removePowers),
    removeTechniques: toCsv(raw.removeTechniques),
    removeArmaments: toCsv(raw.removeArmaments),
    notes: typeof raw.notes === 'string' ? raw.notes : '',
  };
}

function buildLevelPayload(level: PathLevelForm, includeLevel: boolean): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  if (includeLevel) payload.level = level.level;
  const feats = csvToArray(level.feats);
  const skills = csvToArray(level.skills);
  const powers = csvToArray(level.powers);
  const techniques = csvToArray(level.techniques);
  const armaments = csvToArray(level.armaments);
  const equipment = csvToArray(level.equipment);
  const removeFeats = csvToArray(level.removeFeats);
  const removePowers = csvToArray(level.removePowers);
  const removeTechniques = csvToArray(level.removeTechniques);
  const removeArmaments = csvToArray(level.removeArmaments);
  if (feats.length) payload.feats = feats;
  if (skills.length) payload.skills = skills;
  if (powers.length) payload.powers = powers;
  if (techniques.length) payload.techniques = techniques;
  if (armaments.length) payload.armaments = armaments;
  if (equipment.length) payload.equipment = equipment;
  if (removeFeats.length) payload.removeFeats = removeFeats;
  if (removePowers.length) payload.removePowers = removePowers;
  if (removeTechniques.length) payload.removeTechniques = removeTechniques;
  if (removeArmaments.length) payload.removeArmaments = removeArmaments;
  if (level.notes.trim()) payload.notes = level.notes.trim();
  return payload;
}

export function AdminArchetypesTab() {
  const { data: archetypes, isLoading, error } = useCodexArchetypes();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  type ArchetypeItem = {
    id: string;
    name?: string;
    type?: string;
    description?: string;
    archetype_ability?: string;
    secondary_ability?: string;
    power_prof_start?: number;
    martial_prof_start?: number;
    power_prof_level5?: number;
    martial_prof_level5?: number;
    path_data?: Record<string, unknown> | string;
  };
  const [editing, setEditing] = useState<ArchetypeItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [copySourceName, setCopySourceName] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    type: 'power' as 'power' | 'powered-martial' | 'martial',
    description: '',
    archetypeAbility: '',
    secondaryAbility: '',
    powerProfStart: 0,
    martialProfStart: 0,
    powerProfLevel5: 0,
    martialProfLevel5: 0,
    level1Path: makeLevelRow(1),
    levelPathRows: [makeLevelRow(2)],
    advancedPathJson: '',
  });

  const filtered = (archetypes || []).filter(
    (a: ArchetypeItem) =>
      !search ||
      (a.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (a.description || '').toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setEditing(null);
    setCopySourceName(null);
    setForm({
      name: '',
      type: 'power',
      description: '',
      archetypeAbility: '',
      secondaryAbility: '',
      powerProfStart: 0,
      martialProfStart: 0,
      powerProfLevel5: 0,
      martialProfLevel5: 0,
      level1Path: makeLevelRow(1),
      levelPathRows: [makeLevelRow(2)],
      advancedPathJson: '',
    });
    setModalOpen(true);
  };

  const openDuplicate = (a: ArchetypeItem) => {
    const parsedPath = parsePathData(a.path_data);
    const rawLevel1 =
      parsedPath && typeof parsedPath.level1 === 'object' && parsedPath.level1 !== null
        ? (parsedPath.level1 as Record<string, unknown>)
        : {};
    const rawLevels = Array.isArray(parsedPath?.levels)
      ? (parsedPath?.levels as unknown[])
      : [];
    const levelRows = rawLevels
      .filter((entry): entry is Record<string, unknown> => typeof entry === 'object' && entry !== null)
      .map((entry, index) => toLevelForm(entry, index + 2));

    setEditing(null);
    setCopySourceName(a.name || '');
    setForm({
      name: ((a.name || '').trim() || 'Archetype') + COPY_NAME_SUFFIX,
      type: (a.type || 'power') as 'power' | 'powered-martial' | 'martial',
      description: a.description || '',
      archetypeAbility: a.archetype_ability || '',
      secondaryAbility: a.secondary_ability || '',
      powerProfStart: a.power_prof_start ?? 0,
      martialProfStart: a.martial_prof_start ?? 0,
      powerProfLevel5: a.power_prof_level5 ?? 0,
      martialProfLevel5: a.martial_prof_level5 ?? 0,
      level1Path: toLevelForm(rawLevel1, 1),
      levelPathRows: levelRows.length ? levelRows : [makeLevelRow(2)],
      advancedPathJson: '',
    });
    setModalOpen(true);
  };

  const openEdit = (a: ArchetypeItem) => {
    const parsedPath = parsePathData(a.path_data);
    const rawLevel1 =
      parsedPath && typeof parsedPath.level1 === 'object' && parsedPath.level1 !== null
        ? (parsedPath.level1 as Record<string, unknown>)
        : {};
    const rawLevels = Array.isArray(parsedPath?.levels)
      ? (parsedPath?.levels as unknown[])
      : [];
    const levelRows = rawLevels
      .filter((entry): entry is Record<string, unknown> => typeof entry === 'object' && entry !== null)
      .map((entry, index) => toLevelForm(entry, index + 2));

    setEditing(a);
    setCopySourceName(null);
    setForm({
      name: a.name || '',
      type: (a.type || 'power') as 'power' | 'powered-martial' | 'martial',
      description: a.description || '',
      archetypeAbility: a.archetype_ability || '',
      secondaryAbility: a.secondary_ability || '',
      powerProfStart: a.power_prof_start ?? 0,
      martialProfStart: a.martial_prof_start ?? 0,
      powerProfLevel5: a.power_prof_level5 ?? 0,
      martialProfLevel5: a.martial_prof_level5 ?? 0,
      level1Path: toLevelForm(rawLevel1, 1),
      levelPathRows: levelRows.length ? levelRows : [makeLevelRow(2)],
      advancedPathJson: '',
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

    const level1Payload = buildLevelPayload(form.level1Path, false);
    const levelsPayload = form.levelPathRows
      .map((row) => buildLevelPayload(row, true))
      .filter((row) => Object.keys(row).length > 1)
      .sort((a, b) => Number(a.level || 0) - Number(b.level || 0));

    let structuredPathData: Record<string, unknown> | undefined;
    if (Object.keys(level1Payload).length > 0 || levelsPayload.length > 0) {
      structuredPathData = {};
      if (Object.keys(level1Payload).length > 0) structuredPathData.level1 = level1Payload;
      if (levelsPayload.length > 0) structuredPathData.levels = levelsPayload;
    }

    let level1Override: Record<string, unknown> | undefined;
    let levelsOverride: Record<string, unknown>[] | undefined;
    if (form.advancedPathJson.trim()) {
      try {
        const override = JSON.parse(form.advancedPathJson) as Record<string, unknown>;
        if (override.level1 && typeof override.level1 === 'object') level1Override = override.level1 as Record<string, unknown>;
        if (Array.isArray(override.levels)) {
          levelsOverride = override.levels.filter(
            (entry): entry is Record<string, unknown> => typeof entry === 'object' && entry !== null
          );
        }
      } catch {
        alert('Advanced Path JSON must be valid JSON.');
        return;
      }
    }
    setSaving(true);
    const finalLevel1 = level1Override || (structuredPathData?.level1 as Record<string, unknown> | undefined) || {};
    const finalLevels = levelsOverride || (structuredPathData?.levels as Record<string, unknown>[] | undefined) || [];

    const result = await saveArchetypeWithPath({
      ...(editing ? { id: editing.id } : {}),
      name: form.name.trim(),
      type: form.type,
      description: form.description.trim() || undefined,
      archetype_ability: form.archetypeAbility || undefined,
      secondary_ability: form.secondaryAbility || undefined,
      power_prof_start: form.powerProfStart,
      martial_prof_start: form.martialProfStart,
      power_prof_level5: form.powerProfLevel5,
      martial_prof_level5: form.martialProfLevel5,
      level1_feats: toCsv(finalLevel1.feats),
      level1_skills: toCsv(finalLevel1.skills),
      level1_powers: toCsv(finalLevel1.powers),
      level1_techniques: toCsv(finalLevel1.techniques),
      level1_armaments: toCsv(finalLevel1.armaments),
      level1_equipment: toCsv(finalLevel1.equipment),
      level1_remove_feats: toCsv(finalLevel1.removeFeats),
      level1_remove_powers: toCsv(finalLevel1.removePowers),
      level1_remove_techniques: toCsv(finalLevel1.removeTechniques),
      level1_remove_armaments: toCsv(finalLevel1.removeArmaments),
      level1_notes: typeof finalLevel1.notes === 'string' ? finalLevel1.notes : undefined,
      levels: finalLevels.map((entry) => ({
        level: Number(entry.level || 0),
        feats: toCsv(entry.feats),
        skills: toCsv(entry.skills),
        powers: toCsv(entry.powers),
        techniques: toCsv(entry.techniques),
        armaments: toCsv(entry.armaments),
        equipment: toCsv(entry.equipment),
        remove_feats: toCsv(entry.removeFeats),
        remove_powers: toCsv(entry.removePowers),
        remove_techniques: toCsv(entry.removeTechniques),
        remove_armaments: toCsv(entry.removeArmaments),
        notes: typeof entry.notes === 'string' ? entry.notes : undefined,
      })),
    });

    setSaving(false);
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ['gameData', 'archetypes'] });
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
    const result = await deleteCodexDoc('codex_archetypes', id);
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ['gameData', 'archetypes'] });
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
    const result = await deleteCodexDoc('codex_archetypes', id);
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ['gameData', 'archetypes'] });
      setPendingDeleteId(null);
    } else {
      alert(result.error);
      setPendingDeleteId(null);
    }
  };

  if (error) return <ErrorState message="Failed to load archetypes" />;

  return (
    <div>
      <SectionHeader title="Archetypes" onAdd={openAdd} size="md" />
      <div className="mb-4 mt-2">
        <SearchInput value={search} onChange={setSearch} placeholder="Search archetypes..." />
      </div>

      {isLoading ? (
        <LoadingState />
      ) : (
        <div className="border border-border rounded-lg overflow-hidden bg-surface">
          {filtered.map((a: ArchetypeItem) => (
            <div key={a.id} className="flex items-center border-t border-border first:border-t-0 hover:bg-surface-alt/50">
              <div className="flex-1 min-w-0">
                <GridListRow id={a.id} name={a.name || ''} description={(a as { description?: string }).description || ''} columns={[{ key: 'Type', value: (a.type || '-') as string }]} />
              </div>
              <div className="flex items-center gap-1 pr-2">
                {pendingDeleteId === a.id ? (
                  <div className="flex items-center gap-1 text-xs">
                    <span className="text-red-600 font-medium whitespace-nowrap">Remove?</span>
                    <Button size="sm" variant="danger" onClick={() => handleInlineDelete(a.id, a.name || '')} className="text-xs px-2 py-0.5 h-6">Yes</Button>
                    <Button size="sm" variant="secondary" onClick={() => setPendingDeleteId(null)} className="text-xs px-2 py-0.5 h-6">No</Button>
                  </div>
                ) : (
                  <>
                    <IconButton variant="ghost" size="sm" onClick={() => openEdit(a)} label="Edit" aria-label="Edit">
                      <Pencil className="w-4 h-4" />
                    </IconButton>
                    <IconButton variant="ghost" size="sm" onClick={() => openDuplicate(a)} label="Duplicate" aria-label="Duplicate">
                      <Copy className="w-4 h-4" />
                    </IconButton>
                    <IconButton
                      variant="ghost"
                      size="sm"
                      onClick={() => setPendingDeleteId(a.id)}
                      label="Delete"
                      className="text-danger dark:text-danger-400 hover:text-danger-600 dark:hover:text-danger-300 hover:bg-transparent"
                    >
                      <X className="w-4 h-4" />
                    </IconButton>
                  </>
                )}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <EmptyState title="No archetypes found" description="Add one to get started." action={{ label: 'Add Archetype', onClick: openAdd }} size="sm" />
          )}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={closeModal} title={editing ? 'Edit Archetype' : 'Add Archetype'} size="lg" fullScreenOnMobile
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
              Creating a copy of <strong className="text-text-primary">{copySourceName}</strong>. Change the name and details as needed, then save to add the new archetype.
            </p>
          )}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Name *</label>
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Archetype name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Type</label>
            <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as 'power' | 'powered-martial' | 'martial' }))} className="w-full px-3 py-2 rounded-md border border-border bg-background text-text-primary" aria-label="Archetype type">
              <option value="power">Power</option>
              <option value="powered-martial">Powered-Martial</option>
              <option value="martial">Martial</option>
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Primary Ability</label>
              <select
                value={form.archetypeAbility}
                onChange={(e) => setForm((f) => ({ ...f, archetypeAbility: e.target.value }))}
                className="w-full px-3 py-2 rounded-md border border-border bg-background text-text-primary"
                aria-label="Primary archetype ability"
              >
                <option value="">Not set</option>
                {ABILITY_OPTIONS.map((ability) => (
                  <option key={ability} value={ability}>
                    {ability.charAt(0).toUpperCase() + ability.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Secondary Ability</label>
              <select
                value={form.secondaryAbility}
                onChange={(e) => setForm((f) => ({ ...f, secondaryAbility: e.target.value }))}
                className="w-full px-3 py-2 rounded-md border border-border bg-background text-text-primary"
                aria-label="Secondary archetype ability"
              >
                <option value="">Not set</option>
                {ABILITY_OPTIONS.map((ability) => (
                  <option key={ability} value={ability}>
                    {ability.charAt(0).toUpperCase() + ability.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Power Prof (Lv1)</label>
              <Input
                type="number"
                value={String(form.powerProfStart)}
                onChange={(e) => setForm((f) => ({ ...f, powerProfStart: Number(e.target.value || 0) }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Martial Prof (Lv1)</label>
              <Input
                type="number"
                value={String(form.martialProfStart)}
                onChange={(e) => setForm((f) => ({ ...f, martialProfStart: Number(e.target.value || 0) }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Power Prof (Lv5)</label>
              <Input
                type="number"
                value={String(form.powerProfLevel5)}
                onChange={(e) => setForm((f) => ({ ...f, powerProfLevel5: Number(e.target.value || 0) }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Martial Prof (Lv5)</label>
              <Input
                type="number"
                value={String(form.martialProfLevel5)}
                onChange={(e) => setForm((f) => ({ ...f, martialProfLevel5: Number(e.target.value || 0) }))}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Archetype description" className="w-full min-h-[80px] px-3 py-2 rounded-md border border-border bg-background text-text-primary" rows={3} />
          </div>
          <div className="rounded-lg border border-border-light p-4 space-y-3">
            <div>
              <h3 className="text-sm font-semibold text-text-primary">Archetype Path Builder</h3>
              <p className="text-xs text-text-muted dark:text-text-secondary mt-1">
                Use comma-separated IDs or names. Example: <code>mighty_blow, precise_strike</code>
              </p>
            </div>

            <div className="rounded-md border border-border-light bg-surface-alt p-3 space-y-2">
              <h4 className="text-sm font-medium text-text-primary">Level 1 Recommendations</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <Input value={form.level1Path.feats} onChange={(e) => setForm((f) => ({ ...f, level1Path: { ...f.level1Path, feats: e.target.value } }))} placeholder="Feats (CSV)" />
                <Input value={form.level1Path.skills} onChange={(e) => setForm((f) => ({ ...f, level1Path: { ...f.level1Path, skills: e.target.value } }))} placeholder="Skills (CSV)" />
                <Input value={form.level1Path.powers} onChange={(e) => setForm((f) => ({ ...f, level1Path: { ...f.level1Path, powers: e.target.value } }))} placeholder="Powers (CSV)" />
                <Input value={form.level1Path.techniques} onChange={(e) => setForm((f) => ({ ...f, level1Path: { ...f.level1Path, techniques: e.target.value } }))} placeholder="Techniques (CSV)" />
                <Input value={form.level1Path.armaments} onChange={(e) => setForm((f) => ({ ...f, level1Path: { ...f.level1Path, armaments: e.target.value } }))} placeholder="Armaments (CSV)" />
                <Input value={form.level1Path.equipment} onChange={(e) => setForm((f) => ({ ...f, level1Path: { ...f.level1Path, equipment: e.target.value } }))} placeholder="Equipment (CSV)" />
              </div>
              <Input value={form.level1Path.notes} onChange={(e) => setForm((f) => ({ ...f, level1Path: { ...f.level1Path, notes: e.target.value } }))} placeholder="Level 1 notes (optional)" />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-text-primary">Level Progression (2+)</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      levelPathRows: [...f.levelPathRows, makeLevelRow(Math.max(2, ...f.levelPathRows.map((row) => row.level)) + 1)],
                    }))
                  }
                >
                  Add Level
                </Button>
              </div>

              {form.levelPathRows.map((row) => (
                <div key={row.rowId} className="rounded-md border border-border-light p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-medium text-text-secondary">Level</label>
                      <Input
                        type="number"
                        value={String(row.level)}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            levelPathRows: f.levelPathRows.map((candidate) =>
                              candidate.rowId === row.rowId ? { ...candidate, level: Number(e.target.value || 2) } : candidate
                            ),
                          }))
                        }
                        className="w-20"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          levelPathRows: f.levelPathRows.length > 1 ? f.levelPathRows.filter((candidate) => candidate.rowId !== row.rowId) : [makeLevelRow(2)],
                        }))
                      }
                    >
                      Remove
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <Input value={row.feats} onChange={(e) => setForm((f) => ({ ...f, levelPathRows: f.levelPathRows.map((candidate) => candidate.rowId === row.rowId ? { ...candidate, feats: e.target.value } : candidate) }))} placeholder="Add feats (CSV)" />
                    <Input value={row.skills} onChange={(e) => setForm((f) => ({ ...f, levelPathRows: f.levelPathRows.map((candidate) => candidate.rowId === row.rowId ? { ...candidate, skills: e.target.value } : candidate) }))} placeholder="Add skills (CSV)" />
                    <Input value={row.powers} onChange={(e) => setForm((f) => ({ ...f, levelPathRows: f.levelPathRows.map((candidate) => candidate.rowId === row.rowId ? { ...candidate, powers: e.target.value } : candidate) }))} placeholder="Add powers (CSV)" />
                    <Input value={row.techniques} onChange={(e) => setForm((f) => ({ ...f, levelPathRows: f.levelPathRows.map((candidate) => candidate.rowId === row.rowId ? { ...candidate, techniques: e.target.value } : candidate) }))} placeholder="Add techniques (CSV)" />
                    <Input value={row.armaments} onChange={(e) => setForm((f) => ({ ...f, levelPathRows: f.levelPathRows.map((candidate) => candidate.rowId === row.rowId ? { ...candidate, armaments: e.target.value } : candidate) }))} placeholder="Add armaments (CSV)" />
                    <Input value={row.equipment} onChange={(e) => setForm((f) => ({ ...f, levelPathRows: f.levelPathRows.map((candidate) => candidate.rowId === row.rowId ? { ...candidate, equipment: e.target.value } : candidate) }))} placeholder="Add equipment (CSV)" />
                    <Input value={row.removeFeats} onChange={(e) => setForm((f) => ({ ...f, levelPathRows: f.levelPathRows.map((candidate) => candidate.rowId === row.rowId ? { ...candidate, removeFeats: e.target.value } : candidate) }))} placeholder="Remove feats (CSV)" />
                    <Input value={row.removePowers} onChange={(e) => setForm((f) => ({ ...f, levelPathRows: f.levelPathRows.map((candidate) => candidate.rowId === row.rowId ? { ...candidate, removePowers: e.target.value } : candidate) }))} placeholder="Remove powers (CSV)" />
                    <Input value={row.removeTechniques} onChange={(e) => setForm((f) => ({ ...f, levelPathRows: f.levelPathRows.map((candidate) => candidate.rowId === row.rowId ? { ...candidate, removeTechniques: e.target.value } : candidate) }))} placeholder="Remove techniques (CSV)" />
                    <Input value={row.removeArmaments} onChange={(e) => setForm((f) => ({ ...f, levelPathRows: f.levelPathRows.map((candidate) => candidate.rowId === row.rowId ? { ...candidate, removeArmaments: e.target.value } : candidate) }))} placeholder="Remove armaments (CSV)" />
                  </div>
                  <Input value={row.notes} onChange={(e) => setForm((f) => ({ ...f, levelPathRows: f.levelPathRows.map((candidate) => candidate.rowId === row.rowId ? { ...candidate, notes: e.target.value } : candidate) }))} placeholder="Level notes (optional)" />
                </div>
              ))}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Advanced Path JSON Override (optional)</label>
              <textarea
                value={form.advancedPathJson}
                onChange={(e) => setForm((f) => ({ ...f, advancedPathJson: e.target.value }))}
                placeholder="Optional: paste full path_data JSON to override builder output."
                className="w-full min-h-[120px] px-3 py-2 rounded-md border border-border bg-background text-text-primary font-mono text-xs"
                rows={6}
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
