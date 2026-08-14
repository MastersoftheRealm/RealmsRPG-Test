/**
 * Level-1 create legality — server backstop (report 03 P1-7, TASK-738).
 * =====================================================================
 * `POST /api/characters` persists the creator's document as sent, so before this every
 * client-side budget gap was also a persistence gap. These predicates are the floor the
 * server enforces on a level-1 create.
 *
 * Every rule is a **bound, never an equality**: an over-budget or negative-resource
 * payload is rejected, an under-filled one is not. A server rule stricter than the
 * creator would turn any client/server divergence into a 400 on the "Create character"
 * click — worse than the corruption it would catch. For the same reason each budget is
 * evaluated at the more permissive of (`core_rules` override, code default), so an admin
 * rules edit can never retroactively reject a build a creator allowed.
 *
 * Skill spend is a deliberate lower bound (allocated values only, not per-skill
 * proficiency cost): species- and path-granted proficiencies are free, and the server has
 * no draft context to tell them apart. Charging for them here would reject legal builds.
 *
 * Feat *requirements* (level, ability, skill, martial ability, speed, leveled-feat
 * chain) are not a budget: an unmet requirement is never a legal save. When the official
 * catalog is passed in, those checks use the same `checkFeatRequirements` the creators
 * already run. Ids not in the catalog are skipped (custom / unresolvable).
 */

import type { CoreRulesMap } from '@/types/core-rules';
import type { ArchetypeCategory } from '@/types/archetype';
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
 * The subset of a create payload these checks read. Every field is optional — an absent
 * field is skipped rather than treated as 0, so partial documents stay creatable.
 */
interface Level1LegalityCandidate {
  level?: unknown;
  abilities?: unknown;
  skills?: unknown;
  defenseVals?: unknown;
  defenseSkills?: unknown;
  archetype?: unknown;
  archetypeFeats?: unknown;
  feats?: unknown;
  mart_abil?: unknown;
  speedBase?: unknown;
  currency?: unknown;
  healthPoints?: unknown;
  energyPoints?: unknown;
}

/** Official catalog rows used to evaluate feat requirements on create. */
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

function abilityPointsSpent(abilities: Record<string, unknown>, rules?: Rules): number {
  return ABILITY_KEYS.reduce((sum, key) => {
    const score = toFiniteNumber(abilities[key]) ?? 0;
    return sum + calculateAbilityScoreCost(score, rules);
  }, 0);
}

/**
 * Skill points demonstrably spent: allocated values plus defense bonuses. Proficiency
 * gains are excluded (see module docstring), so this is a floor, not the exact spend.
 */
function skillPointsSpentFloor(candidate: Level1LegalityCandidate, rules?: Rules): number {
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
      0
    );
    const cost = permissiveMin(
      resolveSkillAllocationRules(rules).defenseIncreaseCost,
      resolveSkillAllocationRules().defenseIncreaseCost
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
  if (typeof val === 'string') return val.split(',').map((s) => s.trim()).filter(Boolean);
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

function featRefs(value: unknown): Array<{ id: string; name?: string }> {
  if (!Array.isArray(value)) return [];
  const out: Array<{ id: string; name?: string }> = [];
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
  skillRows: unknown[] | null | undefined
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
        rec.base_feat_id != null && rec.base_feat_id !== ''
          ? String(rec.base_feat_id)
          : undefined,
    });
  }

  const skills: CodexSkillForFeat[] = [];
  for (const row of skillRows ?? []) {
    const rec = asRecord(row);
    if (!rec || rec.id == null) continue;
    skills.push({
      id: rec.id as string | number,
      name: typeof rec.name === 'string' ? rec.name : undefined,
      // Columnar rows use `base_skill`; never read a non-existent `base_skill_id` column.
      base_skill_id: mapCodexBaseSkillToId(rec.base_skill),
      ability: typeof rec.ability === 'string' ? rec.ability : undefined,
    });
  }

  return { feats, skills };
}

function candidateToFeatRequirementCharacter(
  candidate: Level1LegalityCandidate
): CharacterForFeatRequirement {
  const archetype = asRecord(candidate.archetype);
  const owned = [...featRefs(candidate.archetypeFeats), ...featRefs(candidate.feats)];
  const martAbil = candidate.mart_abil ?? archetype?.mart_abil;
  return {
    level: toFiniteNumber(candidate.level) ?? 1,
    abilities: (asRecord(candidate.abilities) ?? {}) as CharacterForFeatRequirement['abilities'],
    skills: candidate.skills as CharacterForFeatRequirement['skills'],
    defenseVals: asRecord(candidate.defenseVals) as CharacterForFeatRequirement['defenseVals'],
    defenseSkills: asRecord(candidate.defenseSkills) as CharacterForFeatRequirement['defenseSkills'],
    mart_abil: martAbil as CharacterForFeatRequirement['mart_abil'],
    speedBase: toFiniteNumber(candidate.speedBase) ?? undefined,
    archetype: archetype
      ? { mart_abil: archetype.mart_abil as CharacterForFeatRequirement['mart_abil'] }
      : null,
    feats: owned,
    archetypeFeats: featRefs(candidate.archetypeFeats),
  };
}

function findUnmetFeatRequirementViolations(
  candidate: Level1LegalityCandidate,
  catalog: FeatRequirementCatalog
): string[] {
  if (catalog.feats.length === 0) return [];

  const character = candidateToFeatRequirementCharacter(candidate);
  const seen = new Set<string>();
  const violations: string[] = [];

  for (const ref of [...featRefs(candidate.archetypeFeats), ...featRefs(candidate.feats)]) {
    if (seen.has(ref.id)) continue;
    seen.add(ref.id);
    const feat = catalog.feats.find((row) => String(row.id) === ref.id);
    // Custom / unresolvable ids cannot be evaluated — do not 400 them.
    if (!feat) continue;
    const result = checkFeatRequirements(feat, character, catalog.skills, catalog.feats);
    if (!result.met) {
      const label = feat.name ?? ref.name ?? ref.id;
      violations.push(
        result.reason
          ? `${label} does not meet its requirements: ${result.reason}.`
          : `${label} does not meet its requirements.`
      );
    }
  }

  return violations;
}

/**
 * Rule violations in a level-1 create payload. Empty array = legal (or not checkable).
 * Messages are player-facing: they are returned to the client as `details`.
 *
 * When `featCatalog` is provided (POST create), catalog feats that fail
 * `checkFeatRequirements` are refused. Ids not in the catalog are skipped.
 */
export function findLevel1LegalityViolations(
  candidate: Level1LegalityCandidate,
  rules?: Rules,
  featCatalog?: FeatRequirementCatalog
): string[] {
  const violations: string[] = [];

  const abilities = asRecord(candidate.abilities);
  if (abilities) {
    const budget = permissiveMax(
      calculateAbilityPoints(1, false, rules),
      calculateAbilityPoints(1)
    );
    const spent = permissiveMin(
      abilityPointsSpent(abilities, rules),
      abilityPointsSpent(abilities)
    );
    if (spent > budget) {
      violations.push(`Ability points spent (${spent}) exceed the level 1 budget (${budget}).`);
    }

    // Negative scores refund points, so without a floor a single score could be pushed
    // arbitrarily high and still balance the budget.
    const floor = Math.min(rules?.ABILITY_RULES?.min ?? ABILITY_LIMITS.MIN, ABILITY_LIMITS.MIN);
    const belowFloor = ABILITY_KEYS.filter((key) => (toFiniteNumber(abilities[key]) ?? 0) < floor);
    if (belowFloor.length > 0) {
      violations.push(`Ability scores cannot go below ${floor} (${belowFloor.join(', ')}).`);
    }
  }

  const skillBudget = permissiveMax(
    getTotalSkillPoints(1, 'character', rules),
    getTotalSkillPoints(1, 'character')
  );
  const skillSpent = skillPointsSpentFloor(candidate, rules);
  if (skillSpent > skillBudget) {
    violations.push(`Skill points spent (${skillSpent}) exceed the level 1 budget (${skillBudget}).`);
  }

  const archetypeType = asRecord(candidate.archetype)?.type;
  const maxArchetypeFeats = permissiveMax(
    calculateMaxArchetypeFeats(1, archetypeType as ArchetypeCategory | undefined, rules),
    calculateMaxArchetypeFeats(1, archetypeType as ArchetypeCategory | undefined)
  );
  const archetypeFeatCount = countRefs(candidate.archetypeFeats);
  if (archetypeFeatCount !== null && archetypeFeatCount > maxArchetypeFeats) {
    violations.push(
      `Archetype feats (${archetypeFeatCount}) exceed the level 1 maximum (${maxArchetypeFeats}).`
    );
  }

  const maxCharacterFeats = calculateMaxCharacterFeats(1);
  const characterFeatCount = countRefs(candidate.feats);
  if (characterFeatCount !== null && characterFeatCount > maxCharacterFeats) {
    violations.push(
      `Character feats (${characterFeatCount}) exceed the level 1 maximum (${maxCharacterFeats}).`
    );
  }

  const currency = toFiniteNumber(candidate.currency);
  if (currency !== null && currency < 0) {
    violations.push('Currency cannot be negative — a character cannot start play in debt.');
  }

  const pool = permissiveMax(
    calculateHealthEnergyPool(1, 'PLAYER', false, rules),
    calculateHealthEnergyPool(1, 'PLAYER')
  );
  const healthPoints = toFiniteNumber(candidate.healthPoints);
  const energyPoints = toFiniteNumber(candidate.energyPoints);
  if ((healthPoints ?? 0) < 0 || (energyPoints ?? 0) < 0) {
    violations.push('Health and Energy allocations cannot be negative.');
  } else if (healthPoints !== null && energyPoints !== null && healthPoints + energyPoints > pool) {
    violations.push(
      `Health + Energy allocation (${healthPoints + energyPoints}) exceeds the level 1 pool (${pool}).`
    );
  }

  if (featCatalog) {
    violations.push(...findUnmetFeatRequirementViolations(candidate, featCatalog));
  }

  return violations;
}

/**
 * True when a create payload should be legality-checked: level 1 only. Higher levels
 * accumulate level-up spend the server cannot reconstruct from the document alone.
 */
export function shouldCheckLevel1Legality(candidate: Level1LegalityCandidate): boolean {
  const level = toFiniteNumber(candidate.level);
  return level === null || level === 1;
}
