/**
 * Library Creatures Tab — entity mapping + rows; shell from ADR-0001.
 * Full CreatureStatBlock display with roll support.
 */

'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users } from 'lucide-react';
import { CreatureLibraryStatBlockRows } from '@/components/shared';
import { RollLog, RollProvider } from '@/components/rolls';
import { useSort } from '@/hooks/use-sort';
import {
  useUserCreatures,
  useDuplicateCreature,
  usePowerParts,
  useTechniqueParts,
  useItemProperties,
} from '@/hooks';
import type { DisplayItem } from '@/types';
import type { LibraryCreature } from '@/types/library';
import { calculateCreatureMaxHealth, calculateCreatureMaxEnergy } from '@/lib/game/encounter-utils';
import { getCreatureSyncResult, sanitizeCreatureForSync } from '@/lib/library-sync';
import {
  CREATURE_STAT_BLOCK_GRID,
  CREATURE_STAT_BLOCK_HEADER_COLUMNS,
  filterOfficialCreatureRows,
} from '@/lib/library/official-creature-list';
import {
  LibrarySyncRowAction,
  UserLibraryEntityTabShell,
} from './components/UserLibraryEntityTabShell';
import { CREATURE_LIBRARY_LABELS } from './components/library-entity-tab.types';
import { useLibraryEntitySync } from './hooks/use-library-entity-sync';
import { useLibraryDuplicateConfirm } from './hooks/use-library-duplicate-confirm';

type CreatureListRow = LibraryCreature & {
  id: string;
  hasDrift: boolean;
  syncMessage?: string;
};

/** Match Powers/Techniques — ListHeader must reserve edit/delete/sync tracks. */
const CREATURE_ROW_CHROME = { edit: true, delete: true, rightSlot: true } as const;

interface LibraryCreaturesTabProps {
  onDelete: (item: DisplayItem) => void;
}

export function LibraryCreaturesTab({ onDelete }: LibraryCreaturesTabProps) {
  const router = useRouter();
  const { data: creatures = [], isLoading, error, refetch } = useUserCreatures();
  const { data: powerPartsDb = [] } = usePowerParts();
  const { data: techniquePartsDb = [] } = useTechniqueParts();
  const { data: itemPropertiesDb = [] } = useItemProperties();
  const duplicateCreature = useDuplicateCreature();
  const [search, setSearch] = useState('');
  const { sortState, handleSort, sortItems } = useSort('name');

  const cardData = useMemo((): CreatureListRow[] => {
    return creatures.map((c) => {
      const level = c.level ?? 1;
      const abil = c.abilities || {};
      const hpAlloc = c.hitPoints ?? c.hp ?? 0;
      const enAlloc = c.energyPoints ?? 0;
      const id = String(c.docId ?? c.id ?? '');
      const syncResult = getCreatureSyncResult(
        c as unknown as Record<string, unknown> as never,
        powerPartsDb as never,
        techniquePartsDb as never,
        itemPropertiesDb as never
      );
      return {
        ...c,
        id,
        name: c.name || '',
        hp: calculateCreatureMaxHealth(level, abil, hpAlloc),
        en: calculateCreatureMaxEnergy(level, abil, enAlloc),
        hasDrift: syncResult.hasDrift,
        syncMessage: syncResult.issues[0]?.message,
      };
    });
  }, [creatures, powerPartsDb, techniquePartsDb, itemPropertiesDb]);

  const driftedIds = useMemo(
    () => cardData.filter((c) => c.hasDrift).map((c) => c.id),
    [cardData]
  );

  const sync = useLibraryEntitySync({
    saveType: 'creatures',
    sources: creatures,
    getRowId: (c) => String(c.docId ?? c.id ?? ''),
    getRowName: (c) => String(c.name ?? ''),
    driftedIds,
    sanitize: (source) =>
      sanitizeCreatureForSync(
        source as unknown as Record<string, unknown> as never,
        powerPartsDb as never,
        techniquePartsDb as never,
        itemPropertiesDb as never
      ),
    refetch,
    entitySingular: CREATURE_LIBRARY_LABELS.entitySingular,
    entityPlural: CREATURE_LIBRARY_LABELS.entityPlural,
  });

  const dup = useLibraryDuplicateConfirm({
    duplicateTitle: CREATURE_LIBRARY_LABELS.duplicateTitle,
    isPending: duplicateCreature.isPending,
    mutate: (id, handlers) => duplicateCreature.mutate(id, handlers),
  });

  const filteredData = useMemo(
    () => filterOfficialCreatureRows(cardData, search, sortItems),
    [cardData, search, sortItems]
  );

  return (
    <RollProvider canRoll>
      <UserLibraryEntityTabShell
        labels={CREATURE_LIBRARY_LABELS}
        isLoading={isLoading}
        error={error}
        onRetry={() => void refetch()}
        totalCount={cardData.length}
        emptyIcon={<Users className="w-8 h-8" />}
        search={search}
        onSearchChange={setSearch}
        sortState={sortState}
        onSort={handleSort}
        headerColumns={CREATURE_STAT_BLOCK_HEADER_COLUMNS}
        gridColumns={CREATURE_STAT_BLOCK_GRID}
        hasThumbnailColumn
        rowChrome={CREATURE_ROW_CHROME}
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
        afterList={<RollLog />}
      >
        <CreatureLibraryStatBlockRows
          creatures={filteredData}
          getRowProps={(creature) => {
            const row = creature as CreatureListRow;
            return {
              badges: row.hasDrift ? [{ label: 'Needs sync', color: 'amber' as const }] : undefined,
              warningMessage: row.syncMessage,
              rightSlot: row.hasDrift ? (
                <LibrarySyncRowAction
                  syncing={sync.syncingIds.has(row.id)}
                  onSync={() => void sync.handleSyncOne(row.id)}
                />
              ) : undefined,
              onEdit: () => {
                const id = row.docId ?? row.id;
                router.push(`/creature-creator?edit=${encodeURIComponent(String(id))}`);
              },
              onDelete: () => onDelete({ id: row.docId, name: row.name } as DisplayItem),
              onDuplicate: () => dup.openDuplicateConfirm(String(row.docId), row.name),
            };
          }}
        />
      </UserLibraryEntityTabShell>
    </RollProvider>
  );
}
