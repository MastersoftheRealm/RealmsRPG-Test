/**
 * Admin Codex — archetype write payload builders.
 * Pure row builders shared by the save action and the read/write parity test, so the
 * columns the save path writes can never drift from the columns `/api/codex` reads.
 */

export type ArchetypeLevelPayload = {
  level: number;
  feats?: string;
  skills?: string;
  powers?: string;
  techniques?: string;
  armaments?: string;
  equipment?: string;
  remove_feats?: string;
  remove_powers?: string;
  remove_techniques?: string;
  remove_armaments?: string;
  notes?: string;
};

export type SaveArchetypeWithPathInput = {
  id?: string;
  name: string;
  type: 'power' | 'martial' | 'powered-martial';
  description?: string;
  archetype_ability?: string;
  secondary_ability?: string;
  power_prof_start?: number;
  martial_prof_start?: number;
  power_prof_level5?: number;
  martial_prof_level5?: number;
  level1_feats?: string;
  level1_skills?: string;
  level1_powers?: string;
  level1_innate_powers?: string;
  level1_techniques?: string;
  level1_armaments?: string;
  level1_equipment?: string;
  level1_recommend_unarmed_prowess?: boolean;
  level1_remove_feats?: string;
  level1_remove_powers?: string;
  level1_remove_techniques?: string;
  level1_remove_armaments?: string;
  level1_notes?: string;
  level1_guidance_groups?: unknown;
  level1_recommended_abilities?: unknown;
  level1_loadouts?: unknown;
  levels: ArchetypeLevelPayload[];
};

/** Lowest level stored in codex_archetype_levels (level 1 lives in columns on the archetype). */
export const MIN_ARCHETYPE_LEVEL = 2;

export function buildArchetypeRow(
  id: string,
  payload: SaveArchetypeWithPathInput
): Record<string, unknown> {
  return {
    id,
    name: payload.name,
    type: payload.type,
    description: payload.description ?? null,
    archetype_ability: payload.archetype_ability ?? null,
    secondary_ability: payload.secondary_ability ?? null,
    power_prof_start: payload.power_prof_start ?? null,
    martial_prof_start: payload.martial_prof_start ?? null,
    power_prof_level5: payload.power_prof_level5 ?? null,
    martial_prof_level5: payload.martial_prof_level5 ?? null,
    level1_feats: payload.level1_feats ?? null,
    level1_skills: payload.level1_skills ?? null,
    level1_powers: payload.level1_powers ?? null,
    level1_innate_powers: payload.level1_innate_powers ?? null,
    level1_techniques: payload.level1_techniques ?? null,
    level1_armaments: payload.level1_armaments ?? null,
    level1_equipment: payload.level1_equipment ?? null,
    level1_recommend_unarmed_prowess: payload.level1_recommend_unarmed_prowess ?? false,
    level1_remove_feats: payload.level1_remove_feats ?? null,
    level1_remove_powers: payload.level1_remove_powers ?? null,
    level1_remove_techniques: payload.level1_remove_techniques ?? null,
    level1_remove_armaments: payload.level1_remove_armaments ?? null,
    level1_notes: payload.level1_notes ?? null,
    level1_guidance_groups: payload.level1_guidance_groups ?? null,
    level1_recommended_abilities: payload.level1_recommended_abilities ?? null,
    level1_loadouts: payload.level1_loadouts ?? null,
  };
}

export function buildArchetypeLevelRows(
  archetypeId: string,
  levels: ArchetypeLevelPayload[]
): Record<string, unknown>[] {
  return levels
    .filter((entry) => Number.isFinite(entry.level) && entry.level >= MIN_ARCHETYPE_LEVEL)
    .map((entry) => ({
      archetype_id: archetypeId,
      level: entry.level,
      feats: entry.feats ?? null,
      skills: entry.skills ?? null,
      powers: entry.powers ?? null,
      techniques: entry.techniques ?? null,
      armaments: entry.armaments ?? null,
      equipment: entry.equipment ?? null,
      remove_feats: entry.remove_feats ?? null,
      remove_powers: entry.remove_powers ?? null,
      remove_techniques: entry.remove_techniques ?? null,
      remove_armaments: entry.remove_armaments ?? null,
      notes: entry.notes ?? null,
    }));
}

/** Level rows restored on rollback keep their original primary keys and timestamps. */
export function restorableLevelRows(snapshot: Record<string, unknown>[]): Record<string, unknown>[] {
  return snapshot.map((row) => ({ ...row }));
}
