import { describe, expect, it } from 'vitest';
import {
  applyCharacterDirtyPatch,
  characterLockToken,
  characterTimestampsMatch,
  isStaleCharacterWrite,
  mergeRemotePreservingDirty,
  pickDirtyCharacterFields,
} from './dirty-patch';

describe('characterLockToken', () => {
  it('keeps non-empty strings and ISO-stringifies Dates', () => {
    expect(characterLockToken('2026-07-01T12:00:00.000Z')).toBe('2026-07-01T12:00:00.000Z');
    expect(characterLockToken(new Date('2026-07-01T12:00:00.000Z'))).toBe('2026-07-01T12:00:00.000Z');
    expect(characterLockToken(null)).toBeUndefined();
    expect(characterLockToken('')).toBeUndefined();
  });
});

describe('characterTimestampsMatch', () => {
  it('matches identical strings and equivalent instants', () => {
    expect(characterTimestampsMatch('2026-07-01T12:00:00.000Z', '2026-07-01T12:00:00.000Z')).toBe(
      true
    );
    expect(characterTimestampsMatch('2026-07-01T12:00:00.000Z', '2026-07-01T12:00:00Z')).toBe(true);
    expect(characterTimestampsMatch('2026-07-01T12:00:00.000Z', '2026-07-01T12:00:01.000Z')).toBe(
      false
    );
    expect(characterTimestampsMatch(null, '2026-07-01T12:00:00.000Z')).toBe(false);
  });
});

describe('isStaleCharacterWrite', () => {
  it('is not stale when the client omits a token or the column is null', () => {
    expect(isStaleCharacterWrite(undefined, '2026-07-01T12:00:00.000Z')).toBe(false);
    expect(isStaleCharacterWrite('2026-07-01T12:00:00.000Z', null)).toBe(false);
  });

  it('is stale when both tokens exist and differ', () => {
    expect(
      isStaleCharacterWrite('2026-07-01T12:00:00.000Z', '2026-07-01T13:00:00.000Z')
    ).toBe(true);
    expect(
      isStaleCharacterWrite('2026-07-01T12:00:00.000Z', '2026-07-01T12:00:00.000Z')
    ).toBe(false);
  });
});

describe('pickDirtyCharacterFields', () => {
  it('returns only keys that changed vs baseline and strips meta', () => {
    const baseline = {
      name: 'Hero',
      notes: 'old',
      level: 1,
      updatedAt: 'T0',
      equipment: { weapons: [{ id: 'a' }] },
    };
    const current = {
      name: 'Hero',
      notes: 'new',
      level: 1,
      updatedAt: 'T0',
      id: 'char-1',
      equipment: { weapons: [{ id: 'a' }, { id: 'b' }] },
    };
    expect(pickDirtyCharacterFields(current, baseline)).toEqual({
      notes: 'new',
      equipment: { weapons: [{ id: 'a' }, { id: 'b' }] },
    });
  });

  it('treats a null baseline as all non-meta keys dirty', () => {
    expect(pickDirtyCharacterFields({ name: 'A', updatedAt: 'T0' }, null)).toEqual({ name: 'A' });
  });
});

describe('applyCharacterDirtyPatch / mergeRemotePreservingDirty', () => {
  it('leaves omitted keys intact, strips client meta, and can stamp blob updatedAt', () => {
    const merged = applyCharacterDirtyPatch(
      { name: 'Hero', notes: 'keep', level: 2, extra: 1 },
      { notes: 'changed', updatedAt: 'client', id: 'ignored' },
      { blobUpdatedAt: '2026-08-14T00:00:00.000Z' }
    );
    expect(merged).toEqual({
      name: 'Hero',
      notes: 'changed',
      level: 2,
      extra: 1,
      updatedAt: '2026-08-14T00:00:00.000Z',
    });
  });

  it('keeps local dirty keys when merging a remote snapshot', () => {
    const remote = { name: 'Remote', notes: 'from-other-tab', currentHealth: 4, level: 3 };
    const local = { name: 'Local', notes: 'mine', currentHealth: 10, level: 2 };
    expect(mergeRemotePreservingDirty(remote, local, ['notes'])).toEqual({
      name: 'Remote',
      notes: 'mine',
      currentHealth: 4,
      level: 3,
    });
  });
});
