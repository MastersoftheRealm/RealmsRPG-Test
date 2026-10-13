/**
 * Trait names on the sheet come from the codex catalog.
 * While that catalog is still loading, a stored numeric id is not a name.
 */

export function traitIdPendingCatalogName(
  stored: string,
  resolvedName: string | undefined,
  catalogLoading: boolean,
): boolean {
  if (resolvedName?.trim()) return false;
  if (!catalogLoading) return false;
  return /^\d+$/.test(String(stored ?? '').trim());
}
