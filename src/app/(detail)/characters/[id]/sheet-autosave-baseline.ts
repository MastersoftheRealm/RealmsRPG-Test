/**
 * Sheet locked-autosave baseline advance (ADR-0013 / PR #529).
 */

import { applyCharacterDirtyPatch, pickDirtyCharacterFields } from '@/lib/character/dirty-patch';
import { applySheetEnergyPointsChange } from '@/lib/character/current-follows-max';
import { mergeSheetRealtimePayload } from '@/lib/character/realtime-merge';
import { cleanForSave } from '@/lib/data-enrichment/clean-for-save';
import { DEFAULT_ABILITIES } from '@/types';
import type { Character } from '@/types';

export type AdvanceSheetAutosaveBaseline = (
  baseline: Record<string, unknown> | null,
  args: {
    applied: Record<string, unknown>;
    cleaned: Record<string, unknown>;
    updatedAt?: string | undefined;
  },
) => Record<string, unknown>;

/** Production: advance baseline only with keys that actually persisted. */
export function advanceSheetAutosaveBaselineAfterSuccess(
  baseline: Record<string, unknown> | null,
  args: {
    applied: Record<string, unknown>;
    cleaned: Record<string, unknown>;
    updatedAt?: string | undefined;
  },
): Record<string, unknown> {
  return applyCharacterDirtyPatch(baseline ?? {}, args.applied, {
    documentUpdatedAt: args.updatedAt,
  });
}

/** Pre-fix `use-character-sheet-page-data.ts` ~411–414 (master through 03e9fb04). */
export function advanceSheetAutosaveBaselineAfterSuccess_masterBuggy(
  baseline: Record<string, unknown> | null,
  args: {
    applied: Record<string, unknown>;
    cleaned: Record<string, unknown>;
    updatedAt?: string | undefined;
  },
): Record<string, unknown> {
  void baseline;
  void args.applied;
  return args.updatedAt ? { ...args.cleaned, updatedAt: args.updatedAt } : { ...args.cleaned };
}

function qaLevelFourPowerAcuity(): Character {
  return {
    id: 'c-qa',
    userId: 'user',
    name: 'Hero',
    level: 4,
    abilities: { ...DEFAULT_ABILITIES, acuity: 2 },
    archetype: { type: 'power' },
    pow_abil: 'acuity',
    pow_prof: 1,
    mart_prof: 0,
    healthPoints: 0,
    energyPoints: 0,
    currentHealth: 20,
    currentEnergy: 8,
    updatedAt: 'T0',
  } as Character;
}

/**
 * QA path after Add EN points + resource-only PATCH + relational refetch:
 * returns whether the next locked autosave dirty payload includes `energyPoints`.
 */
export function qaEnAllocationLockedPatchIncludesEnergyPoints(
  advanceBaseline: AdvanceSheetAutosaveBaseline,
): boolean {
  const loaded = qaLevelFourPowerAcuity();
  let savedCleanRef = cleanForSave(loaded) as Record<string, unknown>;
  const allocated = applySheetEnergyPointsChange(loaded, 8);
  const cleanedAfterAllocate = cleanForSave({
    ...allocated,
    currentEnergy: 8,
  }) as Record<string, unknown>;

  const resourceOnlyDirty = pickDirtyCharacterFields(cleanedAfterAllocate, savedCleanRef);
  const resourceApplied: Record<string, unknown> = {};
  if (resourceOnlyDirty.currentEnergy !== undefined) {
    resourceApplied.currentEnergy = resourceOnlyDirty.currentEnergy;
  }
  if (resourceOnlyDirty.energy !== undefined) {
    resourceApplied.energy = resourceOnlyDirty.energy;
  }

  savedCleanRef = advanceBaseline(savedCleanRef, {
    applied: resourceApplied,
    cleaned: cleanedAfterAllocate,
    updatedAt: 'T-resource',
  });

  const remote = cleanForSave({ ...loaded, currentEnergy: 8, updatedAt: 'T2' }) as Record<
    string,
    unknown
  >;
  const { character: afterRefetch } = mergeSheetRealtimePayload(
    { ...allocated, currentEnergy: 8 },
    remote,
    savedCleanRef,
    { updatedAt: 'T2' },
  );

  const dirtyForLockedAutosave = pickDirtyCharacterFields(
    cleanForSave(afterRefetch) as Record<string, unknown>,
    savedCleanRef,
  );
  return dirtyForLockedAutosave.energyPoints === 8;
}
