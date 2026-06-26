/**
 * Feat Requirement Checking — Single Source of Truth
 * ===================================================
 * Shared logic for determining whether a character (or creator draft) meets a
 * feat's requirements (level, ability/defense, skill, martial ability, speed,
 * and leveled-feat prerequisites).
 *
 * Used by:
 * - Character creator Feats step (`feats-step.tsx`)
 * - Character sheet Add Feat modal (`add-feat-modal.tsx`)
 * - Creature creator Add Feat modal (`AddCreatureFeatModal.tsx`)
 * - Codex feats tab character filter (`CodexFeatsTab.tsx`)
 *
 * Keep all feat-qualification logic here so the creator, sheet, and codex stay
 * in sync — "learn once, use forever".
 */

import type { Abilities } from '@/types/abilities';
import type { DefenseSkills } from '@/types/skills';
import { calculateDefenses, calculateSpeed } from './calculations';
import { getSkillBonusForFeatRequirement, type CodexSkillForFeat } from './formulas';
import { getFeatLevel } from '@/lib/leveled-feats';
import { DEFAULT_DEFENSE_SKILLS } from '@/types/skills';

/** Minimal feat shape needed for requirement checks (structurally compatible with codex Feat). */
export interface FeatForRequirement {
  id: string | number;
  name?: string;
  lvl_req?: number;
  ability_req?: string[];
  abil_req_val?: number[];
  skill_req?: Array<string | number>;
  skill_req_val?: number[];
  mart_abil_req?: number | string;
  speed_req?: number;
  feat_lvl?: number;
  base_feat_id?: string;
}

/** Minimal character/draft shape needed for requirement checks. */
export interface CharacterForFeatRequirement {
  level?: number;
  abilities?: Partial<Abilities>;
  /** Character: Record<id, { prof, val }>; Draft: Record<id, value (number)>; legacy: array. */
  skills?:
    | Record<string, number | { prof?: boolean; val?: number }>
    | Array<{ id?: string | number; name?: string; skill_val?: number; prof?: boolean }>
    | null;
  /** Canonical defense allocation field. */
  defenseVals?: Partial<DefenseSkills> | null;
  /** @deprecated legacy defense field, still honored for old saves/drafts. */
  defenseSkills?: Partial<DefenseSkills> | null;
  /** Martial ability (top-level on saved characters). */
  mart_abil?: number | string;
  /** Base speed (default 6). */
  speedBase?: number;
  /** Creator draft nests martial ability under archetype. */
  archetype?: { mart_abil?: number | string } | null;
  /** Selected/owned feats — used for leveled-feat prerequisite checks. */
  feats?: Array<{ id?: string | number; name?: string }> | null;
  archetypeFeats?: Array<{ id?: string | number; name?: string }> | null;
}

export interface FeatRequirementResult {
  met: boolean;
  /** All failing reasons joined; undefined when met. */
  reason?: string;
  /** Individual failing reasons. */
  reasons: string[];
}

function normalizeReqKey(input: string): string {
  return String(input ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '');
}

function isAbilityReqKey(
  key: string
): key is 'strength' | 'vitality' | 'agility' | 'acuity' | 'intelligence' | 'charisma' {
  return (
    key === 'strength' ||
    key === 'vitality' ||
    key === 'agility' ||
    key === 'acuity' ||
    key === 'intelligence' ||
    key === 'charisma'
  );
}

type DefenseReqKey = 'might' | 'fortitude' | 'reflex' | 'discernment' | 'mentalFortitude' | 'resolve';

function toDefenseReqKey(key: string): DefenseReqKey | null {
  if (key === 'might') return 'might';
  if (key === 'fortitude') return 'fortitude';
  if (key === 'reflex' || key === 'reflexes') return 'reflex';
  if (key === 'discernment') return 'discernment';
  if (key === 'mentalfortitude') return 'mentalFortitude';
  if (key === 'resolve') return 'resolve';
  return null;
}

/** Id of the previous-level feat required to take this feat. Null if level 1 or no base. */
export function getPreviousLevelFeatId(
  feat: FeatForRequirement,
  allFeats: FeatForRequirement[]
): string | null {
  const level = getFeatLevel(feat);
  if (level <= 1) return null;
  if (feat.base_feat_id && level === 2) return String(feat.base_feat_id);
  if (feat.base_feat_id && level >= 3) {
    const prev = allFeats.find(
      (f) => f.base_feat_id === feat.base_feat_id && getFeatLevel(f) === level - 1
    );
    return prev ? String(prev.id) : null;
  }
  return null;
}

/** Normalize a character's skills into the shape `getSkillBonusForFeatRequirement` expects. */
function normalizeSkills(
  skills: CharacterForFeatRequirement['skills']
): Record<string, number | { prof?: boolean; val?: number }> {
  if (!skills) return {};
  if (Array.isArray(skills)) {
    const record: Record<string, { prof?: boolean; val?: number }> = {};
    skills.forEach((s) => {
      const id = s.id != null ? String(s.id) : '';
      const name = s.name != null ? String(s.name) : '';
      const entry = { prof: s.prof ?? false, val: s.skill_val ?? 0 };
      if (id) record[id] = entry;
      if (name && name !== id) record[name] = entry;
    });
    return record;
  }
  return skills as Record<string, number | { prof?: boolean; val?: number }>;
}

/**
 * Check whether a character (or creator draft) meets a feat's requirements.
 *
 * Mirrors the character creator's feat filtering exactly: level, ability/defense,
 * skill (with proficiency), martial ability, speed, and leveled-feat prerequisites.
 *
 * @param feat - The feat to evaluate.
 * @param character - Character or draft stats.
 * @param skillsDb - Full codex skills (resolves base/sub skill and ability).
 * @param allFeats - All codex feats (resolves leveled-feat prerequisite chain).
 */
export function checkFeatRequirements(
  feat: FeatForRequirement,
  character: CharacterForFeatRequirement,
  skillsDb: CodexSkillForFeat[],
  allFeats: FeatForRequirement[]
): FeatRequirementResult {
  const reasons: string[] = [];
  const abilities = (character.abilities || {}) as Partial<Abilities>;
  const level = character.level ?? 1;

  // Level requirement
  if (feat.lvl_req != null && feat.lvl_req > level) {
    reasons.push(`Requires level ${feat.lvl_req}`);
  }

  // Ability / defense requirements
  if (feat.ability_req && feat.ability_req.length > 0) {
    const defenseVals: Partial<DefenseSkills> = {
      ...DEFAULT_DEFENSE_SKILLS,
      ...(character.defenseSkills || {}),
      ...(character.defenseVals || {}),
    };
    const { defenseBonuses } = calculateDefenses(abilities, defenseVals);
    feat.ability_req.forEach((abil, idx) => {
      const required = feat.abil_req_val?.[idx] ?? 0;
      const key = normalizeReqKey(abil);
      const defenseKey = toDefenseReqKey(key);
      const current = isAbilityReqKey(key)
        ? (abilities[key] ?? 0)
        : defenseKey
          ? (defenseBonuses[defenseKey] ?? 0)
          : 0;
      if (current < required) reasons.push(`Requires ${abil} ${required}+`);
    });
  }

  // Skill requirements: skill_req_val = required SKILL BONUS; proficiency required for all.
  if (feat.skill_req && feat.skill_req.length > 0) {
    const skillsForReq = normalizeSkills(character.skills);
    feat.skill_req.forEach((skillId, idx) => {
      const requiredBonus = feat.skill_req_val?.[idx] ?? 1;
      const skillName =
        skillsDb.find((s) => String(s.id) === String(skillId))?.name || String(skillId);
      const { bonus, proficient } = getSkillBonusForFeatRequirement(
        String(skillId),
        abilities,
        skillsForReq,
        skillsDb
      );
      if (!proficient) reasons.push(`Requires proficiency in ${skillName}`);
      else if (bonus < requiredBonus)
        reasons.push(`Requires ${skillName} bonus ${requiredBonus}+ (yours: ${bonus})`);
    });
  }

  // Martial ability requirement
  const martAbil = character.mart_abil ?? character.archetype?.mart_abil;
  if (feat.mart_abil_req && martAbil !== feat.mart_abil_req) {
    reasons.push(`Requires ${feat.mart_abil_req} martial ability`);
  }

  // Speed requirement
  if (feat.speed_req != null && feat.speed_req > 0) {
    const speed = calculateSpeed(abilities.agility || 0, character.speedBase);
    if (speed < feat.speed_req) reasons.push(`Requires Speed ${feat.speed_req}+`);
  }

  // Leveled-feat prerequisite: requires the previous level by id.
  const prevLevelId = getPreviousLevelFeatId(feat, allFeats);
  if (prevLevelId) {
    const ownedFeatIds = new Set(
      [...(character.feats || []), ...(character.archetypeFeats || [])].map((f) =>
        String(f.id ?? (f as { name?: string }).name)
      )
    );
    if (!ownedFeatIds.has(prevLevelId)) {
      const prevFeat = allFeats.find((f) => String(f.id) === prevLevelId);
      const prevLevel = getFeatLevel(prevFeat);
      reasons.push(`Requires ${prevFeat?.name ?? 'previous level'} (Level ${prevLevel})`);
    }
  }

  return {
    met: reasons.length === 0,
    reason: reasons.length > 0 ? reasons.join(', ') : undefined,
    reasons,
  };
}
