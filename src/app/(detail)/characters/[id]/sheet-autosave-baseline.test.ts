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

describe('sheet autosave baseline (QA EN allocation)', () => {
  it('regression: absorbing full cleaned baseline drops energyPoints from the next locked PATCH', () => {
    const loaded = levelFourPowerAcuity();
    const savedCleanRef = cleanForSave(loaded) as Record<string, unknown>;
    const allocated = applySheetEnergyPointsChange(loaded, 8);
    const cleaned = cleanForSave({ ...allocated, currentEnergy: 8 }) as Record<string, unknown>;
    const firstDirty = pickDirtyCharacterFields(cleaned, savedCleanRef);
    expect(firstDirty.energyPoints).toBe(8);

    // Resource-only echo landed first; an older baseline snap stored the whole local cleaned doc.
    const buggyBaseline = { ...cleaned, updatedAt: 'T-resource' };
    const afterBuggySnap = pickDirtyCharacterFields(cleaned, buggyBaseline);
    expect(afterBuggySnap.energyPoints).toBeUndefined();
  });

  it('locked autosave baseline advances only applied dirty keys (PR 529 / ADR-0013)', () => {
    const loaded = levelFourPowerAcuity();
    const savedCleanRef = cleanForSave(loaded) as Record<string, unknown>;
    const allocated = applySheetEnergyPointsChange(loaded, 8);
    const cleaned = cleanForSave({ ...allocated, currentEnergy: 8 }) as Record<string, unknown>;

    const resourceOnly = { currentEnergy: cleaned.currentEnergy, energy: cleaned.energy };
    const nextBaseline = applyCharacterDirtyPatch(savedCleanRef, resourceOnly, {
      documentUpdatedAt: 'T-resource',
    });
    const dirtyAfterResourceOnly = pickDirtyCharacterFields(cleaned, nextBaseline);
    expect(dirtyAfterResourceOnly.energyPoints).toBe(8);
  });

  it('QA repro: document cleared to server energyPoints before debounced save omits allocation key', () => {
    const loaded = levelFourPowerAcuity();
    const savedCleanRef = cleanForSave(loaded) as Record<string, unknown>;
    const allocated = applySheetEnergyPointsChange(loaded, 8);

    // After a resource echo + stale refetch the in-memory sheet can show 8/8 while energyPoints
    // on the document is still 0 (only currentEnergy was PATCHed).
    const documentAtAutosave = { ...allocated, energyPoints: 0, currentEnergy: 8 } as Character;
    const cleanedAtSave = cleanForSave(documentAtAutosave) as Record<string, unknown>;
    const dirty = pickDirtyCharacterFields(cleanedAtSave, savedCleanRef);
    expect(dirty.energyPoints).toBeUndefined();
    expect(Object.keys(dirty)).toHaveLength(0);

    const fixedBaseline = applyCharacterDirtyPatch(savedCleanRef, dirty, {
      documentUpdatedAt: 'T-partial',
    });
    const stillAllocatedLocally = cleanForSave(applySheetEnergyPointsChange(loaded, 8)) as Record<
      string,
      unknown
    >;
    const dirtyAfterFix = pickDirtyCharacterFields(stillAllocatedLocally, fixedBaseline);
    expect(dirtyAfterFix.energyPoints).toBe(8);
  });

  it('regression: false baseline snap lets relational refetch clear local energyPoints', () => {
    const loaded = levelFourPowerAcuity();
    const allocated = applySheetEnergyPointsChange(loaded, 8);
    const cleanedLocal = cleanForSave({ ...allocated, currentEnergy: 8 }) as Record<
      string,
      unknown
    >;
    const buggyBaseline = { ...cleanedLocal, updatedAt: 'T-bad' };
    const remote = cleanForSave({ ...loaded, currentEnergy: 8, updatedAt: 'T2' }) as Record<
      string,
      unknown
    >;
    const { character } = mergeSheetRealtimePayload(
      { ...allocated, currentEnergy: 8 },
      remote,
      buggyBaseline,
      { updatedAt: 'T2' },
    );
    expect(character.energyPoints).toBe(0);
  });
});
