/**
 * Admin archetype path form helpers (TASK-381 Phase 6a).
 * Pure mappers/serializers for AdminArchetypesTab — not shared domain parsers
 * (those stay in `@/lib/game/archetype-path`).
 */

import {
  parseArchetypePathData,
  parseIdQuantityStrings,
  serializeIdQuantityStrings,
  seedFeatGroupsFromFlatFeats,
  type Level1ArmorStep,
} from '@/lib/game/archetype-path';
import { validateLevel1Skills } from '@/lib/game/path-validation';
import { LAYER1_GOVERNANCE } from '@/lib/constants/creator-layer-governance';
import type { AbilityName } from '@/types/abilities';
import type { CodexSkill, CodexArchetype } from '@/types/codex';
import type {
  PathGuidanceAudience,
  PathGuidanceGroup,
  PathItemRecommendation,
} from '@/types/archetype';

export type ArchetypeItem = CodexArchetype;

export const ABILITY_OPTIONS = [
  'strength',
  'vitality',
  'agility',
  'acuity',
  'intelligence',
  'charisma',
] as const;
/** Level-1 ability cap mirrors the character creator (ABILITY_CONSTRAINTS.getMaxAbility(1)). */
export const RECOMMENDED_ABILITY_MAX = 3;
export const PATH_LEVEL1_MAX_BASE_SKILLS = LAYER1_GOVERNANCE.maxPathRecommendedBaseSkills;

type RecommendedAbilities = Partial<Record<AbilityName, number>>;

export type PathSelectionKey =
  | 'feats'
  | 'skills'
  | 'powers'
  | 'innatePowers'
  | 'techniques'
  | 'armaments'
  | 'equipment'
  | 'removeFeats'
  | 'removePowers'
  | 'removeTechniques'
  | 'removeArmaments';

export type AdminArchetypeFormState = {
  name: string;
  type: 'power' | 'powered-martial' | 'martial';
  description: string;
  archetypeAbility: string;
  secondaryAbility: string;
  powerProfStart: number;
  martialProfStart: number;
  powerProfLevel5: number;
  martialProfLevel5: number;
  level1Path: PathLevelForm;
  levelPathRows: PathLevelForm[];
  advancedPathJson: string;
  guidedRecommendedAbilities: RecommendedAbilities;
  guidedArmorStep: Level1ArmorStep | '';
  guidedSharedEquipmentEntries: PathItemRecommendation[];
  /** Level 1 guidance groups (feat groups authored here; others preserved). */
  guidanceGroups: PathGuidanceGroup[];
};

/** Admin sections include empty newly-added groups (guided filter still requires feats). */
export function isFeatOrientedGuidanceGroup(g: PathGuidanceGroup): boolean {
  return (g.feats?.length ?? 0) > 0 || g.audience === 'character' || g.audience === 'archetype';
}

export type CodexFeatLike = {
  id?: string | undefined;
  name?: string | undefined;
  description?: string | undefined;
  feat_lvl?: number | undefined;
  base_feat_id?: string | undefined;
  lvl_req?: number | undefined;
  char_feat?: boolean | undefined;
};

export type PathLevelForm = {
  rowId: string;
  level: number;
  feats: string[];
  skills: string[];
  powers: string[];
  /** Level 1 only: recommended Innate Powers (distinct from powers). */
  innatePowers: string[];
  techniques: string[];
  armaments: string[];
  equipment: string[];
  /** Level 1 only: armaments with quantity for path recommended gear */
  armamentEntries: PathItemRecommendation[];
  /** Level 1 only: equipment with quantity for path recommended gear */
  equipmentEntries: PathItemRecommendation[];
  /** Level 1 only: recommend Unarmed Prowess proficiency in equipment step */
  recommendUnarmedProwess: boolean;
  removeFeats: string[];
  removePowers: string[];
  removeTechniques: string[];
  removeArmaments: string[];
  notes: string;
};

export type SelectionOption = { value: string; label: string };

/**
 * Base skills: empty/null `base_skill_id` only (TASK-515 AC + guided curated-skills SoT).
 * `base_skill_id === 0` is an any-base sub-skill — not a base skill for path recommendations.
 */
export function isCodexBaseSkill(skill: Pick<CodexSkill, 'base_skill_id'>): boolean {
  return skill.base_skill_id == null;
}

export function isCodexSubSkill(skill: Pick<CodexSkill, 'base_skill_id'>): boolean {
  return skill.base_skill_id != null;
}

export function toastLevel1SkillWarnings(
  skillIds: string[],
  skills: CodexSkill[],
  showToast: (message: string, type: 'warning') => void,
): void {
  const byId = new Map(skills.map((s) => [String(s.id), s]));
  const issues = validateLevel1Skills(skillIds, {
    isSubSkill: (id) => {
      const skill = byId.get(String(id));
      if (!skill) return null;
      return isCodexSubSkill(skill);
    },
  });
  for (const issue of issues) {
    showToast(issue.message, 'warning');
  }
}

export function armamentTypeOf(
  id: string,
  typeById: Map<string, string>,
): 'weapon' | 'shield' | 'armor' | 'unknown' {
  const t = typeById.get(id);
  if (t === 'weapon' || t === 'shield' || t === 'armor') return t;
  return 'unknown';
}

export function labelForAbility(ability: string): string {
  return ability.charAt(0).toUpperCase() + ability.slice(1);
}

export function toLeveledFeatLike(f: CodexFeatLike) {
  return { ...f, id: f.id ?? '' };
}

export function guidedAbilitiesFromPath(pathData: unknown): RecommendedAbilities {
  const level1 = parseArchetypePathData(pathData)?.level1;
  return level1?.recommended_abilities ?? {};
}

/** Build the persisted recommended-abilities object (only non-zero entries); null when none set. */
export function serializeRecommendedAbilities(
  abilities: RecommendedAbilities,
): RecommendedAbilities | null {
  const entries = ABILITY_OPTIONS.map(
    (ability) => [ability, abilities[ability] ?? 0] as const,
  ).filter(([, value]) => value > 0);
  return entries.length > 0 ? (Object.fromEntries(entries) as RecommendedAbilities) : null;
}

export function guidedEquipmentMetaFromPath(pathData: unknown): {
  armorStep: Level1ArmorStep | '';
  sharedEquipmentEntries: PathItemRecommendation[];
} {
  const level1 = parseArchetypePathData(pathData)?.level1;
  return {
    armorStep: level1?.armorStep ?? '',
    sharedEquipmentEntries: (level1?.sharedEquipment ?? []).map((entry) => ({
      id: entry.id,
      quantity: entry.quantity ?? 1,
    })),
  };
}

export function toCsv(value: unknown): string {
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

export function dedupeStrings(values: string[]): string[] {
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
    }),
  );
}

export function makeLevelRow(level = 2): PathLevelForm {
  return {
    rowId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    level,
    feats: [],
    skills: [],
    powers: [],
    innatePowers: [],
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

export function newFeatGuidanceGroup(audience: PathGuidanceAudience): PathGuidanceGroup {
  const suffix = Math.random().toString(36).slice(2, 8);
  return {
    id: `feat-${audience}-${Date.now().toString(36)}-${suffix}`,
    title: audience === 'character' ? 'Character feat picks' : 'Archetype feat picks',
    why: '',
    audience,
    feats: [],
  };
}

/** Load guidance groups for admin edit; seed from flat feats when groups lack feat lists. */
export function guidanceGroupsFromPathData(
  pathData: unknown,
  flatFeats: string[],
): PathGuidanceGroup[] {
  const parsed = parseArchetypePathData(pathData);
  const existing = parsed?.level1?.guidance_groups ?? [];
  return seedFeatGroupsFromFlatFeats(flatFeats, existing);
}

export function toLevelForm(
  raw: Record<string, unknown>,
  level = 2,
  optionsByKey?: Partial<
    Record<keyof Omit<PathLevelForm, 'rowId' | 'level' | 'notes'>, SelectionOption[]>
  >,
): PathLevelForm {
  const rawArmaments = Array.isArray(raw.armaments)
    ? (raw.armaments as string[]).map(String)
    : toSelectionArray(raw.armaments);
  const rawEquipment = Array.isArray(raw.equipment)
    ? (raw.equipment as string[]).map(String)
    : toSelectionArray(raw.equipment);
  const armamentEntries = parseIdQuantityStrings(rawArmaments);
  const equipmentEntries = parseIdQuantityStrings(rawEquipment);
  return {
    rowId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    level: Number(raw.level ?? level) || level,
    feats: resolveSelectedValues(toSelectionArray(raw.feats), optionsByKey?.feats ?? []),
    skills: resolveSelectedValues(toSelectionArray(raw.skills), optionsByKey?.skills ?? []),
    powers: resolveSelectedValues(toSelectionArray(raw.powers), optionsByKey?.powers ?? []),
    innatePowers: resolveSelectedValues(
      toSelectionArray(raw.innatePowers ?? raw.innate_powers),
      optionsByKey?.innatePowers ?? optionsByKey?.powers ?? [],
    ),
    techniques: resolveSelectedValues(
      toSelectionArray(raw.techniques),
      optionsByKey?.techniques ?? [],
    ),
    armaments: armamentEntries.map((e) => e.id),
    equipment: equipmentEntries.map((e) => e.id),
    armamentEntries,
    equipmentEntries,
    recommendUnarmedProwess: raw.recommendUnarmedProwess === true,
    removeFeats: resolveSelectedValues(
      toSelectionArray(raw.removeFeats),
      optionsByKey?.removeFeats ?? [],
    ),
    removePowers: resolveSelectedValues(
      toSelectionArray(raw.removePowers),
      optionsByKey?.removePowers ?? [],
    ),
    removeTechniques: resolveSelectedValues(
      toSelectionArray(raw.removeTechniques),
      optionsByKey?.removeTechniques ?? [],
    ),
    removeArmaments: resolveSelectedValues(
      toSelectionArray(raw.removeArmaments),
      optionsByKey?.removeArmaments ?? [],
    ),
    notes: typeof raw.notes === 'string' ? raw.notes : '',
  };
}

export function buildLevelPayload(
  level: PathLevelForm,
  includeLevel: boolean,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  if (includeLevel) payload.level = level.level;
  const feats = dedupeStrings(level.feats);
  const skills = dedupeStrings(level.skills);
  const powers = dedupeStrings(level.powers);
  const innatePowers = dedupeStrings(level.innatePowers);
  const techniques = dedupeStrings(level.techniques);
  const isLevel1 = !includeLevel;
  const armaments =
    isLevel1 && level.armamentEntries?.length
      ? serializeIdQuantityStrings(level.armamentEntries)
      : dedupeStrings(level.armaments);
  const equipment =
    isLevel1 && level.equipmentEntries?.length
      ? serializeIdQuantityStrings(level.equipmentEntries)
      : dedupeStrings(level.equipment);
  const removeFeats = dedupeStrings(level.removeFeats);
  const removePowers = dedupeStrings(level.removePowers);
  const removeTechniques = dedupeStrings(level.removeTechniques);
  const removeArmaments = dedupeStrings(level.removeArmaments);
  if (feats.length) payload.feats = feats;
  if (skills.length) payload.skills = skills;
  if (powers.length) payload.powers = powers;
  if (isLevel1 && innatePowers.length) payload.innatePowers = innatePowers;
  if (techniques.length) payload.techniques = techniques;
  if (armaments.length) payload.armaments = armaments;
  if (equipment.length) payload.equipment = equipment;
  if (removeFeats.length) payload.removeFeats = removeFeats;
  if (removePowers.length) payload.removePowers = removePowers;
  if (removeTechniques.length) payload.removeTechniques = removeTechniques;
  if (removeArmaments.length) payload.removeArmaments = removeArmaments;
  if (level.notes.trim()) payload.notes = level.notes.trim();
  if (isLevel1 && level.recommendUnarmedProwess) payload.recommendUnarmedProwess = true;
  return payload;
}
