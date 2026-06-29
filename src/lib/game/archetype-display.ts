import type { SupabaseClient } from '@supabase/supabase-js';
import { parseArchetypePathData } from '@/lib/game/archetype-path';
import type { Archetype, ArchetypeCategory, Character, CharacterArchetype } from '@/types';

const FORGE_ARCHETYPE_IDS = new Set(['power', 'martial', 'powered-martial']);

/** Id used to look up codex_archetypes (path id preferred). */
export function getArchetypeCodexLookupId(
  data: Pick<Character, 'archetypePathId' | 'archetype'> | undefined
): string | undefined {
  if (!data) return undefined;
  const pathId = data.archetypePathId?.trim();
  if (pathId) return pathId;
  const archId = data.archetype?.id?.trim();
  if (archId && !FORGE_ARCHETYPE_IDS.has(archId)) return archId;
  return undefined;
}

export function formatArchetypeCategoryName(type?: string): string | null {
  if (!type) return null;
  return type
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/** Display name: codex path name, saved name, or formatted category type. */
export function resolveArchetypeDisplayName(
  data:
    | {
        archetypePathId?: string;
        archetype?: { id?: string; name?: string; type?: string };
      }
    | undefined,
  codexNameById?: Map<string, string>
): string | null {
  if (!data?.archetype?.type && !data?.archetype?.id && !data?.archetypePathId) return null;
  const lookupId = getArchetypeCodexLookupId(
    data as Pick<Character, 'archetypePathId' | 'archetype'>
  );
  if (lookupId && codexNameById?.get(lookupId)) {
    return codexNameById.get(lookupId) ?? null;
  }
  if (data.archetype?.name) return data.archetype.name;
  return formatArchetypeCategoryName(data.archetype?.type);
}

export async function fetchArchetypeNameMap(
  supabase: SupabaseClient
): Promise<Map<string, string>> {
  const { data, error } = await supabase.from('codex_archetypes').select('id, name');
  if (error) {
    return new Map();
  }
  const map = new Map<string, string>();
  for (const row of data ?? []) {
    const id = row.id != null ? String(row.id) : '';
    const name = row.name != null ? String(row.name).trim() : '';
    if (id && name) map.set(id, name);
  }
  return map;
}

function rowToArchetype(row: Record<string, unknown>): Archetype {
  return {
    id: String(row.id ?? ''),
    name: String(row.name ?? ''),
    type: (row.type as ArchetypeCategory) || 'power',
    description: row.description ? String(row.description) : undefined,
    archetype_ability: row.archetype_ability as Archetype['archetype_ability'],
    secondary_ability: row.secondary_ability as Archetype['secondary_ability'],
    power_prof_start: row.power_prof_start != null ? Number(row.power_prof_start) : undefined,
    martial_prof_start: row.martial_prof_start != null ? Number(row.martial_prof_start) : undefined,
    power_prof_level5: row.power_prof_level5 != null ? Number(row.power_prof_level5) : undefined,
    martial_prof_level5: row.martial_prof_level5 != null ? Number(row.martial_prof_level5) : undefined,
    path_data: parseArchetypePathData(row.path_data),
  };
}

/** Fetch a single archetype with path_data composed like GET /api/codex (minimal columns). */
export async function fetchCodexArchetypeById(
  supabase: SupabaseClient,
  id: string
): Promise<Archetype | null> {
  if (!id.trim()) return null;

  const { data: row, error } = await supabase
    .from('codex_archetypes')
    .select(
      'id, name, type, description, archetype_ability, secondary_ability, power_prof_start, martial_prof_start, power_prof_level5, martial_prof_level5, path_data, level1_feats, level1_skills, level1_powers, level1_techniques, level1_armaments, level1_equipment, level1_recommend_unarmed_prowess, level1_remove_feats, level1_remove_powers, level1_remove_techniques, level1_remove_armaments, level1_notes, level1_recommended_species, level1_guidance_groups'
    )
    .eq('id', id.trim())
    .maybeSingle();

  if (error || !row) return null;

  const { data: levelRows } = await supabase
    .from('codex_archetype_levels')
    .select('*')
    .eq('archetype_id', id.trim());

  const toStrArray = (v: unknown): string[] => {
    if (!v) return [];
    if (Array.isArray(v)) return v.map(String).filter(Boolean);
    if (typeof v === 'string') {
      return v
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }
    return [];
  };

  const levels = (levelRows ?? [])
    .map((entry) => ({
      level: Number(entry.level),
      feats: toStrArray(entry.feats),
      skills: toStrArray(entry.skills),
      powers: toStrArray(entry.powers),
      techniques: toStrArray(entry.techniques),
      armaments: toStrArray(entry.armaments),
      equipment: toStrArray(entry.equipment),
      removeFeats: toStrArray(entry.remove_feats),
      removePowers: toStrArray(entry.remove_powers),
      removeTechniques: toStrArray(entry.remove_techniques),
      removeArmaments: toStrArray(entry.remove_armaments),
      notes: entry.notes ? String(entry.notes) : undefined,
    }))
    .filter((e) => Number.isFinite(e.level))
    .sort((a, b) => a.level - b.level);

  const r = row as Record<string, unknown>;
  const legacyPath =
    r.path_data && typeof r.path_data === 'object'
      ? (r.path_data as Record<string, unknown>)
      : undefined;
  const level1FromLegacy =
    legacyPath && typeof legacyPath.level1 === 'object' && legacyPath.level1 !== null
      ? (legacyPath.level1 as Record<string, unknown>)
      : undefined;

  const level1Raw: Record<string, unknown> = {
    feats: toStrArray(r.level1_feats),
    skills: toStrArray(r.level1_skills),
    powers: toStrArray(r.level1_powers),
    techniques: toStrArray(r.level1_techniques),
    armaments: toStrArray(r.level1_armaments),
    equipment: toStrArray(r.level1_equipment),
    recommendUnarmedProwess: r.level1_recommend_unarmed_prowess === true,
    removeFeats: toStrArray(r.level1_remove_feats),
    removePowers: toStrArray(r.level1_remove_powers),
    removeTechniques: toStrArray(r.level1_remove_techniques),
    removeArmaments: toStrArray(r.level1_remove_armaments),
    notes: r.level1_notes ? String(r.level1_notes) : undefined,
    recommended_species: toStrArray(
      r.level1_recommended_species ?? level1FromLegacy?.recommended_species
    ),
    guidance_groups: r.level1_guidance_groups ?? level1FromLegacy?.guidance_groups,
  };
  const level1FromColumns = parseArchetypePathData({ level1: level1Raw })?.level1;

  const hasLevel1 = Boolean(
    level1FromColumns &&
      Object.entries(level1FromColumns).some(([key, value]) => {
        if (key === 'recommendUnarmedProwess') return value === true;
        if (key === 'armamentRecommendations' || key === 'equipmentRecommendations') return false;
        if (Array.isArray(value)) return value.length > 0;
        return Boolean(value);
      })
  );

  const legacyPathOnly =
    legacyPath && typeof legacyPath === 'object' ? legacyPath : undefined;

  const path_data = hasLevel1 || levels.length > 0
    ? {
        ...(hasLevel1 && level1FromColumns ? { level1: level1FromColumns } : {}),
        ...(levels.length > 0 ? { levels } : {}),
      }
    : parseArchetypePathData(legacyPathOnly ?? r.path_data);

  return {
    ...rowToArchetype({ ...r, path_data }),
    path_data,
  };
}

/** Merge codex display fields onto character for UI (does not change saved lean id/type). */
export function mergeArchetypeFromCodex(
  character: Character,
  codexArchetype: Archetype | null | undefined
): Character {
  if (!codexArchetype || !character.archetype) return character;

  const mergedArch: CharacterArchetype = {
    ...character.archetype,
    name: codexArchetype.name || character.archetype.name,
    description: codexArchetype.description ?? character.archetype.description,
    path_data: codexArchetype.path_data ?? character.archetype.path_data,
    archetype_ability: codexArchetype.archetype_ability ?? character.archetype.archetype_ability,
    secondary_ability: codexArchetype.secondary_ability ?? character.archetype.secondary_ability,
    power_prof_start: codexArchetype.power_prof_start ?? character.archetype.power_prof_start,
    martial_prof_start: codexArchetype.martial_prof_start ?? character.archetype.martial_prof_start,
    power_prof_level5: codexArchetype.power_prof_level5 ?? character.archetype.power_prof_level5,
    martial_prof_level5: codexArchetype.martial_prof_level5 ?? character.archetype.martial_prof_level5,
  };

  return { ...character, archetype: mergedArch };
}

/** When a path character reaches level 5+, apply admin level-5 prof targets if set (floor, not override higher values). */
export function applyPathProficiencyForLevel(
  character: Character,
  newLevel: number,
  pathArchetype?: CharacterArchetype | null
): { pow_prof: number; mart_prof: number } | null {
  if (newLevel < 5) return null;
  if (character.creationMode !== 'path' && !character.archetypePathId) return null;

  const arch = pathArchetype ?? character.archetype;
  const powTarget = arch?.power_prof_level5;
  const martTarget = arch?.martial_prof_level5;
  const hasPowTarget = powTarget != null && powTarget > 0;
  const hasMartTarget = martTarget != null && martTarget > 0;
  if (!hasPowTarget && !hasMartTarget) return null;

  const currentPow = character.pow_prof ?? character.powerProficiency ?? 0;
  const currentMart = character.mart_prof ?? character.martialProficiency ?? 0;
  const nextPow = hasPowTarget ? Math.max(currentPow, powTarget!) : currentPow;
  const nextMart = hasMartTarget ? Math.max(currentMart, martTarget!) : currentMart;

  if (nextPow === currentPow && nextMart === currentMart) return null;
  return { pow_prof: nextPow, mart_prof: nextMart };
}
