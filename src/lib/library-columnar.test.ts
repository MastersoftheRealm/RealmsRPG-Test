import { describe, expect, it } from 'vitest';
import {
  bodyToColumnar,
  bodyToColumnarSpecies,
  columnarViewSelect,
  rowToItem,
  toDbRow,
} from './library-columnar';

/** Simulates POST/PATCH body → DB row → GET response for library API routes. */
function apiRoundTrip(
  type: 'powers' | 'techniques' | 'empowered-techniques' | 'items',
  body: Record<string, unknown>,
  source: 'official' | 'user' = 'user',
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
  it('stores attackMode in payload and derives the Attack label on read (Weapon)', () => {
    const body = {
      name: 'Whirlwind Cut',
      description: 'A spinning strike.',
      actionType: 'basic',
      isReaction: false,
      attackMode: 'weapon',
      parts: [
        { id: 12, name: 'Expose', op_1_lvl: 0 },
        { id: 7, name: 'Add Weapon to Technique', op_1_lvl: 0 },
      ],
      damage: [],
    };

    const { scalars, payload } = bodyToColumnar('techniques', body);

    expect(scalars.weaponName).toBeUndefined();
    expect(payload.weaponName).toBeUndefined();
    expect(payload.attackMode).toBe('weapon');
    expect(payload.parts).toHaveLength(2);

    const loaded = apiRoundTrip('techniques', body);

    expect(loaded.attackMode).toBe('weapon');
    expect(loaded.weaponName).toBe('Weapon');
    expect(loaded.parts).toHaveLength(2);
  });

  it('shows No Attack for the No Attack mechanic and Unarmed otherwise', () => {
    const noAttack = apiRoundTrip('techniques', {
      name: 'Restrained Strike',
      attackMode: 'none',
      parts: [{ id: 415, name: 'No Attack', op_1_lvl: 0 }],
      damage: [],
    });
    expect(noAttack.attackMode).toBe('none');
    expect(noAttack.weaponName).toBe('No Attack');

    const unarmed = apiRoundTrip('techniques', {
      name: 'Palm Strike',
      attackMode: 'unarmed',
      parts: [],
      damage: [],
    });
    expect(unarmed.attackMode).toBe('unarmed');
    expect(unarmed.weaponName).toBe('Unarmed');
  });

  it('derives attack mode for legacy rows (weapon part → Weapon)', () => {
    const row = {
      id: 'tech-official-1',
      name: 'Official Slash',
      action_type: 'basic',
      payload: {
        parts: [{ id: 7, name: 'Add Weapon Attack', op_1_lvl: 1 }],
        actionType: 'basic',
      },
    };

    const loaded = rowToItem('techniques', row, 'official');

    expect(loaded.attackMode).toBe('weapon');
    expect(loaded.weaponName).toBe('Weapon');
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

    expect((loaded.range as { steps?: number | undefined }).steps).toBe(2);
    expect(loaded.damage).toEqual([{ amount: 1, size: 8 }]);
  });
});

describe('library-columnar API round-trip — empowered techniques', () => {
  it('stores the attack mode label and keeps nested structures in payload', () => {
    const body = {
      name: 'Arc Lance',
      empoweredTechnique: true,
      actionType: 'quick',
      isReaction: false,
      attackMode: 'weapon',
      power: {
        addWeaponPowerPart: { id: 369, name: 'Add Weapon to Power', op_1_lvl: 0 },
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

    expect(scalars.weaponName).toBeUndefined();
    expect(scalars.rangeSteps).toBe(3);
    expect(payload.attackMode).toBe('weapon');
    expect(payload.technique).toBeDefined();

    const loaded = apiRoundTrip('empowered-techniques', body);

    expect(loaded.attackMode).toBe('weapon');
    expect(loaded.weaponName).toBe('Weapon');
    expect((loaded.power as { range?: { steps?: number | undefined } }).range?.steps).toBe(3);
    expect((loaded.technique as { parts?: unknown[] | undefined }).parts).toHaveLength(1);
  });

  it('derives Weapon for legacy empowered rows carrying power.addWeapon', () => {
    const row = {
      id: 'emp-legacy',
      name: 'Stored Empowered',
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

    expect(loaded.attackMode).toBe('weapon');
    expect(loaded.weaponName).toBe('Weapon');
  });

  it('derives Weapon from the Add Weapon to Power part (official migration path)', () => {
    const row = {
      id: 'emp-migrate',
      name: 'Old Official Empowered',
      payload: {
        empoweredTechnique: true,
        power: {
          range: { steps: 0 },
          parts: [{ id: 369, name: 'Add Weapon to Power', op_1_lvl: 2 }],
        },
        technique: { parts: [] },
      },
    };

    const loaded = rowToItem('empowered-techniques', row, 'official');

    expect(loaded.attackMode).toBe('weapon');
    expect(loaded.weaponName).toBe('Weapon');
    expect(
      (loaded.power as { parts?: Array<{ name?: string | undefined }> }).parts?.[0]?.name,
    ).toBe('Add Weapon to Power');
  });

  it('derives Weapon from technique Add Weapon autoMechanic (cheaper-EN path)', () => {
    const loaded = apiRoundTrip('empowered-techniques', {
      name: 'Cheap Weapon Empowered',
      empoweredTechnique: true,
      attackMode: 'weapon',
      power: { range: { steps: 0 }, parts: [], autoMechanics: [] },
      technique: {
        parts: [],
        autoMechanics: [{ id: 7, name: 'Add Weapon to Technique', op_1_lvl: 0 }],
      },
    });

    expect(loaded.attackMode).toBe('weapon');
    expect(loaded.weaponName).toBe('Weapon');
  });

  it('defaults empowered powers with no weapon to No Attack', () => {
    const loaded = apiRoundTrip('empowered-techniques', {
      name: 'Unarmed Empowered',
      empoweredTechnique: true,
      power: { range: { steps: 0 }, parts: [] },
      technique: { parts: [] },
    });

    expect(loaded.attackMode).toBe('none');
    expect(loaded.weaponName).toBe('No Attack');
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

    expect((loaded.range as { steps?: number | undefined }).steps).toBe(4);
    expect((loaded.area as { type?: string | undefined; level?: number | undefined }).type).toBe(
      'sphere',
    );
    expect(
      (loaded.duration as { type?: string | undefined; value?: number | undefined }).value,
    ).toBe(3);
    expect((loaded.parts as unknown[]).length).toBe(1);
  });

  it('persists area applyDuration and duration modifiers through columnar round-trip', () => {
    const body = {
      name: 'Lingering Sphere',
      actionType: 'basic',
      range: { steps: 2, applyDuration: true },
      area: { type: 'sphere', level: 3, applyDuration: true },
      duration: {
        type: 'minutes',
        value: 10,
        applyDuration: false,
        focus: true,
        noHarm: true,
        endsOnActivation: false,
        sustain: 2,
      },
      damage: [{ amount: 1, size: 6, type: 'fire', applyDuration: true }],
      parts: [{ id: 205, name: 'Frighten', op_1_lvl: 1, applyDuration: true }],
    };

    const { scalars, payload } = bodyToColumnar('powers', body);

    expect(scalars.areaType).toBe('sphere');
    expect(scalars.areaLevel).toBe(3);
    expect(scalars.durationType).toBe('minutes');
    expect(scalars.durationValue).toBe(10);
    expect((payload.area as { applyDuration?: boolean | undefined }).applyDuration).toBe(true);
    expect((payload.range as { applyDuration?: boolean | undefined }).applyDuration).toBe(true);
    expect(
      (payload.duration as { focus?: boolean | undefined; sustain?: number | undefined }).focus,
    ).toBe(true);
    expect(
      (payload.duration as { focus?: boolean | undefined; sustain?: number | undefined }).sustain,
    ).toBe(2);
    expect((payload.duration as { noHarm?: boolean | undefined }).noHarm).toBe(true);

    const loaded = apiRoundTrip('powers', body);

    expect(
      (
        loaded.area as {
          applyDuration?: boolean | undefined;
          type?: string | undefined;
          level?: number | undefined;
        }
      ).applyDuration,
    ).toBe(true);
    expect((loaded.area as { type?: string | undefined }).type).toBe('sphere');
    expect((loaded.area as { level?: number | undefined }).level).toBe(3);
    expect(
      (loaded.range as { applyDuration?: boolean | undefined; steps?: number | undefined })
        .applyDuration,
    ).toBe(true);
    expect((loaded.range as { steps?: number | undefined }).steps).toBe(2);
    expect((loaded.duration as { focus?: boolean | undefined }).focus).toBe(true);
    expect((loaded.duration as { noHarm?: boolean | undefined }).noHarm).toBe(true);
    expect((loaded.duration as { sustain?: number | undefined }).sustain).toBe(2);
    expect(
      (loaded.duration as { type?: string | undefined; value?: number | undefined }).type,
    ).toBe('minutes');
    expect((loaded.duration as { value?: number | undefined }).value).toBe(10);
    expect(
      (loaded.damage as Array<{ applyDuration?: boolean | undefined }>)[0]?.applyDuration,
    ).toBe(true);
    expect((loaded.parts as Array<{ applyDuration?: boolean | undefined }>)[0]?.applyDuration).toBe(
      true,
    );
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
    expect((loaded.costs as { totalTP?: number | undefined }).totalTP).toBe(2);
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
    expect((loaded.properties as Array<{ name?: string | undefined }>)[0]?.name).toBe('Armor Base');
  });
});

describe('library-columnar bodyToColumnar payload isolation', () => {
  it('does not put mechanic parts into scalar columns for techniques', () => {
    const { scalars, payload } = bodyToColumnar('techniques', {
      name: 'Test',
      attackMode: 'weapon',
      parts: [{ id: 7, name: 'Add Weapon to Technique', op_1_lvl: 0 }],
    });

    expect(scalars.parts).toBeUndefined();
    expect(payload.parts).toHaveLength(1);
    expect(scalars.weaponName).toBeUndefined();
    expect(payload.attackMode).toBe('weapon');
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

describe('library-columnar image_id parity (TASK-497)', () => {
  it('promotes camelCase image refs to scalars and keeps them out of payload', () => {
    const { scalars, payload } = bodyToColumnar('powers', {
      name: 'Firebolt',
      imageId: '11111111-1111-1111-1111-111111111111',
      imageUrl: 'https://example.com/art.jpg?v=1',
      parts: [],
    });

    expect(scalars.imageId).toBe('11111111-1111-1111-1111-111111111111');
    expect(scalars.imageUrl).toBe('https://example.com/art.jpg');
    expect(payload.imageId).toBeUndefined();
    expect(payload.imageUrl).toBeUndefined();
  });

  it('accepts snake_case image refs from official copy-on-add', () => {
    const { scalars, payload } = bodyToColumnar('creatures', {
      name: 'Wolf',
      image_id: '22222222-2222-2222-2222-222222222222',
      image_url: 'https://example.com/wolf.jpg',
    });

    expect(scalars.imageId).toBe('22222222-2222-2222-2222-222222222222');
    expect(scalars.imageUrl).toBe('https://example.com/wolf.jpg');
    expect(payload.image_id).toBeUndefined();
    expect(payload.image_url).toBeUndefined();
  });

  it('round-trips image refs for user library rows', () => {
    const loaded = apiRoundTrip(
      'powers',
      {
        name: 'Shield',
        imageId: '33333333-3333-3333-3333-333333333333',
        imageUrl: 'https://example.com/shield.jpg',
        parts: [],
      },
      'user',
    );

    expect(loaded.imageId).toBe('33333333-3333-3333-3333-333333333333');
    expect(loaded.imageUrl).toBe('https://example.com/shield.jpg');
    expect(loaded._source).toBe('user');
  });

  it('promotes species image refs to scalars and keeps them out of payload', () => {
    const { scalars, payload } = bodyToColumnarSpecies({
      name: 'Elf',
      type: 'Ancestry',
      imageId: '44444444-4444-4444-4444-444444444444',
      imageUrl: 'https://example.com/elf.jpg?cache=1',
      sizes: ['Medium'],
    });

    expect(scalars.imageId).toBe('44444444-4444-4444-4444-444444444444');
    expect(scalars.imageUrl).toBe('https://example.com/elf.jpg');
    expect(payload.imageId).toBeUndefined();
    expect(payload.imageUrl).toBeUndefined();
  });
});

describe('columnarViewSelect', () => {
  it('lists identity, payload, and scalars without user_id', () => {
    const columns = columnarViewSelect('powers').split(', ');
    expect(columns).toContain('id');
    expect(columns).toContain('payload');
    expect(columns).toContain('name');
    expect(columns).not.toContain('user_id');
  });
});

describe('columnarViewSelect', () => {
  it('lists identity, payload, and scalars without user_id', () => {
    const columns = columnarViewSelect('powers').split(', ');
    expect(columns).toContain('id');
    expect(columns).toContain('payload');
    expect(columns).toContain('name');
    expect(columns).not.toContain('user_id');
  });
});
