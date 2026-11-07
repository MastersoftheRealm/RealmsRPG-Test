import { describe, expect, it } from 'vitest';
import { bodyToColumnar } from '@/lib/library-columnar';
import {
  persistedLibraryBodyShapeError,
  unknownPersistedLibraryKeys,
} from '@/lib/library-persisted-contract';
import { validateUserLibraryWriteBody } from '@/lib/library-mutation-validation';
import {
  sanitizeItemForSync,
  sanitizePowerForSync,
  sanitizeTechniqueForSync,
  stampCreatureSyncMeta,
} from '@/lib/library-sync';

const weaponProperty = {
  id: 12,
  name: 'Weapon Damage',
  op_1_desc: 'Damage',
  op_1_tp: 1,
};

const powerPartDef = {
  id: 1,
  name: 'Bolt',
  op_1_desc: 'Energy',
  op_1_en: 2,
};

function creatureWithWeapon() {
  return {
    name: 'Stamped wolf',
    level: 1,
    archetypeType: 'power' as const,
    weapons: [
      {
        name: 'Sword',
        properties: [{ id: 12, name: 'Weapon Damage', op_1_lvl: 1 }],
      },
    ],
  };
}

describe('library syncMeta persistence contract', () => {
  it('accepts a real stamped creature creator save payload', () => {
    const stamped = stampCreatureSyncMeta(
      creatureWithWeapon(),
      [powerPartDef],
      [],
      [weaponProperty],
    );
    expect(unknownPersistedLibraryKeys('creatures', stamped)).toEqual([]);
    expect(persistedLibraryBodyShapeError('creatures', stamped)).toBeNull();
    expect(validateUserLibraryWriteBody('creatures', stamped)).toBeNull();
    expect(stamped.syncMeta?.dependencyFingerprint).toBeTruthy();
    expect(stamped.syncMeta?.syncedAt).toMatch(/^\d{4}-/);
  });

  it('accepts library-sync sanitized power, technique, and item payloads', () => {
    const power = {
      id: 'pow-1',
      docId: 'pow-1',
      name: 'Arc',
      parts: [{ id: 1, name: 'Bolt', op_1_lvl: 1 }],
    };
    const powerSynced = sanitizePowerForSync(power, [powerPartDef]);
    expect(
      validateUserLibraryWriteBody(
        'powers',
        powerSynced.value as unknown as Record<string, unknown>,
      ),
    ).toBeNull();

    const technique = {
      id: 'tech-1',
      docId: 'tech-1',
      name: 'Riposte',
      parts: [{ id: 1, name: 'Bolt', op_1_lvl: 1 }],
    };
    const techniqueSynced = sanitizeTechniqueForSync(technique, [powerPartDef]);
    expect(
      validateUserLibraryWriteBody(
        'techniques',
        techniqueSynced.value as unknown as Record<string, unknown>,
      ),
    ).toBeNull();

    const item = {
      id: 'item-1',
      docId: 'item-1',
      name: 'Blade',
      type: 'weapon' as const,
      properties: [{ id: 12, name: 'Weapon Damage', op_1_lvl: 1 }],
    };
    const itemSynced = sanitizeItemForSync(item, [weaponProperty]);
    expect(
      validateUserLibraryWriteBody('items', itemSynced.value as unknown as Record<string, unknown>),
    ).toBeNull();
  });

  it('preserves syncMeta through columnar mapping and name-only merge rebuild', () => {
    const stamped = stampCreatureSyncMeta(
      creatureWithWeapon(),
      [powerPartDef],
      [],
      [weaponProperty],
    );
    const { payload: storedPayload } = bodyToColumnar('creatures', stamped);
    expect(storedPayload.syncMeta).toEqual(stamped.syncMeta);

    const existingItem = {
      id: 'c1',
      docId: 'c1',
      name: 'Stamped wolf',
      level: 1,
      archetypeType: 'power',
      weapons: stamped.weapons,
      syncMeta: stamped.syncMeta,
      _source: 'user',
    };
    const merged = { ...existingItem, name: 'Renamed wolf' };
    const { scalars, payload } = bodyToColumnar('creatures', merged);
    expect(scalars.name).toBe('Renamed wolf');
    expect(payload.syncMeta).toEqual(stamped.syncMeta);
  });

  it('allows duplicate flows that only send duplicateOf without rejecting syncMeta on full bodies', () => {
    const stamped = stampCreatureSyncMeta(
      creatureWithWeapon(),
      [powerPartDef],
      [],
      [weaponProperty],
    );
    expect(
      validateUserLibraryWriteBody('creatures', {
        duplicateOf: '11111111-1111-4111-8111-111111111111',
      }),
    ).toBeNull();
    expect(validateUserLibraryWriteBody('creatures', stamped)).toBeNull();
  });

  it('rejects malformed syncMeta shapes', () => {
    expect(
      persistedLibraryBodyShapeError('powers', {
        name: 'X',
        syncMeta: 'bad',
      }),
    ).toBe('syncMeta must be an object');
    expect(
      persistedLibraryBodyShapeError('powers', {
        name: 'X',
        syncMeta: { dependencyFingerprint: 1 },
      }),
    ).toBe('syncMeta.dependencyFingerprint must be a string');
    expect(
      persistedLibraryBodyShapeError('powers', {
        name: 'X',
        syncMeta: { injected: true },
      }),
    ).toBe('syncMeta contains unsupported fields');
  });
});
