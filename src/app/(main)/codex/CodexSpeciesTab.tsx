/**
 * Codex Species Tab
 * =================
 * Species list with filters: search, type, size.
 */

'use client';

import { useState, useMemo } from 'react';
import { formatListCellLabel } from '@/lib/utils';
import { ChipSelect } from '@/components/patterns/filters';
import {
  CodexBrowseListShell,
  ErrorDisplay as ErrorState,
  GridListRow,
} from '@/components/patterns';
import type { ColumnValue } from '@/components/patterns/list/grid-list-row';
import { useSort, sortByColumn } from '@/hooks/use-sort';

const SPECIES_GRID_COLUMNS = '1.5fr 1fr 0.8fr 1fr';
const SPECIES_COLUMNS = [
  { key: 'name', label: 'NAME' },
  { key: 'type', label: 'TYPE' },
  { key: 'sizes', label: 'SIZES' },
  // Description column should be left-aligned while other non-name columns are centered
  { key: '_desc', label: 'DESCRIPTION', align: 'left' as const },
];
import {
  useSpecies,
  useUserSpecies,
  userSpeciesToSpecies,
  useTraits,
  useCodexSkills,
  resolveTraitIds,
  type Species,
  type Trait,
} from '@/hooks';
import { buildSkillIdToName } from '@/lib/codex/skill-list';
import { resolveSpeciesListRowThumbnail } from '@/lib/list-row-image';

interface SpeciesFilters {
  search: string;
  types: string[];
  sizes: string[];
}

function SpeciesCard({
  species,
  allTraits,
  skillIdToName,
}: {
  species: Species;
  allTraits: Trait[];
  skillIdToName: Map<string, string>;
}) {
  const speciesTraits = useMemo(
    () => resolveTraitIds(species.species_traits || [], allTraits),
    [species.species_traits, allTraits],
  );
  const ancestryTraits = useMemo(
    () => resolveTraitIds(species.ancestry_traits || [], allTraits),
    [species.ancestry_traits, allTraits],
  );
  const flaws = useMemo(
    () => resolveTraitIds(species.flaws || [], allTraits),
    [species.flaws, allTraits],
  );
  const characteristics = useMemo(
    () => resolveTraitIds(species.characteristics || [], allTraits),
    [species.characteristics, allTraits],
  );

  const speciesSkillNames = useMemo(() => {
    if (!species.skills?.length) return [];
    return species.skills.map((skillId) => skillIdToName.get(String(skillId)) || String(skillId));
  }, [species.skills, skillIdToName]);

  const columns: ColumnValue[] = [
    { key: 'type', value: formatListCellLabel(species.type) },
    {
      key: 'sizes',
      value: species.sizes?.length
        ? species.sizes.map((sz) => formatListCellLabel(sz)).join(', ')
        : '-',
    },
    {
      key: '_desc',
      value: species.description ? `${species.description.substring(0, 60)}...` : '-',
      align: 'left',
    },
  ];

  return (
    <GridListRow
      id={String(species.id ?? '')}
      name={species.name}
      thumbnail={resolveSpeciesListRowThumbnail(species)}
      description={species.description}
      gridColumns={SPECIES_GRID_COLUMNS}
      columns={columns}
      expandedContent={
        <div className="space-y-4">
          {species.description && <p className="text-text-secondary">{species.description}</p>}

          <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
            {species.ave_height != null && Number(species.ave_height) > 0 && (
              <div>
                <span className="font-medium">Avg Height:</span> {species.ave_height} cm
              </div>
            )}
            {species.ave_weight != null && Number(species.ave_weight) > 0 && (
              <div>
                <span className="font-medium">Avg Weight:</span> {species.ave_weight} kg
              </div>
            )}
            {species.adulthood_lifespan?.[0] != null && (
              <div>
                <span className="font-medium">Adulthood:</span> {species.adulthood_lifespan[0]} yr
              </div>
            )}
            {species.adulthood_lifespan?.[1] != null && (
              <div>
                <span className="font-medium">Lifespan (max):</span> {species.adulthood_lifespan[1]}{' '}
                yr
              </div>
            )}
            {species.languages?.length > 0 && (
              <div>
                <span className="font-medium">Languages:</span> {species.languages.join(', ')}
              </div>
            )}
            {speciesSkillNames.length > 0 && (
              <div>
                <span className="font-medium">Skills:</span> {speciesSkillNames.join(', ')}
              </div>
            )}
          </div>

          {speciesTraits.length > 0 && (
            <div>
              <h3 className="mb-2 font-medium text-text-primary">Species Traits</h3>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
                {speciesTraits.map((trait: Trait) => (
                  <div
                    key={trait.id}
                    className="rounded border border-info-200 bg-info-50 p-2 dark:border-info-700/50 dark:bg-info-900/30"
                  >
                    <span className="font-medium text-info-fg">{trait.name}</span>
                    {trait.description && (
                      <p className="mt-1 text-sm text-info-fg">{trait.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {ancestryTraits.length > 0 && (
            <div>
              <h3 className="mb-2 font-medium text-text-primary">Ancestry Traits</h3>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
                {ancestryTraits.map((trait: Trait) => (
                  <div
                    key={trait.id}
                    className="rounded border border-success-200 bg-success-50 p-2 dark:border-success-700/50 dark:bg-success-900/30"
                  >
                    <span className="font-medium text-success-fg">{trait.name}</span>
                    {trait.description && (
                      <p className="mt-1 text-sm text-success-fg">{trait.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {flaws.length > 0 && (
            <div>
              <h3 className="mb-2 font-medium text-text-primary">Flaws</h3>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
                {flaws.map((trait: Trait) => (
                  <div
                    key={trait.id}
                    className="rounded border border-danger-200 bg-danger-50 p-2 dark:border-danger-700/50 dark:bg-danger-900/30"
                  >
                    <span className="font-medium text-danger-fg">{trait.name}</span>
                    {trait.description && (
                      <p className="mt-1 text-sm text-danger-fg">{trait.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {characteristics.length > 0 && (
            <div>
              <h3 className="mb-2 font-medium text-text-primary">Characteristics</h3>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
                {characteristics.map((trait: Trait) => (
                  <div
                    key={trait.id}
                    className="dark:bg-power-900/30 rounded border border-power-border bg-power-light p-2"
                  >
                    <span className="font-medium text-power-fg">{trait.name}</span>
                    {trait.description && (
                      <p className="mt-1 text-sm text-text-secondary">{trait.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      }
    />
  );
}

export function CodexSpeciesTab({ codexMode = 'public' }: { codexMode?: 'public' | 'my' }) {
  const isPublic = codexMode === 'public';
  const isMy = codexMode === 'my';
  const {
    data: codexSpecies = [],
    isLoading: codexLoading,
    error: codexError,
    refetch: refetchCodex,
  } = useSpecies({ enabled: isPublic });
  const {
    data: userSpeciesRaw = [],
    isLoading: userLoading,
    error: userError,
    refetch: refetchUser,
  } = useUserSpecies({ enabled: isMy });

  const species = useMemo(() => {
    if (codexMode === 'my') {
      return (userSpeciesRaw ?? []).map(userSpeciesToSpecies);
    }
    return codexSpecies ?? [];
  }, [codexMode, codexSpecies, userSpeciesRaw]);

  const isLoading = codexMode === 'my' ? userLoading : codexLoading;
  const error = codexMode === 'my' ? userError : codexError;
  const { data: allTraits } = useTraits({ enabled: isPublic || isMy });
  const { data: allSkills } = useCodexSkills({ enabled: isPublic || isMy });
  const { sortState, handleSort } = useSort('name');

  const skillIdToName = useMemo(() => buildSkillIdToName(allSkills), [allSkills]);

  const [filters, setFilters] = useState<SpeciesFilters>({
    search: '',
    types: [],
    sizes: [],
  });

  const filterOptions = useMemo(() => {
    if (!species) return { types: [], sizes: [] };

    const types = new Set<string>();
    const sizes = new Set<string>();

    species.forEach((s: Species) => {
      if (s.type) types.add(s.type);
      s.sizes?.forEach((sz: string) => sizes.add(sz));
    });

    return {
      types: Array.from(types).sort(),
      sizes: Array.from(sizes).sort(),
    };
  }, [species]);

  const filteredSpecies = useMemo(() => {
    if (!species) return [];

    const filtered = species.filter((s: Species) => {
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        if (
          !String(s.name ?? '')
            .toLowerCase()
            .includes(searchLower) &&
          !s.description?.toLowerCase().includes(searchLower)
        ) {
          return false;
        }
      }

      if (filters.types.length > 0 && !filters.types.includes(s.type)) {
        return false;
      }

      if (filters.sizes.length > 0 && !s.sizes?.some((sz: string) => filters.sizes.includes(sz))) {
        return false;
      }

      return true;
    });

    if (sortState.col === 'sizes') {
      const sizeOrder = ['Tiny', 'Small', 'Medium', 'Large', 'Huge', 'Gargantuan'];
      const getMinSizeIndex = (sizes: string[] | undefined) => {
        if (!sizes || sizes.length === 0) return 999;
        return Math.min(
          ...sizes.map((s: string) => {
            const idx = sizeOrder.indexOf(s);
            return idx >= 0 ? idx : 999;
          }),
        );
      };
      return filtered.sort((a: Species, b: Species) => {
        const aIdx = getMinSizeIndex(a.sizes);
        const bIdx = getMinSizeIndex(b.sizes);
        return sortState.dir * (aIdx - bIdx);
      });
    }

    if (sortState.col === '_desc') {
      return filtered.sort(
        (a: Species, b: Species) =>
          sortState.dir *
          String(a.description ?? '').localeCompare(String(b.description ?? ''), undefined, {
            numeric: true,
          }),
      );
    }

    return sortByColumn(filtered, sortState);
  }, [species, filters, sortState]);

  if (error)
    return (
      <ErrorState
        message="Failed to load species"
        onRetry={() => {
          refetchCodex();
          refetchUser();
        }}
      />
    );

  return (
    <div>
      <h2 className="sr-only">Species</h2>
      <CodexBrowseListShell
        search={filters.search}
        onSearchChange={(v) => setFilters((f) => ({ ...f, search: v }))}
        searchPlaceholder="Search names, descriptions..."
        filters={
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <ChipSelect
              label="Type"
              placeholder="Choose type"
              options={filterOptions.types.map((t) => ({ value: t, label: t }))}
              selectedValues={filters.types}
              onSelect={(v) => setFilters((f) => ({ ...f, types: [...f.types, v] }))}
              onRemove={(v) => setFilters((f) => ({ ...f, types: f.types.filter((t) => t !== v) }))}
            />

            <ChipSelect
              label="Size"
              placeholder="Choose size"
              options={filterOptions.sizes.map((s) => ({ value: s, label: s }))}
              selectedValues={filters.sizes}
              onSelect={(v) => setFilters((f) => ({ ...f, sizes: [...f.sizes, v] }))}
              onRemove={(v) => setFilters((f) => ({ ...f, sizes: f.sizes.filter((s) => s !== v) }))}
            />
          </div>
        }
        headerColumns={SPECIES_COLUMNS}
        gridColumns={SPECIES_GRID_COLUMNS}
        hasThumbnailColumn
        sortState={sortState}
        onSort={handleSort}
        isLoading={isLoading}
        isEmpty={filteredSpecies.length === 0}
        emptyTitle={codexMode === 'my' ? 'No custom species yet' : 'No species match your filters.'}
        emptyMessage={codexMode === 'my' ? 'Create one in the Species Creator.' : undefined}
      >
        {filteredSpecies.map((s: Species) => (
          <SpeciesCard
            key={s.id}
            species={s}
            allTraits={allTraits || []}
            skillIdToName={skillIdToName}
          />
        ))}
      </CodexBrowseListShell>
    </div>
  );
}
