/**
 * Library Techniques Tab — entity mapping + rows; shell from ADR-0001.
 * Handles both standard and empowered techniques via the `mode` prop.
 */

'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Swords } from 'lucide-react';
import {
  GridListRow,
  LibraryAddToCharacterButton,
  LibraryRowActionSlot,
} from '@/components/shared';
import { PowerTechniqueFilters } from '@/components/shared/filters';
import { useSort } from '@/hooks/use-sort';
import { useAddToCharacterFromLibrary } from '@/hooks/use-add-to-character-from-library';
import { usePathListFilter } from '@/hooks';
import { empoweredTechniquePartsSection } from '@/lib/library/empowered-technique-display';
import {
  buildOfficialTechniqueRows,
  filterOfficialTechniqueRows,
  officialTechniqueDetailSections,
  officialTechniqueRowColumns,
  OFFICIAL_TECHNIQUE_GRID,
  OFFICIAL_TECHNIQUE_HEADER_COLUMNS,
} from '@/lib/library/official-technique-list';
import { collectCategoryOptionsFromItems } from '@/lib/library/power-technique-categories';
import {
  EMPTY_POWER_TECHNIQUE_FILTERS,
  countActivePowerTechniqueFilters,
  type PowerTechniqueFilterState,
} from '@/lib/library/power-technique-filters';
import type { PowerTechniqueCharacterContext } from '@/lib/library/power-technique-character-context';
import {
  useUserTechniques,
  useUserEmpoweredTechniques,
  useTechniqueParts,
  usePowerParts,
  useDuplicateTechnique,
  useDuplicateEmpoweredTechnique,
} from '@/hooks';
import type { DisplayItem } from '@/types';
import { getTechniqueSyncResult, sanitizeTechniqueForSync } from '@/lib/library-sync';
import {
  LibrarySyncRowAction,
  UserLibraryEntityTabShell,
} from './components/UserLibraryEntityTabShell';
import {
  TECHNIQUE_LIBRARY_LABELS,
  EMPOWERED_TECHNIQUE_LIBRARY_LABELS,
} from './components/library-entity-tab.types';
import { useLibraryEntitySync } from './hooks/use-library-entity-sync';
import { useLibraryDuplicateConfirm } from './hooks/use-library-duplicate-confirm';
import { resolveListRowThumbnail } from '@/lib/list-row-image';
import {
  libraryRowPathIds,
  pathChipLabelsForEntity,
  pathFilterEmptyTitle,
} from '@/lib/game/path-recommendation-index';

const TECHNIQUE_ROW_CHROME = { edit: true, delete: true, rightSlot: true } as const;

interface LibraryTechniquesTabProps {
  onDelete: (item: DisplayItem) => void;
  mode?: 'standard' | 'empowered';
}

export function LibraryTechniquesTab({ onDelete, mode = 'standard' }: LibraryTechniquesTabProps) {
  const router = useRouter();
  const standardTechniquesQuery = useUserTechniques({ enabled: mode === 'standard' });
  const empoweredTechniquesQuery = useUserEmpoweredTechniques({ enabled: mode === 'empowered' });
  const {
    data: standardTechniques = [],
    isLoading: standardLoading,
    error: standardError,
  } = standardTechniquesQuery;
  const {
    data: empoweredTechniques = [],
    isLoading: empoweredLoading,
    error: empoweredError,
  } = empoweredTechniquesQuery;
  const { data: partsDb = [] } = useTechniqueParts();
  const { data: powerPartsDb = [] } = usePowerParts({ enabled: mode === 'empowered' });
  const duplicateTechnique = useDuplicateTechnique();
  const duplicateEmpoweredTechnique = useDuplicateEmpoweredTechnique();
  const [search, setSearch] = useState('');
  const [advancedFilters, setAdvancedFilters] = useState<PowerTechniqueFilterState>(
    EMPTY_POWER_TECHNIQUE_FILTERS,
  );
  const [characterContext, setCharacterContext] = useState<PowerTechniqueCharacterContext | null>(
    null,
  );
  const [characterFilterId, setCharacterFilterId] = useState('');
  const addToCharacter = useAddToCharacterFromLibrary('technique', characterFilterId);
  const { sortState, handleSort, sortItems } = useSort('name');

  const techniques = mode === 'empowered' ? empoweredTechniques : standardTechniques;
  const isLoading = mode === 'empowered' ? empoweredLoading : standardLoading;
  const error = mode === 'empowered' ? empoweredError : standardError;
  const labels =
    mode === 'empowered' ? EMPOWERED_TECHNIQUE_LIBRARY_LABELS : TECHNIQUE_LIBRARY_LABELS;
  const saveType = mode === 'empowered' ? 'empowered-techniques' : 'techniques';
  const duplicateMutation = mode === 'empowered' ? duplicateEmpoweredTechnique : duplicateTechnique;
  const { selectedPathIds, setSelectedPathIds, pathIndex, pathRecommendedIds, pathFilterActive } =
    usePathListFilter({
      entities: techniques,
      kind: 'techniques',
      enabled: mode === 'standard',
    });

  const cardData = useMemo(() => {
    return buildOfficialTechniqueRows(techniques, partsDb, mode).map((row) => {
      const syncResult = getTechniqueSyncResult(row.raw, partsDb);
      return {
        ...row,
        id: String(row.raw.docId ?? row.raw.id ?? row.id),
        hasDrift: syncResult.hasDrift,
        syncIssues: syncResult.issues,
      };
    });
  }, [mode, techniques, partsDb]);

  const categoryOptions = useMemo(
    () => (mode === 'empowered' ? [] : collectCategoryOptionsFromItems(techniques, partsDb)),
    [mode, techniques, partsDb],
  );

  const driftedIds = useMemo(
    () => cardData.filter((item) => item.hasDrift).map((item) => item.id),
    [cardData],
  );

  const sync = useLibraryEntitySync({
    saveType,
    sources: techniques,
    getRowId: (t) => String(t.docId ?? t.id ?? ''),
    getRowName: (t) => String(t.name ?? ''),
    driftedIds,
    sanitize: (source) => sanitizeTechniqueForSync(source, partsDb),
    refetch: () =>
      mode === 'empowered' ? empoweredTechniquesQuery.refetch() : standardTechniquesQuery.refetch(),
    entitySingular: labels.entitySingular,
    entityPlural: labels.entityPlural,
  });

  const dup = useLibraryDuplicateConfirm({
    duplicateTitle: labels.duplicateTitle,
    isPending: duplicateMutation.isPending,
    mutate: (id, handlers) => duplicateMutation.mutate(id, handlers),
  });

  const filteredData = useMemo(() => {
    const advanced = mode === 'empowered' ? undefined : advancedFilters;
    return filterOfficialTechniqueRows(
      cardData,
      search,
      sortItems,
      advanced,
      mode === 'empowered' ? null : characterContext,
      mode === 'empowered' ? null : pathRecommendedIds,
    );
  }, [cardData, search, sortItems, mode, advancedFilters, characterContext, pathRecommendedIds]);

  return (
    <>
      <UserLibraryEntityTabShell
        labels={labels}
        isLoading={isLoading}
        error={error}
        onRetry={() => {
          void standardTechniquesQuery.refetch();
          void empoweredTechniquesQuery.refetch();
        }}
        totalCount={cardData.length}
        emptyIcon={<Swords className="h-8 w-8" />}
        search={search}
        onSearchChange={setSearch}
        sortState={sortState}
        onSort={handleSort}
        headerColumns={OFFICIAL_TECHNIQUE_HEADER_COLUMNS}
        gridColumns={OFFICIAL_TECHNIQUE_GRID}
        hasThumbnailColumn
        rowChrome={TECHNIQUE_ROW_CHROME}
        filteredCount={filteredData.length}
        driftedCount={sync.driftedCount}
        syncingAll={sync.syncingAll}
        showSyncAllConfirm={sync.showSyncAllConfirm}
        onOpenSyncAllConfirm={() => sync.setShowSyncAllConfirm(true)}
        onCloseSyncAllConfirm={() => sync.setShowSyncAllConfirm(false)}
        onConfirmSyncAll={() => {
          sync.setShowSyncAllConfirm(false);
          void sync.handleSyncAll();
        }}
        duplicateConfirm={dup.duplicateConfirm}
        onCloseDuplicate={dup.closeDuplicateConfirm}
        onConfirmDuplicate={dup.onConfirmDuplicate}
        duplicatePending={dup.isPending}
        filters={
          mode === 'empowered' ? undefined : (
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
          mode === 'empowered'
            ? undefined
            : countActivePowerTechniqueFilters(
                advancedFilters,
                'technique',
                Boolean(characterContext),
              ) +
              (characterFilterId ? 1 : 0) +
              (pathFilterActive ? 1 : 0)
        }
        filterEmptyTitle={
          mode !== 'empowered' && pathFilterActive ? pathFilterEmptyTitle('techniques') : undefined
        }
      >
        {filteredData.map((tech) => {
          const detailSections =
            mode === 'empowered'
              ? (() => {
                  const section = empoweredTechniquePartsSection(tech.raw, powerPartsDb, partsDb, {
                    stripOptionSuffix: true,
                  });
                  return section ? [section] : undefined;
                })()
              : officialTechniqueDetailSections(tech);
          const nameLabels =
            mode !== 'empowered' && pathFilterActive
              ? pathChipLabelsForEntity(pathIndex, libraryRowPathIds(tech), selectedPathIds)
              : undefined;
          const nameBadges = nameLabels?.map((label) => ({ label })) ?? [];
          const driftBadges = tech.hasDrift
            ? [{ label: 'Needs sync' as const, color: 'amber' as const }]
            : [];
          const badges = [...nameBadges, ...driftBadges];
          return (
            <GridListRow
              key={tech.id}
              id={tech.id}
              name={tech.name}
              description={tech.description}
              thumbnail={resolveListRowThumbnail('technique', tech.raw, tech.name)}
              gridColumns={OFFICIAL_TECHNIQUE_GRID}
              rowChrome={TECHNIQUE_ROW_CHROME}
              columns={officialTechniqueRowColumns(tech)}
              detailSections={
                detailSections && detailSections.length > 0 ? detailSections : undefined
              }
              badges={badges.length > 0 ? badges : undefined}
              showBadgesInName={nameBadges.length > 0}
              warningMessage={tech.syncIssues[0]?.message}
              rightSlot={
                mode !== 'empowered' &&
                addToCharacter.active &&
                !addToCharacter.isOnCharacter(tech.raw) ? (
                  <LibraryRowActionSlot>
                    <LibraryAddToCharacterButton
                      kind="technique"
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCharacter.openAddConfirm(tech.name, tech.raw);
                      }}
                    />
                    {tech.hasDrift ? (
                      <LibrarySyncRowAction
                        syncing={sync.syncingIds.has(tech.id)}
                        onSync={() => void sync.handleSyncOne(tech.id)}
                      />
                    ) : null}
                  </LibraryRowActionSlot>
                ) : tech.hasDrift ? (
                  <LibrarySyncRowAction
                    syncing={sync.syncingIds.has(tech.id)}
                    onSync={() => void sync.handleSyncOne(tech.id)}
                  />
                ) : undefined
              }
              onEdit={() => {
                const creator =
                  mode === 'empowered' ? '/empowered-technique-creator' : '/technique-creator';
                router.push(`${creator}?edit=${encodeURIComponent(tech.id)}`);
              }}
              onDelete={() => onDelete({ id: tech.id, name: tech.name } as DisplayItem)}
              onDuplicate={() => dup.openDuplicateConfirm(tech.id, tech.name)}
            />
          );
        })}
      </UserLibraryEntityTabShell>
      {mode !== 'empowered' ? addToCharacter.confirmModal : null}
    </>
  );
}
