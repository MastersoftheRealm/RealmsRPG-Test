import { describe, expect, it } from 'vitest';
import { bodyToColumnar, rowToItem, toDbRow } from './library-columnar';

/** Simulates POST/PATCH body → DB row → GET response for library API routes. */
function apiRoundTrip(
  type: 'powers' | 'techniques' | 'empowered-techniques' | 'items',
  body: Record<string, unknown>,
  source: 'official' | 'user' = 'user'
): Record<string, unknown> {
  const { scalars, payload } = bodyToColumnar(type, body);
  const dbRow = toDbRow({
    id: 'test-id-1',
    ...scalars,
    payload,
    created_at: '2026-05-16T00:00:00.000Z',
    updated_at: '2026-05-16T00:00:00.000Z',
  });
  return rowToItem(type, dbRow, source);
}

describe('library-columnar API round-trip — techniques', () => {
  it('persists weapon id/name in payload and promotes weaponName to scalar', () => {
    const body = {
      name: 'Whirlwind Cut',
      description: 'A spinning strike.',
      actionType: 'basic',
      isReaction: false,
      weapon: { id: 'weapon-uuid-abc', name: 'Glaive of Storms', tp: 3 },
      parts: [{ id: 12, name: 'Expose', op_1_lvl: 0 }],
      damage: [],
    };

    const { scalars, payload } = bodyToColumnar('techniques', body);

    expect(scalars.weaponName).toBe('Glaive of Storms');
    expect(payload.weapon).toEqual(body.weapon);
    expect(payload.parts).toHaveLength(1);

    const loaded = apiRoundTrip('techniques', body);

    expect(loaded.weapon).toEqual({ id: 'weapon-uuid-abc', name: 'Glaive of Storms', tp: 3 });
    expect(loaded.weaponName).toBe('Glaive of Storms');
    expect(loaded.parts).toHaveLength(1);
  });

  it('rehydrates weapon from weapon_name column when legacy payload has no weapon object', () => {
    const row = {
      id: 'tech-official-1',
      name: 'Official Slash',
      weapon_name: 'Sunblade',
      action_type: 'basic',
      payload: {
        parts: [{ id: 7, name: 'Add Weapon Attack', op_1_lvl: 1 }],
        actionType: 'basic',
      },
    };

    const loaded = rowToItem('techniques', row, 'official');

    expect(loaded.weapon).toEqual({ name: 'Sunblade' });
    expect(loaded.weaponName).toBe('Sunblade');
    expect((loaded.parts as unknown[]).length).toBe(1);
  });

  it('merges promoted range/damage columns over payload fragments', () => {
    const row = {
      id: 'tech-2',
      name: 'Lunge',
      range_steps: 2,
      damage: [{ amount: 1, size: 8 }],
      payload: {
        range: { steps: 0 },
        damage: [],
        parts: [],
      },
    };

    const loaded = rowToItem('techniques', row, 'user');

    expect((loaded.range as { steps?: number }).steps).toBe(2);
    expect(loaded.damage).toEqual([{ amount: 1, size: 8 }]);
  });
});

describe('library-columnar API round-trip — empowered techniques', () => {
  it('stores weaponName from nested power.addWeapon and keeps nested structures in payload', () => {
    const body = {
      name: 'Arc Lance',
      empoweredTechnique: true,
      actionType: 'quick',
      isReaction: false,
      power: {
        addWeapon: { id: 'w-emp-1', name: 'Arc Pike', tp: 4 },
        range: { steps: 3 },
        damage: [{ amount: 2, size: 6, type: 'fire' }],
        parts: [],
        autoMechanics: [],
      },
      technique: {
        parts: [{ id: 99, name: 'Custom Part', op_1_lvl: 0 }],
        additionalDamage: [{ amount: 1, size: 6 }],
      },
    };

    const { scalars, payload } = bodyToColumnar('empowered-techniques', body);

    expect(scalars.weaponName).toBe('Arc Pike');
    expect(scalars.rangeSteps).toBe(3);
    expect((payload.power as Record<string, unknown>).addWeapon).toBeDefined();
    expect(payload.technique).toBeDefined();

    const loaded = apiRoundTrip('empowered-techniques', body);

    expect((loaded.power as { addWeapon?: { name?: string; id?: string } }).addWeapon).toMatchObject({
      id: 'w-emp-1',
      name: 'Arc Pike',
    });
    expect((loaded.power as { range?: { steps?: number } }).range?.steps).toBe(3);
    expect((loaded.technique as { parts?: unknown[] }).parts).toHaveLength(1);
  });

  it('does not overwrite existing power.addWeapon when rehydrating from weapon_name', () => {
    const row = {
      id: 'emp-legacy',
      name: 'Stored Empowered',
      weapon_name: 'Column Pike',
      payload: {
        empoweredTechnique: true,
        power: {
          addWeapon: { id: 'existing-id', name: 'Payload Pike' },
          range: { steps: 1 },
        },
        technique: { parts: [] },
      },
    };

    const loaded = rowToItem('empowered-techniques', row, 'official');

    expect((loaded.power as { addWeapon?: { id?: string; name?: string } }).addWeapon).toEqual({
      id: 'existing-id',
      name: 'Payload Pike',
    });
  });

  it('injects addWeapon from weapon_name when payload power lacks addWeapon (official migration path)', () => {
    const row = {
      id: 'emp-migrate',
      name: 'Old Official Empowered',
      weapon_name: 'Legacy Halberd',
      payload: {
        empoweredTechnique: true,
        power: { range: { steps: 0 }, parts: [{ id: 369, name: 'Add Weapon to Power', op_1_lvl: 2 }] },
        technique: { parts: [] },
      },
    };

    const loaded = rowToItem('empowered-techniques', row, 'official');

    expect((loaded.power as { addWeapon?: { name?: string } }).addWeapon?.name).toBe('Legacy Halberd');
    expect((loaded.power as { parts?: Array<{ name?: string }> }).parts?.[0]?.name).toBe(
      'Add Weapon to Power'
    );
  });
});

describe('library-columnar API round-trip — powers', () => {
  it('promotes nested range/area/duration and keeps parts in payload', () => {
    const body = {
      name: 'Fireball',
      actionType: 'basic',
      range: { steps: 4 },
      area: { type: 'sphere', level: 2 },
      duration: { type: 'rounds', value: 3 },
      damage: [{ amount: 3, size: 6, type: 'fire' }],
      parts: [{ id: 294, name: 'Magic Damage', op_1_lvl: 2 }],
    };

    const { scalars, payload } = bodyToColumnar('powers', body);

    expect(scalars.rangeSteps).toBe(4);
    expect(scalars.areaType).toBe('sphere');
    expect(scalars.areaLevel).toBe(2);
    expect(scalars.durationType).toBe('rounds');
    expect(scalars.durationValue).toBe(3);
    expect(payload.parts).toHaveLength(1);

    const loaded = apiRoundTrip('powers', body);

    expect((loaded.range as { steps?: number }).steps).toBe(4);
    expect((loaded.area as { type?: string; level?: number }).type).toBe('sphere');
    expect((loaded.duration as { type?: string; value?: number }).value).toBe(3);
    expect((loaded.parts as unknown[]).length).toBe(1);
  });
});

describe('library-columnar API round-trip — items (migration hardening)', () => {
  it('prefers payload damage/properties when promoted columns are empty arrays', () => {
    const row = {
      id: 'item-1',
      name: 'Storm Axe',
      type: 'weapon',
      damage: [],
      properties: [],
      payload: {
        damage: [{ amount: 2, size: 8, type: 'slashing' }],
        properties: [{ id: 47, name: 'Quick', op_1_lvl: 0 }],
        costs: { totalTP: 2 },
      },
    };

    const loaded = rowToItem('items', row, 'user');

    expect(loaded.damage).toEqual([{ amount: 2, size: 8, type: 'slashing' }]);
    expect(loaded.properties).toHaveLength(1);
    expect((loaded.costs as { totalTP?: number }).totalTP).toBe(2);
  });

  it('uses non-empty promoted columns when present', () => {
    const row = {
      id: 'item-2',
      name: 'Plate',
      type: 'armor',
      armor_value: 3,
      properties: [{ id: 16, name: 'Armor Base', op_1_lvl: 0 }],
      payload: {
        properties: [{ id: 99, name: 'Stale Payload Prop', op_1_lvl: 0 }],
      },
    };

    const loaded = rowToItem('items', row, 'official');

    expect(loaded.armorValue).toBe(3);
    expect((loaded.properties as Array<{ name?: string }>)[0]?.name).toBe('Armor Base');
  });
});

describe('library-columnar bodyToColumnar payload isolation', () => {
  it('does not put mechanic parts into scalar columns for techniques', () => {
    const { scalars, payload } = bodyToColumnar('techniques', {
      name: 'Test',
      parts: [{ id: 7, name: 'Add Weapon Attack', op_1_lvl: 1 }],
      weapon: { id: 'w1', name: 'Sword' },
    });

    expect(scalars.parts).toBeUndefined();
    expect(payload.parts).toHaveLength(1);
    expect(scalars.weaponName).toBe('Sword');
  });

  it('skips id/docId/_source in payload and promotes name to scalars', () => {
    const { scalars, payload } = bodyToColumnar('techniques', {
      id: 'should-not-store',
      docId: 'also-skip',
      _source: 'user',
      name: 'Clean',
      parts: [],
    });

    expect(payload.id).toBeUndefined();
    expect(payload.docId).toBeUndefined();
    expect(payload._source).toBeUndefined();
    expect(scalars.name).toBe('Clean');
    expect(payload.parts).toEqual([]);
  });
});
