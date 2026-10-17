import type { Species } from '@/hooks';
import { getSpeciesSizeOptions as getSpeciesSizeOptionsFromLib } from '@/lib/ancestry/species-size-options';

/** Normalized size options for a species (legacy `size` or `sizes[]`). */
export function getSpeciesSizeOptions(species: Species): string[] {
  return getSpeciesSizeOptionsFromLib(species);
}
