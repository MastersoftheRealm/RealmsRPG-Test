/**
 * Library Powers Tab — entity mapping + rows; shell from ADR-0001.
 */

'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Wand2 } from 'lucide-react';
import {
  GridListRow,
  LibraryAddToCharacterButton,
  LibraryRowActionSlot,
} from '@/components/shared';
import { PowerTechniqueFilters } from '@/components/shared/filters';
import { useSort } from '@/hooks/use-sort';
import { useGameRules } from '@/hooks/use-game-rules';
import { useAddToCharacterFromLibrary } from '@/hooks/use-add-to-character-from-library';
import { partsProficienciesSection } from '@/lib/chip/list-row-metadata';
import { useUserPowers, usePowerParts, useDuplicatePower } from '@/hooks';
import type { DisplayItem } from '@/types';
import { getPowerSyncResult, sanitizePowerForSync } from '@/lib/library-sync';
import {
  buildOfficialPowerRows,
  filterOfficialPowerRows,
  OFFICIAL_POWER_GRID,
  OFFICIAL_POWER_HEADER_COLUMNS,
} from '@/lib/library/official-power-list';
import { collectCategoryOptionsFromItems } from '@/lib/library/power-technique-categories';
import {
  EMPTY_POWER_TECHNIQUE_FILTERS,
  type PowerTechniqueFilterState,
} from '@/lib/library/power-technique-filters';
import type { PowerTechniqueCharacterContext } from '@/lib/library/power-technique-character-context';
import { listInnateThresholdFilterOptions } from '@/lib/game/innate-eligibility';
import {
  LibrarySyncRowAction,
  UserLibraryEntityTabShell,
} from './components/UserLibraryEntityTabShell';
import { POWER_LIBRARY_LABELS } from './components/library-entity-tab.types';
import { useLibraryEntitySync } from './hooks/use-library-entity-sync';
import { useLibraryDuplicateConfirm } from './hooks/use-library-duplicate-confirm';
import { resolveListRowThumbnail } from '@/lib/list-row-image';

const POWER_ROW_CHROME = { edit: true, delete: true, rightSlot: true } as const;

interface LibraryPowersTabProps {
  onDelete: (item: DisplayItem) => void;
}

export function LibraryPowersTab({ onDelete }: LibraryPowersTabProps) {
  const router = useRouter();
  const { rules } = useGameRules();
  const { data: powers = [], isLoading, error, refetch } = useUserPowers();
  const { data: partsDb = [] } = usePowerParts();
  const duplicatePower = useDuplicatePower();
  const [search, setSearch] = useState('');
  const [advancedFilters, setAdvancedFilters] = useState<PowerTechniqueFilterState>(
    EMPTY_POWER_TECHNIQUE_FILTERS
  );
  const [characterContext, setCharacterContext] =
    useState<PowerTechniqueCharacterContext | null>(null);
  const [characterFilterId, setCharacterFilterId] = useState('');
  const addToCharacter = useAddToCharacterFromLibrary('power', characterFilterId);
  const { sortState, handleSort, sortItems } = useSort('name');

  const cardData = useMemo(() => {
    return buildOfficialPowerRows(powers, partsDb).map((row) => {
      const syncResult = getPowerSyncResult(row.raw, partsDb);
      return {
        ...row,
        id: String(row.raw.docId ?? row.raw.id ?? row.id),
        hasDrift: syncResult.hasDrift,
        syncIssues: syncResult.issues,
      };
    });
  }, [powers, partsDb]);

  const categoryOptions = useMemo(
    () => collectCategoryOptionsFromItems(powers, partsDb, { includeDamageCategory: true }),
    [powers, partsDb]
  );

  const innateThresholdOptions = useMemo(
    () => listInnateThresholdFilterOptions(rules),
    [rules]
  );

  const driftedIds = useMemo(
    () => cardData.filter((item) => item.hasDrift).map((item) => item.id),
    [cardData]
  );

  const sync = useLibraryEntitySync({
    saveType: 'powers',
    sources: powers,
    getRowId: (p) => String(p.docId ?? p.id ?? ''),
    getRowName: (p) => String(p.name ?? ''),
    driftedIds,
    sanitize: (source) => sanitizePowerForSync(source, partsDb),
    refetch,
    entitySingular: POWER_LIBRARY_LABELS.entitySingular,
    entityPlural: POWER_LIBRARY_LABELS.entityPlural,
  });

  const dup = useLibraryDuplicateConfirm({
    duplicateTitle: POWER_LIBRARY_LABELS.duplicateTitle,
    isPending: duplicatePower.isPending,
    mutate: (id, handlers) => duplicatePower.mutate(id, handlers),
  });

  const filteredData = useMemo(
    () =>
      filterOfficialPowerRows(cardData, search, sortItems, advancedFilters, characterContext),
    [cardData, search, advancedFilters, characterContext, sortItems]
  );

  return (
    <>
    <UserLibraryEntityTabShell
      labels={POWER_LIBRARY_LABELS}
      isLoading={isLoading}
      error={error}
      onRetry={() => void refetch()}
      totalCount={cardData.length}
      emptyIcon={<Wand2 className="w-8 h-8" />}
      search={search}
      onSearchChange={setSearch}
      sortState={sortState}
      onSort={handleSort}
      headerColumns={OFFICIAL_POWER_HEADER_COLUMNS}
      gridColumns={OFFICIAL_POWER_GRID}
      hasThumbnailColumn
      rowChrome={POWER_ROW_CHROME}
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
        <PowerTechniqueFilters
          kind="power"
          value={advancedFilters}
          onChange={setAdvancedFilters}
          categoryOptions={categoryOptions}
          innateThresholdOptions={innateThresholdOptions}
          onCharacterContextChange={setCharacterContext}
          onCharacterIdChange={setCharacterFilterId}
        />
      }
    >
      {filteredData.map((power) => {
        const partsSection = partsProficienciesSection(power.parts, 'power');
        return (
          <GridListRow
            key={power.id}
            id={power.id}
            name={power.name}
            description={power.description}
            thumbnail={resolveListRowThumbnail('power', power.raw, power.name)}
            gridColumns={OFFICIAL_POWER_GRID}
            rowChrome={POWER_ROW_CHROME}
            columns={[
              { key: 'Category', value: power.category, align: 'center' },
              { key: 'Energy', value: power.energy, highlight: true, align: 'center' },
              { key: 'Action', value: power.action, align: 'center' },
              { key: 'Duration', value: power.duration, align: 'center' },
              { key: 'Range', value: power.range, align: 'center' },
              { key: 'Area', value: power.area, align: 'center' },
              { key: 'Damage', value: power.damage, align: 'center' },
            ]}
            detailSections={partsSection ? [partsSection] : undefined}
            totalCost={power.tp}
            costLabel="TP"
            badges={power.hasDrift ? [{ label: 'Needs sync', color: 'amber' }] : []}
            warningMessage={power.syncIssues[0]?.message}
            rightSlot={
              addToCharacter.active && !addToCharacter.isOnCharacter(power.raw) ? (
                <LibraryRowActionSlot>
                  <LibraryAddToCharacterButton
                    kind="power"
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCharacter.openAddConfirm(power.name, power.raw);
                    }}
                  />
                  {power.hasDrift ? (
                    <LibrarySyncRowAction
                      syncing={sync.syncingIds.has(power.id)}
                      onSync={() => void sync.handleSyncOne(power.id)}
                    />
                  ) : null}
                </LibraryRowActionSlot>
              ) : power.hasDrift ? (
                <LibrarySyncRowAction
                  syncing={sync.syncingIds.has(power.id)}
                  onSync={() => void sync.handleSyncOne(power.id)}
                />
              ) : undefined
            }
            onEdit={() => router.push(`/power-creator?edit=${encodeURIComponent(power.id)}`)}
            onDelete={() => onDelete({ id: power.id, name: power.name } as DisplayItem)}
            onDuplicate={() => dup.openDuplicateConfirm(power.id, power.name)}
          />
        );
      })}
    </UserLibraryEntityTabShell>
    {addToCharacter.confirmModal}
    </>
  );
}
