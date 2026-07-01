import type { ArchetypePathData, ArchetypePathRecommendations, PathGuidanceGroup, PathItemRecommendation, PathLoadout } from '@/types/archetype';
import type { AbilityName } from '@/types/abilities';

const ABILITY_NAMES: AbilityName[] = ['strength', 'vitality', 'agility', 'acuity', 'intelligence', 'charisma'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toStringArray(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
  }
  return [];
}

/** Parse "id" or "id:qty" strings into { id, quantity } (qty default 1). */
function parseIdQuantityArray(arr: string[]): PathItemRecommendation[] {
  return arr.map((s) => {
    const colon = s.indexOf(':');
    if (colon < 0) return { id: s.trim(), quantity: 1 };
    const id = s.slice(0, colon).trim();
    const q = parseInt(s.slice(colon + 1).trim(), 10);
    return { id, quantity: Number.isFinite(q) && q >= 1 ? q : 1 };
  }).filter((e) => e.id.length > 0);
}

function parseLevel(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseRecommendedAbilities(value: unknown): Partial<Record<AbilityName, number>> | undefined {
  if (!isRecord(value)) return undefined;
  const result: Partial<Record<AbilityName, number>> = {};
  for (const ability of ABILITY_NAMES) {
    const raw = value[ability];
    if (raw == null) continue;
    const num = Number(raw);
    if (Number.isFinite(num)) result[ability] = num;
  }
  return Object.keys(result).length > 0 ? result : undefined;
}

function parseIdQuantityObjects(value: unknown): PathItemRecommendation[] {
  if (Array.isArray(value)) {
    const fromObjects = value
      .map((entry) => {
        if (!isRecord(entry)) return null;
        const id = entry.id != null ? String(entry.id).trim() : '';
        if (!id) return null;
        const q = entry.quantity != null ? Number(entry.quantity) : 1;
        return { id, quantity: Number.isFinite(q) && q >= 1 ? q : 1 };
      })
      .filter((entry): entry is PathItemRecommendation => entry !== null);
    if (fromObjects.length > 0) return fromObjects;
  }
  return parseIdQuantityArray(toStringArray(value));
}

function parseLoadouts(value: unknown): PathLoadout[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const loadouts = value
    .map((entry) => {
      if (!isRecord(entry)) return null;
      const id = typeof entry.id === 'string' ? entry.id : typeof entry.title === 'string' ? entry.title : null;
      const title = typeof entry.title === 'string' ? entry.title : id;
      if (!id || !title) return null;
      const loadout: PathLoadout = {
        id,
        title,
        ...(typeof entry.why === 'string' ? { why: entry.why } : {}),
        armaments: parseIdQuantityObjects(entry.armaments),
        armor: parseIdQuantityObjects(entry.armor),
        equipment: parseIdQuantityObjects(entry.equipment),
      };
      return loadout;
    })
    .filter((l): l is PathLoadout => l !== null);
  return loadouts.length > 0 ? loadouts : undefined;
}

function parseGuidanceGroups(value: unknown): PathGuidanceGroup[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const groups = value
    .map((entry) => {
      if (!isRecord(entry)) return null;
      const id = typeof entry.id === 'string' ? entry.id : typeof entry.title === 'string' ? entry.title : null;
      const title = typeof entry.title === 'string' ? entry.title : id;
      if (!id || !title) return null;
      const group: PathGuidanceGroup = {
        id,
        title,
        ...(typeof entry.why === 'string' ? { why: entry.why } : {}),
        feats: toStringArray(entry.feats),
        powers: toStringArray(entry.powers),
        techniques: toStringArray(entry.techniques),
        armaments: toStringArray(entry.armaments),
        equipment: toStringArray(entry.equipment),
      };
      return group;
    })
    .filter((g): g is PathGuidanceGroup => g !== null);
  return groups.length > 0 ? groups : undefined;
}

export function parseArchetypePathData(value: unknown): ArchetypePathData | undefined {
  if (!value) return undefined;

  let raw: unknown = value;
  if (typeof value === 'string') {
    try {
      raw = JSON.parse(value);
    } catch {
      return undefined;
    }
  }

  if (!isRecord(raw)) return undefined;

  const level1Raw = isRecord(raw.level1) ? raw.level1 : undefined;
  const levelsRaw = Array.isArray(raw.levels) ? raw.levels : [];

  const level1: ArchetypePathData['level1'] | undefined = level1Raw
    ? (() => {
        const armamentsStr = toStringArray(level1Raw.armaments);
        const equipmentStr = toStringArray(level1Raw.equipment);
        return {
        feats: toStringArray(level1Raw.feats),
        skills: toStringArray(level1Raw.skills),
        powers: toStringArray(level1Raw.powers),
        techniques: toStringArray(level1Raw.techniques),
        armaments: armamentsStr,
        equipment: equipmentStr,
        armamentRecommendations: parseIdQuantityArray(armamentsStr),
        equipmentRecommendations: parseIdQuantityArray(equipmentStr),
        recommendUnarmedProwess: level1Raw.recommendUnarmedProwess === true,
        removeFeats: toStringArray(level1Raw.removeFeats),
        removePowers: toStringArray(level1Raw.removePowers),
        removeTechniques: toStringArray(level1Raw.removeTechniques),
        removeArmaments: toStringArray(level1Raw.removeArmaments),
        notes: typeof level1Raw.notes === 'string' ? level1Raw.notes : undefined,
        recommended_species: toStringArray(level1Raw.recommended_species),
        guidance_groups: parseGuidanceGroups(level1Raw.guidance_groups),
        recommended_abilities: parseRecommendedAbilities(level1Raw.recommended_abilities),
        loadouts: parseLoadouts(level1Raw.loadouts),
        proficiency: isRecord(level1Raw.proficiency)
          ? {
              power:
                level1Raw.proficiency.power != null
                  ? Number(level1Raw.proficiency.power)
                  : undefined,
              martial:
                level1Raw.proficiency.martial != null
                  ? Number(level1Raw.proficiency.martial)
                  : undefined,
            }
          : undefined,
      };
      })()
    : undefined;

  const levels = levelsRaw
    .map((entry) => {
      if (!isRecord(entry)) return null;
      const level = parseLevel(entry.level);
      if (level == null) return null;
      return {
        level,
        feats: toStringArray(entry.feats),
        skills: toStringArray(entry.skills),
        powers: toStringArray(entry.powers),
        techniques: toStringArray(entry.techniques),
        armaments: toStringArray(entry.armaments),
        equipment: toStringArray(entry.equipment),
        removeFeats: toStringArray(entry.removeFeats),
        removePowers: toStringArray(entry.removePowers),
        removeTechniques: toStringArray(entry.removeTechniques),
        removeArmaments: toStringArray(entry.removeArmaments),
        notes: typeof entry.notes === 'string' ? entry.notes : undefined,
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
    .sort((a, b) => a.level - b.level);

  if (!level1 && levels.length === 0) return undefined;
  return { level1, levels };
}

export function getPathRecommendationsForLevel(
  archetype: { path_data?: ArchetypePathData } | undefined,
  level: number
): ArchetypePathRecommendations | undefined {
  if (!archetype?.path_data) return undefined;
  if (level <= 1) return archetype.path_data.level1;
  return archetype.path_data.levels?.find((entry) => entry.level === level);
}

/** Level 1 has at least one add recommendation (feat/skill/power/technique/armament/equipment). */
export function pathLevel1HasAddRecommendations(
  level1: ArchetypePathRecommendations | undefined
): boolean {
  if (!level1) return false;
  return Boolean(
    level1.feats?.length ||
      level1.skills?.length ||
      level1.powers?.length ||
      level1.techniques?.length ||
      level1.armaments?.length ||
      level1.equipment?.length
  );
}

/** Paths shown in character creator picker, public codex list, and path switcher. */
export function pathHasPlayerVisibleLevel1(pathData: ArchetypePathData | undefined): boolean {
  return pathLevel1HasAddRecommendations(pathData?.level1);
}

/** Level 1 has notes, remove lists, or unarmed prowess but no add recommendations. */
export function pathLevel1HasNonPickerContent(
  level1: ArchetypePathRecommendations | undefined
): boolean {
  if (!level1) return false;
  return Boolean(
    level1.notes?.trim() ||
      level1.recommendUnarmedProwess ||
      level1.removeFeats?.length ||
      level1.removePowers?.length ||
      level1.removeTechniques?.length ||
      level1.removeArmaments?.length
  );
}

/** Admin-only paths: saved in codex but hidden from player path pickers. */
export function pathHiddenFromPlayerPicker(pathData: ArchetypePathData | undefined): boolean {
  return pathLevel1HasNonPickerContent(pathData?.level1) && !pathHasPlayerVisibleLevel1(pathData);
}
