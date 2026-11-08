import { describe, expect, it } from 'vitest';
import { COLUMNAR_LIBRARY_TYPES } from '@/lib/library-columnar-keys';
import { validateUserLibraryWriteBody } from '@/lib/library-mutation-validation';
import { stampCreatureSyncMeta } from '@/lib/library-sync';

const powerFixture = {
  name: 'Mind Lance',
  parts: [],
  damage: [],
  composition: { enabled: true },
};

const CREATOR_FIXTURES: Record<(typeof COLUMNAR_LIBRARY_TYPES)[number], Record<string, unknown>> = {
  powers: powerFixture,
  techniques: { name: 'Riposte', parts: [] },
  'empowered-techniques': {
    name: 'Arc',
    totals: { energy: 3 },
    power: { parts: [] },
    technique: { parts: [] },
  },
  items: { name: 'Tower', type: 'shield', hasShieldDamage: true, properties: [] },
  creatures: {
    name: 'Wolf',
    level: 1,
    archetypeType: 'power',
    abilities: { strength: 0, vitality: 0, agility: 0, acuity: 0, intelligence: 0, charisma: 0 },
    defenses: {
      might: 0,
      fortitude: 0,
      reflex: 0,
      discernment: 0,
      mentalFortitude: 0,
      resolve: 0,
    },
  },
};

describe('validateUserLibraryWriteBody', () => {
  it('rejects unknown fields on library writes', () => {
    const response = validateUserLibraryWriteBody('powers', {
      name: 'Bolt',
      evilField: true,
    });
    expect(response?.status).toBe(400);
  });

  it('accepts real creator power payloads', () => {
    expect(validateUserLibraryWriteBody('powers', powerFixture)).toBeNull();
  });

  it('rejects malformed parts on patch bodies', () => {
    const response = validateUserLibraryWriteBody(
      'powers',
      { parts: { bad: true } },
      { mode: 'patch' },
    );
    expect(response?.status).toBe(400);
  });

  it.each(COLUMNAR_LIBRARY_TYPES)('accepts real creator payloads for POST (%s)', (type) => {
    expect(validateUserLibraryWriteBody(type, CREATOR_FIXTURES[type])).toBeNull();
  });

  it.each(COLUMNAR_LIBRARY_TYPES)('accepts duplicateOf-only creates (%s)', (type) => {
    expect(
      validateUserLibraryWriteBody(type, {
        duplicateOf: '11111111-1111-4111-8111-111111111111',
      }),
    ).toBeNull();
  });

  it.each(COLUMNAR_LIBRARY_TYPES)(
    'accepts PATCH subsets without dropping allowlisted keys (%s)',
    (type) => {
      expect(validateUserLibraryWriteBody(type, { name: 'Renamed' }, { mode: 'patch' })).toBeNull();
    },
  );

  it('accepts stamped creatures with nonempty skill objects', () => {
    const body = stampCreatureSyncMeta(
      {
        name: 'Ranger',
        level: 1,
        archetypeType: 'power',
        skills: [{ name: 'Stealth', value: 4, proficient: false }],
      },
      [],
      [],
      [],
    );
    expect(validateUserLibraryWriteBody('creatures', body)).toBeNull();
  });

  it('strips direct image URL writes for user library saves', () => {
    const body = {
      name: 'Bolt',
      imageId: '11111111-1111-4111-8111-111111111111',
      imageUrl: 'https://evil.example/art.jpg',
    };
    expect(validateUserLibraryWriteBody('powers', body)).toBeNull();
    expect(body.imageUrl).toBeUndefined();
    expect(body.imageId).toBe('11111111-1111-4111-8111-111111111111');
  });

  it('rejects official catalog image fields when the caller is not admin', () => {
    const response = validateUserLibraryWriteBody(
      'powers',
      { name: 'Bolt', imageId: '11111111-1111-4111-8111-111111111111' },
      { isAdmin: false },
    );
    expect(response?.status).toBe(403);
  });

  it('strips direct image URL on admin official catalog writes', () => {
    const body = {
      name: 'Bolt',
      imageId: '11111111-1111-4111-8111-111111111111',
      imageUrl: 'https://evil.example/art.jpg',
    };
    expect(validateUserLibraryWriteBody('powers', body, { isAdmin: true })).toBeNull();
    expect(body.imageUrl).toBeUndefined();
    expect(body.imageId).toBe('11111111-1111-4111-8111-111111111111');
  });
});
