/**
 * Character save legality — server backstop (report 03 P1-7, TASK-738, audit B5).
 * =============================================================================
 * B5 scope: compare **document totals** to **level budgets** from `lib/game` formulas
 * and loaded `core_rules`. Rebuilding level-up spend history from the sheet is **B6**
 * (out of scope here).
 *
 * Level 1 **POST create:** blocking 400 with player-facing `details` (unchanged from master).
 * Level 1 **PATCH:** master never blocked; only **new** L1 violations vs stored → 400; pre-existing → 200 warnings.
 * Level 2+: advisory structured `legalityWarnings` on success; saves are not blocked.
 *
 * Skill spend is a deliberate lower bound (allocated values only). Feat requirements
 * use `checkFeatRequirements` when the feat catalog loaded; catalog load failure is
 * `feat_catalog_unavailable` (save still succeeds).
 */

import type { CoreRulesMap } from '@/types/core-rules';
import type { ArchetypeCategory } from '@/types/archetype';
import { normalizeArchetypeChoices } from '@/lib/character/schema-normalize';
import { fetchFeatRequirementCatalogCached } from '@/lib/codex/feat-requirement-catalog-server';
import { fetchCoreRules } from '@/lib/core-rules-server';
import type { TypedSupabaseClient } from '@/lib/supabase/database';
import { ABILITY_LIMITS } from './constants';
import {
  checkFeatRequirements,
  type CharacterForFeatRequirement,
  type FeatForRequirement,
} from './feat-requirements';
import {
  calculateAbilityPoints,
  calculateAbilityScoreCost,
  calculateHealthEnergyPool,
  calculateMaxArchetypeFeats,
  calculateMaxCharacterFeats,
  type CodexSkillForFeat,
} from './formulas';
import { getTotalSkillPoints, resolveSkillAllocationRules } from './skill-allocation';

type Rules = Partial<CoreRulesMap>;

/** Required on every legality call so missing `core_rules` cannot silently fall back (B5). */
export type CharacterLegalityRulesStatus = 'loaded' | 'missing';

export type CharacterLegalityUncomputableCode =
  | 'core_rules_unavailable'
  | 'invalid_level'
  | 'feat_catalog_unavailable';

export type CharacterLegalityWarningCode =
  | 'ability_points_over_budget'
  | 'ability_below_floor'
  | 'skill_points_over_budget'
  | 'archetype_feats_over_max'
  | 'character_feats_over_max'
  | 'currency_negative'
  | 'health_energy_negative'
  | 'health_energy_over_pool'
  | 'feat_requirements_unmet'
  | 'level_1_preexisting_violation';

export interface CharacterLegalityStructuredWarning {
  code: CharacterLegalityWarningCode;
  level: number;
  spent?: number | undefined;
  budget?: number | undefined;
  count?: number | undefined;
  max?: number | undefined;
  allocation?: number | undefined;
  pool?: number | undefined;
  floor?: number | undefined;
  abilities?: string[] | undefined;
  featId?: string | undefined;
  /** Existing level-1 blocking line (PATCH pre-existing violations only). */
  detail?: string | undefined;
}

export interface CharacterLegalityResult {
  /** Level 1 POST create — 400 `details`. Not used for PATCH blocking (see resolveCharacterPatchLegality). */
  blocking: string[];
  /** Level 2+ advisory — machine-readable; no player-facing sentences in B5. */
  warnings: CharacterLegalityStructuredWarning[];
  uncomputable: CharacterLegalityUncomputableCode[];
}

const FEAT_CATALOG_PATCH_KEYS = new Set([
  'feats',
  'archetypeFeats',
  'abilities',
  'skills',
  'defenseVals',
  'defenseSkills',
  'level',
  'mart_abil',
  'speedBase',
  'archetype',
  'archetypeChoices',
]);

const ABILITY_KEYS = [
  'strength',
  'vitality',
  'agility',
  'acuity',
  'intelligence',
  'charisma',
] as const;

const DEFENSE_KEYS = [
  'might',
  'fortitude',
  'reflex',
  'discernment',
  'mentalFortitude',
  'resolve',
] as const;

/**
 * The subset of a save payload these checks read. Every field is optional — an absent field is
 * skipped rather than treated as 0, so partial documents stay saveable.
 */
export interface CharacterLegalityCandidate {
  level?: unknown | undefined;
  abilities?: unknown | undefined;
  skills?: unknown | undefined;
  defenseVals?: unknown | undefined;
  defenseSkills?: unknown | undefined;
  archetype?: unknown | undefined;
  archetypeFeats?: unknown | undefined;
  archetypeChoices?: unknown | undefined;
  feats?: unknown | undefined;
  mart_abil?: unknown | undefined;
  speedBase?: unknown | undefined;
  currency?: unknown | undefined;
  healthPoints?: unknown | undefined;
  energyPoints?: unknown | undefined;
}

/** Official catalog rows used to evaluate feat requirements on create/save. */
export interface FeatRequirementCatalog {
  feats: FeatForRequirement[];
  skills: CodexSkillForFeat[];
}

export interface EvaluateCharacterLegalityOptions {
  /** When false, skip codex catalog fetch (feat requirement checks omitted). */
  loadFeatCatalog?: boolean | undefined;
}

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function permissiveMax(withRules: number, withDefaults: number): number {
  return Math.max(withRules, withDefaults);
}

function permissiveMin(withRules: number, withDefaults: number): number {
  return Math.min(withRules, withDefaults);
}

function resolveLegalityLevel(candidate: CharacterLegalityCandidate): number | null {
  const level = toFiniteNumber(candidate.level);
  if (level === null) return 1;
  if (!Number.isInteger(level) || level < 1) return null;
  return level;
}

export function legalityLevelForSave(candidate: CharacterLegalityCandidate): number {
  return resolveLegalityLevel(candidate) ?? 1;
}

export function shouldBlockCharacterSaveAtLevel(
  level: number,
  result: CharacterLegalityResult,
): boolean {
  return level === 1 && result.blocking.length > 0;
}

/**
 * PATCH level-1: block only violations newly introduced by the merge; surface pre-existing as warnings.
 */
export function resolveCharacterPatchLegality(
  stored: CharacterLegalityResult,
  merged: CharacterLegalityResult,
  mergedLevel: number,
): { status400Details: string[] | null; legality: CharacterLegalityResult } {
  if (mergedLevel !== 1) {
    return { status400Details: null, legality: merged };
  }
  const storedSet = new Set(stored.blocking);
  const newBlocking = merged.blocking.filter((line) => !storedSet.has(line));
  if (newBlocking.length > 0) {
    return { status400Details: newBlocking, legality: merged };
  }
  const preExisting = merged.blocking.filter((line) => storedSet.has(line));
  const warnings: CharacterLegalityStructuredWarning[] = [
    ...merged.warnings,
    ...preExisting.map((detail) => ({
      code: 'level_1_preexisting_violation' as const,
      level: 1,
      detail,
    })),
  ];
  return {
    status400Details: null,
    legality: { blocking: [], warnings, uncomputable: merged.uncomputable },
  };
}

export function patchDirtyKeysNeedFeatCatalog(dirty: Record<string, unknown>): boolean {
  return Object.keys(dirty).some((key) => FEAT_CATALOG_PATCH_KEYS.has(key));
}

function archetypeChoicesFromCandidate(
  candidate: CharacterLegalityCandidate,
): Record<number, 'innate' | 'feat'> {
  if (candidate.archetypeChoices === undefined || candidate.archetypeChoices === null) {
    return {};
  }
  return normalizeArchetypeChoices(candidate.archetypeChoices as Record<string | number, unknown>);
}

function abilityPointsSpent(abilities: Record<string, unknown>, rules?: Rules): number {
  return ABILITY_KEYS.reduce((sum, key) => {
    const score = toFiniteNumber(abilities[key]) ?? 0;
    return sum + calculateAbilityScoreCost(score, rules);
  }, 0);
}

function skillPointsSpentFloor(candidate: CharacterLegalityCandidate, rules?: Rules): number {
  let spent = 0;

  const skills = candidate.skills;
  if (Array.isArray(skills)) {
    for (const row of skills) {
      const entry = asRecord(row);
      if (!entry) continue;
      const value = toFiniteNumber(entry.skill_val) ?? toFiniteNumber(entry.val) ?? 0;
      spent += Math.max(0, value);
    }
  } else {
    const record = asRecord(skills);
    if (record) {
      for (const raw of Object.values(record)) {
        const entry = asRecord(raw);
        const value = entry ? (toFiniteNumber(entry.val) ?? 0) : (toFiniteNumber(raw) ?? 0);
        spent += Math.max(0, value);
      }
    }
  }

  const defenses = asRecord(candidate.defenseVals) ?? asRecord(candidate.defenseSkills);
  if (defenses) {
    const defenseTotal = DEFENSE_KEYS.reduce(
      (sum, key) => sum + Math.max(0, toFiniteNumber(defenses[key]) ?? 0),
      0,
    );
    const cost = permissiveMin(
      resolveSkillAllocationRules(rules).defenseIncreaseCost,
      resolveSkillAllocationRules().defenseIncreaseCost,
    );
    spent += defenseTotal * cost;
  }

  return spent;
}

function countRefs(value: unknown): number | null {
  return Array.isArray(value) ? value.length : null;
}

function toStrArray(val: unknown): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val.map(String);
  if (typeof val === 'string')
    return val
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  return [];
}

function toNumArray(val: unknown): number[] {
  if (!val) return [];
  if (Array.isArray(val)) return val.map(Number).filter(Number.isFinite);
  if (typeof val === 'string') {
    return val.split(',').map(Number).filter(Number.isFinite);
  }
  const n = toFiniteNumber(val);
  return n === null ? [] : [n];
}

function featRefs(value: unknown): Array<{ id: string; name?: string | undefined }> {
  if (!Array.isArray(value)) return [];
  const out: Array<{ id: string; name?: string | undefined }> = [];
  for (const row of value) {
    const rec = asRecord(row);
    if (rec) {
      const id = rec.id != null ? String(rec.id) : '';
      if (!id) continue;
      out.push({
        id,
        name: typeof rec.name === 'string' ? rec.name : undefined,
      });
    } else if (row != null && row !== '') {
      out.push({ id: String(row) });
    }
  }
  return out;
}

export function mapCodexBaseSkillToId(baseSkill: unknown): number | undefined {
  if (baseSkill === undefined || baseSkill === null || baseSkill === '') return undefined;
  const parsed = parseInt(String(baseSkill), 10);
  return Number.isNaN(parsed) ? undefined : parsed;
}

export function catalogFromCodexRows(
  featRows: unknown[] | null | undefined,
  skillRows: unknown[] | null | undefined,
): FeatRequirementCatalog {
  const feats: FeatForRequirement[] = [];
  for (const row of featRows ?? []) {
    const rec = asRecord(row);
    if (!rec || rec.id == null) continue;
    const martAbil = rec.mart_abil_req;
    feats.push({
      id: rec.id as string | number,
      name: typeof rec.name === 'string' ? rec.name : undefined,
      lvl_req: toFiniteNumber(rec.lvl_req) ?? undefined,
      ability_req: toStrArray(rec.ability_req),
      abil_req_val: toNumArray(rec.abil_req_val),
      skill_req: toStrArray(rec.skill_req),
      skill_req_val: toNumArray(rec.skill_req_val),
      mart_abil_req:
        martAbil == null || martAbil === ''
          ? undefined
          : (toFiniteNumber(martAbil) ?? String(martAbil)),
      speed_req: toFiniteNumber(rec.speed_req) ?? undefined,
      feat_lvl: toFiniteNumber(rec.feat_lvl) ?? undefined,
      base_feat_id:
        rec.base_feat_id != null && rec.base_feat_id !== '' ? String(rec.base_feat_id) : undefined,
    });
  }

  const skills: CodexSkillForFeat[] = [];
  for (const row of skillRows ?? []) {
    const rec = asRecord(row);
    if (!rec || rec.id == null) continue;
    skills.push({
      id: rec.id as string | number,
      name: typeof rec.name === 'string' ? rec.name : undefined,
      base_skill_id: mapCodexBaseSkillToId(rec.base_skill),
      ability: typeof rec.ability === 'string' ? rec.ability : undefined,
    });
  }

  return { feats, skills };
}

function candidateToFeatRequirementCharacter(
  candidate: CharacterLegalityCandidate,
  level: number,
): CharacterForFeatRequirement {
  const archetype = asRecord(candidate.archetype);
  const owned = [...featRefs(candidate.archetypeFeats), ...featRefs(candidate.feats)];
  const martAbil = candidate.mart_abil ?? archetype?.mart_abil;
  return {
    level,
    abilities: (asRecord(candidate.abilities) ?? {}) as CharacterForFeatRequirement['abilities'],
    skills: candidate.skills as CharacterForFeatRequirement['skills'],
    defenseVals: asRecord(candidate.defenseVals) as CharacterForFeatRequirement['defenseVals'],
    defenseSkills: asRecord(
      candidate.defenseSkills,
    ) as CharacterForFeatRequirement['defenseSkills'],
    mart_abil: martAbil as CharacterForFeatRequirement['mart_abil'],
    speedBase: toFiniteNumber(candidate.speedBase) ?? undefined,
    archetype: archetype
      ? { mart_abil: archetype.mart_abil as CharacterForFeatRequirement['mart_abil'] }
      : null,
    feats: owned,
    archetypeFeats: featRefs(candidate.archetypeFeats),
  };
}

function addAbilityOverBudget(
  level: number,
  blocking: string[],
  warnings: CharacterLegalityStructuredWarning[],
  spent: number,
  budget: number,
) {
  if (spent <= budget) return;
  if (level === 1) {
    blocking.push(`Ability points spent (${spent}) exceed the level 1 budget (${budget}).`);
    return;
  }
  warnings.push({ code: 'ability_points_over_budget', level, spent, budget });
}

function addSkillOverBudget(
  level: number,
  blocking: string[],
  warnings: CharacterLegalityStructuredWarning[],
  spent: number,
  budget: number,
) {
  if (spent <= budget) return;
  if (level === 1) {
    blocking.push(`Skill points spent (${spent}) exceed the level 1 budget (${budget}).`);
    return;
  }
  warnings.push({ code: 'skill_points_over_budget', level, spent, budget });
}

function findUnmetFeatRequirementViolations(
  candidate: CharacterLegalityCandidate,
  level: number,
  catalog: FeatRequirementCatalog,
  blocking: string[],
  warnings: CharacterLegalityStructuredWarning[],
) {
  if (catalog.feats.length === 0) return;

  const character = candidateToFeatRequirementCharacter(candidate, level);
  const seen = new Set<string>();

  for (const ref of [...featRefs(candidate.archetypeFeats), ...featRefs(candidate.feats)]) {
    if (seen.has(ref.id)) continue;
    seen.add(ref.id);
    const feat = catalog.feats.find((row) => String(row.id) === ref.id);
    if (!feat) continue;
    const result = checkFeatRequirements(feat, character, catalog.skills, catalog.feats);
    if (!result.met) {
      if (level === 1) {
        const label = feat.name ?? ref.name ?? ref.id;
        blocking.push(
          result.reason
            ? `${label} does not meet its requirements: ${result.reason}.`
            : `${label} does not meet its requirements.`,
        );
      } else {
        warnings.push({ code: 'feat_requirements_unmet', level, featId: ref.id });
      }
    }
  }
}

export function findCharacterLegalityViolations(
  candidate: CharacterLegalityCandidate,
  rulesStatus: CharacterLegalityRulesStatus,
  rules?: Rules,
  featCatalog?: FeatRequirementCatalog,
): CharacterLegalityResult {
  const uncomputable: CharacterLegalityUncomputableCode[] = [];
  let effectiveRules = rules;
  if (rulesStatus === 'missing') {
    uncomputable.push('core_rules_unavailable');
    effectiveRules = undefined;
  }

  const level = resolveLegalityLevel(candidate);
  if (level === null) {
    return { blocking: [], warnings: [], uncomputable: ['invalid_level'] };
  }

  const blocking: string[] = [];
  const warnings: CharacterLegalityStructuredWarning[] = [];
  const archetypeChoices = archetypeChoicesFromCandidate(candidate);

  const abilities = asRecord(candidate.abilities);
  if (abilities) {
    const budget = permissiveMax(
      calculateAbilityPoints(level, false, effectiveRules),
      calculateAbilityPoints(level),
    );
    const spent = permissiveMin(
      abilityPointsSpent(abilities, effectiveRules),
      abilityPointsSpent(abilities),
    );
    addAbilityOverBudget(level, blocking, warnings, spent, budget);

    const floor = Math.min(
      effectiveRules?.ABILITY_RULES?.min ?? ABILITY_LIMITS.MIN,
      ABILITY_LIMITS.MIN,
    );
    const belowFloor = ABILITY_KEYS.filter((key) => (toFiniteNumber(abilities[key]) ?? 0) < floor);
    if (belowFloor.length > 0) {
      if (level === 1) {
        blocking.push(`Ability scores cannot go below ${floor} (${belowFloor.join(', ')}).`);
      } else {
        warnings.push({
          code: 'ability_below_floor',
          level,
          floor,
          abilities: [...belowFloor],
        });
      }
    }
  }

  const skillBudget = permissiveMax(
    getTotalSkillPoints(level, 'character', effectiveRules),
    getTotalSkillPoints(level, 'character'),
  );
  const skillSpent = skillPointsSpentFloor(candidate, effectiveRules);
  addSkillOverBudget(level, blocking, warnings, skillSpent, skillBudget);

  const archetypeType = asRecord(candidate.archetype)?.type;
  const maxArchetypeFeats = permissiveMax(
    calculateMaxArchetypeFeats(
      level,
      archetypeType as ArchetypeCategory | undefined,
      effectiveRules,
      archetypeChoices,
    ),
    calculateMaxArchetypeFeats(
      level,
      archetypeType as ArchetypeCategory | undefined,
      undefined,
      archetypeChoices,
    ),
  );
  const archetypeFeatCount = countRefs(candidate.archetypeFeats);
  if (archetypeFeatCount !== null && archetypeFeatCount > maxArchetypeFeats) {
    if (level === 1) {
      blocking.push(
        `Archetype feats (${archetypeFeatCount}) exceed the level 1 maximum (${maxArchetypeFeats}).`,
      );
    } else {
      warnings.push({
        code: 'archetype_feats_over_max',
        level,
        count: archetypeFeatCount,
        max: maxArchetypeFeats,
      });
    }
  }

  const maxCharacterFeats = calculateMaxCharacterFeats(level);
  const characterFeatCount = countRefs(candidate.feats);
  if (characterFeatCount !== null && characterFeatCount > maxCharacterFeats) {
    if (level === 1) {
      blocking.push(
        `Character feats (${characterFeatCount}) exceed the level 1 maximum (${maxCharacterFeats}).`,
      );
    } else {
      warnings.push({
        code: 'character_feats_over_max',
        level,
        count: characterFeatCount,
        max: maxCharacterFeats,
      });
    }
  }

  const currency = toFiniteNumber(candidate.currency);
  if (currency !== null && currency < 0) {
    if (level === 1) {
      blocking.push('Currency cannot be negative — a character cannot start play in debt.');
    } else {
      warnings.push({ code: 'currency_negative', level });
    }
  }

  const pool = permissiveMax(
    calculateHealthEnergyPool(level, 'PLAYER', false, effectiveRules),
    calculateHealthEnergyPool(level, 'PLAYER'),
  );
  const healthPoints = toFiniteNumber(candidate.healthPoints);
  const energyPoints = toFiniteNumber(candidate.energyPoints);
  if ((healthPoints ?? 0) < 0 || (energyPoints ?? 0) < 0) {
    if (level === 1) {
      blocking.push('Health and Energy allocations cannot be negative.');
    } else {
      warnings.push({ code: 'health_energy_negative', level });
    }
  } else if (healthPoints !== null && energyPoints !== null && healthPoints + energyPoints > pool) {
    const allocation = healthPoints + energyPoints;
    if (level === 1) {
      blocking.push(
        `Health + Energy allocation (${allocation}) exceeds the level 1 pool (${pool}).`,
      );
    } else {
      warnings.push({
        code: 'health_energy_over_pool',
        level,
        allocation,
        pool,
      });
    }
  }

  if (featCatalog) {
    findUnmetFeatRequirementViolations(candidate, level, featCatalog, blocking, warnings);
  }

  return { blocking, warnings, uncomputable };
}

function rulesStatusFromFetch(rules: Partial<CoreRulesMap>): CharacterLegalityRulesStatus {
  return Object.keys(rules).length > 0 ? 'loaded' : 'missing';
}

export function appendCharacterLegalityToResponse<T extends Record<string, unknown>>(
  body: T,
  legality: CharacterLegalityResult,
): T & {
  legalityWarnings?: CharacterLegalityStructuredWarning[];
  legalityUncomputable?: CharacterLegalityUncomputableCode[];
} {
  const next = { ...body } as T & {
    legalityWarnings?: CharacterLegalityStructuredWarning[];
    legalityUncomputable?: CharacterLegalityUncomputableCode[];
  };
  if (legality.warnings.length > 0) next.legalityWarnings = legality.warnings;
  if (legality.uncomputable.length > 0) next.legalityUncomputable = legality.uncomputable;
  return next;
}

export async function evaluateCharacterLegalityForSave(
  supabase: TypedSupabaseClient,
  candidate: CharacterLegalityCandidate,
  options: EvaluateCharacterLegalityOptions = {},
): Promise<CharacterLegalityResult> {
  const rules = await fetchCoreRules(supabase);
  let featCatalog: FeatRequirementCatalog | undefined;
  const extraUncomputable: CharacterLegalityUncomputableCode[] = [];

  if (options.loadFeatCatalog !== false) {
    try {
      featCatalog = await fetchFeatRequirementCatalogCached();
    } catch {
      extraUncomputable.push('feat_catalog_unavailable');
    }
  }

  const result = findCharacterLegalityViolations(
    candidate,
    rulesStatusFromFetch(rules),
    rules,
    featCatalog,
  );
  if (extraUncomputable.length > 0) {
    result.uncomputable.push(...extraUncomputable);
  }
  return result;
}
