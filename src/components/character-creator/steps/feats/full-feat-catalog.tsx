'use client';

import { cn } from '@/lib/utils';
import { statusPanel } from '@/lib/ui/status-surface-classes';
import { EmptyState } from '@/components/ui';
import {
  SearchInput,
  ListHeader,
  SegmentedControl,
} from '@/components/shared';
import { FilterSection, ChipSelect } from '@/components/shared/filters';
import type { Feat } from '@/hooks';
import { FEAT_GRID_COLUMNS, FEAT_HEADER_COLUMNS } from './feat-list-columns';
import type { FeatFilters, SelectedFeat } from './feat-list-columns';
import { FeatRow } from './feat-row';

type FeatFamilyEntry = { displayFeat: Feat; familyLevels: Feat[] };

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
  checkRequirements: (feat: Feat) => { met: boolean; reason?: string };
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
      <div className="flex items-center gap-2 mb-4">
        <SegmentedControl
          value={filters.featType}
          onChange={(next) => onFiltersChange((f) => ({ ...f, featType: next as 'archetype' | 'character' }))}
          options={[
            { value: 'archetype', label: 'Archetype Feats' },
            { value: 'character', label: 'Character Feats' },
          ]}
          aria-label="Feat list type"
          className="flex-1 min-w-0 sm:flex-initial"
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <ChipSelect
            label="Category"
            placeholder="All categories"
            options={categories.map((c) => ({ value: c, label: c }))}
            selectedValues={filters.categories}
            onSelect={(v) => onFiltersChange((f) => ({ ...f, categories: [...f.categories, v] }))}
            onRemove={(v) => onFiltersChange((f) => ({ ...f, categories: f.categories.filter((c) => c !== v) }))}
          />
          <ChipSelect
            label="Ability"
            placeholder="All abilities"
            options={abilityOptions.map((a) => ({ value: a, label: a }))}
            selectedValues={filters.abilityFilter}
            onSelect={(v) => onFiltersChange((f) => ({ ...f, abilityFilter: [...f.abilityFilter, v] }))}
            onRemove={(v) => onFiltersChange((f) => ({ ...f, abilityFilter: f.abilityFilter.filter((a) => a !== v) }))}
          />
          <div className="filter-group">
            <label className="block text-sm font-medium text-text-secondary mb-1">Qualification</label>
            <button
              type="button"
              onClick={() => onFiltersChange((f) => ({ ...f, hideUnqualified: !f.hideUnqualified }))}
              className={cn(
                'w-full px-3 py-2 rounded-lg border text-sm font-medium transition-colors text-left min-h-11',
                filters.hideUnqualified
                  ? cn(statusPanel.complete, 'text-success-fg')
                  : 'bg-surface border-border-light text-text-secondary hover:bg-surface-alt'
              )}
            >
              {filters.hideUnqualified ? '✓ Hiding unqualified' : 'Showing all feats'}
            </button>
            <p className="text-xs text-text-muted dark:text-text-secondary mt-1">
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
      <div className="mb-8 mt-4">
        <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
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
              className="bg-surface-alt rounded-lg py-4"
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
