import { describe, it, expect } from 'vitest';
import {
  mergeRollLogsById,
  personalRollLogStorageKey,
  MAX_PERSISTED_PERSONAL_ROLLS,
  type StoredRollLogEntry,
} from './personal-roll-log-storage';

function roll(id: string, ms: number): StoredRollLogEntry {
  return {
    id,
    type: 'custom',
    title: id,
    dice: [],
    modifier: 0,
    total: 0,
    timestamp: new Date(ms),
  };
}

describe('personalRollLogStorageKey (86e3jvcgv)', () => {
  it('scopes localStorage to the character id', () => {
    expect(personalRollLogStorageKey('char-a')).toBe('realms-roll-log:char-a');
    expect(personalRollLogStorageKey('char-b')).not.toBe(personalRollLogStorageKey('char-a'));
  });
});

describe('mergeRollLogsById (86e3jvcgv multi-tab)', () => {
  it('keeps rolls from both tabs when ids differ', () => {
    const tabA = [roll('a1', 100), roll('a2', 200)];
    const tabB = [roll('a1', 100), roll('b1', 150)];
    const merged = mergeRollLogsById(tabA, tabB);
    expect(merged.map((r) => r.id)).toEqual(['a1', 'b1', 'a2']);
  });

  it('dedupes the same roll id', () => {
    const left = [roll('x', 50)];
    const right = [roll('x', 50)];
    expect(mergeRollLogsById(left, right)).toHaveLength(1);
  });

  it('documents the persisted cap used by RollProvider', () => {
    expect(MAX_PERSISTED_PERSONAL_ROLLS).toBe(20);
  });
});
