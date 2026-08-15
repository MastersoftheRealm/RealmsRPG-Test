import type { Species } from '@/hooks';

/** Normalized size options for a species (legacy `size` or `sizes[]`). */
export function getSpeciesSizeOptions(species: Species): string[] {
  const fromArray = (species.sizes ?? []).map((s) => String(s).trim()).filter(Boolean);
  if (fromArray.length > 0) return fromArray;
  const legacy = species.size?.trim();
  if (legacy) return [legacy];
  return [];
}
