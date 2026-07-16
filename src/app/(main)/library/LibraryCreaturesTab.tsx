/**
 * Library Creatures Tab — entity mapping + rows; shell from ADR-0001.
 * Full CreatureStatBlock display with roll support.
 */

'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users } from 'lucide-react';
import { CreatureStatBlock } from '@/components/shared';
import { RollLog, RollProvider } from '@/components/character-sheet';
import { useSort } from '@/hooks/use-sort';
import {
  useUserCreatures,
  useDuplicateCreature,
  usePowerParts,
  useTechniqueParts,
  useItemProperties,
} from '@/hooks';
import type { DisplayItem } from '@/types';
import { calculateCreatureMaxHealth, calculateCreatureMaxEnergy } from '@/lib/game/encounter-utils';
import { getCreatureSyncResult, sanitizeCreatureForSync } from '@/lib/library-sync';
import {
  LibrarySyncRowAction,
  UserLibraryEntityTabShell,
} from './components/UserLibraryEntityTabShell';
import { CREATURE_LIBRARY_LABELS } from './components/library-entity-tab.types';
import { useLibraryEntitySync } from './hooks/use-library-entity-sync';
import { useLibraryDuplicateConfirm } from './hooks/use-library-duplicate-confirm';

const CREATURE_GRID_COLUMNS = '1.8fr 0.6fr 0.8fr 1fr 1fr 0.6fr 0.6fr';
const CREATURE_HEADER_COLUMNS = [
  { key: 'name', label: 'NAME' },
  { key: 'level', label: 'LEVEL', align: 'center' as const },
  { key: 'size', label: 'SIZE', align: 'center' as const },
  { key: 'type', label: 'TYPE', align: 'center' as const },
  { key: 'archetype', label: 'ARCHETYPE', align: 'center' as const },
  { key: 'hp', label: 'HP', align: 'center' as const },
  { key: 'en', label: 'EN', align: 'center' as const },
];

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

  const cardData = useMemo(() => {
    return creatures.map((c) => {
      const power = c.powerProficiency ?? 0;
      const martial = c.martialProficiency ?? 0;
      const archetype =
        power > 0 && martial > 0 ? 'Powered-Martial' : power > 0 ? 'Power' : martial > 0 ? 'Martial' : 'None';
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
        level: c.level ?? 0,
        size: c.size ?? '',
        type: c.type ?? '',
        hp: calculateCreatureMaxHealth(level, abil, hpAlloc),
        en: calculateCreatureMaxEnergy(level, abil, enAlloc),
        archetype,
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

  const filteredData = useMemo(() => {
    let result = cardData;
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.name?.toLowerCase().includes(searchLower) ||
          c.type?.toLowerCase().includes(searchLower) ||
          c.description?.toLowerCase().includes(searchLower)
      );
    }
    return sortItems(result);
  }, [cardData, search, sortItems]);

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
        headerColumns={CREATURE_HEADER_COLUMNS}
        gridColumns={CREATURE_GRID_COLUMNS}
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
        listClassName=""
        afterList={<RollLog />}
      >
        <div className="space-y-3">
          {filteredData.map((creature) => (
            <CreatureStatBlock
              key={creature.docId}
              creature={{
                id: creature.docId,
                name: creature.name,
                description: creature.description,
                level: creature.level,
                type: creature.type,
                size: creature.size,
                hp: creature.hp,
                hitPoints: creature.hitPoints,
                energyPoints: creature.energyPoints,
                abilities: creature.abilities,
                defenses: creature.defenses,
                powerProficiency: creature.powerProficiency,
                martialProficiency: creature.martialProficiency,
                resistances: creature.resistances,
                weaknesses: creature.weaknesses,
                immunities: creature.immunities,
                conditionImmunities: creature.conditionImmunities,
                senses: creature.senses,
                movementTypes: creature.movementTypes,
                languages: creature.languages,
                skills: creature.skills,
                powers: creature.powers,
                techniques: creature.techniques,
                feats: creature.feats,
                armaments: creature.armaments,
              }}
              badges={creature.hasDrift ? [{ label: 'Needs sync', color: 'amber' }] : undefined}
              warningMessage={creature.syncMessage}
              rightSlot={
                creature.hasDrift ? (
                  <LibrarySyncRowAction
                    syncing={sync.syncingIds.has(creature.id)}
                    onSync={() => void sync.handleSyncOne(creature.id)}
                  />
                ) : undefined
              }
              onEdit={() => {
                const id = creature.docId ?? creature.id;
                router.push(`/creature-creator?edit=${encodeURIComponent(String(id))}`);
              }}
              onDelete={() => onDelete({ id: creature.docId, name: creature.name } as DisplayItem)}
              onDuplicate={() => dup.openDuplicateConfirm(String(creature.docId), creature.name)}
            />
          ))}
        </div>
      </UserLibraryEntityTabShell>
    </RollProvider>
  );
}
