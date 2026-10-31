import { clampTextToLength } from '@/lib/character/character-name-limit';

/** Free-text character age (JSONB `data.age`, TASK-886 / 86e3jw2mg). */
export const CHARACTER_AGE_MAX_LENGTH = 150;

const AGE_IN_APPEARANCE = /^Age:\s*(\d+)\s*(?:\n|$)/;

/** Coerce persisted JSON age (string or legacy number) for display and save. */
export function coerceCharacterAgeValue(age: unknown): string {
  if (age === null || age === undefined) return '';
  if (typeof age === 'number' && Number.isFinite(age)) return String(age).trim();
  if (typeof age === 'string') return age.trim();
  return '';
}

export function clampCharacterAgeInput(value: string): string {
  return clampTextToLength(value, CHARACTER_AGE_MAX_LENGTH).value;
}

export function parseAgeFromAppearance(appearance?: string): string {
  const match = appearance?.match(AGE_IN_APPEARANCE);
  return match?.[1] ?? '';
}

/** Appearance body after a legacy `Age: N` line, including spaces and line breaks. */
function appearanceBody(appearance?: string): string {
  return appearance?.replace(AGE_IN_APPEARANCE, '') ?? '';
}

/** Remove legacy `Age: N` prefix merged into appearance before TASK-886. */
export function stripAgeFromAppearance(appearance?: string): string {
  return appearanceBody(appearance).trim();
}

export function resolveCharacterAge(age?: unknown, appearance?: string): string {
  const trimmed = coerceCharacterAgeValue(age);
  if (trimmed) return trimmed;
  return parseAgeFromAppearance(appearance);
}

export function resolveCharacterAppearance(appearance?: string): string {
  return appearanceBody(appearance);
}

/**
 * Value stored while Appearance is edited. Keeps spaces and line breaks.
 * A finished legacy `Age: N` line is still removed; save-time trim stays on
 * `stripAgeFromAppearance`.
 */
export function appearanceDraftFromEdit(value: string): string | undefined {
  const next = appearanceBody(value);
  return next.length > 0 ? next : undefined;
}

/** Creator `description` predates dedicated `backstory` on the character JSON. */
export function resolveCharacterBackstory(backstory?: string, description?: string): string {
  if (typeof backstory === 'string' && backstory.length > 0) return backstory;
  return description?.trim() ?? '';
}

/** Value stored while Backstory is edited. Keeps spaces and line breaks. */
export function backstoryDraftFromEdit(value: string): string | undefined {
  return value.length > 0 ? value : undefined;
}

/**
 * Save-time migration (TASK-886): promote legacy `Age: N` prefix into `age` and strip it from
 * `appearance` so persisted JSON stops duplicating age in both fields.
 */
export function normalizeAgeAppearanceForSave(data: Record<string, unknown>): void {
  const appearance = typeof data.appearance === 'string' ? data.appearance : undefined;
  const existingAge = coerceCharacterAgeValue(data.age);
  const resolvedAge = clampCharacterAgeInput(existingAge || parseAgeFromAppearance(appearance));

  if (resolvedAge) {
    data.age = resolvedAge;
  } else {
    delete data.age;
  }

  if (!appearance || !AGE_IN_APPEARANCE.test(appearance)) return;

  const stripped = stripAgeFromAppearance(appearance);
  if (stripped) data.appearance = stripped;
  else delete data.appearance;
}
