'use client';

import { useCallback, useMemo, useState } from 'react';
import { SectionHeader, SearchInput, LoadingState, ErrorDisplay as ErrorState, GridListRow, ListEmptyState as EmptyState } from '@/components/shared';
import { Modal, Button, Input } from '@/components/ui';
import { ChipSelect } from '@/components/shared';
import { useCodexArchetypes, useCodexEquipment, useCodexFeats, useCodexSkills } from '@/hooks/use-codex';
import { useOfficialLibrary } from '@/hooks/use-public-library';
import { useQueryClient } from '@tanstack/react-query';
import { deleteCodexDoc, saveArchetypeWithPath } from './actions';
import { Pencil, Copy, X } from 'lucide-react';
import { IconButton } from '@/components/ui';
import { getFeatLevel, formatFeatName } from '@/lib/leveled-feats';

const COPY_NAME_SUFFIX = ' copy';
const ABILITY_OPTIONS = ['strength', 'vitality', 'agility', 'acuity', 'intelligence', 'charisma'] as const;

type PathItemEntry = { id: string; quantity: number };

type PathLevelForm = {
  rowId: string;
  level: number;
  feats: string[];
  skills: string[];
  powers: string[];
  techniques: string[];
  armaments: string[];
  equipment: string[];
  /** Level 1 only: armaments with quantity for path recommended gear */
  armamentEntries: PathItemEntry[];
  /** Level 1 only: equipment with quantity for path recommended gear */
  equipmentEntries: PathItemEntry[];
  /** Level 1 only: recommend Unarmed Prowess proficiency in equipment step */
  recommendUnarmedProwess: boolean;
  removeFeats: string[];
  removePowers: string[];
  removeTechniques: string[];
  removeArmaments: string[];
  notes: string;
};

function parseIdQuantityStrings(arr: string[]): PathItemEntry[] {
  return arr.map((s) => {
    const colon = s.indexOf(':');
    if (colon < 0) return { id: s.trim(), quantity: 1 };
    const id = s.slice(0, colon).trim();
    const q = parseInt(s.slice(colon + 1).trim(), 10);
    return { id, quantity: Number.isFinite(q) && q >= 1 ? q : 1 };
  }).filter((e) => e.id.length > 0);
}

function toIdQuantityStrings(entries: PathItemEntry[]): string[] {
  return entries.map((e) => (e.quantity > 1 ? `${e.id}:${e.quantity}` : e.id));
}

type SelectionOption = { value: string; label: string };

function toCsv(value: unknown): string {
  if (!Array.isArray(value)) return '';
  return value.map(String).filter(Boolean).join(', ');
}

function toSelectionArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry).trim()).filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);
  }
  return [];
}

function dedupeStrings(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function resolveSelectedValues(values: string[], options: SelectionOption[]): string[] {
  if (!values.length) return [];
  if (!options.length) return dedupeStrings(values);

  const byValue = new Map(options.map((opt) => [opt.value.toLowerCase(), opt.value]));
  const byLabel = new Map(options.map((opt) => [opt.label.toLowerCase(), opt.value]));

  return dedupeStrings(
    values.map((raw) => {
      const normalized = raw.toLowerCase();
      return byValue.get(normalized) || byLabel.get(normalized) || raw;
    })
  );
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
    feats: [],
    skills: [],
    powers: [],
    techniques: [],
    armaments: [],
    equipment: [],
    armamentEntries: [],
    equipmentEntries: [],
    recommendUnarmedProwess: false,
    removeFeats: [],
    removePowers: [],
    removeTechniques: [],
    removeArmaments: [],
    notes: '',
  };
}

function toLevelForm(
  raw: Record<string, unknown>,
  level = 2,
  optionsByKey?: Partial<Record<keyof Omit<PathLevelForm, 'rowId' | 'level' | 'notes'>, SelectionOption[]>>
): PathLevelForm {
  const rawArmaments = Array.isArray(raw.armaments) ? (raw.armaments as string[]).map(String) : toSelectionArray(raw.armaments);
  const rawEquipment = Array.isArray(raw.equipment) ? (raw.equipment as string[]).map(String) : toSelectionArray(raw.equipment);
  const armamentEntries = parseIdQuantityStrings(rawArmaments);
  const equipmentEntries = parseIdQuantityStrings(rawEquipment);
  return {
    rowId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    level: Number(raw.level ?? level) || level,
    feats: resolveSelectedValues(toSelectionArray(raw.feats), optionsByKey?.feats ?? []),
    skills: resolveSelectedValues(toSelectionArray(raw.skills), optionsByKey?.skills ?? []),
    powers: resolveSelectedValues(toSelectionArray(raw.powers), optionsByKey?.powers ?? []),
    techniques: resolveSelectedValues(toSelectionArray(raw.techniques), optionsByKey?.techniques ?? []),
    armaments: armamentEntries.map((e) => e.id),
    equipment: equipmentEntries.map((e) => e.id),
    armamentEntries,
    equipmentEntries,
    recommendUnarmedProwess: raw.recommendUnarmedProwess === true,
    removeFeats: resolveSelectedValues(toSelectionArray(raw.removeFeats), optionsByKey?.removeFeats ?? []),
    removePowers: resolveSelectedValues(toSelectionArray(raw.removePowers), optionsByKey?.removePowers ?? []),
    removeTechniques: resolveSelectedValues(toSelectionArray(raw.removeTechniques), optionsByKey?.removeTechniques ?? []),
    removeArmaments: resolveSelectedValues(toSelectionArray(raw.removeArmaments), optionsByKey?.removeArmaments ?? []),
    notes: typeof raw.notes === 'string' ? raw.notes : '',
  };
}

function buildLevelPayload(level: PathLevelForm, includeLevel: boolean): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  if (includeLevel) payload.level = level.level;
  const feats = dedupeStrings(level.feats);
  const skills = dedupeStrings(level.skills);
  const powers = dedupeStrings(level.powers);
  const techniques = dedupeStrings(level.techniques);
  const isLevel1 = !includeLevel;
  const armaments = isLevel1 && level.armamentEntries?.length
    ? toIdQuantityStrings(level.armamentEntries)
    : dedupeStrings(level.armaments);
  const equipment = isLevel1 && level.equipmentEntries?.length
    ? toIdQuantityStrings(level.equipmentEntries)
    : dedupeStrings(level.equipment);
  const removeFeats = dedupeStrings(level.removeFeats);
  const removePowers = dedupeStrings(level.removePowers);
  const removeTechniques = dedupeStrings(level.removeTechniques);
  const removeArmaments = dedupeStrings(level.removeArmaments);
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
  if (isLevel1 && (level as PathLevelForm).recommendUnarmedProwess) payload.recommendUnarmedProwess = true;
  return payload;
}

export function AdminArchetypesTab() {
  const { data: archetypes, isLoading, error } = useCodexArchetypes();
  const { data: codexFeats = [] } = useCodexFeats();
  const { data: codexSkills = [] } = useCodexSkills();
  const { data: codexEquipment = [] } = useCodexEquipment();
  const { data: officialPowers = [], isLoading: isLoadingOfficialPowers } = useOfficialLibrary('powers');
  const { data: officialTechniques = [], isLoading: isLoadingOfficialTechniques } = useOfficialLibrary('techniques');
  const { data: officialItems = [], isLoading: isLoadingOfficialItems } = useOfficialLibrary('items');
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

  type CodexFeatLike = { id?: string; name?: string; feat_lvl?: number; base_feat_id?: string; lvl_req?: number };
  const toLeveledFeatLike = (f: CodexFeatLike) => ({ ...f, id: f.id ?? '' });
  const featOptions = useMemo<SelectionOption[]>(
    () =>
      (codexFeats as CodexFeatLike[])
        .map((feat) => {
          const normalized = toLeveledFeatLike(feat);
          return {
            value: String(normalized.id),
            label: formatFeatName(normalized) || String(normalized.id),
          };
        })
        .filter((feat) => feat.value && feat.label)
        .sort((a, b) => a.label.localeCompare(b.label)),
    [codexFeats]
  );
  const getFeatOptionsForLevel = useCallback(
    (pathLevel: number): SelectionOption[] => {
      return (codexFeats as CodexFeatLike[])
        .filter((feat) => {
          const lvlReq = feat.lvl_req;
          if (lvlReq != null && lvlReq > pathLevel) return false;
          if (pathLevel === 1) return getFeatLevel(toLeveledFeatLike(feat)) === 1;
          return true;
        })
        .map((feat) => {
          const normalized = toLeveledFeatLike(feat);
          return {
            value: String(normalized.id),
            label: formatFeatName(normalized) || String(normalized.id),
          };
        })
        .filter((o) => o.value && o.label)
        .sort((a, b) => a.label.localeCompare(b.label));
    },
    [codexFeats]
  );
  const featOptionsLevel1 = useMemo(() => getFeatOptionsForLevel(1), [getFeatOptionsForLevel]);

  const skillOptions = useMemo<SelectionOption[]>(
    () =>
      (codexSkills as Array<{ id?: string; name?: string }>)
        .map((skill) => ({ value: String(skill.id ?? ''), label: String(skill.name ?? skill.id ?? '') }))
        .filter((skill) => skill.value && skill.label)
        .sort((a, b) => a.label.localeCompare(b.label)),
    [codexSkills]
  );

  const powerOptions = useMemo<SelectionOption[]>(
    () =>
      (officialPowers as Array<Record<string, unknown>>)
        .map((power) => ({
          value: String(power.id ?? ''),
          label: String(power.name ?? power.id ?? ''),
        }))
        .filter((power) => power.value && power.label)
        .sort((a, b) => a.label.localeCompare(b.label)),
    [officialPowers]
  );

  const techniqueOptions = useMemo<SelectionOption[]>(
    () =>
      (officialTechniques as Array<Record<string, unknown>>)
        .map((technique) => ({
          value: String(technique.id ?? ''),
          label: String(technique.name ?? technique.id ?? ''),
        }))
        .filter((technique) => technique.value && technique.label)
        .sort((a, b) => a.label.localeCompare(b.label)),
    [officialTechniques]
  );

  const armamentOptions = useMemo<SelectionOption[]>(
    () =>
      (officialItems as Array<Record<string, unknown>>)
        .filter((item) => {
          const type = String(item.type ?? '').toLowerCase();
          return type === 'weapon' || type === 'armor' || type === 'shield';
        })
        .map((item) => ({
          value: String(item.id ?? ''),
          label: String(item.name ?? item.id ?? ''),
        }))
        .filter((item) => item.value && item.label)
        .sort((a, b) => a.label.localeCompare(b.label)),
    [officialItems]
  );

  const equipmentOptions = useMemo<SelectionOption[]>(() => {
    const codex = (codexEquipment as Array<{ id?: string; name?: string }>)
      .map((item) => ({
        value: String(item.id ?? ''),
        label: `${String(item.name ?? item.id ?? '')} (Codex)`,
      }))
      .filter((item) => item.value && item.label);

    const official = (officialItems as Array<Record<string, unknown>>)
      .filter((item) => String(item.type ?? '').toLowerCase() === 'equipment')
      .map((item) => ({
        value: String(item.id ?? ''),
        label: `${String(item.name ?? item.id ?? '')} (Official)`,
      }))
      .filter((item) => item.value && item.label);

    return dedupeStrings([...codex.map((item) => item.value), ...official.map((item) => item.value)])
      .map((id) => codex.find((item) => item.value === id) ?? official.find((item) => item.value === id))
      .filter((item): item is SelectionOption => Boolean(item))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [codexEquipment, officialItems]);

  const optionsByField = useMemo(
    () => ({
      feats: featOptions,
      skills: skillOptions,
      powers: powerOptions,
      techniques: techniqueOptions,
      armaments: armamentOptions,
      equipment: equipmentOptions,
      removeFeats: featOptions,
      removePowers: powerOptions,
      removeTechniques: techniqueOptions,
      removeArmaments: armamentOptions,
    }),
    [featOptions, skillOptions, powerOptions, techniqueOptions, armamentOptions, equipmentOptions]
  );

  const isSelectionDataLoading =
    isLoadingOfficialPowers || isLoadingOfficialTechniques || isLoadingOfficialItems;

  type PathSelectionKey =
    | 'feats'
    | 'skills'
    | 'powers'
    | 'techniques'
    | 'armaments'
    | 'equipment'
    | 'removeFeats'
    | 'removePowers'
    | 'removeTechniques'
    | 'removeArmaments';

  const selectionFieldConfig: Array<{ key: PathSelectionKey; label: string; placeholder: string }> = [
    { key: 'feats', label: 'Feats', placeholder: 'Select recommended feats' },
    { key: 'skills', label: 'Skills', placeholder: 'Select recommended skills' },
    { key: 'powers', label: 'Powers', placeholder: 'Select recommended powers' },
    { key: 'techniques', label: 'Techniques', placeholder: 'Select recommended techniques' },
    { key: 'armaments', label: 'Armaments', placeholder: 'Select recommended armaments' },
    { key: 'equipment', label: 'Equipment', placeholder: 'Select recommended equipment' },
  ];

  const removeFieldConfig: Array<{ key: PathSelectionKey; label: string; placeholder: string }> = [
    { key: 'removeFeats', label: 'Remove Feats', placeholder: 'Select feats to remove at this level' },
    { key: 'removePowers', label: 'Remove Powers', placeholder: 'Select powers to remove at this level' },
    { key: 'removeTechniques', label: 'Remove Techniques', placeholder: 'Select techniques to remove at this level' },
    { key: 'removeArmaments', label: 'Remove Armaments', placeholder: 'Select armaments to remove at this level' },
  ];

  const getSelectedLabels = (values: string[], options: SelectionOption[]) =>
    values.map((value) => options.find((option) => option.value === value)?.label ?? value);

  function getUnknownSelectionsForLevel(levelForm: PathLevelForm, labelPrefix: string): string[] {
    const unknowns: string[] = [];

    const checkField = (key: PathSelectionKey, label: string) => {
      const options = optionsByField[key];
      const knownIds = new Set(options.map((opt) => opt.value));
      const ids = levelForm[key].filter(Boolean);
      const invalidIds = ids.filter((id) => !knownIds.has(id));
      if (invalidIds.length) {
        const prettyLabels = getSelectedLabels(invalidIds, options);
        unknowns.push(`${labelPrefix}${label}: ${prettyLabels.join(', ')}`);
      }
    };

    const checkEntries = (entries: PathItemEntry[], label: string) => {
      const options = entries.length && label === 'Armaments' ? optionsByField.armaments : optionsByField.equipment;
      if (!options) return;
      const knownIds = new Set(options.map((opt) => opt.value));
      const invalid = entries.filter((e) => !knownIds.has(e.id));
      if (invalid.length) {
        const pretty = invalid.map((e) => getSelectedLabels([e.id], options).join(', ') || e.id);
        unknowns.push(`${labelPrefix}${label}: ${pretty.join(', ')}`);
      }
    };

    checkField('feats', 'Feats');
    checkField('skills', 'Skills');
    checkField('powers', 'Powers');
    checkField('techniques', 'Techniques');
    if (levelForm.armamentEntries?.length) checkEntries(levelForm.armamentEntries, 'Armaments');
    else checkField('armaments', 'Armaments');
    if (levelForm.equipmentEntries?.length) checkEntries(levelForm.equipmentEntries, 'Equipment');
    else checkField('equipment', 'Equipment');
    checkField('removeFeats', 'Remove Feats');
    checkField('removePowers', 'Remove Powers');
    checkField('removeTechniques', 'Remove Techniques');
    checkField('removeArmaments', 'Remove Armaments');

    return unknowns;
  }

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
      .map((entry, index) => toLevelForm(entry, index + 2, optionsByField));

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
      level1Path: toLevelForm(rawLevel1, 1, optionsByField),
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
      .map((entry, index) => toLevelForm(entry, index + 2, optionsByField));

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
      level1Path: toLevelForm(rawLevel1, 1, optionsByField),
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

    const unknownFromLevel1 = getUnknownSelectionsForLevel(form.level1Path, 'Level 1 ');
    const unknownFromLevels = form.levelPathRows.flatMap((row) =>
      getUnknownSelectionsForLevel(row, `Level ${row.level} `)
    );
    const allUnknowns = [...unknownFromLevel1, ...unknownFromLevels];
    if (allUnknowns.length) {
      alert(
        'Some archetype path entries no longer match existing Codex/Official Library items. ' +
          'Please fix or remove these before saving:\n\n' +
          allUnknowns.join('\n')
      );
      return;
    }

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
      level1_recommend_unarmed_prowess: finalLevel1.recommendUnarmedProwess === true,
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
    const result = await deleteCodexDoc('codex_archetypes', id);
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ['gameData', 'archetypes'] });
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
    const result = await deleteCodexDoc('codex_archetypes', id);
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ['gameData', 'archetypes'] });
      queryClient.invalidateQueries({ queryKey: ['codex'] });
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
              <Button onClick={handleSave} disabled={saving || !form.name.trim() || isSelectionDataLoading}>
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
                Select existing codex and official library entries. No manual CSV input required.
              </p>
              {isSelectionDataLoading && (
                <p className="text-xs text-text-muted dark:text-text-secondary mt-1">
                  Loading official library options...
                </p>
              )}
            </div>

            <div className="rounded-md border border-border-light bg-surface-alt p-3 space-y-2">
              <h4 className="text-sm font-medium text-text-primary">Level 1 Recommendations</h4>
              <p className="text-xs text-text-muted dark:text-text-secondary">
                Only level 1 feats can be recommended at level 1. For each progression level, only feats with level requirement ≤ that level are shown.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {selectionFieldConfig.filter((f) => f.key !== 'armaments' && f.key !== 'equipment').map((field) => {
                  const options = field.key === 'feats' ? featOptionsLevel1 : optionsByField[field.key];
                  return (
                  <ChipSelect
                    key={`level1-${field.key}`}
                    label={field.label}
                    placeholder={field.placeholder}
                    options={options.map((option) => ({
                      value: option.value,
                      label: option.label,
                    }))}
                    selectedValues={form.level1Path[field.key]}
                    onSelect={(value) =>
                      setForm((prev) => ({
                        ...prev,
                        level1Path: {
                          ...prev.level1Path,
                          [field.key]: dedupeStrings([...prev.level1Path[field.key], value]),
                        },
                      }))
                    }
                    onRemove={(value) =>
                      setForm((prev) => ({
                        ...prev,
                        level1Path: {
                          ...prev.level1Path,
                          [field.key]: prev.level1Path[field.key].filter((entry) => entry !== value),
                        },
                      }))
                    }
                  />
                  );
                })}
              </div>
              {/* Level 1: Armaments & Equipment with quantity */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-border-light">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-text-secondary">Armaments (recommended qty)</label>
                  <ChipSelect
                    label="Add armament"
                    placeholder="Select armament"
                    options={armamentOptions.map((o) => ({ value: o.value, label: o.label }))}
                    selectedValues={[]}
                    onSelect={(value) => {
                      if (form.level1Path.armamentEntries.some((e) => e.id === value)) return;
                      setForm((prev) => ({
                        ...prev,
                        level1Path: {
                          ...prev.level1Path,
                          armamentEntries: [...prev.level1Path.armamentEntries, { id: value, quantity: 1 }],
                        },
                      }));
                    }}
                    onRemove={() => {}}
                  />
                  <div className="flex flex-wrap gap-2 mt-1">
                    {form.level1Path.armamentEntries.map((entry, idx) => {
                      const label = armamentOptions.find((o) => o.value === entry.id)?.label ?? entry.id;
                      return (
                        <div key={`${entry.id}-${idx}`} className="flex items-center gap-1 rounded-lg border border-border-light bg-surface px-2 py-1">
                          <span className="text-sm truncate max-w-[120px]">{label}</span>
                          <Input
                            type="number"
                            min={1}
                            value={String(entry.quantity)}
                            onChange={(e) => {
                              const q = Math.max(1, parseInt(e.target.value, 10) || 1);
                              setForm((prev) => ({
                                ...prev,
                                level1Path: {
                                  ...prev.level1Path,
                                  armamentEntries: prev.level1Path.armamentEntries.map((e, i) =>
                                    i === idx ? { ...e, quantity: q } : e
                                  ),
                                },
                              }));
                            }}
                            className="w-14 text-center"
                          />
                          <IconButton variant="ghost" size="sm" onClick={() => setForm((prev) => ({ ...prev, level1Path: { ...prev.level1Path, armamentEntries: prev.level1Path.armamentEntries.filter((_, i) => i !== idx) } }))} label="Remove armament">
                            <X className="w-4 h-4" />
                          </IconButton>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-text-secondary">Equipment (recommended qty)</label>
                  <ChipSelect
                    label="Add equipment"
                    placeholder="Select equipment"
                    options={equipmentOptions.map((o) => ({ value: o.value, label: o.label }))}
                    selectedValues={[]}
                    onSelect={(value) => {
                      if (form.level1Path.equipmentEntries.some((e) => e.id === value)) return;
                      setForm((prev) => ({
                        ...prev,
                        level1Path: {
                          ...prev.level1Path,
                          equipmentEntries: [...prev.level1Path.equipmentEntries, { id: value, quantity: 1 }],
                        },
                      }));
                    }}
                    onRemove={() => {}}
                  />
                  <div className="flex flex-wrap gap-2 mt-1">
                    {form.level1Path.equipmentEntries.map((entry, idx) => {
                      const label = equipmentOptions.find((o) => o.value === entry.id)?.label ?? entry.id;
                      return (
                        <div key={`${entry.id}-${idx}`} className="flex items-center gap-1 rounded-lg border border-border-light bg-surface px-2 py-1">
                          <span className="text-sm truncate max-w-[120px]">{label}</span>
                          <Input
                            type="number"
                            min={1}
                            value={String(entry.quantity)}
                            onChange={(e) => {
                              const q = Math.max(1, parseInt(e.target.value, 10) || 1);
                              setForm((prev) => ({
                                ...prev,
                                level1Path: {
                                  ...prev.level1Path,
                                  equipmentEntries: prev.level1Path.equipmentEntries.map((e, i) =>
                                    i === idx ? { ...e, quantity: q } : e
                                  ),
                                },
                              }));
                            }}
                            className="w-14 text-center"
                          />
                          <IconButton variant="ghost" size="sm" onClick={() => setForm((prev) => ({ ...prev, level1Path: { ...prev.level1Path, equipmentEntries: prev.level1Path.equipmentEntries.filter((_, i) => i !== idx) } }))} label="Remove equipment">
                            <X className="w-4 h-4" />
                          </IconButton>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              <label className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  checked={form.level1Path.recommendUnarmedProwess}
                  onChange={(e) => setForm((prev) => ({
                    ...prev,
                    level1Path: { ...prev.level1Path, recommendUnarmedProwess: e.target.checked },
                  }))}
                  className="rounded border-border"
                  aria-describedby="unarmed-prowess-desc"
                />
                <span className="text-sm font-medium text-text-primary">Recommend Unarmed Prowess</span>
              </label>
              <p id="unarmed-prowess-desc" className="text-xs text-text-muted dark:text-text-secondary mt-0.5">
                When enabled, the equipment step (choose a path) will show Unarmed Prowess in the simplified view so the player can add it.
              </p>
              {!!form.level1Path.feats.length && (
                <p className="text-xs text-text-secondary">
                  Selected Feats: {getSelectedLabels(form.level1Path.feats, featOptions).join(', ')}
                </p>
              )}
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectionFieldConfig.map((field) => {
                      const options = (field.key === 'feats' || field.key === 'removeFeats')
                        ? getFeatOptionsForLevel(row.level)
                        : optionsByField[field.key];
                      return (
                      <ChipSelect
                        key={`${row.rowId}-${field.key}`}
                        label={`Add ${field.label}`}
                        placeholder={field.placeholder}
                        options={options.map((option) => ({
                          value: option.value,
                          label: option.label,
                        }))}
                        selectedValues={row[field.key]}
                        onSelect={(value) =>
                          setForm((f) => ({
                            ...f,
                            levelPathRows: f.levelPathRows.map((candidate) =>
                              candidate.rowId === row.rowId
                                ? { ...candidate, [field.key]: dedupeStrings([...candidate[field.key], value]) }
                                : candidate
                            ),
                          }))
                        }
                        onRemove={(value) =>
                          setForm((f) => ({
                            ...f,
                            levelPathRows: f.levelPathRows.map((candidate) =>
                              candidate.rowId === row.rowId
                                ? { ...candidate, [field.key]: candidate[field.key].filter((entry) => entry !== value) }
                                : candidate
                            ),
                          }))
                        }
                      />
                      );
                    })}
                    {removeFieldConfig.map((field) => {
                      const options = (field.key === 'feats' || field.key === 'removeFeats')
                        ? getFeatOptionsForLevel(row.level)
                        : optionsByField[field.key];
                      return (
                      <ChipSelect
                        key={`${row.rowId}-${field.key}`}
                        label={field.label}
                        placeholder={field.placeholder}
                        options={options.map((option) => ({
                          value: option.value,
                          label: option.label,
                        }))}
                        selectedValues={row[field.key]}
                        onSelect={(value) =>
                          setForm((f) => ({
                            ...f,
                            levelPathRows: f.levelPathRows.map((candidate) =>
                              candidate.rowId === row.rowId
                                ? { ...candidate, [field.key]: dedupeStrings([...candidate[field.key], value]) }
                                : candidate
                            ),
                          }))
                        }
                        onRemove={(value) =>
                          setForm((f) => ({
                            ...f,
                            levelPathRows: f.levelPathRows.map((candidate) =>
                              candidate.rowId === row.rowId
                                ? { ...candidate, [field.key]: candidate[field.key].filter((entry) => entry !== value) }
                                : candidate
                            ),
                          }))
                        }
                      />
                      );
                    })}
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
