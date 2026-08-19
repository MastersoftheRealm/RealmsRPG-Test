'use client';

import { EmptyState } from '@/components/ui';
import { ListHeader } from '@/components/patterns';
import type { Feat } from '@/hooks';
import type { PathGuidanceGroup } from '@/types/archetype';
import { FEAT_GRID_COLUMNS, FEAT_HEADER_COLUMNS } from './feat-list-columns';
import type { FeatFilters, SelectedFeat } from './feat-list-columns';
import { FeatRow } from './feat-row';
import type { FeatFamilyEntry } from './path-mode-feat-families';

interface PathFeatListsProps {
  featGuidanceGroups: Array<{
    group: PathGuidanceGroup;
    archetypeEntries: FeatFamilyEntry[];
  }> | null;
  pathModeArchetypeFeats: FeatFamilyEntry[];
  pathModeCharacterFeats: FeatFamilyEntry[];
  archetypeName?: string | undefined;
  filters: FeatFilters;
  onSort: (col: string) => void;
  selectedArchetypeFeats: SelectedFeat[];
  selectedCharacterFeats: SelectedFeat[];
  maxArchetypeFeats: number;
  maxCharacterFeats: number;
  featById: Map<string, Feat>;
  skillIdToName: Map<string, string>;
  checkRequirements: (feat: Feat) => { met: boolean; reason?: string | undefined };
  onToggleFeat: (feat: Feat, isCharacterFeat: boolean) => void;
}

export function PathFeatLists({
  featGuidanceGroups,
  pathModeArchetypeFeats,
  pathModeCharacterFeats,
  archetypeName,
  filters,
  onSort,
  selectedArchetypeFeats,
  selectedCharacterFeats,
  maxArchetypeFeats,
  maxCharacterFeats,
  featById,
  skillIdToName,
  checkRequirements,
  onToggleFeat,
}: PathFeatListsProps) {
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
    <div className="space-y-8">
      {featGuidanceGroups ? (
        featGuidanceGroups.map(({ group, archetypeEntries }) => (
          <section key={group.id}>
            <h3 className="mb-1 text-lg font-semibold text-text-primary">{group.title}</h3>
            {group.why && <p className="mb-3 text-sm text-text-secondary">{group.why}</p>}
            <ListHeader
              columns={FEAT_HEADER_COLUMNS}
              gridColumns={FEAT_GRID_COLUMNS}
              sortState={{ col: filters.sortCol, dir: filters.sortDir }}
              onSort={onSort}
            />
            <div className="mt-2 max-h-[400px] space-y-2 overflow-y-auto pr-2">
              {archetypeEntries.map(({ displayFeat, familyLevels }) => (
                <FeatRow
                  key={displayFeat.id}
                  feat={displayFeat}
                  familyLevels={familyLevels}
                  isCharacterFeat={false}
                  {...featRowProps}
                />
              ))}
              {archetypeEntries.length === 0 && (
                <EmptyState
                  title="No feats in this group resolved from codex."
                  size="sm"
                  className="rounded-lg bg-surface-alt py-4"
                />
              )}
            </div>
          </section>
        ))
      ) : (
        <section>
          <h3 className="mb-2 text-lg font-semibold text-text-primary">
            {archetypeName ?? 'Path'} Archetype Feats
          </h3>
          <p className="mb-3 text-sm text-text-secondary">
            Choose from the recommended archetype feats for this path.
          </p>
          <ListHeader
            columns={FEAT_HEADER_COLUMNS}
            gridColumns={FEAT_GRID_COLUMNS}
            sortState={{ col: filters.sortCol, dir: filters.sortDir }}
            onSort={onSort}
          />
          <div className="mt-2 max-h-[400px] space-y-2 overflow-y-auto pr-2">
            {pathModeArchetypeFeats.map(({ displayFeat, familyLevels }) => (
              <FeatRow
                key={displayFeat.id}
                feat={displayFeat}
                familyLevels={familyLevels}
                isCharacterFeat={false}
                {...featRowProps}
              />
            ))}
            {pathModeArchetypeFeats.length === 0 && (
              <EmptyState
                title="No recommended archetype feats for this path in codex."
                size="sm"
                className="rounded-lg bg-surface-alt py-4"
              />
            )}
          </div>
        </section>
      )}
      <section>
        <h3 className="mb-2 text-lg font-semibold text-text-primary">
          {archetypeName ?? 'Path'} Character Feats
        </h3>
        <p className="mb-3 text-sm text-text-secondary">
          Choose from the recommended character feats for this path.
        </p>
        <ListHeader
          columns={FEAT_HEADER_COLUMNS}
          gridColumns={FEAT_GRID_COLUMNS}
          sortState={{ col: filters.sortCol, dir: filters.sortDir }}
          onSort={onSort}
        />
        <div className="mt-2 max-h-[400px] space-y-2 overflow-y-auto pr-2">
          {pathModeCharacterFeats.map(({ displayFeat, familyLevels }) => (
            <FeatRow
              key={displayFeat.id}
              feat={displayFeat}
              familyLevels={familyLevels}
              isCharacterFeat={true}
              {...featRowProps}
            />
          ))}
          {pathModeCharacterFeats.length === 0 && (
            <EmptyState
              title="No recommended character feats for this path in codex."
              size="sm"
              className="rounded-lg bg-surface-alt py-4"
            />
          )}
        </div>
      </section>
    </div>
  );
}
