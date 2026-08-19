/**
 * OfficialTechniqueList — Realms Library techniques (browse + admin).
 * Thin wrapper over the generic OfficialEntityList. (DUP-09)
 */

'use client';

import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { Swords } from 'lucide-react';
import { OfficialEntityList } from '@/components/patterns/list/official-entity-list';
import { PowerTechniqueFilters } from '@/components/patterns/filters';
import { useAddToCharacterFromLibrary } from '@/hooks/use-add-to-character-from-library';
import { usePathListFilter } from '@/hooks';
import type { PowerPart, TechniquePart } from '@/hooks/codex-types';
import type { LibraryTechnique } from '@/types/library';
import {
  buildOfficialTechniqueRows,
  filterOfficialTechniqueRows,
  officialTechniqueDetailSections,
  officialTechniqueRowColumns,
  OFFICIAL_TECHNIQUE_GRID,
  OFFICIAL_TECHNIQUE_HEADER_COLUMNS,
  type OfficialTechniqueRow,
} from '@/lib/library/official-technique-list';
import { collectCategoryOptionsFromItems } from '@/lib/library/power-technique-categories';
import {
  EMPTY_POWER_TECHNIQUE_FILTERS,
  countActivePowerTechniqueFilters,
  type PowerTechniqueFilterState,
} from '@/lib/library/power-technique-filters';
import type { PowerTechniqueCharacterContext } from '@/lib/library/power-technique-character-context';
import { empoweredTechniquePartsSection } from '@/lib/library/empowered-technique-display';
import { resolveListRowThumbnail } from '@/lib/list-row-image';
import {
  libraryRowPathIds,
  pathChipLabelsForEntity,
  pathFilterEmptyTitle,
} from '@/lib/game/path-recommendation-index';

export type { OfficialTechniqueRow };

export interface OfficialTechniqueListProps {
  items: LibraryTechnique[];
  partsDb: TechniquePart[];
  /** Required when `mode="empowered"` — nested power part chips use derivePowerDisplay. */
  powerPartsDb?: PowerPart[];
  isLoading: boolean;
  error: Error | null;
  onRetry: () => void;
  mode?: 'standard' | 'empowered';
  errorMessage?: string;
  sectionTitle?: string;
  searchPlaceholder?: string;
  emptyIcon?: ReactNode;
  emptyTitle: string;
  emptyMessage: string;
  searchEmptyMessage?: string;
  variant: 'library' | 'admin';
  readOnly?: boolean;
  onAddRequest?: (row: OfficialTechniqueRow) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string, name: string) => void;
}

export function OfficialTechniqueList({
  items,
  partsDb,
  powerPartsDb = [],
  isLoading,
  error,
  onRetry,
  mode = 'standard',
  errorMessage,
  sectionTitle,
  searchPlaceholder,
  emptyIcon = <Swords className="h-8 w-8" />,
  emptyTitle,
  emptyMessage,
  searchEmptyMessage,
  variant,
  readOnly = false,
  onAddRequest,
  onEdit,
  onDelete,
}: OfficialTechniqueListProps) {
  const empowered = mode === 'empowered';
  const [advancedFilters, setAdvancedFilters] = useState<PowerTechniqueFilterState>(
    EMPTY_POWER_TECHNIQUE_FILTERS,
  );
  const [characterContext, setCharacterContext] = useState<PowerTechniqueCharacterContext | null>(
    null,
  );
  const [characterFilterId, setCharacterFilterId] = useState('');
  const addToCharacter = useAddToCharacterFromLibrary('technique', characterFilterId);
  const { selectedPathIds, setSelectedPathIds, pathIndex, pathRecommendedIds, pathFilterActive } =
    usePathListFilter({
      entities: items,
      kind: 'techniques',
      enabled: !empowered,
    });

  const categoryOptions = useMemo(() => {
    if (empowered) return [];
    return collectCategoryOptionsFromItems(items, partsDb);
  }, [empowered, items, partsDb]);

  const filterRows = useCallback(
    (
      rows: OfficialTechniqueRow[],
      search: string,
      sortItems: (items: OfficialTechniqueRow[]) => OfficialTechniqueRow[],
    ) =>
      filterOfficialTechniqueRows(
        rows,
        search,
        sortItems,
        advancedFilters,
        characterContext,
        empowered ? null : pathRecommendedIds,
      ),
    [advancedFilters, characterContext, empowered, pathRecommendedIds],
  );

  return (
    <>
      <OfficialEntityList<OfficialTechniqueRow, LibraryTechnique>
        items={items}
        isLoading={isLoading}
        error={error}
        onRetry={onRetry}
        buildRows={(raw) => buildOfficialTechniqueRows(raw, partsDb, mode)}
        filterRows={filterRows}
        gridColumns={OFFICIAL_TECHNIQUE_GRID}
        headerColumns={OFFICIAL_TECHNIQUE_HEADER_COLUMNS}
        filters={
          empowered ? undefined : (
            <PowerTechniqueFilters
              kind="technique"
              value={advancedFilters}
              onChange={setAdvancedFilters}
              categoryOptions={categoryOptions}
              onCharacterContextChange={setCharacterContext}
              onCharacterIdChange={setCharacterFilterId}
              pathFilter={{
                options: pathIndex.options,
                selectedPathIds,
                onChange: setSelectedPathIds,
              }}
            />
          )
        }
        filterActiveCount={
          empowered
            ? undefined
            : countActivePowerTechniqueFilters(
                advancedFilters,
                'technique',
                Boolean(characterContext),
              ) +
              (characterFilterId ? 1 : 0) +
              (pathFilterActive ? 1 : 0)
        }
        getNameChipLabels={
          empowered
            ? undefined
            : (t) =>
                pathFilterActive
                  ? pathChipLabelsForEntity(pathIndex, libraryRowPathIds(t), selectedPathIds)
                  : undefined
        }
        getColumns={(t) => officialTechniqueRowColumns(t)}
        getDetailSections={(t) => {
          if (empowered) {
            const section = empoweredTechniquePartsSection(t.raw, powerPartsDb, partsDb, {
              stripOptionSuffix: true,
            });
            return section ? [section] : undefined;
          }
          const sections = officialTechniqueDetailSections(t);
          return sections.length > 0 ? sections : undefined;
        }}
        getThumbnail={(t) => resolveListRowThumbnail('technique', t.raw, t.name)}
        errorMessage={
          errorMessage ?? `Failed to load ${empowered ? 'empowered techniques' : 'techniques'}`
        }
        sectionTitle={sectionTitle}
        searchPlaceholder={
          searchPlaceholder ??
          (empowered ? 'Search empowered techniques...' : 'Search techniques...')
        }
        emptyIcon={emptyIcon}
        emptyTitle={emptyTitle}
        emptyMessage={emptyMessage}
        searchEmptyMessage={
          !empowered && pathFilterActive
            ? pathFilterEmptyTitle('techniques')
            : (searchEmptyMessage ??
              (empowered
                ? 'No empowered techniques match your search.'
                : 'No techniques match your search.'))
        }
        variant={variant}
        readOnly={readOnly}
        onAddRequest={onAddRequest}
        addToCharacter={
          variant === 'library' && !empowered && addToCharacter.active
            ? {
                kind: 'technique',
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
