/**
 * Library Techniques Tab
 * ======================
 * User's techniques with search and sort.
 */

'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Plus, RefreshCw, Swords } from 'lucide-react';
import {
  GridListRow,
  SearchInput,
  ListHeader,
  LoadingState,
  ErrorDisplay,
  ListEmptyState,
  type ChipData,
} from '@/components/shared';
import { useSort } from '@/hooks/use-sort';
import type { TechniqueDocument } from '@/lib/calculators/technique-calc';
import { deriveTechniqueDisplay, formatTechniqueDamage } from '@/lib/calculators/technique-calc';
import { useUserTechniques, useUserEmpoweredTechniques, useTechniqueParts, useDuplicateTechnique, useDuplicateEmpoweredTechnique } from '@/hooks';
import { Button, IconButton, useToast } from '@/components/ui';
import type { DisplayItem } from '@/types';
import { getTechniqueSyncResult, sanitizeTechniqueForSync } from '@/lib/library-sync';
import { saveToLibrary } from '@/services/library-service';

const TECHNIQUE_GRID_COLUMNS = '1.5fr 0.8fr 0.8fr 1fr 1fr 1fr 40px';
const TECHNIQUE_HEADER_COLUMNS = [
  { key: 'name', label: 'NAME' },
  { key: 'energy', label: 'ENERGY' },
  { key: 'tp', label: 'TP' },
  { key: 'action', label: 'ACTION' },
  { key: 'weapon', label: 'WEAPON' },
  { key: 'damage', label: 'DAMAGE' },
  { key: '_actions', label: '', sortable: false as const },
];

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
  const { showToast } = useToast();
  const standardTechniquesQuery = useUserTechniques();
  const empoweredTechniquesQuery = useUserEmpoweredTechniques();
  const { data: standardTechniques = [], isLoading: standardLoading, error: standardError } = standardTechniquesQuery;
  const { data: empoweredTechniques = [], isLoading: empoweredLoading, error: empoweredError } = empoweredTechniquesQuery;
  const { data: partsDb = [] } = useTechniqueParts();
  const duplicateTechnique = useDuplicateTechnique();
  const duplicateEmpoweredTechnique = useDuplicateEmpoweredTechnique();
  const [search, setSearch] = useState('');
  const [syncingIds, setSyncingIds] = useState<Set<string>>(new Set());
  const [syncingAll, setSyncingAll] = useState(false);
  const { sortState, handleSort, sortItems } = useSort('name');
  const techniques = mode === 'empowered' ? empoweredTechniques : standardTechniques;
  const isLoading = mode === 'empowered' ? empoweredLoading : standardLoading;
  const error = mode === 'empowered' ? empoweredError : standardError;

  const cardData = useMemo(() => {
    return techniques.map(tech => {
      const empowered = mode === 'empowered';
      const doc: TechniqueDocument = {
        name: String(tech.name ?? ''),
        description: String(tech.description ?? ''),
        parts: Array.isArray(tech.parts) ? (tech.parts as TechniqueDocument['parts']) : [],
        damage: Array.isArray(tech.damage) ? (tech.damage[0] as TechniqueDocument['damage']) : (tech.damage as TechniqueDocument['damage']),
        weapon: tech.weapon as TechniqueDocument['weapon'],
      };
      const display = deriveTechniqueDisplay(doc, partsDb);
      const syncResult = getTechniqueSyncResult(tech, partsDb);
      const totals = getEmpoweredTotals(tech);
      const damageStr = formatTechniqueDamage(doc.damage);
      const parts: ChipData[] = display.partChips.map(chip => ({
        name: chip.text.split(' | TP:')[0].replace(/\s*\(Opt\d+ \d+\)/g, '').trim(),
        description: chip.description,
        cost: chip.finalTP,
        costLabel: 'TP',
      }));
      return {
        id: String(tech.docId ?? tech.id ?? ''),
        source: tech,
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
      };
    });
  }, [mode, techniques, partsDb]);

  const driftedItems = useMemo(() => cardData.filter((item) => item.hasDrift), [cardData]);

  const saveType = mode === 'empowered' ? 'empowered-techniques' : 'techniques';

  const handleSyncOne = async (itemId: string) => {
    const source = techniques.find((t) => String(t.docId ?? t.id ?? '') === itemId);
    if (!source) return;
    const sanitized = sanitizeTechniqueForSync(source, partsDb);
    if (!sanitized.hasDrift || !sanitized.changed) return;

    setSyncingIds((prev) => new Set(prev).add(itemId));
    try {
      await saveToLibrary(saveType, sanitized.value as unknown as Record<string, unknown>, { existingId: itemId });
      if (mode === 'empowered') {
        await empoweredTechniquesQuery.refetch();
      } else {
        await standardTechniquesQuery.refetch();
      }
      showToast(`Synced "${source.name}" to current patch rules.`, 'success');
    } catch (e) {
      showToast((e as Error)?.message ?? 'Failed to sync technique', 'error');
    } finally {
      setSyncingIds((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  const handleSyncAll = async () => {
    if (driftedItems.length === 0) return;
    setSyncingAll(true);
    let syncedCount = 0;
    try {
      for (const item of driftedItems) {
        const source = techniques.find((t) => String(t.docId ?? t.id ?? '') === item.id);
        if (!source) continue;
        const sanitized = sanitizeTechniqueForSync(source, partsDb);
        if (!sanitized.hasDrift || !sanitized.changed) continue;
        await saveToLibrary(saveType, sanitized.value as unknown as Record<string, unknown>, { existingId: item.id });
        syncedCount += 1;
      }
      if (mode === 'empowered') {
        await empoweredTechniquesQuery.refetch();
      } else {
        await standardTechniquesQuery.refetch();
      }
      showToast(
        syncedCount > 0
          ? `Synced ${syncedCount} technique${syncedCount === 1 ? '' : 's'} with current patch.`
          : 'All techniques are already in sync.',
        'success'
      );
    } catch (e) {
      showToast((e as Error)?.message ?? 'Failed to sync all techniques', 'error');
    } finally {
      setSyncingAll(false);
    }
  };

  const filteredData = useMemo(() => {
    let result = cardData;
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(t =>
        String(t.name ?? '').toLowerCase().includes(searchLower) ||
        String(t.description ?? '').toLowerCase().includes(searchLower) ||
        String(t.weapon ?? '').toLowerCase().includes(searchLower)
      );
    }
    return sortItems(result);
  }, [cardData, search, sortItems]);

  if (error) {
    return <ErrorDisplay message="Failed to load techniques" subMessage="Please try again later" />;
  }

  if (!isLoading && cardData.length === 0) {
    return (
      <ListEmptyState
        icon={<Swords className="w-8 h-8" />}
        title={mode === 'empowered' ? 'No empowered techniques yet' : 'No techniques yet'}
        message={mode === 'empowered' ? 'Create your first empowered technique to see it here in your library.' : 'Create your first technique to see it here in your library.'}
        action={
          <Button asChild>
            <Link href={mode === 'empowered' ? '/empowered-technique-creator' : '/technique-creator'}>
              <Plus className="w-4 h-4" />
              {mode === 'empowered' ? 'Create Empowered Technique' : 'Create Technique'}
            </Link>
          </Button>
        }
      />
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search techniques..."
        />
        <Button
          variant="secondary"
          size="sm"
          onClick={handleSyncAll}
          disabled={driftedItems.length === 0 || syncingAll}
        >
          <RefreshCw className={`w-4 h-4 ${syncingAll ? 'animate-spin' : ''}`} />
          Sync with current patch
          {driftedItems.length > 0 ? ` (${driftedItems.length})` : ''}
        </Button>
      </div>

      <ListHeader
        columns={TECHNIQUE_HEADER_COLUMNS}
        gridColumns={TECHNIQUE_GRID_COLUMNS}
        sortState={sortState}
        onSort={handleSort}
      />

      <div className="flex flex-col gap-1 mt-2">
        {isLoading ? (
          <LoadingState />
        ) : filteredData.length === 0 ? (
          <div className="py-12 text-center text-text-secondary">
            {mode === 'empowered' ? 'No empowered techniques match your search.' : 'No techniques match your search.'}
          </div>
        ) : (
          filteredData.map(tech => (
            <GridListRow
              key={tech.id}
              id={tech.id}
              name={tech.name}
              description={tech.description}
              gridColumns={TECHNIQUE_GRID_COLUMNS}
              columns={[
                { key: 'Energy', value: tech.energy, highlight: true },
                { key: 'TP', value: tech.tp },
                { key: 'Action', value: tech.action },
                { key: 'Weapon', value: tech.weapon },
                { key: 'Damage', value: tech.damage },
              ]}
              chips={tech.parts}
              chipsLabel="Parts & Proficiencies"
              totalCost={typeof tech.tp === 'number' ? tech.tp : (parseFloat(String(tech.tp)) || undefined)}
              costLabel="TP"
              badges={tech.hasDrift ? [{ label: 'Needs sync', color: 'amber' }] : []}
              warningMessage={tech.syncIssues[0]?.message}
              rightSlot={tech.hasDrift ? (
                <IconButton
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    void handleSyncOne(tech.id);
                  }}
                  label="Sync with current patch"
                  className="text-warning-700 hover:text-warning-700 dark:text-warning-400"
                >
                  <RefreshCw className={`w-4 h-4 ${syncingIds.has(tech.id) ? 'animate-spin' : ''}`} />
                </IconButton>
              ) : undefined}
              onEdit={() => window.open(`${mode === 'empowered' ? '/empowered-technique-creator' : '/technique-creator'}?edit=${tech.id}`, '_blank')}
              onDelete={() => onDelete({ id: tech.id, name: tech.name } as DisplayItem)}
              onDuplicate={() =>
                (mode === 'empowered' ? duplicateEmpoweredTechnique : duplicateTechnique).mutate(tech.id, {
                  onError: (e) => showToast(e?.message ?? 'Failed to duplicate', 'error'),
                })
              }
            />
          ))
        )}
      </div>
    </div>
  );
}
