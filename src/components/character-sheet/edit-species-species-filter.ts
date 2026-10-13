import type { SourceFilterValue } from '@/components/patterns/filters/source-filter';

export function filterSheetSpecies<T extends { id: string; name: string }>(
  allSpecies: readonly T[],
  userSpeciesIds: ReadonlySet<string>,
  source: SourceFilterValue,
  query: string,
): T[] {
  const bySource =
    source === 'my'
      ? allSpecies.filter((species) => userSpeciesIds.has(species.id))
      : source === 'public'
        ? allSpecies.filter((species) => !userSpeciesIds.has(species.id))
        : [...allSpecies];
  const needle = query.trim().toLowerCase();
  if (!needle) return bySource;
  return bySource.filter((species) => species.name.toLowerCase().includes(needle));
}
