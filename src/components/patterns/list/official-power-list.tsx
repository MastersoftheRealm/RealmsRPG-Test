/**
 * OfficialPowerList — Realms Library powers (browse + admin).
 * Thin wrapper over the generic OfficialEntityList. (DUP-09)
 */

'use client';

import { useCallback, useMemo, type ReactNode } from 'react';
import { Wand2 } from 'lucide-react';
import { OfficialEntityList } from '@/components/patterns/list/official-entity-list';
import { PowerTechniqueFilters } from '@/components/patterns/filters';
import { useGameRules } from '@/hooks/use-game-rules';
import { useAddToCharacterFromLibrary } from '@/hooks/use-add-to-character-from-library';
import type { PowerPart } from '@/hooks/codex-types';
import type { LibraryPower } from '@/types/library';
import { filterOfficialPowerTechniqueRows } from '@/lib/library/official-catalog-row-filter';
import {
  buildOfficialPowerRows,
  officialPowerCategoryOptions,
  officialPowerDetailSections,
  officialPowerRowColumns,
  OFFICIAL_POWER_GRID,
  OFFICIAL_POWER_HEADER_COLUMNS,
  type OfficialPowerRow,
} from '@/lib/library/official-power-list';
import { useOfficialPowerTechniqueBrowseFilters } from '@/hooks/use-official-power-technique-browse-filters';
import { listInnateThresholdFilterOptions } from '@/lib/game/innate-eligibility';
import {
  libraryRowPathIds,
  pathChipLabelsForEntity,
  pathFilterEmptyTitle,
} from '@/lib/game/path-recommendation-index';
import { resolveListRowThumbnail } from '@/lib/list-row-image';
import type { CatalogListing } from '@/lib/library/catalog-listing';

export type { OfficialPowerRow };

export interface OfficialPowerListProps {
  items: LibraryPower[];
  partsDb: PowerPart[];
  isLoading: boolean;
  error: Error | null;
  onRetry: () => void;
  errorMessage?: string | undefined;
  sectionTitle?: string | undefined;
  searchPlaceholder?: string | undefined;
  emptyIcon?: ReactNode | undefined;
  emptyTitle: string;
  emptyMessage: string;
  searchEmptyMessage?: string | undefined;
  variant: 'library' | 'admin';
  readOnly?: boolean | undefined;
  onAddRequest?: ((row: OfficialPowerRow) => void) | undefined;
  onEdit?: ((id: string) => void) | undefined;
  onDelete?: ((id: string, name: string) => void) | undefined;
  onCatalogListingChange?: ((id: string, listing: CatalogListing) => void) | undefined;
}

export function OfficialPowerList({
  items,
  partsDb,
  isLoading,
  error,
  onRetry,
  errorMessage = 'Failed to load powers',
  sectionTitle,
  searchPlaceholder = 'Search powers...',
  emptyIcon = <Wand2 className="h-8 w-8" />,
  emptyTitle,
  emptyMessage,
  searchEmptyMessage = 'No powers match your search.',
  variant,
  readOnly = false,
  onAddRequest,
  onEdit,
  onDelete,
  onCatalogListingChange,
}: OfficialPowerListProps) {
  const { rules } = useGameRules();
  const browseFilters = useOfficialPowerTechniqueBrowseFilters({
    kind: 'power',
    entities: items,
  });
  const {
    advancedFilters,
    setAdvancedFilters,
    setCharacterContext,
    characterFilterId,
    setCharacterFilterId,
    rulesSources,
    setRulesSources,
    selectedPathIds,
    setSelectedPathIds,
    pathIndex,
    pathRecommendedIds,
    pathFilterActive,
    filterActiveCount,
  } = browseFilters;
  const addToCharacter = useAddToCharacterFromLibrary('power', characterFilterId);

  const categoryOptions = useMemo(
    () => officialPowerCategoryOptions(items, partsDb),
    [items, partsDb],
  );

  const innateThresholdOptions = useMemo(() => listInnateThresholdFilterOptions(rules), [rules]);

  const filterRows = useCallback(
    (
      rows: OfficialPowerRow[],
      search: string,
      sortItems: (items: OfficialPowerRow[]) => OfficialPowerRow[],
    ) =>
      filterOfficialPowerTechniqueRows(
        rows,
        search,
        sortItems,
        'power',
        advancedFilters,
        browseFilters.characterContext,
        pathRecommendedIds,
        rulesSources,
      ),
    [advancedFilters, browseFilters.characterContext, pathRecommendedIds, rulesSources],
  );

  return (
    <>
      <OfficialEntityList<OfficialPowerRow, LibraryPower>
        items={items}
        isLoading={isLoading}
        error={error}
        onRetry={onRetry}
        buildRows={(raw) => buildOfficialPowerRows(raw, partsDb)}
        filterRows={filterRows}
        gridColumns={OFFICIAL_POWER_GRID}
        headerColumns={OFFICIAL_POWER_HEADER_COLUMNS}
        filters={
          <PowerTechniqueFilters
            kind="power"
            value={advancedFilters}
            onChange={setAdvancedFilters}
            categoryOptions={categoryOptions}
            innateThresholdOptions={innateThresholdOptions}
            onCharacterContextChange={setCharacterContext}
            onCharacterIdChange={setCharacterFilterId}
            pathFilter={{
              options: pathIndex.options,
              selectedPathIds,
              onChange: setSelectedPathIds,
            }}
            rulesSources={rulesSources}
            onRulesSourcesChange={setRulesSources}
          />
        }
        filterActiveCount={filterActiveCount}
        getNameChipLabels={(p) =>
          pathFilterActive
            ? pathChipLabelsForEntity(pathIndex, libraryRowPathIds(p), selectedPathIds)
            : undefined
        }
        getColumns={(p) => officialPowerRowColumns(p)}
        getDetailSections={(p) => {
          const sections = officialPowerDetailSections(p);
          return sections.length > 0 ? sections : undefined;
        }}
        getThumbnail={(p) => resolveListRowThumbnail('power', p.raw, p.name)}
        errorMessage={errorMessage}
        sectionTitle={sectionTitle}
        searchPlaceholder={searchPlaceholder}
        emptyIcon={emptyIcon}
        emptyTitle={emptyTitle}
        emptyMessage={emptyMessage}
        searchEmptyMessage={pathFilterActive ? pathFilterEmptyTitle('powers') : searchEmptyMessage}
        variant={variant}
        readOnly={readOnly}
        onAddRequest={onAddRequest}
        addToCharacter={
          variant === 'library' && addToCharacter.active
            ? {
                kind: 'power',
                onRequest: (row) => addToCharacter.openAddConfirm(row.name, row.raw),
                isOnCharacter: (row) => addToCharacter.isOnCharacter(row.raw),
              }
            : undefined
        }
        onEdit={onEdit}
        onDelete={onDelete}
        onCatalogListingChange={onCatalogListingChange}
      />
      {addToCharacter.confirmModal}
    </>
  );
}
