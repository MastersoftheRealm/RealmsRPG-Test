/**
 * Admin Archetypes — save handler (TASK-617)
 */

import type { QueryClient } from '@tanstack/react-query';
import type { PowerPart } from '@/hooks/codex-types';
import type { LibraryItem, LibraryPower } from '@/types/library';
import type { CodexSkill, CodexEquipmentItem } from '@/types/codex';
import type { PathGuidanceGroup } from '@/types/archetype';
import {
  mergeFeatGuidanceGroups,
  parseArchetypePathData,
  pathHiddenFromPlayerPicker,
  parseOptionalJsonField,
  serializeLevel1LoadoutsField,
  unionFeatIdsFromGuidanceGroups,
  resolvePathGuidanceAudience,
} from '@/lib/game/archetype-path';
import { validatePathDataForPublish } from '@/lib/game/path-validation';
import { snapshotOfficialPowerForInnate } from '@/lib/game/innate-eligibility';
import {
  createItemTpResolver,
  trainingPointLimitFromRecommendedAbilities,
} from '@/lib/guided-creator/loadout-tp';
import type { ItemPropertyTpRow } from '@/lib/calculators/item-calc';
import {
  buildLevelPayload,
  dedupeStrings,
  isCodexSubSkill,
  serializeRecommendedAbilities,
  toCsv,
  type AdminArchetypeFormState,
  type PathSelectionKey,
  type SelectionOption,
} from './admin-archetype-path-form';
import { saveArchetypeWithPath } from './actions';
import { getUnknownSelectionsForLevel } from './admin-archetype-workspace-unknown-selections';
import type { ArchetypeItem } from './use-admin-archetype-workspace';

type OptionsByField = Partial<Record<PathSelectionKey | 'armaments' | 'equipment', SelectionOption[]>>;

export type SaveAdminArchetypeArgs = {
  form: AdminArchetypeFormState;
  editing: ArchetypeItem | null;
  optionsByField: OptionsByField;
  codexSkills: CodexSkill[];
  skillById: Map<string, CodexSkill>;
  officialPowers: LibraryPower[];
  officialItems: LibraryItem[];
  codexEquipment: CodexEquipmentItem[];
  itemProperties: ItemPropertyTpRow[];
  powerPartsDb: PowerPart[];
  queryClient: QueryClient;
  showToast: (message: string, variant: 'warning' | 'error' | 'success') => void;
  setSaving: (saving: boolean) => void;
  onSuccess: () => void;
};

export async function saveAdminArchetype({
  form,
  editing,
  optionsByField,
  codexSkills,
  skillById,
  officialPowers,
  officialItems,
  codexEquipment,
  itemProperties,
  powerPartsDb,
  queryClient,
  showToast,
  setSaving,
  onSuccess,
}: SaveAdminArchetypeArgs): Promise<void> {
  if (!form.name.trim()) return;

  const unknownFromLevel1 = getUnknownSelectionsForLevel(form.level1Path, 'Level 1 ', optionsByField);
  const unknownFromLevels = form.levelPathRows.flatMap((row) =>
    getUnknownSelectionsForLevel(row, `Level ${row.level} `, optionsByField)
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
    if (override.level1 && typeof override.level1 === 'object')
      level1Override = override.level1 as Record<string, unknown>;
    if (Array.isArray(override.levels)) {
      levelsOverride = override.levels.filter(
        (entry): entry is Record<string, unknown> => typeof entry === 'object' && entry !== null
      );
    }
  }

  const previewLevel1 =
    level1Override || (structuredPathData?.level1 as Record<string, unknown> | undefined) || {};
  const previewExistingLevel1 = editing ? parseArchetypePathData(editing.path_data)?.level1 : undefined;
  const previewAbilities =
    recommendedAbilitiesValue ?? previewExistingLevel1?.recommended_abilities;

  const pathForValidation = parseArchetypePathData({
    level1: {
      ...previewLevel1,
      ...(guidanceGroupsForSave.length > 0 ? { guidance_groups: guidanceGroupsForSave } : {}),
      ...(previewAbilities ? { recommended_abilities: previewAbilities } : {}),
      ...(form.guidedArmorStep ? { armorStep: form.guidedArmorStep } : {}),
      ...(form.guidedSharedEquipmentEntries.length
        ? { sharedEquipment: form.guidedSharedEquipmentEntries }
        : {}),
    },
  });
  if (pathForValidation?.level1) {
    const officialById = new Map(officialPowers.map((p) => [String(p.id ?? ''), p]));
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
        return snapshotOfficialPowerForInnate(power, powerPartsDb);
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
  const finalLevels =
    levelsOverride || (structuredPathData?.levels as Record<string, unknown>[] | undefined) || [];
  const existingLevel1 = previewExistingLevel1;
  const advancedGuidance =
    Array.isArray(finalLevel1.guidance_groups) && finalLevel1.guidance_groups.length > 0
      ? (finalLevel1.guidance_groups as PathGuidanceGroup[])
      : null;
  const preservedGuidanceGroups =
    advancedGuidance ?? (guidanceGroupsForSave.length > 0 ? guidanceGroupsForSave : null);
  const preservedRecommendedAbilities =
    recommendedAbilitiesValue ?? existingLevel1?.recommended_abilities ?? null;
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
    onSuccess();
  } else {
    showToast(result.error ?? 'Operation failed', 'error');
  }
}
