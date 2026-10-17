/**
 * Species codex size options (legacy single `size` or `sizes[]`).
 */

export function getSpeciesSizeOptions(species: {
  size?: string | null | undefined;
  sizes?: string[] | null | undefined;
}): string[] {
  const fromArray = (species.sizes ?? []).map((s) => String(s).trim()).filter(Boolean);
  if (fromArray.length > 0) return fromArray;
  const legacy = species.size?.trim();
  if (legacy) return [legacy];
  return [];
}
