import { describe, expect, it } from 'vitest';
import { nextResourceSyncCursor, type CharacterResourcePatch } from './character-resource-sync';

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
