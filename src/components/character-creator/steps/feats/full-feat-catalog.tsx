'use client';

import { cn } from '@/lib/utils';
import { statusPanel } from '@/lib/ui/status-surface-classes';
import { EmptyState, SearchInput } from '@/components/ui';
import { ListHeader, SegmentedControl } from '@/components/patterns';
import { FilterSection, ChipSelect } from '@/components/patterns/filters';
import type { Feat } from '@/hooks';
import { FEAT_GRID_COLUMNS, FEAT_HEADER_COLUMNS } from './feat-list-columns';
import type { FeatFilters, SelectedFeat } from './feat-list-columns';
import { FeatRow } from './feat-row';
import type { FeatFamilyEntry } from './path-mode-feat-families';

interface FullFeatCatalogProps {
  filters: FeatFilters;
  onFiltersChange: (updater: (prev: FeatFilters) => FeatFilters) => void;
  onSort: (col: string) => void;
  categories: string[];
  abilityOptions: string[];
  groupedDisplayFeats: FeatFamilyEntry[];
  selectedArchetypeFeats: SelectedFeat[];
  selectedCharacterFeats: SelectedFeat[];
  maxArchetypeFeats: number;
  maxCharacterFeats: number;
  featById: Map<string, Feat>;
  skillIdToName: Map<string, string>;
  checkRequirements: (feat: Feat) => { met: boolean; reason?: string | undefined };
  onToggleFeat: (feat: Feat, isCharacterFeat: boolean) => void;
}

export function FullFeatCatalog({
  filters,
  onFiltersChange,
  onSort,
  categories,
  abilityOptions,
  groupedDisplayFeats,
  selectedArchetypeFeats,
  selectedCharacterFeats,
  maxArchetypeFeats,
  maxCharacterFeats,
  featById,
  skillIdToName,
  checkRequirements,
  onToggleFeat,
}: FullFeatCatalogProps) {
  const featRowProps = {
    selectedArchetypeFeats,
    selectedCharacterFeats,
    maxArchetypeFeats,
    maxCharacterFeats,
    featById,
    skillIdToName,
    checkRequirements,
    onToggle: onToggleFeat,
  };

  return (
    <>
      <div className="mb-4 flex items-center gap-2">
        <SegmentedControl
          value={filters.featType}
          onChange={(next) =>
            onFiltersChange((f) => ({ ...f, featType: next as 'archetype' | 'character' }))
          }
          options={[
            { value: 'archetype', label: 'Archetype Feats' },
            { value: 'character', label: 'Character Feats' },
          ]}
          aria-label="Feat list type"
          className="min-w-0 flex-1 sm:flex-initial"
        />
      </div>
      <div className="mb-4">
        <SearchInput
          value={filters.search}
          onChange={(v) => onFiltersChange((f) => ({ ...f, search: v }))}
          placeholder="Search feats by name, description, or tags..."
        />
      </div>
      <FilterSection>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <ChipSelect
            label="Category"
            placeholder="All categories"
            options={categories.map((c) => ({ value: c, label: c }))}
            selectedValues={filters.categories}
            onSelect={(v) => onFiltersChange((f) => ({ ...f, categories: [...f.categories, v] }))}
            onRemove={(v) =>
              onFiltersChange((f) => ({ ...f, categories: f.categories.filter((c) => c !== v) }))
            }
          />
          <ChipSelect
            label="Ability"
            placeholder="All abilities"
            options={abilityOptions.map((a) => ({ value: a, label: a }))}
            selectedValues={filters.abilityFilter}
            onSelect={(v) =>
              onFiltersChange((f) => ({ ...f, abilityFilter: [...f.abilityFilter, v] }))
            }
            onRemove={(v) =>
              onFiltersChange((f) => ({
                ...f,
                abilityFilter: f.abilityFilter.filter((a) => a !== v),
              }))
            }
          />
          <div className="filter-group">
            <label className="mb-1 block text-sm font-medium text-text-secondary">
              Qualification
            </label>
            <button
              type="button"
              onClick={() =>
                onFiltersChange((f) => ({ ...f, hideUnqualified: !f.hideUnqualified }))
              }
              className={cn(
                'min-h-11 w-full rounded-lg border px-3 py-2 text-left text-sm font-medium transition-colors',
                filters.hideUnqualified
                  ? cn(statusPanel.complete, 'text-success-fg')
                  : 'border-border-light bg-surface text-text-secondary hover:bg-surface-alt',
              )}
            >
              {filters.hideUnqualified ? '✓ Hiding unqualified' : 'Showing all feats'}
            </button>
            <p className="mt-1 text-xs text-text-muted">
              {filters.hideUnqualified ? 'Only feats you qualify for' : 'Including unqualified'}
            </p>
          </div>
        </div>
      </FilterSection>
      <ListHeader
        columns={FEAT_HEADER_COLUMNS}
        gridColumns={FEAT_GRID_COLUMNS}
        sortState={{ col: filters.sortCol, dir: filters.sortDir }}
        onSort={onSort}
      />
      <div className="mt-4 mb-8">
        <div className="max-h-[600px] space-y-2 overflow-y-auto pr-2">
          {groupedDisplayFeats.map(({ displayFeat, familyLevels }) => (
            <FeatRow
              key={displayFeat.id}
              feat={displayFeat}
              familyLevels={familyLevels}
              isCharacterFeat={!!displayFeat.char_feat}
              {...featRowProps}
            />
          ))}
          {groupedDisplayFeats.length === 0 && (
            <EmptyState
              title="No feats match your filters."
              size="sm"
              className="rounded-lg bg-surface-alt py-4"
              secondaryAction={
                filters.hideUnqualified
                  ? {
                      label: 'Show unqualified feats',
                      onClick: () => onFiltersChange((f) => ({ ...f, hideUnqualified: false })),
                    }
                  : undefined
              }
            />
          )}
        </div>
      </div>
    </>
  );
}
