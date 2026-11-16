import { describe, expect, it } from 'vitest';
import {
  applyCharacterDirtyPatch,
  isStaleCharacterWrite,
  pickDirtyCharacterFields,
} from '@/lib/character/dirty-patch';
import {
  buildResourcePatchFromCharacter,
  nextResourceSyncCursor,
  type CharacterResourcePatch,
} from './character-resource-sync';

const hp: CharacterResourcePatch = { currentHealth: 10, currentEnergy: 4, actionPoints: 3 };

describe('nextResourceSyncCursor', () => {
  it('does not schedule on first sight or same resources', () => {
    const first = nextResourceSyncCursor(null, 'c1', hp);
    expect(first.schedule).toBe(false);
    expect(nextResourceSyncCursor(first.next, 'c1', { ...hp }).schedule).toBe(false);
  });

  it('schedules when HP/EN/AP change and resets when the character id changes', () => {
    const first = nextResourceSyncCursor(null, 'c1', hp);
    const changed = nextResourceSyncCursor(first.next, 'c1', { ...hp, currentHealth: 8 });
    expect(changed.schedule).toBe(true);
    const switched = nextResourceSyncCursor(changed.next, 'c2', { ...hp, currentHealth: 8 });
    expect(switched.schedule).toBe(false);
  });

  it('does not schedule a null patch after a change to empty resources', () => {
    const first = nextResourceSyncCursor(null, 'c1', hp);
    const emptied = nextResourceSyncCursor(first.next, 'c1', null);
    expect(emptied.schedule).toBe(false);
  });
});

describe('two-tab pool allocation', () => {
  it('does not let a stale tab unlocked sync replace the other tab pools', () => {
    const savedByTabA = {
      healthPoints: 3,
      energyPoints: 8,
      currentHealth: 20,
      currentEnergy: 8,
      updatedAt: '2026-11-16T18:00:01.000Z',
    };
    const staleTab = {
      healthPoints: 1,
      energyPoints: 2,
      currentHealth: 20,
      currentEnergy: 1,
      actionPoints: 2,
      health: { current: 20, max: 20 },
      energy: { current: 1, max: 2 },
    };
    const unlocked = buildResourcePatchFromCharacter(staleTab);
    expect(unlocked).not.toHaveProperty('healthPoints');
    expect(unlocked).not.toHaveProperty('energyPoints');

    const afterUnlocked = applyCharacterDirtyPatch(savedByTabA, unlocked ?? {});
    expect(afterUnlocked.healthPoints).toBe(3);
    expect(afterUnlocked.energyPoints).toBe(8);
    expect(afterUnlocked.currentEnergy).toBe(1);
    expect(isStaleCharacterWrite('2026-11-16T18:00:00.000Z', savedByTabA.updatedAt)).toBe(true);

    const allocatingTabDirty = pickDirtyCharacterFields(
      { healthPoints: 3, energyPoints: 8, currentEnergy: 16 },
      { healthPoints: 0, energyPoints: 0, currentEnergy: 8 },
    );
    expect(allocatingTabDirty.healthPoints).toBe(3);
    expect(allocatingTabDirty.energyPoints).toBe(8);
  });
});
