const AGE_IN_APPEARANCE = /^Age:\s*(\d+)\s*(?:\n|$)/;

export function parseAgeFromAppearance(appearance?: string): string {
  const match = appearance?.match(AGE_IN_APPEARANCE);
  return match?.[1] ?? '';
}

/** Remove legacy `Age: N` prefix merged into appearance before TASK-886. */
export function stripAgeFromAppearance(appearance?: string): string {
  return appearance?.replace(AGE_IN_APPEARANCE, '').trim() ?? '';
}

export function resolveCharacterAge(age?: string, appearance?: string): string {
  const trimmed = age?.trim();
  if (trimmed) return trimmed;
  return parseAgeFromAppearance(appearance);
}

export function resolveCharacterAppearance(appearance?: string): string {
  return stripAgeFromAppearance(appearance);
}

/** Creator `description` predates dedicated `backstory` on the character JSON. */
export function resolveCharacterBackstory(backstory?: string, description?: string): string {
  const trimmed = backstory?.trim();
  if (trimmed) return trimmed;
  return description?.trim() ?? '';
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
