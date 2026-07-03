/**
 * Normalize codex feat `ability` (sorting/filtering) from DB or legacy shapes.
 * Stored as comma-separated TEXT; legacy rows may use slash separators.
 */

/** Split a stored ability string on comma or slash delimiters. */
function splitAbilityToken(token: string): string[] {
  const s = token.trim();
  if (!s) return [];
  if (s.includes(',') || s.includes('/')) {
    return s
      .split(/[,/]/)
      .map((part) => part.trim())
      .filter(Boolean);
  }
  return [s];
}

/**
 * Normalize feat sorting abilities to a flat list of display names.
 * Handles arrays, comma-separated strings, and legacy slash-separated values.
 */
export function normalizeFeatAbilities(
  ability: string | string[] | null | undefined
): string[] {
  if (ability == null || ability === '') return [];
  const raw = Array.isArray(ability) ? ability : [String(ability)];
  const out: string[] = [];
  for (const item of raw) {
    out.push(...splitAbilityToken(String(item)));
  }
  return out;
}
