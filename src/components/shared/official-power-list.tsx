/**
 * OfficialPowerList — Realms Library powers (browse + admin).
 * Thin wrapper over the generic OfficialEntityList. (DUP-09)
 */

'use client';

import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { Wand2 } from 'lucide-react';
import { OfficialEntityList } from '@/components/shared/official-entity-list';
import { PowerTechniqueFilters } from '@/components/shared/filters';
import { useGameRules } from '@/hooks/use-game-rules';
import { usePathListFilter } from '@/hooks';
import { useAddToCharacterFromLibrary } from '@/hooks/use-add-to-character-from-library';
import type { PowerPart } from '@/hooks/codex-types';
import type { LibraryPower } from '@/types/library';
import {
  buildOfficialPowerRows,
  filterOfficialPowerRows,
  officialPowerDetailSections,
  officialPowerRowColumns,
  OFFICIAL_POWER_GRID,
  OFFICIAL_POWER_HEADER_COLUMNS,
  type OfficialPowerRow,
} from '@/lib/library/official-power-list';
import { collectCategoryOptionsFromItems } from '@/lib/library/power-technique-categories';
import {
  EMPTY_POWER_TECHNIQUE_FILTERS,
  countActivePowerTechniqueFilters,
  type PowerTechniqueFilterState,
} from '@/lib/library/power-technique-filters';
import type { PowerTechniqueCharacterContext } from '@/lib/library/power-technique-character-context';
import { listInnateThresholdFilterOptions } from '@/lib/game/innate-eligibility';
import {
  POWER_LIST_PATH_KINDS,
  libraryRowPathIds,
  pathChipLabelsForEntity,
  pathFilterEmptyTitle,
} from '@/lib/game/path-recommendation-index';
import { resolveListRowThumbnail } from '@/lib/list-row-image';

export type { OfficialPowerRow };

export interface OfficialPowerListProps {
  items: LibraryPower[];
  partsDb: PowerPart[];
  isLoading: boolean;
  error: Error | null;
  onRetry: () => void;
  errorMessage?: string;
  sectionTitle?: string;
  searchPlaceholder?: string;
  emptyIcon?: ReactNode;
  emptyTitle: string;
  emptyMessage: string;
  searchEmptyMessage?: string;
  variant: 'library' | 'admin';
  readOnly?: boolean;
  onAddRequest?: (row: OfficialPowerRow) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string, name: string) => void;
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
}: OfficialPowerListProps) {
  const { rules } = useGameRules();
  const [advancedFilters, setAdvancedFilters] = useState<PowerTechniqueFilterState>(
    EMPTY_POWER_TECHNIQUE_FILTERS,
  );
  const [characterContext, setCharacterContext] = useState<PowerTechniqueCharacterContext | null>(
    null,
  );
  const [characterFilterId, setCharacterFilterId] = useState('');
  const addToCharacter = useAddToCharacterFromLibrary('power', characterFilterId);
  const { selectedPathIds, setSelectedPathIds, pathIndex, pathRecommendedIds, pathFilterActive } =
    usePathListFilter({ entities: items, kind: POWER_LIST_PATH_KINDS });

  const categoryOptions = useMemo(
    () => collectCategoryOptionsFromItems(items, partsDb, { includeDamageCategory: true }),
    [items, partsDb],
  );

  const innateThresholdOptions = useMemo(() => listInnateThresholdFilterOptions(rules), [rules]);

  const filterRows = useCallback(
    (
      rows: OfficialPowerRow[],
      search: string,
      sortItems: (items: OfficialPowerRow[]) => OfficialPowerRow[],
    ) =>
      filterOfficialPowerRows(
        rows,
        search,
        sortItems,
        advancedFilters,
        characterContext,
        pathRecommendedIds,
      ),
    [advancedFilters, characterContext, pathRecommendedIds],
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
          />
        }
        filterActiveCount={
          countActivePowerTechniqueFilters(advancedFilters, 'power', Boolean(characterContext)) +
          (characterFilterId ? 1 : 0) +
          (pathFilterActive ? 1 : 0)
        }
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
      />
      {addToCharacter.confirmModal}
    </>
  );
}
