/**
 * Admin Archetypes — workspace hook (TASK-381 Phase 6c)
 * =====================================================
 * Owns list/modal state, option memos, guidance/armament mutators, and
 * open/save/delete. Presentational modal body stays in admin-archetype-editor;
 * list chrome + Modal shell stay in AdminArchetypesTab.
 */

'use client';

import { useCallback, useMemo, useState } from 'react';
import { useToast } from '@/components/ui';
import { useCodexArchetypes, useCodexEquipment, useCodexFeats, useCodexSkills, useCodexItemProperties, useCodexPowerParts } from '@/hooks/use-codex';
import { useOfficialLibrary } from '@/hooks/use-official-library';
import { useQueryClient } from '@tanstack/react-query';
import { deleteCodexDoc, saveArchetypeWithPath } from './actions';
import {
  COPY_NAME_SUFFIX,
  armamentTypeOf,
  buildLevelPayload,
  dedupeStrings,
  guidedAbilitiesFromPath,
  guidedEquipmentMetaFromPath,
  guidanceGroupsFromPathData,
  isCodexBaseSkill,
  isCodexSubSkill,
  isFeatOrientedGuidanceGroup,
  makeLevelRow,
  newFeatGuidanceGroup,
  serializeRecommendedAbilities,
  toCsv,
  toLevelForm,
  toLeveledFeatLike,
  toastLevel1SkillWarnings,
  type AdminArchetypeFormState,
  type CodexFeatLike,
  type PathLevelForm,
  type PathSelectionKey,
  type SelectionOption,
} from './admin-archetype-path-form';
import { getFeatLevel, formatFeatName } from '@/lib/leveled-feats';
import {
  parseArchetypePathData,
  pathHiddenFromPlayerPicker,
  serializeLevel1LoadoutsField,
  coerceJsonRecord,
  parseOptionalJsonField,
  filterFeatGuidanceGroups,
  mergeFeatGuidanceGroups,
  unionFeatIdsFromGuidanceGroups,
  resolvePathGuidanceAudience,
} from '@/lib/game/archetype-path';
import { validateLevel1Skills, validatePathDataForPublish } from '@/lib/game/path-validation';
import { snapshotOfficialPowerForInnate } from '@/lib/game/innate-eligibility';
import {
  createItemTpResolver,
  trainingPointLimitFromRecommendedAbilities,
} from '@/lib/guided-creator/loadout-tp';
import { LAYER1_GOVERNANCE } from '@/lib/constants/creator-layer-governance';
import type { PowerPart } from '@/hooks/codex-types';
import type { LibraryPower } from '@/types/library';
import type { CodexSkill, CodexArchetype } from '@/types/codex';
import type {
  PathGuidanceAudience,
  PathGuidanceGroup,
  PathItemRecommendation,
} from '@/types/archetype';

export type ArchetypeItem = CodexArchetype;

export function useAdminArchetypeWorkspace() {
  const { showToast } = useToast();
  const { data: archetypes, isLoading, error, refetch } = useCodexArchetypes();
  const { data: codexFeats = [] } = useCodexFeats();
  const { data: codexSkills = [] } = useCodexSkills();
  const { data: codexEquipment = [] } = useCodexEquipment();
  const { data: powerPartsDb = [] } = useCodexPowerParts();
  const { data: officialPowers = [], isLoading: isLoadingOfficialPowers } = useOfficialLibrary('powers');
  const { data: officialTechniques = [], isLoading: isLoadingOfficialTechniques } = useOfficialLibrary('techniques');
  const { data: officialItems = [], isLoading: isLoadingOfficialItems } = useOfficialLibrary('items');
  const { data: itemProperties = [] } = useCodexItemProperties();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ArchetypeItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [copySourceName, setCopySourceName] = useState<string | null>(null);

  const [form, setForm] = useState<AdminArchetypeFormState>({
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
    guidedRecommendedAbilities: {},
    guidedArmorStep: '',
    guidedSharedEquipmentEntries: [],
    /** Level 1 guidance groups (feat groups authored here; others preserved). */
    guidanceGroups: [],
  });

  const filtered = (archetypes || []).filter(
    (a: ArchetypeItem) =>
      !search ||
      (a.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (a.description || '').toLowerCase().includes(search.toLowerCase())
  );

  const featById = useMemo(() => {
    const map = new Map<string, CodexFeatLike>();
    for (const feat of codexFeats as CodexFeatLike[]) {
      if (feat.id != null && feat.id !== '') map.set(String(feat.id), feat);
    }
    return map;
  }, [codexFeats]);

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
  const characterFeatOptionsLevel1 = useMemo(
    () =>
      featOptionsLevel1.filter((opt) => {
        const feat = (codexFeats as CodexFeatLike[]).find((f) => String(f.id) === opt.value);
        return Boolean(feat?.char_feat);
      }),
    [featOptionsLevel1, codexFeats]
  );
  const archetypeFeatOptionsLevel1 = useMemo(
    () =>
      featOptionsLevel1.filter((opt) => {
        const feat = (codexFeats as CodexFeatLike[]).find((f) => String(f.id) === opt.value);
        return !feat?.char_feat;
      }),
    [featOptionsLevel1, codexFeats]
  );

  const allSkillOptions = useMemo<SelectionOption[]>(
    () =>
      (codexSkills as CodexSkill[])
        .map((skill) => ({ value: String(skill.id ?? ''), label: String(skill.name ?? skill.id ?? '') }))
        .filter((skill) => skill.value && skill.label)
        .sort((a, b) => a.label.localeCompare(b.label)),
    [codexSkills]
  );

  const baseSkillOptions = useMemo<SelectionOption[]>(
    () =>
      (codexSkills as CodexSkill[])
        .filter((skill) => isCodexBaseSkill(skill))
        .map((skill) => ({ value: String(skill.id ?? ''), label: String(skill.name ?? skill.id ?? '') }))
        .filter((skill) => skill.value && skill.label)
        .sort((a, b) => a.label.localeCompare(b.label)),
    [codexSkills]
  );

  const skillById = useMemo(() => {
    const map = new Map<string, CodexSkill>();
    for (const skill of codexSkills as CodexSkill[]) {
      if (skill.id != null) map.set(String(skill.id), skill);
    }
    return map;
  }, [codexSkills]);

  /** Picker options: base skills + any legacy-selected ids (so chips keep labels). */
  const level1SkillPickerOptions = useMemo<SelectionOption[]>(() => {
    const selected = form.level1Path.skills;
    const byValue = new Map(baseSkillOptions.map((o) => [o.value, o]));
    for (const id of selected) {
      if (byValue.has(id)) continue;
      const fromAll = allSkillOptions.find((o) => o.value === id);
      if (fromAll) byValue.set(id, fromAll);
      else byValue.set(id, { value: id, label: id });
    }
    return Array.from(byValue.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [baseSkillOptions, allSkillOptions, form.level1Path.skills]);

  const level1SkillIssues = useMemo(
    () =>
      validateLevel1Skills(form.level1Path.skills, {
        isSubSkill: (id) => {
          const skill = skillById.get(String(id));
          if (!skill) return null;
          return isCodexSubSkill(skill);
        },
      }),
    [form.level1Path.skills, skillById]
  );

  const powerOptions = useMemo<SelectionOption[]>(
    () =>
      officialPowers
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
      officialTechniques
        .map((technique) => ({
          value: String(technique.id ?? ''),
          label: String(technique.name ?? technique.id ?? ''),
        }))
        .filter((technique) => technique.value && technique.label)
        .sort((a, b) => a.label.localeCompare(b.label)),
    [officialTechniques]
  );

  const armamentTypeById = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of officialItems) {
      const id = String(item.id ?? '');
      if (id) map.set(id, String(item.type ?? '').toLowerCase());
    }
    return map;
  }, [officialItems]);

  const weaponShieldArmamentOptions = useMemo<SelectionOption[]>(
    () =>
      officialItems
        .filter((item) => {
          const type = String(item.type ?? '').toLowerCase();
          return type === 'weapon' || type === 'shield';
        })
        .map((item) => ({
          value: String(item.id ?? ''),
          label: String(item.name ?? item.id ?? ''),
        }))
        .filter((item) => item.value && item.label)
        .sort((a, b) => a.label.localeCompare(b.label)),
    [officialItems]
  );

  const armorArmamentOptions = useMemo<SelectionOption[]>(
    () =>
      officialItems
        .filter((item) => String(item.type ?? '').toLowerCase() === 'armor')
        .map((item) => ({
          value: String(item.id ?? ''),
          label: String(item.name ?? item.id ?? ''),
        }))
        .filter((item) => item.value && item.label)
        .sort((a, b) => a.label.localeCompare(b.label)),
    [officialItems]
  );

  /** Combined for labels / unknown checks / remove-armaments (single storage pool). */
  const armamentOptions = useMemo<SelectionOption[]>(
    () =>
      dedupeStrings([
        ...weaponShieldArmamentOptions.map((o) => o.value),
        ...armorArmamentOptions.map((o) => o.value),
      ])
        .map(
          (id) =>
            weaponShieldArmamentOptions.find((o) => o.value === id) ??
            armorArmamentOptions.find((o) => o.value === id)
        )
        .filter((item): item is SelectionOption => Boolean(item))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [weaponShieldArmamentOptions, armorArmamentOptions]
  );

  const level1WeaponShieldEntries = useMemo(
    () =>
      form.level1Path.armamentEntries.filter((entry) => {
        const kind = armamentTypeOf(entry.id, armamentTypeById);
        return kind === 'weapon' || kind === 'shield' || kind === 'unknown';
      }),
    [form.level1Path.armamentEntries, armamentTypeById]
  );

  const level1ArmorEntries = useMemo(
    () =>
      form.level1Path.armamentEntries.filter(
        (entry) => armamentTypeOf(entry.id, armamentTypeById) === 'armor'
      ),
    [form.level1Path.armamentEntries, armamentTypeById]
  );

  const equipmentOptions = useMemo<SelectionOption[]>(() => {
    const codex = (codexEquipment as Array<{ id?: string; name?: string }>)
      .map((item) => ({
        value: String(item.id ?? ''),
        label: `${String(item.name ?? item.id ?? '')} (Codex)`,
      }))
      .filter((item) => item.value && item.label);

    const official = officialItems
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
      skills: allSkillOptions,
      powers: powerOptions,
      innatePowers: powerOptions,
      techniques: techniqueOptions,
      armaments: armamentOptions,
      equipment: equipmentOptions,
      removeFeats: featOptions,
      removePowers: powerOptions,
      removeTechniques: techniqueOptions,
      removeArmaments: armamentOptions,
    }),
    [featOptions, allSkillOptions, powerOptions, techniqueOptions, armamentOptions, equipmentOptions]
  );

  const isSelectionDataLoading =
    isLoadingOfficialPowers || isLoadingOfficialTechniques || isLoadingOfficialItems;

  const characterFeatGroups = useMemo(
    () =>
      form.guidanceGroups.filter(
        (g) => isFeatOrientedGuidanceGroup(g) && resolvePathGuidanceAudience(g) === 'character'
      ),
    [form.guidanceGroups]
  );
  const archetypeFeatGroups = useMemo(
    () =>
      form.guidanceGroups.filter(
        (g) => isFeatOrientedGuidanceGroup(g) && resolvePathGuidanceAudience(g) === 'archetype'
      ),
    [form.guidanceGroups]
  );
  const syncedFeatPreviewLabels = useMemo(() => {
    const ids = unionFeatIdsFromGuidanceGroups(form.guidanceGroups);
    return ids.map((value) => featOptions.find((option) => option.value === value)?.label ?? value);
  }, [form.guidanceGroups, featOptions]);

  const updateFeatGuidanceGroup = (
    groupId: string,
    patch: Partial<Pick<PathGuidanceGroup, 'title' | 'why' | 'feats'>>
  ) => {
    setForm((prev) => ({
      ...prev,
      guidanceGroups: prev.guidanceGroups.map((g) =>
        g.id === groupId
          ? {
              ...g,
              ...patch,
              audience: resolvePathGuidanceAudience(g),
            }
          : g
      ),
    }));
  };

  const addFeatGuidanceGroup = (audience: PathGuidanceAudience) => {
    const current = filterFeatGuidanceGroups(form.guidanceGroups, audience);
    if (current.length >= LAYER1_GOVERNANCE.maxGroupsPerStep) {
      showToast(
        `At most ${LAYER1_GOVERNANCE.maxGroupsPerStep} ${audience} feat groups (Layer 1 governance).`,
        'warning'
      );
      return;
    }
    setForm((prev) => ({
      ...prev,
      guidanceGroups: [...prev.guidanceGroups, newFeatGuidanceGroup(audience)],
    }));
  };

  const removeFeatGuidanceGroup = (groupId: string) => {
    setForm((prev) => ({
      ...prev,
      guidanceGroups: prev.guidanceGroups.filter((g) => g.id !== groupId),
    }));
  };

  const addLevel1Armament = (value: string) => {
    setForm((prev) => {
      if (prev.level1Path.armamentEntries.some((e) => e.id === value)) return prev;
      return {
        ...prev,
        level1Path: {
          ...prev.level1Path,
          armamentEntries: [...prev.level1Path.armamentEntries, { id: value, quantity: 1 }],
        },
      };
    });
  };

  const updateLevel1ArmamentQty = (id: string, quantity: number) => {
    setForm((prev) => ({
      ...prev,
      level1Path: {
        ...prev.level1Path,
        armamentEntries: prev.level1Path.armamentEntries.map((e) =>
          e.id === id ? { ...e, quantity } : e
        ),
      },
    }));
  };

  const removeLevel1Armament = (id: string) => {
    setForm((prev) => ({
      ...prev,
      level1Path: {
        ...prev.level1Path,
        armamentEntries: prev.level1Path.armamentEntries.filter((e) => e.id !== id),
      },
    }));
  };

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

    const checkEntries = (entries: PathItemRecommendation[], label: string) => {
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
    checkField('innatePowers', 'Innate Powers');
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
      guidedRecommendedAbilities: {},
      guidedArmorStep: '',
      guidedSharedEquipmentEntries: [],
      guidanceGroups: [],
    });
    setModalOpen(true);
  };

  const openDuplicate = (a: ArchetypeItem) => {
    const parsedPath = coerceJsonRecord(a.path_data);
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
    const equipmentMeta = guidedEquipmentMetaFromPath(a.path_data);
    const level1Path = toLevelForm(rawLevel1, 1, optionsByField);
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
      level1Path,
      levelPathRows: levelRows.length ? levelRows : [makeLevelRow(2)],
      advancedPathJson: '',
      guidedRecommendedAbilities: guidedAbilitiesFromPath(a.path_data),
      guidedArmorStep: equipmentMeta.armorStep,
      guidedSharedEquipmentEntries: equipmentMeta.sharedEquipmentEntries,
      guidanceGroups: guidanceGroupsFromPathData(a.path_data, level1Path.feats),
    });
    toastLevel1SkillWarnings(level1Path.skills, codexSkills as CodexSkill[], showToast);
    setModalOpen(true);
  };

  const openEdit = (a: ArchetypeItem) => {
    const parsedPath = coerceJsonRecord(a.path_data);
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
    const equipmentMeta = guidedEquipmentMetaFromPath(a.path_data);
    const level1Path = toLevelForm(rawLevel1, 1, optionsByField);
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
      level1Path,
      levelPathRows: levelRows.length ? levelRows : [makeLevelRow(2)],
      advancedPathJson: '',
      guidedRecommendedAbilities: guidedAbilitiesFromPath(a.path_data),
      guidedArmorStep: equipmentMeta.armorStep,
      guidedSharedEquipmentEntries: equipmentMeta.sharedEquipmentEntries,
      guidanceGroups: guidanceGroupsFromPathData(a.path_data, level1Path.feats),
    });
    toastLevel1SkillWarnings(level1Path.skills, codexSkills as CodexSkill[], showToast);
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
      showToast(
        'Some archetype path entries no longer match existing Codex/Official Library items. ' +
          'Please fix or remove these before saving: ' +
          allUnknowns.join('; '),
        'error'
      );
      return;
    }

    const featGroupsForSave: PathGuidanceGroup[] = form.guidanceGroups
      .filter((g) => (g.feats?.length ?? 0) > 0)
      .map((g) => {
        const audience = resolvePathGuidanceAudience(g);
        const feats = dedupeStrings(g.feats ?? []);
        const why = g.why?.trim();
        return {
          id: g.id,
          title: g.title.trim() || (audience === 'character' ? 'Character feats' : 'Archetype feats'),
          audience,
          ...(why ? { why } : {}),
          feats,
        };
      });
    const nonFeatGroups = form.guidanceGroups.filter(
      (g) =>
        !(g.feats?.length) &&
        ((g.powers?.length ?? 0) > 0 ||
          (g.techniques?.length ?? 0) > 0 ||
          (g.armaments?.length ?? 0) > 0 ||
          (g.equipment?.length ?? 0) > 0 ||
          (g.innatePowers?.length ?? 0) > 0)
    );
    const guidanceGroupsForSave = mergeFeatGuidanceGroups(nonFeatGroups, featGroupsForSave);
    const syncedFeats = unionFeatIdsFromGuidanceGroups(guidanceGroupsForSave);

    const level1Payload = buildLevelPayload(
      {
        ...form.level1Path,
        feats: syncedFeats.length > 0 ? syncedFeats : form.level1Path.feats,
      },
      false
    );
    if (guidanceGroupsForSave.length > 0) {
      level1Payload.guidance_groups = guidanceGroupsForSave;
    }
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

    if (structuredPathData && pathHiddenFromPlayerPicker(parseArchetypePathData(structuredPathData))) {
      showToast(
        'Level 1 has notes, remove lists, or Unarmed Prowess only; no add recommendations. ' +
          'This path will not appear in the character creator picker or public codex path list until you add level 1 feats, skills, powers, innate powers, techniques, armaments, or equipment.',
        'warning'
      );
    }

    const recommendedAbilitiesValue = serializeRecommendedAbilities(form.guidedRecommendedAbilities);

    let level1Override: Record<string, unknown> | undefined;
    let levelsOverride: Record<string, unknown>[] | undefined;
    if (form.advancedPathJson.trim()) {
      const advancedParse = parseOptionalJsonField(form.advancedPathJson, 'Advanced Path JSON');
      if (!advancedParse.ok) {
        showToast(advancedParse.error, 'error');
        return;
      }
      const override = (advancedParse.value ?? {}) as Record<string, unknown>;
      if (override.level1 && typeof override.level1 === 'object') level1Override = override.level1 as Record<string, unknown>;
      if (Array.isArray(override.levels)) {
        levelsOverride = override.levels.filter(
          (entry): entry is Record<string, unknown> => typeof entry === 'object' && entry !== null
        );
      }
    }

    const previewLevel1 = level1Override || (structuredPathData?.level1 as Record<string, unknown> | undefined) || {};
    const previewExistingLevel1 = editing ? parseArchetypePathData(editing.path_data)?.level1 : undefined;
    const previewAbilities =
      recommendedAbilitiesValue ?? previewExistingLevel1?.recommended_abilities;

    const pathForValidation = parseArchetypePathData({
      level1: {
        ...previewLevel1,
        ...(guidanceGroupsForSave.length > 0
          ? { guidance_groups: guidanceGroupsForSave }
          : {}),
        ...(previewAbilities ? { recommended_abilities: previewAbilities } : {}),
        ...(form.guidedArmorStep ? { armorStep: form.guidedArmorStep } : {}),
        ...(form.guidedSharedEquipmentEntries.length
          ? { sharedEquipment: form.guidedSharedEquipmentEntries }
          : {}),
      },
    });
    if (pathForValidation?.level1) {
      const officialById = new Map(
        (officialPowers as LibraryPower[]).map((p) => [String(p.id ?? ''), p])
      );
      const publishIssues = validatePathDataForPublish(pathForValidation, {
        resolveItemTrainingPoints: createItemTpResolver(
          officialItems,
          codexEquipment,
          itemProperties
        ),
        trainingPointLimit: trainingPointLimitFromRecommendedAbilities(previewAbilities),
        archetypeType: form.type,
        powerProfStart: form.powerProfStart,
        martialProfStart: form.martialProfStart,
        isSubSkill: (skillId) => {
          const skill = skillById.get(String(skillId));
          if (!skill) return null;
          return isCodexSubSkill(skill);
        },
        resolveInnatePower: (powerId) => {
          const power = officialById.get(powerId);
          if (!power) return null;
          return snapshotOfficialPowerForInnate(power, powerPartsDb as PowerPart[]);
        },
      });
      const publishErrors = publishIssues.filter((i) => i.severity === 'error');
      if (publishErrors.length > 0) {
        showToast(publishErrors.map((i) => i.message).join(' '), 'error');
        return;
      }
      const publishWarnings = publishIssues.filter((i) => i.severity === 'warning');
      if (publishWarnings.length > 0) {
        showToast(
          `Layer 1 governance: ${publishWarnings.map((i) => i.message).join(' ')}`,
          'warning'
        );
      }
    }

    setSaving(true);
    const finalLevel1 = previewLevel1;
    const finalLevels = levelsOverride || (structuredPathData?.levels as Record<string, unknown>[] | undefined) || [];
    const existingLevel1 = previewExistingLevel1;
    const advancedGuidance =
      Array.isArray(finalLevel1.guidance_groups) && finalLevel1.guidance_groups.length > 0
        ? (finalLevel1.guidance_groups as PathGuidanceGroup[])
        : null;
    const preservedGuidanceGroups =
      advancedGuidance ?? (guidanceGroupsForSave.length > 0 ? guidanceGroupsForSave : null);
    const preservedRecommendedAbilities =
      recommendedAbilitiesValue ??
      existingLevel1?.recommended_abilities ??
      null;
    // Kits removed from live DB (TASK-442). Persist armorStep + recommended gear only.
    const preservedLoadouts = serializeLevel1LoadoutsField({
      armorStep: form.guidedArmorStep || undefined,
      sharedEquipment: form.guidedSharedEquipmentEntries.length
        ? form.guidedSharedEquipmentEntries
        : undefined,
    });

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
      level1_innate_powers: toCsv(finalLevel1.innatePowers),
      level1_techniques: toCsv(finalLevel1.techniques),
      level1_armaments: toCsv(finalLevel1.armaments),
      level1_equipment: toCsv(finalLevel1.equipment),
      level1_recommend_unarmed_prowess: finalLevel1.recommendUnarmedProwess === true,
      level1_remove_feats: toCsv(finalLevel1.removeFeats),
      level1_remove_powers: toCsv(finalLevel1.removePowers),
      level1_remove_techniques: toCsv(finalLevel1.removeTechniques),
      level1_remove_armaments: toCsv(finalLevel1.removeArmaments),
      level1_notes: typeof finalLevel1.notes === 'string' ? finalLevel1.notes : undefined,
      level1_guidance_groups: preservedGuidanceGroups,
      level1_recommended_abilities: preservedRecommendedAbilities,
      level1_loadouts: preservedLoadouts,
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
      await queryClient.refetchQueries({ queryKey: ['gameData', 'archetypes'] });
      await queryClient.refetchQueries({ queryKey: ['codex'] });
      closeModal();
    } else {
      showToast(result.error ?? 'Operation failed', 'error');
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
      await queryClient.refetchQueries({ queryKey: ['gameData', 'archetypes'] });
      await queryClient.refetchQueries({ queryKey: ['codex'] });
      closeModal();
    } else {
      showToast(result.error ?? 'Operation failed', 'error');
    }
  };

  const handleInlineDelete = async (id: string) => {
    if (pendingDeleteId !== id) {
      setPendingDeleteId(id);
      return;
    }
    const result = await deleteCodexDoc('codex_archetypes', id);
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ['gameData', 'archetypes'] });
      queryClient.invalidateQueries({ queryKey: ['codex'] });
      await queryClient.refetchQueries({ queryKey: ['gameData', 'archetypes'] });
      await queryClient.refetchQueries({ queryKey: ['codex'] });
      setPendingDeleteId(null);
    } else {
      showToast(result.error ?? 'Operation failed', 'error');
      setPendingDeleteId(null);
    }
  };


  return {
    showToast,
    isLoading,
    error,
    refetch,
    search,
    setSearch,
    modalOpen,
    editing,
    saving,
    deleteConfirm,
    pendingDeleteId,
    setPendingDeleteId,
    copySourceName,
    form,
    setForm,
    filtered,
    featById,
    featOptionsLevel1,
    characterFeatOptionsLevel1,
    archetypeFeatOptionsLevel1,
    level1SkillPickerOptions,
    skillById,
    level1SkillIssues,
    weaponShieldArmamentOptions,
    armorArmamentOptions,
    armamentOptions,
    equipmentOptions,
    optionsByField,
    isSelectionDataLoading,
    characterFeatGroups,
    archetypeFeatGroups,
    syncedFeatPreviewLabels,
    level1WeaponShieldEntries,
    level1ArmorEntries,
    getFeatOptionsForLevel,
    updateFeatGuidanceGroup,
    addFeatGuidanceGroup,
    removeFeatGuidanceGroup,
    addLevel1Armament,
    updateLevel1ArmamentQty,
    removeLevel1Armament,
    openAdd,
    openDuplicate,
    openEdit,
    closeModal,
    handleSave,
    handleDelete,
    handleInlineDelete,
  };
}
