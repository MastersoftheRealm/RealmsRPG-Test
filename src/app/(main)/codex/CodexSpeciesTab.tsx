/**
 * Codex Species Tab
 * =================
 * Species list with filters: search, type, size.
 */

'use client';

import { useState, useMemo } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ChipSelect,
  FilterSection,
} from '@/components/codex';
import {
  SearchInput,
  ListHeader,
  LoadingState,
  ErrorDisplay as ErrorState,
} from '@/components/shared';
import { useSort, sortByColumn } from '@/hooks/use-sort';

const SPECIES_GRID_COLUMNS = '1.5fr 1fr 0.8fr 1fr';
const SPECIES_COLUMNS = [
  { key: 'name', label: 'NAME' },
  { key: 'type', label: 'TYPE' },
  { key: 'sizes', label: 'SIZES' },
  { key: '_desc', label: 'DESCRIPTION', sortable: false as const },
];
import { useSpecies, useTraits, useCodexSkills, resolveTraitIds, type Species, type Trait, type Skill } from '@/hooks';

interface SpeciesFilters {
  search: string;
  types: string[];
  sizes: string[];
}

function SpeciesCard({ species, allTraits, skillIdToName }: { species: Species; allTraits: Trait[]; skillIdToName: Map<string, string> }) {
  const [expanded, setExpanded] = useState(false);

  const speciesTraits = useMemo(() =>
    resolveTraitIds(species.species_traits || [], allTraits),
    [species.species_traits, allTraits]
  );
  const ancestryTraits = useMemo(() =>
    resolveTraitIds(species.ancestry_traits || [], allTraits),
    [species.ancestry_traits, allTraits]
  );
  const flaws = useMemo(() =>
    resolveTraitIds(species.flaws || [], allTraits),
    [species.flaws, allTraits]
  );
  const characteristics = useMemo(() =>
    resolveTraitIds(species.characteristics || [], allTraits),
    [species.characteristics, allTraits]
  );

  const speciesSkillNames = useMemo(() => {
    if (!species.skills?.length) return [];
    return species.skills.map(skillId => skillIdToName.get(String(skillId)) || String(skillId));
  }, [species.skills, skillIdToName]);

  return (
    <div className="bg-surface">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-4 px-4 py-3 text-left hover:bg-surface-alt transition-colors"
      >
        <div className="font-medium text-text-primary">{species.name}</div>
        <div className="text-text-secondary">{species.type || '-'}</div>
        <div className="text-text-secondary hidden lg:block">{species.sizes?.join(', ') || '-'}</div>
        <div className="hidden lg:flex items-center justify-between">
          <span className="text-text-secondary truncate">{species.description?.substring(0, 50)}...</span>
          <ChevronDown className={cn('w-4 h-4 text-text-muted transition-transform flex-shrink-0', expanded && 'rotate-180')} />
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-2 border-t border-border bg-surface-alt space-y-4">
          {species.description && (
            <p className="text-text-secondary">{species.description}</p>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {species.ave_height != null && Number(species.ave_height) > 0 && (
              <div><span className="font-medium">Avg Height:</span> {species.ave_height} cm</div>
            )}
            {species.ave_weight != null && Number(species.ave_weight) > 0 && (
              <div><span className="font-medium">Avg Weight:</span> {species.ave_weight} kg</div>
            )}
            {species.adulthood_lifespan?.[0] != null && (
              <div><span className="font-medium">Adulthood:</span> {species.adulthood_lifespan[0]} yr</div>
            )}
            {species.adulthood_lifespan?.[1] != null && (
              <div><span className="font-medium">Lifespan (max):</span> {species.adulthood_lifespan[1]} yr</div>
            )}
            {species.languages?.length > 0 && (
              <div><span className="font-medium">Languages:</span> {species.languages.join(', ')}</div>
            )}
            {speciesSkillNames.length > 0 && (
              <div><span className="font-medium">Skills:</span> {speciesSkillNames.join(', ')}</div>
            )}
          </div>

          {speciesTraits.length > 0 && (
            <div>
              <h4 className="font-medium text-text-primary mb-2">Species Traits</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {speciesTraits.map((trait: Trait) => (
                  <div key={trait.id} className="p-2 bg-info-50 dark:bg-info-900/30 border border-info-200 dark:border-info-700/50 rounded">
                    <span className="font-medium text-info-800">{trait.name}</span>
                    {trait.description && (
                      <p className="text-sm text-info-700 mt-1">{trait.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {ancestryTraits.length > 0 && (
            <div>
              <h4 className="font-medium text-text-primary mb-2">Ancestry Traits</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {ancestryTraits.map((trait: Trait) => (
                  <div key={trait.id} className="p-2 bg-success-50 dark:bg-success-900/30 border border-success-200 dark:border-success-700/50 rounded">
                    <span className="font-medium text-success-800">{trait.name}</span>
                    {trait.description && (
                      <p className="text-sm text-success-700 mt-1">{trait.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {flaws.length > 0 && (
            <div>
              <h4 className="font-medium text-text-primary mb-2">Flaws</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {flaws.map((trait: Trait) => (
                  <div key={trait.id} className="p-2 bg-danger-50 dark:bg-danger-900/30 border border-danger-200 dark:border-danger-700/50 rounded">
                    <span className="font-medium text-danger-800">{trait.name}</span>
                    {trait.description && (
                      <p className="text-sm text-danger-700 mt-1">{trait.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {characteristics.length > 0 && (
            <div>
              <h4 className="font-medium text-text-primary mb-2">Characteristics</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {characteristics.map((trait: Trait) => (
                  <div key={trait.id} className="p-2 bg-power-light border border-power-border rounded">
                    <span className="font-medium text-power-text">{trait.name}</span>
                    {trait.description && (
                      <p className="text-sm text-power-text/80 mt-1">{trait.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function CodexSpeciesTab() {
  const { data: species, isLoading, error } = useSpecies();
  const { data: allTraits } = useTraits();
  const { data: allSkills } = useCodexSkills();
  const { sortState, handleSort } = useSort('name');

  const skillIdToName = useMemo((): Map<string, string> => {
    if (!allSkills) return new Map<string, string>();
    return new Map(allSkills.map((s: Skill) => [String(s.id), s.name] as [string, string]));
  }, [allSkills]);

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
        if (!String(s.name ?? '').toLowerCase().includes(searchLower) &&
          !s.description?.toLowerCase().includes(searchLower)) {
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
        return Math.min(...sizes.map((s: string) => {
          const idx = sizeOrder.indexOf(s);
          return idx >= 0 ? idx : 999;
        }));
      };
      return filtered.sort((a: Species, b: Species) => {
        const aIdx = getMinSizeIndex(a.sizes);
        const bIdx = getMinSizeIndex(b.sizes);
        return sortState.dir * (aIdx - bIdx);
      });
    }

    return sortByColumn(filtered, sortState);
  }, [species, filters, sortState]);

  if (error) return <ErrorState message="Failed to load species" />;

  return (
    <div>
      <div className="mb-4">
        <SearchInput
          value={filters.search}
          onChange={(v) => setFilters(f => ({ ...f, search: v }))}
          placeholder="Search names, descriptions..."
        />
      </div>

      <FilterSection>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ChipSelect
            label="Type"
            placeholder="Choose type"
            options={filterOptions.types.map(t => ({ value: t, label: t }))}
            selectedValues={filters.types}
            onSelect={(v) => setFilters(f => ({ ...f, types: [...f.types, v] }))}
            onRemove={(v) => setFilters(f => ({ ...f, types: f.types.filter(t => t !== v) }))}
          />

          <ChipSelect
            label="Size"
            placeholder="Choose size"
            options={filterOptions.sizes.map(s => ({ value: s, label: s }))}
            selectedValues={filters.sizes}
            onSelect={(v) => setFilters(f => ({ ...f, sizes: [...f.sizes, v] }))}
            onRemove={(v) => setFilters(f => ({ ...f, sizes: f.sizes.filter(s => s !== v) }))}
          />
        </div>
      </FilterSection>

      <ListHeader
        columns={SPECIES_COLUMNS}
        gridColumns={SPECIES_GRID_COLUMNS}
        sortState={sortState}
        onSort={handleSort}
      />

      <div className="flex flex-col gap-1 mt-2">
        {isLoading ? (
          <LoadingState />
        ) : filteredSpecies.length === 0 ? (
          <div className="p-8 text-center text-text-muted">No species match your filters.</div>
        ) : (
          filteredSpecies.map((s: Species) => (
            <SpeciesCard key={s.id} species={s} allTraits={allTraits || []} skillIdToName={skillIdToName} />
          ))
        )}
      </div>
    </div>
  );
}
