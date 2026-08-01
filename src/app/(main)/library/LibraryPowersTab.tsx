/**
 * Library Powers Tab — entity mapping + rows; shell from ADR-0001.
 */

'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Wand2 } from 'lucide-react';
import { GridListRow } from '@/components/shared';
import { useSort } from '@/hooks/use-sort';
import {
  derivePowerDisplay,
  formatPowerDamage,
  type PowerDocument,
} from '@/lib/calculators/power-calc';
import { partChipsFromDisplay } from '@/lib/chip/part-chips-from-display';
import { partsProficienciesSection } from '@/lib/chip/list-row-metadata';
import { useUserPowers, usePowerParts, useDuplicatePower } from '@/hooks';
import type { DisplayItem } from '@/types';
import { getPowerSyncResult, sanitizePowerForSync } from '@/lib/library-sync';
import {
  LibrarySyncRowAction,
  UserLibraryEntityTabShell,
} from './components/UserLibraryEntityTabShell';
import { POWER_LIBRARY_LABELS } from './components/library-entity-tab.types';
import { useLibraryEntitySync } from './hooks/use-library-entity-sync';
import { useLibraryDuplicateConfirm } from './hooks/use-library-duplicate-confirm';
import { resolveListRowThumbnail } from '@/lib/list-row-image';

const POWER_GRID_COLUMNS = '1.5fr 0.8fr 1fr 1fr 0.8fr 1fr 1fr';
const POWER_HEADER_COLUMNS = [
  { key: 'name', label: 'NAME' },
  { key: 'energy', label: 'ENERGY' },
  { key: 'action', label: 'ACTION' },
  { key: 'duration', label: 'DURATION' },
  { key: 'range', label: 'RANGE' },
  { key: 'area', label: 'AREA' },
  { key: 'damage', label: 'DAMAGE' },
];
const POWER_ROW_CHROME = { edit: true, delete: true, rightSlot: true } as const;

interface LibraryPowersTabProps {
  onDelete: (item: DisplayItem) => void;
}

export function LibraryPowersTab({ onDelete }: LibraryPowersTabProps) {
  const router = useRouter();
  const { data: powers = [], isLoading, error, refetch } = useUserPowers();
  const { data: partsDb = [] } = usePowerParts();
  const duplicatePower = useDuplicatePower();
  const [search, setSearch] = useState('');
  const { sortState, handleSort, sortItems } = useSort('name');

  const cardData = useMemo(() => {
    return powers.map((p) => {
      const doc: PowerDocument = {
        name: String(p.name ?? ''),
        description: String(p.description ?? ''),
        parts: Array.isArray(p.parts) ? (p.parts as PowerDocument['parts']) : [],
        damage: p.damage as PowerDocument['damage'],
        actionType: p.actionType,
        isReaction: p.isReaction,
        range: p.range as PowerDocument['range'],
        area: p.area as PowerDocument['area'],
        duration: p.duration as PowerDocument['duration'],
      };
      const display = derivePowerDisplay(doc, partsDb);
      const syncResult = getPowerSyncResult(p, partsDb);
      const damageStr = formatPowerDamage(doc.damage);
      const parts = partChipsFromDisplay(display.partChips, { stripOptionSuffix: true });
      return {
        id: String(p.docId ?? p.id ?? ''),
        name: display.name,
        description: display.description,
        energy: display.energy,
        action: display.actionType,
        duration: display.duration,
        range: display.range,
        area: display.area,
        damage: damageStr,
        tp: display.tp,
        parts,
        hasDrift: syncResult.hasDrift,
        syncIssues: syncResult.issues,
        raw: p,
      };
    });
  }, [powers, partsDb]);

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

  const filteredData = useMemo(() => {
    let result = cardData;
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(
        (p) =>
          String(p.name ?? '').toLowerCase().includes(searchLower) ||
          String(p.description ?? '').toLowerCase().includes(searchLower)
      );
    }
    return sortItems(result);
  }, [cardData, search, sortItems]);

  return (
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
      headerColumns={POWER_HEADER_COLUMNS}
      gridColumns={POWER_GRID_COLUMNS}
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
            gridColumns={POWER_GRID_COLUMNS}
            columns={[
              { key: 'Energy', value: power.energy, highlight: true },
              { key: 'Action', value: power.action },
              { key: 'Duration', value: power.duration },
              { key: 'Range', value: power.range },
              { key: 'Area', value: power.area },
              { key: 'Damage', value: power.damage },
            ]}
            detailSections={partsSection ? [partsSection] : undefined}
            totalCost={power.tp}
            costLabel="TP"
            badges={power.hasDrift ? [{ label: 'Needs sync', color: 'amber' }] : []}
            warningMessage={power.syncIssues[0]?.message}
            rightSlot={
              power.hasDrift ? (
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
  );
}
