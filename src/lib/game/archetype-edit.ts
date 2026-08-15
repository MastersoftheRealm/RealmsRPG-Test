/**
 * Shared archetype path/forge edit helpers for Advanced creator + sheet Edit Archetype.
 */

import { calculateProficiency } from '@/lib/game/formulas';
import { parseArchetypePathData, pathHasPlayerVisibleLevel1 } from '@/lib/game/archetype-path';
import { applyPathProficiencyForLevel } from '@/lib/game/archetype-display';
import { resolvePathAbilityLabels } from '@/lib/game/path-ability-labels';
import type { AbilityName, Archetype, ArchetypeCategory, Character } from '@/types';

export const ARCHETYPE_ABILITY_OPTIONS: AbilityName[] = [
  'strength',
  'vitality',
  'agility',
  'acuity',
  'intelligence',
  'charisma',
];

export type PathCategoryGroup = 'power' | 'powered-martial' | 'martial';

export const PATH_CATEGORY_GROUPS: PathCategoryGroup[] = ['power', 'powered-martial', 'martial'];

export function pathCategoryGroupLabel(group: PathCategoryGroup): string {
  if (group === 'power') return 'Power Paths';
  if (group === 'martial') return 'Martial Paths';
  return 'Powered-Martial Paths';
}

/** Infer forge/path category from character type or proficiency split. */
export function inferArchetypeCategoryFromCharacter(c: Character): ArchetypeCategory {
  if (c.archetype?.type) return c.archetype.type;
  const mart = c.mart_prof ?? c.martialProficiency ?? 0;
  const pow = c.pow_prof ?? c.powerProficiency ?? 0;
  if (pow > 0 && mart === 0) return 'power';
  if (mart > 0 && pow === 0) return 'martial';
  if (mart > 0 && pow > 0) return 'powered-martial';
  return 'power';
}

/**
 * Default split when switching path **type**. Powered-Martial even-splits and
 * gives an odd remainder to Martial. This is not the level-up "+1 to either
 * Martial or Power Proficiency" pick (GAME_RULES every 5th level) — the player
 * reallocates afterward via the proficiency editors.
 */
export function redistributeProficiency(
  total: number,
  type: ArchetypeCategory,
): { mart_prof: number; pow_prof: number } {
  if (type === 'power') return { mart_prof: 0, pow_prof: total };
  if (type === 'martial') return { mart_prof: total, pow_prof: 0 };
  const half = Math.floor(total / 2);
  return { mart_prof: half + (total % 2), pow_prof: half };
}

/** Player-visible paths with parsed path_data; optionally exclude current path id. */
export function listPlayerVisiblePaths(
  codexArchetypes: Archetype[],
  options?: { excludeId?: string | null },
): Archetype[] {
  const excludeId = options?.excludeId ?? null;
  return (codexArchetypes ?? [])
    .map((archetype) => ({
      ...archetype,
      path_data: parseArchetypePathData(archetype.path_data),
    }))
    .filter((archetype) => pathHasPlayerVisibleLevel1(archetype.path_data))
    .filter((option) => (excludeId ? option.id !== excludeId : true));
}

export function groupPathsByCategory(paths: Archetype[]): Record<PathCategoryGroup, Archetype[]> {
  return {
    power: paths.filter((p) => p.type === 'power'),
    'powered-martial': paths.filter((p) => p.type === 'powered-martial'),
    martial: paths.filter((p) => p.type === 'martial'),
  };
}

export type PathSwitchEditResult = {
  archetype: { id: string; type: ArchetypeCategory };
  pow_abil?: AbilityName;
  mart_abil?: AbilityName;
  mart_prof: number;
  pow_prof: number;
  archetypePathId: string;
};

/** Build sheet path-switch save payload (redistribute + level-5 path proficiency floor). */
export function buildPathSwitchResult(path: Archetype, character: Character): PathSwitchEditResult {
  const type = path.type;
  const level = character.level || 1;
  const totalProf = calculateProficiency(level);
  const currentMart = character.mart_prof ?? character.martialProficiency ?? 0;
  const currentPow = character.pow_prof ?? character.powerProficiency ?? 0;
  const effectiveTotal = Math.min(currentMart + currentPow, totalProf);
  const { mart_prof, pow_prof } = redistributeProficiency(effectiveTotal, type);

  const labels = resolvePathAbilityLabels(path);
  // Legacy `ability` fallback matches prior sheet edit-archetype behavior.
  const legacyAbility = path.ability;
  const powAbil = type !== 'martial' ? (labels.powAbil ?? legacyAbility ?? undefined) : undefined;
  const martAbil = type !== 'power' ? (labels.martAbil ?? legacyAbility ?? undefined) : undefined;

  const base: PathSwitchEditResult = {
    archetype: { id: path.id, type },
    pow_abil: powAbil,
    mart_abil: martAbil,
    mart_prof,
    pow_prof,
    archetypePathId: path.id,
  };

  const profUpdate = applyPathProficiencyForLevel(
    {
      ...character,
      ...base,
      archetypePathId: path.id,
    },
    level,
    path,
  );

  return profUpdate ? { ...base, ...profUpdate } : base;
}

export function canSaveForgeAbilities(args: {
  selectedType: ArchetypeCategory;
  selectedPowerAbility: AbilityName | null;
  selectedMartialAbility: AbilityName | null;
}): boolean {
  const { selectedType, selectedPowerAbility, selectedMartialAbility } = args;
  if (selectedType === 'power') return Boolean(selectedPowerAbility);
  if (selectedType === 'martial') return Boolean(selectedMartialAbility);
  return Boolean(
    selectedPowerAbility &&
    selectedMartialAbility &&
    selectedPowerAbility !== selectedMartialAbility,
  );
}
