/**
 * Character create/save legality — server advisory backstop (report 03 P1-7, TASK-738, audit B5).
 * =====================================================================================================
 * `POST /api/characters` and `PATCH /api/characters/[id]` persist the document as sent. These
 * predicates compare spend/counts to level-aware bounds from `lib/game` formulas and `core_rules`.
 * Violations are returned as warnings; saves are not blocked (Kadin Oct 29, 2026).
 *
 * Every rule is a **bound, never an equality**: an over-budget payload yields a warning, an
 * under-filled one does not. Each budget is evaluated at the more permissive of (`core_rules`
 * override, code default) when rules data was loaded.
 *
 * Skill spend is a deliberate lower bound (allocated values only, not per-skill proficiency cost):
 * species- and path-granted proficiencies are free, and the server has no draft context to tell
 * them apart.
 *
 * Feat *requirements* use the same `checkFeatRequirements` the creators run when the official
 * catalog is passed in. Ids not in the catalog are skipped (custom / unresolvable).
 */

import type { CoreRulesMap } from '@/types/core-rules';
import type { ArchetypeCategory } from '@/types/archetype';
import { normalizeArchetypeChoices } from '@/lib/character/schema-normalize';
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

export interface CharacterLegalityResult {
  warnings: string[];
  uncomputable: string[];
}

const CORE_RULES_UNAVAILABLE_MESSAGE =
  'Core rules data was unavailable, so legality bounds could not be computed for this save.';

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

/** The looser of the rules-driven and code-default budget, so neither can reject the other. */
function permissiveMax(withRules: number, withDefaults: number): number {
  return Math.max(withRules, withDefaults);
}

/** The cheaper of the rules-driven and code-default spend, for the same reason. */
function permissiveMin(withRules: number, withDefaults: number): number {
  return Math.min(withRules, withDefaults);
}

function resolveLegalityLevel(candidate: CharacterLegalityCandidate): number | null {
  const level = toFiniteNumber(candidate.level);
  if (level === null) return 1;
  if (!Number.isInteger(level) || level < 1) return null;
  return level;
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

/**
 * Skill points demonstrably spent: allocated values plus defense bonuses. Proficiency gains are
 * excluded (see module docstring), so this is a floor, not the exact spend.
 */
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

/**
 * Live `codex_skills.base_skill` is TEXT (id of the parent skill, or empty). App types use
 * `base_skill_id`. Empty/null → undefined; numeric text → id. Same mapping as GET /api/codex.
 */
export function mapCodexBaseSkillToId(baseSkill: unknown): number | undefined {
  if (baseSkill === undefined || baseSkill === null || baseSkill === '') return undefined;
  const parsed = parseInt(String(baseSkill), 10);
  return Number.isNaN(parsed) ? undefined : parsed;
}

/** Map columnar `codex_feats` / `codex_skills` rows into the shape `checkFeatRequirements` reads. */
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

function findUnmetFeatRequirementWarnings(
  candidate: CharacterLegalityCandidate,
  level: number,
  catalog: FeatRequirementCatalog,
): string[] {
  if (catalog.feats.length === 0) return [];

  const character = candidateToFeatRequirementCharacter(candidate, level);
  const seen = new Set<string>();
  const warnings: string[] = [];

  for (const ref of [...featRefs(candidate.archetypeFeats), ...featRefs(candidate.feats)]) {
    if (seen.has(ref.id)) continue;
    seen.add(ref.id);
    const feat = catalog.feats.find((row) => String(row.id) === ref.id);
    if (!feat) continue;
    const result = checkFeatRequirements(feat, character, catalog.skills, catalog.feats);
    if (!result.met) {
      const label = feat.name ?? ref.name ?? ref.id;
      warnings.push(
        result.reason
          ? `${label} does not meet its requirements: ${result.reason}.`
          : `${label} does not meet its requirements.`,
      );
    }
  }

  return warnings;
}

/**
 * Advisory legality warnings for a character save payload. Empty warnings = within computed
 * bounds (or nothing checkable). When `rulesStatus` is `missing`, bounds are not computed.
 */
export function findCharacterLegalityViolations(
  candidate: CharacterLegalityCandidate,
  rulesStatus: CharacterLegalityRulesStatus,
  rules?: Rules,
  featCatalog?: FeatRequirementCatalog,
): CharacterLegalityResult {
  if (rulesStatus === 'missing') {
    return { warnings: [], uncomputable: [CORE_RULES_UNAVAILABLE_MESSAGE] };
  }

  const level = resolveLegalityLevel(candidate);
  if (level === null) {
    return {
      warnings: [],
      uncomputable: [
        'Character level is missing or invalid, so legality bounds could not be computed.',
      ],
    };
  }

  const warnings: string[] = [];
  const archetypeChoices = archetypeChoicesFromCandidate(candidate);

  const abilities = asRecord(candidate.abilities);
  if (abilities) {
    const budget = permissiveMax(
      calculateAbilityPoints(level, false, rules),
      calculateAbilityPoints(level),
    );
    const spent = permissiveMin(
      abilityPointsSpent(abilities, rules),
      abilityPointsSpent(abilities),
    );
    if (spent > budget) {
      warnings.push(
        `Ability points spent (${spent}) exceed the level ${level} budget (${budget}).`,
      );
    }

    const floor = Math.min(rules?.ABILITY_RULES?.min ?? ABILITY_LIMITS.MIN, ABILITY_LIMITS.MIN);
    const belowFloor = ABILITY_KEYS.filter((key) => (toFiniteNumber(abilities[key]) ?? 0) < floor);
    if (belowFloor.length > 0) {
      warnings.push(`Ability scores cannot go below ${floor} (${belowFloor.join(', ')}).`);
    }
  }

  const skillBudget = permissiveMax(
    getTotalSkillPoints(level, 'character', rules),
    getTotalSkillPoints(level, 'character'),
  );
  const skillSpent = skillPointsSpentFloor(candidate, rules);
  if (skillSpent > skillBudget) {
    warnings.push(
      `Skill points spent (${skillSpent}) exceed the level ${level} budget (${skillBudget}).`,
    );
  }

  const archetypeType = asRecord(candidate.archetype)?.type;
  const maxArchetypeFeats = permissiveMax(
    calculateMaxArchetypeFeats(
      level,
      archetypeType as ArchetypeCategory | undefined,
      rules,
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
    warnings.push(
      `Archetype feats (${archetypeFeatCount}) exceed the level ${level} maximum (${maxArchetypeFeats}).`,
    );
  }

  const maxCharacterFeats = calculateMaxCharacterFeats(level);
  const characterFeatCount = countRefs(candidate.feats);
  if (characterFeatCount !== null && characterFeatCount > maxCharacterFeats) {
    warnings.push(
      `Character feats (${characterFeatCount}) exceed the level ${level} maximum (${maxCharacterFeats}).`,
    );
  }

  const currency = toFiniteNumber(candidate.currency);
  if (currency !== null && currency < 0) {
    warnings.push('Currency cannot be negative — a character cannot start play in debt.');
  }

  const pool = permissiveMax(
    calculateHealthEnergyPool(level, 'PLAYER', false, rules),
    calculateHealthEnergyPool(level, 'PLAYER'),
  );
  const healthPoints = toFiniteNumber(candidate.healthPoints);
  const energyPoints = toFiniteNumber(candidate.energyPoints);
  if ((healthPoints ?? 0) < 0 || (energyPoints ?? 0) < 0) {
    warnings.push('Health and Energy allocations cannot be negative.');
  } else if (healthPoints !== null && energyPoints !== null && healthPoints + energyPoints > pool) {
    warnings.push(
      `Health + Energy allocation (${healthPoints + energyPoints}) exceeds the level ${level} pool (${pool}).`,
    );
  }

  if (featCatalog) {
    warnings.push(...findUnmetFeatRequirementWarnings(candidate, level, featCatalog));
  }

  return { warnings, uncomputable: [] };
}

/** Merge advisory legality fields into a JSON response body when present. */
export function appendCharacterLegalityToResponse<T extends Record<string, unknown>>(
  body: T,
  legality: CharacterLegalityResult,
): T & { legalityWarnings?: string[]; legalityUncomputable?: string[] } {
  const next = { ...body } as T & { legalityWarnings?: string[]; legalityUncomputable?: string[] };
  if (legality.warnings.length > 0) next.legalityWarnings = legality.warnings;
  if (legality.uncomputable.length > 0) next.legalityUncomputable = legality.uncomputable;
  return next;
}

/** Derive rules status from a `fetchCoreRules` result (empty map = unavailable). */
export function characterLegalityRulesStatus(
  rules: Partial<CoreRulesMap>,
): CharacterLegalityRulesStatus {
  return Object.keys(rules).length > 0 ? 'loaded' : 'missing';
}

const FEAT_REQUIREMENT_COLUMNS =
  'id, name, lvl_req, ability_req, abil_req_val, skill_req, skill_req_val, mart_abil_req, speed_req, feat_lvl, base_feat_id';
const SKILL_REQUIREMENT_COLUMNS = 'id, name, base_skill, ability';

async function fetchFeatRequirementCatalog(supabase: TypedSupabaseClient) {
  const [featRes, skillRes] = await Promise.all([
    supabase.from('codex_feats').select(FEAT_REQUIREMENT_COLUMNS),
    supabase.from('codex_skills').select(SKILL_REQUIREMENT_COLUMNS),
  ]);
  if (featRes.error) throw featRes.error;
  if (skillRes.error) throw skillRes.error;
  return catalogFromCodexRows(featRes.data ?? [], skillRes.data ?? []);
}

/** Load rules + feat catalog and evaluate legality for a save payload. */
export async function evaluateCharacterLegalityForSave(
  supabase: TypedSupabaseClient,
  candidate: CharacterLegalityCandidate,
): Promise<CharacterLegalityResult> {
  const [rules, featCatalog] = await Promise.all([
    fetchCoreRules(supabase),
    fetchFeatRequirementCatalog(supabase),
  ]);
  return findCharacterLegalityViolations(
    candidate,
    characterLegalityRulesStatus(rules),
    rules,
    featCatalog,
  );
}
