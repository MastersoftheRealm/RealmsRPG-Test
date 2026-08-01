/**
 * Library Techniques Tab — entity mapping + rows; shell from ADR-0001.
 * Handles both standard and empowered techniques via the `mode` prop.
 */

'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Swords } from 'lucide-react';
import { GridListRow } from '@/components/shared';
import { useSort } from '@/hooks/use-sort';
import type { TechniqueDocument } from '@/lib/calculators/technique-calc';
import { deriveTechniqueDisplay, formatTechniqueDamage } from '@/lib/calculators/technique-calc';
import { partChipsFromDisplay } from '@/lib/chip/part-chips-from-display';
import { partsProficienciesSection } from '@/lib/chip/list-row-metadata';
import {
  useUserTechniques,
  useUserEmpoweredTechniques,
  useTechniqueParts,
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

const TECHNIQUE_GRID_COLUMNS = '1.5fr 0.8fr 0.8fr 1fr 1fr 1fr';
const TECHNIQUE_HEADER_COLUMNS = [
  { key: 'name', label: 'NAME' },
  { key: 'energy', label: 'ENERGY' },
  { key: 'tp', label: 'TP' },
  { key: 'action', label: 'ACTION' },
  { key: 'weapon', label: 'ATTACK' },
  { key: 'damage', label: 'DAMAGE' },
];
const TECHNIQUE_ROW_CHROME = { edit: true, delete: true } as const;

interface LibraryTechniquesTabProps {
  onDelete: (item: DisplayItem) => void;
  mode?: 'standard' | 'empowered';
}

function getEmpoweredTotals(technique: unknown): { energy?: number; tp?: number } {
  const raw = technique as Record<string, unknown>;
  const totals = raw.totals as Record<string, unknown> | undefined;
  const energy = typeof totals?.energy === 'number' ? totals.energy : undefined;
  const tp = typeof totals?.trainingPoints === 'number' ? totals.trainingPoints : undefined;
  return { energy, tp };
}

export function LibraryTechniquesTab({ onDelete, mode = 'standard' }: LibraryTechniquesTabProps) {
  const router = useRouter();
  const standardTechniquesQuery = useUserTechniques({ enabled: mode === 'standard' });
  const empoweredTechniquesQuery = useUserEmpoweredTechniques({ enabled: mode === 'empowered' });
  const { data: standardTechniques = [], isLoading: standardLoading, error: standardError } = standardTechniquesQuery;
  const { data: empoweredTechniques = [], isLoading: empoweredLoading, error: empoweredError } = empoweredTechniquesQuery;
  const { data: partsDb = [] } = useTechniqueParts();
  const duplicateTechnique = useDuplicateTechnique();
  const duplicateEmpoweredTechnique = useDuplicateEmpoweredTechnique();
  const [search, setSearch] = useState('');
  const { sortState, handleSort, sortItems } = useSort('name');

  const techniques = mode === 'empowered' ? empoweredTechniques : standardTechniques;
  const isLoading = mode === 'empowered' ? empoweredLoading : standardLoading;
  const error = mode === 'empowered' ? empoweredError : standardError;
  const labels = mode === 'empowered' ? EMPOWERED_TECHNIQUE_LIBRARY_LABELS : TECHNIQUE_LIBRARY_LABELS;
  const saveType = mode === 'empowered' ? 'empowered-techniques' : 'techniques';
  const duplicateMutation = mode === 'empowered' ? duplicateEmpoweredTechnique : duplicateTechnique;

  const cardData = useMemo(() => {
    return techniques.map((tech) => {
      const empowered = mode === 'empowered';
      const doc: TechniqueDocument = {
        name: String(tech.name ?? ''),
        description: String(tech.description ?? ''),
        parts: Array.isArray(tech.parts) ? (tech.parts as TechniqueDocument['parts']) : [],
        damage: Array.isArray(tech.damage)
          ? (tech.damage[0] as TechniqueDocument['damage'])
          : (tech.damage as TechniqueDocument['damage']),
        attackMode: tech.attackMode,
        weaponName: tech.weaponName,
        weapon: tech.weapon as TechniqueDocument['weapon'],
      };
      const display = deriveTechniqueDisplay(doc, partsDb);
      const syncResult = getTechniqueSyncResult(tech, partsDb);
      const totals = getEmpoweredTotals(tech);
      const damageStr = formatTechniqueDamage(doc.damage);
      const parts = partChipsFromDisplay(display.partChips, { stripOptionSuffix: true });
      return {
        id: String(tech.docId ?? tech.id ?? ''),
        name: display.name,
        description: display.description,
        energy: empowered ? (totals.energy ?? display.energy) : display.energy,
        tp: empowered ? (totals.tp ?? display.tp) : display.tp,
        action: display.actionType,
        weapon: display.weaponName || '-',
        damage: damageStr,
        parts,
        hasDrift: syncResult.hasDrift,
        syncIssues: syncResult.issues,
        raw: tech,
      };
    });
  }, [mode, techniques, partsDb]);

  const driftedIds = useMemo(
    () => cardData.filter((item) => item.hasDrift).map((item) => item.id),
    [cardData]
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
    let result = cardData;
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(
        (t) =>
          String(t.name ?? '').toLowerCase().includes(searchLower) ||
          String(t.description ?? '').toLowerCase().includes(searchLower) ||
          String(t.weapon ?? '').toLowerCase().includes(searchLower)
      );
    }
    return sortItems(result);
  }, [cardData, search, sortItems]);

  return (
    <UserLibraryEntityTabShell
      labels={labels}
      isLoading={isLoading}
      error={error}
      onRetry={() => {
        void standardTechniquesQuery.refetch();
        void empoweredTechniquesQuery.refetch();
      }}
      totalCount={cardData.length}
      emptyIcon={<Swords className="w-8 h-8" />}
      search={search}
      onSearchChange={setSearch}
      sortState={sortState}
      onSort={handleSort}
      headerColumns={TECHNIQUE_HEADER_COLUMNS}
      gridColumns={TECHNIQUE_GRID_COLUMNS}
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
    >
      {filteredData.map((tech) => {
        const partsSection = partsProficienciesSection(tech.parts, 'technique');
        return (
          <GridListRow
            key={tech.id}
            id={tech.id}
            name={tech.name}
            description={tech.description}
            thumbnail={resolveListRowThumbnail('technique', tech.raw, tech.name)}
            gridColumns={TECHNIQUE_GRID_COLUMNS}
            columns={[
              { key: 'Energy', value: tech.energy, highlight: true },
              { key: 'TP', value: tech.tp },
              { key: 'Action', value: tech.action },
              { key: 'Weapon', value: tech.weapon },
              { key: 'Damage', value: tech.damage },
            ]}
            detailSections={partsSection ? [partsSection] : undefined}
            totalCost={typeof tech.tp === 'number' ? tech.tp : parseFloat(String(tech.tp)) || undefined}
            costLabel="TP"
            badges={tech.hasDrift ? [{ label: 'Needs sync', color: 'amber' }] : []}
            warningMessage={tech.syncIssues[0]?.message}
            rightSlot={
              tech.hasDrift ? (
                <LibrarySyncRowAction
                  syncing={sync.syncingIds.has(tech.id)}
                  onSync={() => void sync.handleSyncOne(tech.id)}
                />
              ) : undefined
            }
            onEdit={() => {
              const creator = mode === 'empowered' ? '/empowered-technique-creator' : '/technique-creator';
              router.push(`${creator}?edit=${encodeURIComponent(tech.id)}`);
            }}
            onDelete={() => onDelete({ id: tech.id, name: tech.name } as DisplayItem)}
            onDuplicate={() => dup.openDuplicateConfirm(tech.id, tech.name)}
          />
        );
      })}
    </UserLibraryEntityTabShell>
  );
}
