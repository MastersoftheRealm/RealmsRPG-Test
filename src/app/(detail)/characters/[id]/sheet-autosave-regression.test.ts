import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { applyCharacterDirtyPatch, pickDirtyCharacterFields } from '@/lib/character/dirty-patch';
import { applySheetEnergyPointsChange } from '@/lib/character/current-follows-max';
import { mergeSheetRealtimePayload } from '@/lib/character/realtime-merge';
import { cleanForSave } from '@/lib/data-enrichment/clean-for-save';
import { DEFAULT_ABILITIES } from '@/types';
import type { Character } from '@/types';

function levelFourPowerAcuity(): Character {
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

type AdvanceBaseline = (
  baseline: Record<string, unknown>,
  args: {
    applied: Record<string, unknown>;
    cleaned: Record<string, unknown>;
    updatedAt?: string | undefined;
  },
) => Record<string, unknown>;

/** Mirrors master `use-character-sheet-page-data.ts` ~411–414 through 03e9fb04. */
const masterFullCleanedBaselineSnap: AdvanceBaseline = (baseline, { cleaned, updatedAt }) => {
  void baseline;
  return updatedAt ? { ...cleaned, updatedAt } : { ...cleaned };
};

const fixedAppliedOnlyBaseline: AdvanceBaseline = (baseline, { applied, updatedAt }) =>
  applyCharacterDirtyPatch(baseline, applied, {
    documentUpdatedAt: updatedAt,
  });

function lockedAutosaveIncludesEnergyPoints(advance: AdvanceBaseline): boolean {
  const loaded = levelFourPowerAcuity();
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

  savedCleanRef = advance(savedCleanRef, {
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

  const dirty = pickDirtyCharacterFields(
    cleanForSave(afterRefetch) as Record<string, unknown>,
    savedCleanRef,
  );
  return dirty.energyPoints === 8;
}

describe('QA EN allocation → locked autosave regression', () => {
  it('master baseline snap drops energyPoints from the next locked PATCH', () => {
    expect(lockedAutosaveIncludesEnergyPoints(masterFullCleanedBaselineSnap)).toBe(false);
  });

  it('applied-only baseline advance keeps energyPoints on the next locked PATCH', () => {
    expect(lockedAutosaveIncludesEnergyPoints(fixedAppliedOnlyBaseline)).toBe(true);
  });

  it('production onSave advances savedCleanRef with applyCharacterDirtyPatch only', () => {
    const pageDataPath = path.join(
      path.dirname(fileURLToPath(import.meta.url)),
      'use-character-sheet-page-data.ts',
    );
    const source = readFileSync(pageDataPath, 'utf8');
    expect(source).toContain('applyCharacterDirtyPatch(');
    expect(source).not.toMatch(/const nextClean = mergedCleanRef\.current \?\? cleaned/);
    expect(source).not.toMatch(
      /if \(Object\.keys\(dirty\)\.length === 0\) \{\s*savedCleanRef\.current = cleaned;/,
    );
  });
});
