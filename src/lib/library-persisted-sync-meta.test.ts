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
    skills: [
      {
        name: 'Athletics',
        value: 2,
        proficient: true,
        id: 'skill-athletics',
        baseSkillId: 'athletics',
      },
    ],
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
    expect(stamped.skills).toHaveLength(1);
    expect(stamped.skills?.[0]).toMatchObject({ name: 'Athletics', proficient: true });
  });

  it('rejects malformed creature skills at validation time', () => {
    const stamped = stampCreatureSyncMeta(creatureWithWeapon(), [], [], []);
    const bad = {
      ...stamped,
      skills: [{ name: 'Athletics', value: 1, proficient: 'nope' }],
    };
    expect(validateUserLibraryWriteBody('creatures', bad)?.status).toBe(400);
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

  it('accepts sanitizeItemForSync output when a property id is null but named', () => {
    const item = {
      id: 'item-null-prop',
      docId: 'item-null-prop',
      name: 'Named blade',
      type: 'weapon' as const,
      properties: [{ id: null, name: 'Weapon Damage', op_1_lvl: 1 }],
    };
    const synced = sanitizeItemForSync(
      item as unknown as Parameters<typeof sanitizeItemForSync>[0],
      [weaponProperty],
    );
    const body = synced.value as unknown as Record<string, unknown>;
    expect(validateUserLibraryWriteBody('items', body)).toBeNull();
    const props = body.properties as Array<{ id: null; name: string }>;
    expect(props[0]?.name).toBe('Weapon Damage');
    expect(props[0]?.id).toBeNull();

    const stored = bodyToColumnar('items', body);
    expect((stored.scalars.properties as Array<{ id: null; name: string }>)[0]?.id).toBeNull();

    const existingItem = {
      id: 'item-null-prop',
      docId: 'item-null-prop',
      name: 'Named blade',
      type: 'weapon',
      properties: [{ id: null, name: 'Weapon Damage', op_1_lvl: 1 }],
      _source: 'user',
    };
    const merged = { ...existingItem, name: 'Renamed blade' };
    const rebuilt = bodyToColumnar('items', merged);
    expect(rebuilt.scalars.name).toBe('Renamed blade');
    expect((rebuilt.scalars.properties as Array<{ id: null; name: string }>)[0]).toMatchObject({
      id: null,
      name: 'Weapon Damage',
    });
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
