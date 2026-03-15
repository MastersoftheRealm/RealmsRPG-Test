import type { Archetype, ArchetypePathData, ArchetypePathRecommendations, PathItemRecommendation } from '@/types/archetype';

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
  archetype: Archetype | undefined,
  level: number
): ArchetypePathRecommendations | undefined {
  if (!archetype?.path_data) return undefined;
  if (level <= 1) return archetype.path_data.level1;
  return archetype.path_data.levels?.find((entry) => entry.level === level);
}
