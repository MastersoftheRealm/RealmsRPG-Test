import { describe, expect, it } from 'vitest';
import { bodyToColumnar } from '@/lib/library-columnar';
import {
  persistedLibraryBodyShapeError,
  unknownPersistedLibraryKeys,
} from '@/lib/library-persisted-contract';

describe('library-persisted-contract', () => {
  it('allows composition and rejects invented keys on powers', () => {
    expect(
      unknownPersistedLibraryKeys('powers', {
        name: 'Mind Lance',
        parts: [],
        damage: [],
        composition: { variant: 'choice' },
      }),
    ).toEqual([]);
    expect(unknownPersistedLibraryKeys('powers', { injected: true })).toEqual(['injected']);
  });

  it('allows empowered totals and shield hasShieldDamage', () => {
    expect(
      unknownPersistedLibraryKeys('empowered-techniques', {
        name: 'Arc',
        totals: { energy: 3 },
        power: { parts: [] },
        technique: { parts: [] },
      }),
    ).toEqual([]);
    expect(
      unknownPersistedLibraryKeys('items', {
        name: 'Tower',
        type: 'shield',
        hasShieldDamage: true,
        properties: [],
      }),
    ).toEqual([]);
  });

  it('allows full creature creator state keys', () => {
    expect(
      unknownPersistedLibraryKeys('creatures', {
        name: 'Wolf',
        level: 1,
        archetypeType: 'power',
        abilities: {
          strength: 0,
          vitality: 0,
          agility: 0,
          acuity: 0,
          intelligence: 0,
          charisma: 0,
        },
        defenses: {
          might: 0,
          fortitude: 0,
          reflex: 0,
          discernment: 0,
          mentalFortitude: 0,
          resolve: 0,
        },
        enablePowers: true,
        enableTechniques: false,
        enableArmaments: true,
      }),
    ).toEqual([]);
  });

  it('rejects non-array parts', () => {
    expect(persistedLibraryBodyShapeError('powers', { parts: {} })).toBe('parts must be an array');
  });

  it('allows technique legacy reaction and actionTypeSelection keys', () => {
    expect(
      unknownPersistedLibraryKeys('techniques', {
        name: 'Riposte',
        reaction: true,
        actionTypeSelection: 'quick',
        parts: [],
      }),
    ).toEqual([]);
  });

  it('preserves composition through columnar mapping', () => {
    const composition = { enabled: true };
    const { payload } = bodyToColumnar('powers', {
      name: 'Stored',
      parts: [],
      damage: [],
      composition,
    });
    expect(payload.composition).toEqual(composition);
  });
});

describe('library metadata-only PATCH preservation', () => {
  it('retains composition when rebuilding from a stored item plus a name patch', () => {
    const stored = bodyToColumnar('powers', {
      name: 'Before',
      parts: [{ id: 1, name: 'Part' }],
      damage: [],
      composition: { choice: true },
    });
    const existingItem = {
      id: 'p1',
      docId: 'p1',
      name: 'Before',
      parts: [{ id: 1, name: 'Part' }],
      damage: [],
      composition: { choice: true },
      _source: 'user',
    };
    const merged = { ...existingItem, name: 'After' };
    const { payload, scalars } = bodyToColumnar('powers', merged);
    expect(scalars.name).toBe('After');
    expect(payload.composition).toEqual(stored.payload.composition);
    expect(payload.parts).toHaveLength(1);
  });
});
