/**
 * Library Creatures Tab
 * =====================
 * User's creatures with search and sort. Full CreatureStatBlock display.
 */

'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, RefreshCw, Users } from 'lucide-react';
import {
  CreatureStatBlock,
  SearchInput,
  ListHeader,
  LoadingState,
  ErrorDisplay,
  ListEmptyState,
  ConfirmActionModal,
} from '@/components/shared';
import { RollLog, RollProvider } from '@/components/character-sheet';
import { useSort } from '@/hooks/use-sort';
import { useUserCreatures, useDuplicateCreature, usePowerParts, useTechniqueParts, useItemProperties } from '@/hooks';
import { Button, IconButton, useToast } from '@/components/ui';
import type { DisplayItem } from '@/types';
import { calculateCreatureMaxHealth, calculateCreatureMaxEnergy } from '@/lib/game/encounter-utils';
import { getCreatureSyncResult, sanitizeCreatureForSync } from '@/lib/library-sync';
import { saveToLibrary } from '@/services/library-service';

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
  const { showToast } = useToast();
  const { data: creatures = [], isLoading, error, refetch } = useUserCreatures();
  const duplicateCreature = useDuplicateCreature();
  const [search, setSearch] = useState('');
  const [syncingIds, setSyncingIds] = useState<Set<string>>(new Set());
  const [syncingAll, setSyncingAll] = useState(false);
  const [duplicateConfirm, setDuplicateConfirm] = useState<{ id: string; name: string } | null>(null);
  const [showSyncAllConfirm, setShowSyncAllConfirm] = useState(false);
  const { sortState, handleSort, sortItems } = useSort('name');

  const { data: powerPartsDb = [] } = usePowerParts();
  const { data: techniquePartsDb = [] } = useTechniqueParts();
  const { data: itemPropertiesDb = [] } = useItemProperties();

  const myOnlyCreatures = useMemo(() => {
    if (!creatures.length) return [];
    const filtered = creatures.filter(c => {
      if (!search) return true;
      const searchLower = search.toLowerCase();
      return (
        c.name?.toLowerCase().includes(searchLower) ||
        c.type?.toLowerCase().includes(searchLower) ||
        c.description?.toLowerCase().includes(searchLower)
      );
    });
    return sortItems(
      filtered.map(c => {
        const power = c.powerProficiency ?? 0;
        const martial = c.martialProficiency ?? 0;
        const archetype = power > 0 && martial > 0 ? 'Powered-Martial' : power > 0 ? 'Power' : martial > 0 ? 'Martial' : 'None';
        const level = c.level ?? 1;
        const abil = c.abilities || {};
        const hpAlloc = c.hitPoints ?? c.hp ?? 0;
        const enAlloc = c.energyPoints ?? 0;
        return {
          ...c,
          name: c.name || '',
          level: c.level ?? 0,
          size: c.size ?? '',
          type: c.type ?? '',
          hp: calculateCreatureMaxHealth(level, abil, hpAlloc),
          en: calculateCreatureMaxEnergy(level, abil, enAlloc),
          archetype,
        };
      })
    );
  }, [creatures, search, sortItems]);

  const driftById = useMemo(() => {
    const map = new Map<string, { hasDrift: boolean; message?: string }>();
    for (const c of creatures) {
      const id = String(c.docId ?? c.id ?? '');
      if (!id) continue;
      const r = getCreatureSyncResult(c as unknown as Record<string, unknown> as never, powerPartsDb as never, techniquePartsDb as never, itemPropertiesDb as never);
      map.set(id, { hasDrift: r.hasDrift, message: r.issues[0]?.message });
    }
    return map;
  }, [creatures, powerPartsDb, techniquePartsDb, itemPropertiesDb]);

  const driftedCount = useMemo(() => {
    let n = 0;
    for (const v of driftById.values()) if (v.hasDrift) n += 1;
    return n;
  }, [driftById]);

  const handleSyncOne = async (creatureId: string) => {
    const source = creatures.find((c) => String(c.docId ?? c.id ?? '') === creatureId);
    if (!source) return;
    const sanitized = sanitizeCreatureForSync(source as unknown as never, powerPartsDb as never, techniquePartsDb as never, itemPropertiesDb as never);
    if (!sanitized.hasDrift || !sanitized.changed) return;

    setSyncingIds((prev) => new Set(prev).add(creatureId));
    try {
      await saveToLibrary('creatures', sanitized.value as unknown as Record<string, unknown>, { existingId: creatureId });
      await refetch();
      showToast(`Synced "${source.name}" to current patch rules.`, 'success');
    } catch (e) {
      showToast((e as Error)?.message ?? 'Failed to sync creature', 'error');
    } finally {
      setSyncingIds((prev) => {
        const next = new Set(prev);
        next.delete(creatureId);
        return next;
      });
    }
  };

  const handleSyncAll = async () => {
    if (driftedCount === 0) return;
    setSyncingAll(true);
    let synced = 0;
    try {
      for (const c of creatures) {
        const id = String(c.docId ?? c.id ?? '');
        if (!id) continue;
        const info = driftById.get(id);
        if (!info?.hasDrift) continue;
        const sanitized = sanitizeCreatureForSync(c as unknown as never, powerPartsDb as never, techniquePartsDb as never, itemPropertiesDb as never);
        if (!sanitized.hasDrift || !sanitized.changed) continue;
        await saveToLibrary('creatures', sanitized.value as unknown as Record<string, unknown>, { existingId: id });
        synced += 1;
      }
      await refetch();
      showToast(synced > 0 ? `Synced ${synced} creature${synced === 1 ? '' : 's'} with current patch.` : 'All creatures are already in sync.', 'success');
    } catch (e) {
      showToast((e as Error)?.message ?? 'Failed to sync all creatures', 'error');
    } finally {
      setSyncingAll(false);
    }
  };

  if (error) {
    return <ErrorDisplay message="Failed to load creatures" subMessage="Please try again later" onRetry={() => refetch()} />;
  }

  if (!isLoading && (!creatures || creatures.length === 0)) {
    return (
      <ListEmptyState
        icon={<Users className="w-8 h-8" />}
        title="No creatures yet"
        message="Create your first creature to see it here in your library."
        action={
          <Button asChild>
            <Link href="/creature-creator">
              <Plus className="w-4 h-4" />
              Create Creature
            </Link>
          </Button>
        }
      />
    );
  }

  return (
    <RollProvider canRoll>
      <div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <SearchInput value={search} onChange={setSearch} placeholder="Search creatures..." />
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowSyncAllConfirm(true)}
            disabled={driftedCount === 0 || syncingAll}
          >
            <RefreshCw className={`w-4 h-4 ${syncingAll ? 'animate-spin' : ''}`} />
            Sync with current patch
            {driftedCount > 0 ? ` (${driftedCount})` : ''}
          </Button>
        </div>
        <ListHeader
          columns={CREATURE_HEADER_COLUMNS}
          gridColumns={CREATURE_GRID_COLUMNS}
          sortState={sortState}
          onSort={handleSort}
        />
        {isLoading ? (
          <LoadingState />
        ) : myOnlyCreatures.length === 0 ? (
          <div className="py-12 text-center text-text-secondary">No creatures match your search.</div>
        ) : (
          <div className="space-y-3">
            {myOnlyCreatures.map(creature => (
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
                badges={driftById.get(String(creature.docId))?.hasDrift ? [{ label: 'Needs sync', color: 'amber' }] : undefined}
                warningMessage={driftById.get(String(creature.docId))?.message}
                rightSlot={driftById.get(String(creature.docId))?.hasDrift ? (
                  <IconButton
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      void handleSyncOne(String(creature.docId));
                    }}
                    label="Sync with current patch"
                    className="text-warning-700 hover:text-warning-700 dark:text-warning-400"
                  >
                    <RefreshCw className={`w-4 h-4 ${syncingIds.has(String(creature.docId)) ? 'animate-spin' : ''}`} />
                  </IconButton>
                ) : undefined}
                onEdit={() => {
                  const id = creature.docId ?? creature.id;
                  router.push(`/creature-creator?edit=${encodeURIComponent(String(id))}`);
                }}
                onDelete={() => onDelete({ id: creature.docId, name: creature.name } as DisplayItem)}
                onDuplicate={() => setDuplicateConfirm({ id: String(creature.docId), name: creature.name })}
              />
            ))}
          </div>
        )}
        <RollLog />

        <ConfirmActionModal
          isOpen={!!duplicateConfirm}
          onClose={() => setDuplicateConfirm(null)}
          onConfirm={() => {
            if (!duplicateConfirm) return;
            duplicateCreature.mutate(duplicateConfirm.id, {
              onSuccess: () => {
                showToast(`Duplicated "${duplicateConfirm.name}"`, 'success');
                setDuplicateConfirm(null);
              },
              onError: (e) => showToast(e?.message ?? 'Failed to duplicate', 'error'),
            });
          }}
          title="Duplicate creature?"
          description={
            duplicateConfirm
              ? `Create a copy of "${duplicateConfirm.name}" in your library?`
              : ''
          }
          confirmLabel="Duplicate"
          loadingLabel="Duplicating..."
          isLoading={duplicateCreature.isPending}
        />

        <ConfirmActionModal
          isOpen={showSyncAllConfirm}
          onClose={() => setShowSyncAllConfirm(false)}
          onConfirm={() => {
            setShowSyncAllConfirm(false);
            void handleSyncAll();
          }}
          title="Sync with current patch?"
          description={`Sync ${driftedCount} creature${driftedCount === 1 ? '' : 's'} to current patch rules. Parts, techniques, or properties that no longer exist in the codex may be removed.`}
          confirmLabel="Sync all"
          loadingLabel="Syncing..."
          isLoading={syncingAll}
        />
      </div>
    </RollProvider>
  );
}
