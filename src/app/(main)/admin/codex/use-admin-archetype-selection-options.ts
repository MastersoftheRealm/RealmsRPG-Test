/**
 * Admin Archetypes — selection option memos (TASK-609).
 * Co-located with use-admin-archetype-workspace; not a public barrel export.
 */

'use client';

import { useCallback, useMemo } from 'react';
import { getFeatLevel, formatFeatName } from '@/lib/leveled-feats';
import {
  armamentTypeOf,
  dedupeStrings,
  isCodexBaseSkill,
  isCodexSubSkill,
  isFeatOrientedGuidanceGroup,
  toLeveledFeatLike,
  type CodexFeatLike,
  type PathSelectionKey,
  type SelectionOption,
} from './admin-archetype-path-form';
import { validateLevel1Skills } from '@/lib/game/path-validation';
import {
  resolvePathGuidanceAudience,
  unionFeatIdsFromGuidanceGroups,
} from '@/lib/game/archetype-path';
import type { CodexSkill } from '@/types/codex';
import type { PathGuidanceGroup } from '@/types/archetype';

type OfficialItemLike = {
  id?: string | undefined;
  name?: string | undefined;
  type?: string | undefined;
};
type OfficialNamedLike = { id?: string | undefined; name?: string | undefined };

export type AdminArchetypeSelectionOptionsInput = {
  codexFeats: CodexFeatLike[];
  codexSkills: CodexSkill[];
  codexEquipment: Array<{ id?: string | undefined; name?: string | undefined }>;
  officialPowers: OfficialNamedLike[];
  officialTechniques: OfficialNamedLike[];
  officialItems: OfficialItemLike[];
  level1Skills: string[];
  guidanceGroups: PathGuidanceGroup[];
  isLoadingOfficialPowers: boolean;
  isLoadingOfficialTechniques: boolean;
  isLoadingOfficialItems: boolean;
};

export function useAdminArchetypeSelectionOptions({
  codexFeats,
  codexSkills,
  codexEquipment,
  officialPowers,
  officialTechniques,
  officialItems,
  level1Skills,
  guidanceGroups,
  isLoadingOfficialPowers,
  isLoadingOfficialTechniques,
  isLoadingOfficialItems,
}: AdminArchetypeSelectionOptionsInput) {
  const featById = useMemo(() => {
    const map = new Map<string, CodexFeatLike>();
    for (const feat of codexFeats) {
      if (feat.id != null && feat.id !== '') map.set(String(feat.id), feat);
    }
    return map;
  }, [codexFeats]);

  const featOptions = useMemo<SelectionOption[]>(
    () =>
      codexFeats
        .map((feat) => {
          const normalized = toLeveledFeatLike(feat);
          return {
            value: String(normalized.id),
            label: formatFeatName(normalized) || String(normalized.id),
          };
        })
        .filter((feat) => feat.value && feat.label)
        .sort((a, b) => a.label.localeCompare(b.label)),
    [codexFeats],
  );

  const getFeatOptionsForLevel = useCallback(
    (pathLevel: number): SelectionOption[] =>
      codexFeats
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
        .sort((a, b) => a.label.localeCompare(b.label)),
    [codexFeats],
  );

  const featOptionsLevel1 = useMemo(() => getFeatOptionsForLevel(1), [getFeatOptionsForLevel]);

  const characterFeatOptionsLevel1 = useMemo(
    () =>
      featOptionsLevel1.filter((opt) => {
        const feat = codexFeats.find((f) => String(f.id) === opt.value);
        return Boolean(feat?.char_feat);
      }),
    [featOptionsLevel1, codexFeats],
  );

  const archetypeFeatOptionsLevel1 = useMemo(
    () =>
      featOptionsLevel1.filter((opt) => {
        const feat = codexFeats.find((f) => String(f.id) === opt.value);
        return !feat?.char_feat;
      }),
    [featOptionsLevel1, codexFeats],
  );

  const allSkillOptions = useMemo<SelectionOption[]>(
    () =>
      codexSkills
        .map((skill) => ({
          value: String(skill.id ?? ''),
          label: String(skill.name ?? skill.id ?? ''),
        }))
        .filter((skill) => skill.value && skill.label)
        .sort((a, b) => a.label.localeCompare(b.label)),
    [codexSkills],
  );

  const baseSkillOptions = useMemo<SelectionOption[]>(
    () =>
      codexSkills
        .filter((skill) => isCodexBaseSkill(skill))
        .map((skill) => ({
          value: String(skill.id ?? ''),
          label: String(skill.name ?? skill.id ?? ''),
        }))
        .filter((skill) => skill.value && skill.label)
        .sort((a, b) => a.label.localeCompare(b.label)),
    [codexSkills],
  );

  const skillById = useMemo(() => {
    const map = new Map<string, CodexSkill>();
    for (const skill of codexSkills) {
      if (skill.id != null) map.set(String(skill.id), skill);
    }
    return map;
  }, [codexSkills]);

  const level1SkillPickerOptions = useMemo<SelectionOption[]>(() => {
    const byValue = new Map(baseSkillOptions.map((o) => [o.value, o]));
    for (const id of level1Skills) {
      if (byValue.has(id)) continue;
      const fromAll = allSkillOptions.find((o) => o.value === id);
      if (fromAll) byValue.set(id, fromAll);
      else byValue.set(id, { value: id, label: id });
    }
    return Array.from(byValue.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [baseSkillOptions, allSkillOptions, level1Skills]);

  const level1SkillIssues = useMemo(
    () =>
      validateLevel1Skills(level1Skills, {
        isSubSkill: (id) => {
          const skill = skillById.get(String(id));
          if (!skill) return null;
          return isCodexSubSkill(skill);
        },
      }),
    [level1Skills, skillById],
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
    [officialPowers],
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
    [officialTechniques],
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
    [officialItems],
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
    [officialItems],
  );

  const armamentOptions = useMemo<SelectionOption[]>(
    () =>
      dedupeStrings([
        ...weaponShieldArmamentOptions.map((o) => o.value),
        ...armorArmamentOptions.map((o) => o.value),
      ])
        .map(
          (id) =>
            weaponShieldArmamentOptions.find((o) => o.value === id) ??
            armorArmamentOptions.find((o) => o.value === id),
        )
        .filter((item): item is SelectionOption => Boolean(item))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [weaponShieldArmamentOptions, armorArmamentOptions],
  );

  const equipmentOptions = useMemo<SelectionOption[]>(() => {
    const codex = codexEquipment
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

    return dedupeStrings([
      ...codex.map((item) => item.value),
      ...official.map((item) => item.value),
    ])
      .map(
        (id) =>
          codex.find((item) => item.value === id) ?? official.find((item) => item.value === id),
      )
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
    [
      featOptions,
      allSkillOptions,
      powerOptions,
      techniqueOptions,
      armamentOptions,
      equipmentOptions,
    ],
  );

  const isSelectionDataLoading =
    isLoadingOfficialPowers || isLoadingOfficialTechniques || isLoadingOfficialItems;

  const characterFeatGroups = useMemo(
    () =>
      guidanceGroups.filter(
        (g) => isFeatOrientedGuidanceGroup(g) && resolvePathGuidanceAudience(g) === 'character',
      ),
    [guidanceGroups],
  );

  const archetypeFeatGroups = useMemo(
    () =>
      guidanceGroups.filter(
        (g) => isFeatOrientedGuidanceGroup(g) && resolvePathGuidanceAudience(g) === 'archetype',
      ),
    [guidanceGroups],
  );

  const syncedFeatPreviewLabels = useMemo(() => {
    const ids = unionFeatIdsFromGuidanceGroups(guidanceGroups);
    return ids.map((value) => featOptions.find((option) => option.value === value)?.label ?? value);
  }, [guidanceGroups, featOptions]);

  const filterLevel1WeaponShieldEntries = (armamentEntries: { id: string; quantity: number }[]) =>
    armamentEntries.filter((entry) => {
      const kind = armamentTypeOf(entry.id, armamentTypeById);
      return kind === 'weapon' || kind === 'shield' || kind === 'unknown';
    });

  const filterLevel1ArmorEntries = (armamentEntries: { id: string; quantity: number }[]) =>
    armamentEntries.filter((entry) => armamentTypeOf(entry.id, armamentTypeById) === 'armor');

  return {
    featById,
    featOptions,
    getFeatOptionsForLevel,
    featOptionsLevel1,
    characterFeatOptionsLevel1,
    archetypeFeatOptionsLevel1,
    skillById,
    level1SkillPickerOptions,
    level1SkillIssues,
    weaponShieldArmamentOptions,
    armorArmamentOptions,
    armamentOptions,
    filterLevel1WeaponShieldEntries,
    filterLevel1ArmorEntries,
    equipmentOptions,
    optionsByField: optionsByField as Partial<Record<PathSelectionKey, SelectionOption[]>>,
    isSelectionDataLoading,
    characterFeatGroups,
    archetypeFeatGroups,
    syncedFeatPreviewLabels,
  };
}
