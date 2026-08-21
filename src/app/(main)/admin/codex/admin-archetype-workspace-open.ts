/**
 * Admin Archetypes — modal open/close helpers (TASK-617)
 */

import type { CodexSkill } from '@/types/codex';
import { coerceJsonRecord } from '@/lib/game/archetype-path';
import { COPY_NAME_SUFFIX } from './admin-codex-copy-suffix';
import {
  guidedAbilitiesFromPath,
  guidedEquipmentMetaFromPath,
  guidanceGroupsFromPathData,
  makeLevelRow,
  toastLevel1SkillWarnings,
  toLevelForm,
  type AdminArchetypeFormState,
  type ArchetypeItem,
  type PathSelectionKey,
  type SelectionOption,
} from './admin-archetype-path-form';

export const EMPTY_ARCHETYPE_FORM: AdminArchetypeFormState = {
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
};

type OptionsByField = Partial<
  Record<PathSelectionKey | 'armaments' | 'equipment', SelectionOption[]>
>;

function pathRowsFromArchetype(
  a: ArchetypeItem,
  optionsByField: OptionsByField,
): { level1Path: ReturnType<typeof toLevelForm>; levelPathRows: ReturnType<typeof toLevelForm>[] } {
  const parsedPath = coerceJsonRecord(a.path_data);
  const rawLevel1 =
    parsedPath && typeof parsedPath.level1 === 'object' && parsedPath.level1 !== null
      ? (parsedPath.level1 as Record<string, unknown>)
      : {};
  const rawLevels = Array.isArray(parsedPath?.levels) ? (parsedPath?.levels as unknown[]) : [];
  const levelRows = rawLevels
    .filter(
      (entry): entry is Record<string, unknown> => typeof entry === 'object' && entry !== null,
    )
    .map((entry, index) => toLevelForm(entry, index + 2, optionsByField));
  const level1Path = toLevelForm(rawLevel1, 1, optionsByField);
  return {
    level1Path,
    levelPathRows: levelRows.length ? levelRows : [makeLevelRow(2)],
  };
}

export function buildArchetypeFormFromItem(
  a: ArchetypeItem,
  optionsByField: OptionsByField,
): AdminArchetypeFormState {
  const equipmentMeta = guidedEquipmentMetaFromPath(a.path_data);
  const { level1Path, levelPathRows } = pathRowsFromArchetype(a, optionsByField);
  return {
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
    levelPathRows,
    advancedPathJson: '',
    guidedRecommendedAbilities: guidedAbilitiesFromPath(a.path_data),
    guidedArmorStep: equipmentMeta.armorStep,
    guidedSharedEquipmentEntries: equipmentMeta.sharedEquipmentEntries,
    guidanceGroups: guidanceGroupsFromPathData(a.path_data, level1Path.feats),
  };
}

export function buildDuplicateArchetypeForm(
  a: ArchetypeItem,
  optionsByField: OptionsByField,
): AdminArchetypeFormState {
  const base = buildArchetypeFormFromItem(a, optionsByField);
  return {
    ...base,
    name: ((a.name || '').trim() || 'Archetype') + COPY_NAME_SUFFIX,
  };
}

export function toastLevel1SkillsFromForm(
  form: AdminArchetypeFormState,
  codexSkills: CodexSkill[],
  showToast: (message: string, variant: 'warning' | 'error' | 'success') => void,
) {
  toastLevel1SkillWarnings(form.level1Path.skills, codexSkills, showToast);
}
