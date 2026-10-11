import { describe, expect, it } from 'vitest';
import type { Character } from '@/types';
import { prepareCharacterForSave } from '@/lib/character-save';
import { cleanForSave } from '@/lib/data-enrichment/clean-for-save';
import {
  applyCharacterDirtyPatch,
  characterLockToken,
  characterTimestampsMatch,
  isStaleCharacterWrite,
  mergeRemotePreservingDirty,
  pickDirtyCharacterFields,
  withDirtyClears,
} from './dirty-patch';

const abilities = {
  strength: 0,
  vitality: 0,
  agility: 0,
  acuity: 0,
  intelligence: 0,
  charisma: 0,
};

function sheet(overrides: Record<string, unknown> = {}): Character {
  return {
    name: 'Hero',
    level: 1,
    abilities,
    ...overrides,
  } as Character;
}

describe('characterLockToken', () => {
  it('keeps non-empty strings and ISO-stringifies Dates', () => {
    expect(characterLockToken('2026-07-01T12:00:00.000Z')).toBe('2026-07-01T12:00:00.000Z');
    expect(characterLockToken(new Date('2026-07-01T12:00:00.000Z'))).toBe(
      '2026-07-01T12:00:00.000Z',
    );
    expect(characterLockToken(null)).toBeUndefined();
    expect(characterLockToken('')).toBeUndefined();
  });
});

describe('characterTimestampsMatch', () => {
  it('matches identical strings and equivalent instants', () => {
    expect(characterTimestampsMatch('2026-07-01T12:00:00.000Z', '2026-07-01T12:00:00.000Z')).toBe(
      true,
    );
    expect(characterTimestampsMatch('2026-07-01T12:00:00.000Z', '2026-07-01T12:00:00Z')).toBe(true);
    expect(characterTimestampsMatch('2026-07-01T12:00:00.000Z', '2026-07-01T12:00:01.000Z')).toBe(
      false,
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
    expect(isStaleCharacterWrite('2026-07-01T12:00:00.000Z', '2026-07-01T13:00:00.000Z')).toBe(
      true,
    );
    expect(isStaleCharacterWrite('2026-07-01T12:00:00.000Z', '2026-07-01T12:00:00.000Z')).toBe(
      false,
    );
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

  it('marks a baseline key missing from current as null', () => {
    expect(
      pickDirtyCharacterFields({ name: 'Hero' }, { name: 'Hero', notes: 'old', updatedAt: 'T0' }),
    ).toEqual({ notes: null });
  });
});

describe('applyCharacterDirtyPatch / mergeRemotePreservingDirty', () => {
  it('leaves omitted keys intact, strips client meta, and can stamp blob updatedAt', () => {
    const merged = applyCharacterDirtyPatch(
      { name: 'Hero', notes: 'keep', level: 2, extra: 1 },
      { notes: 'changed', updatedAt: 'client', id: 'ignored' },
      { blobUpdatedAt: '2026-08-14T00:00:00.000Z' },
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

  it('deletes a stored key when the patch value is null', () => {
    const merged = applyCharacterDirtyPatch(
      { name: 'Hero', tempModifiers: { speed: 1 }, notes: 'keep' },
      { tempModifiers: null },
    );
    expect(merged).toEqual({ name: 'Hero', notes: 'keep' });
    expect(merged).not.toHaveProperty('tempModifiers');
  });

  it('drops a key the local clear set to null', () => {
    const remote = { name: 'Hero', tempModifiers: { abilities: { strength: 1 } }, notes: 'remote' };
    const local = withDirtyClears({ name: 'Hero', notes: 'remote' }, { tempModifiers: null });
    expect(mergeRemotePreservingDirty(remote, local, ['tempModifiers'])).toEqual({
      name: 'Hero',
      notes: 'remote',
    });
  });
});

describe('cleared sheet values are saved (86e3juw04)', () => {
  function persistClear(saved: Character, next: Character): Record<string, unknown> {
    const baseline = cleanForSave(saved) as Record<string, unknown>;
    const current = cleanForSave(next) as Record<string, unknown>;
    const dirty = pickDirtyCharacterFields(current, baseline);
    const prepared = prepareCharacterForSave(dirty as Partial<Character>);
    return applyCharacterDirtyPatch(baseline, prepared);
  }

  it('drops the last ability temp so Strength and its defense cascade do not return', () => {
    const saved = sheet({
      tempModifiers: { abilities: { strength: 1 }, defenses: { might: 1 } },
    });
    const stored = persistClear(saved, sheet());
    expect(stored).not.toHaveProperty('tempModifiers');
    expect(stored.name).toBe('Hero');
  });

  it('drops the last skill temp so the bonus does not return after reload', () => {
    const saved = sheet({ tempModifiers: { skills: { acrobatics: 1 } } });
    const stored = persistClear(saved, sheet());
    expect(stored).not.toHaveProperty('tempModifiers');
  });

  it('drops a speed temp set back to zero', () => {
    const saved = sheet({ tempModifiers: { speed: 1 } });
    const stored = persistClear(saved, sheet({ tempModifiers: { speed: 0 } }));
    expect(stored).not.toHaveProperty('tempModifiers');
  });

  it('keeps a remaining temp when one scalar is set back to zero', () => {
    const saved = sheet({ tempModifiers: { speed: 1, abilities: { strength: 1 } } });
    const stored = persistClear(saved, sheet({ tempModifiers: { abilities: { strength: 1 } } }));
    expect(stored.tempModifiers).toEqual({ abilities: { strength: 1 } });
  });

  it('drops a trait custom name and note when both fields are cleared', () => {
    const saved = sheet({
      traitCustomizations: { 'trait-1': { customName: 'Quick Feet', note: 'fast' } },
    });
    const stored = persistClear(saved, sheet());
    expect(stored).not.toHaveProperty('traitCustomizations');
  });

  it('replaces a trait map when one customization remains', () => {
    const saved = sheet({
      traitCustomizations: {
        'trait-1': { customName: 'Quick Feet', note: 'fast' },
        'trait-2': { customName: 'Keep' },
      },
    });
    const stored = persistClear(
      saved,
      sheet({ traitCustomizations: { 'trait-2': { customName: 'Keep' } } }),
    );
    expect(stored.traitCustomizations).toEqual({ 'trait-2': { customName: 'Keep' } });
  });

  it('replaces a feat row when its custom name and note are cleared', () => {
    const saved = sheet({
      feats: [{ id: 'f1', name: 'Natural Dexterity', customName: 'Quick Feet', note: 'fast' }],
    });
    const stored = persistClear(saved, sheet({ feats: [{ id: 'f1', name: 'Natural Dexterity' }] }));
    expect(stored.feats).toEqual([{ id: 'f1', name: 'Natural Dexterity' }]);
  });
});
