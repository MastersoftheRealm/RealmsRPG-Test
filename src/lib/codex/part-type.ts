/**
 * Power vs technique split for `codex_parts` rows.
 *
 * Shared by GET /api/codex (full payload) and the `['codex', 'parts']` hooks so the
 * `powerParts` / `techniqueParts` slices cannot drift from one another (TASK-775).
 */

/** Rows arrive with `type` normalized to power/technique; blank stays in both lists. */
interface PartTypeRow {
  type?: string;
}

export function selectPowerParts<T extends PartTypeRow>(parts: readonly T[]): T[] {
  return parts.filter((part) => (part.type || 'power').toLowerCase() === 'power');
}

export function selectTechniqueParts<T extends PartTypeRow>(parts: readonly T[]): T[] {
  return parts.filter((part) => (part.type || 'technique').toLowerCase() === 'technique');
}
