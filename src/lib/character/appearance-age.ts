const AGE_IN_APPEARANCE = /^Age:\s*(\d+)\s*(?:\n|$)/;

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

export function resolveCharacterAge(age?: string, appearance?: string): string {
  const trimmed = age?.trim();
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
  const existingAge = typeof data.age === 'string' ? data.age.trim() : '';
  const resolvedAge = existingAge || parseAgeFromAppearance(appearance);

  if (resolvedAge) {
    data.age = resolvedAge;
  }

  if (!appearance || !AGE_IN_APPEARANCE.test(appearance)) return;

  const stripped = stripAgeFromAppearance(appearance);
  if (stripped) data.appearance = stripped;
  else delete data.appearance;
}

export { AGE_IN_APPEARANCE };
