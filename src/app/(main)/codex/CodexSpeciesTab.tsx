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
  SortHeader,
  LoadingState,
  ErrorDisplay as ErrorState,
} from '@/components/shared';
import { useSort, sortByColumn } from '@/hooks/use-sort';
import { useSpecies, useTraits, useRTDBSkills, resolveTraitIds, type Species, type Trait } from '@/hooks';

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
            {species.ave_height && (
              <div><span className="font-medium">Avg Height:</span> {species.ave_height} cm</div>
            )}
            {species.ave_weight && (
              <div><span className="font-medium">Avg Weight:</span> {species.ave_weight} kg</div>
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
                {speciesTraits.map(trait => (
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
                {ancestryTraits.map(trait => (
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
                {flaws.map(trait => (
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
                {characteristics.map(trait => (
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
  const { data: allSkills } = useRTDBSkills();
  const { sortState, handleSort } = useSort('name');

  const skillIdToName = useMemo(() => {
    if (!allSkills) return new Map<string, string>();
    return new Map(allSkills.map(s => [s.id, s.name]));
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

    species.forEach(s => {
      if (s.type) types.add(s.type);
      s.sizes?.forEach(sz => sizes.add(sz));
    });

    return {
      types: Array.from(types).sort(),
      sizes: Array.from(sizes).sort(),
    };
  }, [species]);

  const filteredSpecies = useMemo(() => {
    if (!species) return [];

    const filtered = species.filter(s => {
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        if (!s.name.toLowerCase().includes(searchLower) &&
          !s.description?.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      if (filters.types.length > 0 && !filters.types.includes(s.type)) {
        return false;
      }

      if (filters.sizes.length > 0 && !s.sizes?.some(sz => filters.sizes.includes(sz))) {
        return false;
      }

      return true;
    });

    if (sortState.col === 'sizes') {
      const sizeOrder = ['Tiny', 'Small', 'Medium', 'Large', 'Huge', 'Gargantuan'];
      const getMinSizeIndex = (sizes: string[] | undefined) => {
        if (!sizes || sizes.length === 0) return 999;
        return Math.min(...sizes.map(s => {
          const idx = sizeOrder.indexOf(s);
          return idx >= 0 ? idx : 999;
        }));
      };
      return filtered.sort((a, b) => {
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

      <div className="hidden lg:grid grid-cols-4 gap-4 px-4 py-3 bg-primary-50 border-b border-border-light rounded-t-lg font-semibold text-sm text-primary-700">
        <SortHeader label="NAME" col="name" sortState={sortState} onSort={handleSort} />
        <SortHeader label="TYPE" col="type" sortState={sortState} onSort={handleSort} />
        <SortHeader label="SIZES" col="sizes" sortState={sortState} onSort={handleSort} />
        <span>DESCRIPTION</span>
      </div>

      <div className="flex flex-col gap-1 mt-2">
        {isLoading ? (
          <LoadingState />
        ) : filteredSpecies.length === 0 ? (
          <div className="p-8 text-center text-text-muted">No species match your filters.</div>
        ) : (
          filteredSpecies.map(s => (
            <SpeciesCard key={s.id} species={s} allTraits={allTraits || []} skillIdToName={skillIdToName} />
          ))
        )}
      </div>
    </div>
  );
}
