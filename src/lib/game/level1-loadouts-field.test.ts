import { describe, expect, it } from 'vitest';
import {
  parseLevel1LoadoutsField,
  serializeLevel1LoadoutsField,
} from '@/lib/game/archetype-path';

describe('level1 loadouts field', () => {
  it('parses legacy kit array for compat', () => {
    const parsed = parseLevel1LoadoutsField([
      { id: 'kit-a', title: 'Greataxe', armaments: [{ id: '1', quantity: 1 }] },
    ]);
    expect(parsed.loadouts?.[0]?.title).toBe('Greataxe');
    expect(parsed.armorStep).toBeUndefined();
  });

  it('parses object wrapper with armorStep and shared gear', () => {
    const parsed = parseLevel1LoadoutsField({
      armorStep: 'optional',
      sharedEquipment: [{ id: '3', quantity: 4 }],
      kits: [{ id: 'kit-b', title: 'Sword & shield', armaments: [] }],
    });
    expect(parsed.armorStep).toBe('optional');
    expect(parsed.sharedEquipment).toEqual([{ id: '3', quantity: 4 }]);
    expect(parsed.loadouts?.[0]?.id).toBe('kit-b');
  });

  it('serializes metadata only (never persists kits)', () => {
    const serialized = serializeLevel1LoadoutsField({
      loadouts: [{ id: 'k1', title: 'Kit', armaments: [] }],
      armorStep: 'none',
      sharedEquipment: [{ id: '3', quantity: 4 }],
    });
    expect(serialized).toEqual({
      armorStep: 'none',
      sharedEquipment: [{ id: '3', quantity: 4 }],
    });
  });

  it('serializes empty when no metadata', () => {
    expect(
      serializeLevel1LoadoutsField({
        loadouts: [{ id: 'k1', title: 'Kit', armaments: [] }],
      })
    ).toBeNull();
  });
});
