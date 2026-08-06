import { describe, expect, it } from 'vitest';
import type { Character } from '@/types';
import type { LibraryItem, LibraryPower } from '@/types/library';
import {
  appendLibraryItemToCharacter,
  characterOwnsLibraryItem,
  entityBucketLabel,
  libraryItemRowId,
} from './map-library-to-character';

const baseCharacter = {
  id: 'char-1',
  name: 'Test',
  level: 1,
  abilities: { strength: 0, vitality: 0, agility: 0, acuity: 0, intelligence: 0, charisma: 0 },
  powers: [{ id: 'existing-power', name: 'Existing', parts: [] }],
  techniques: [],
  equipment: {
    weapons: [{ id: 'existing-weapon', name: 'Sword', type: 'weapon', properties: [] }],
    armor: [],
    shields: [],
  },
} satisfies Character;

const samplePower: LibraryPower = {
  id: 'new-power',
  docId: 'new-power',
  name: 'New Power',
  parts: [],
};

const sampleWeapon: LibraryItem = {
  id: 'new-weapon',
  docId: 'new-weapon',
  name: 'Mace',
  type: 'weapon',
  properties: [],
};

describe('map-library-to-character', () => {
  it('libraryItemRowId prefers docId', () => {
    expect(libraryItemRowId({ id: 'a', docId: 'b' })).toBe('b');
  });

  it('characterOwnsLibraryItem matches character list ids', () => {
    expect(characterOwnsLibraryItem(baseCharacter, 'power', 'existing-power')).toBe(true);
    expect(characterOwnsLibraryItem(baseCharacter, 'power', 'new-power')).toBe(false);
    expect(characterOwnsLibraryItem(baseCharacter, 'weapon', 'existing-weapon')).toBe(true);
    expect(characterOwnsLibraryItem(baseCharacter, 'weapon', 'new-weapon')).toBe(false);
  });

  it('appendLibraryItemToCharacter appends mapped power', () => {
    const next = appendLibraryItemToCharacter(baseCharacter, 'power', samplePower, {
      powerPartsDb: [],
      techniquePartsDb: [],
      itemPropertiesDb: [],
    });
    expect(next.powers).toHaveLength(2);
    expect(next.powers?.[1]?.id).toBe('new-power');
    expect(next.powers?.[1]?.name).toBe('New Power');
  });

  it('appendLibraryItemToCharacter appends mapped weapon', () => {
    const next = appendLibraryItemToCharacter(baseCharacter, 'weapon', sampleWeapon, {
      powerPartsDb: [],
      techniquePartsDb: [],
      itemPropertiesDb: [],
    });
    expect(next.equipment?.weapons).toHaveLength(2);
    expect((next.equipment?.weapons as { id: string }[])?.[1]?.id).toBe('new-weapon');
  });

  it('entityBucketLabel covers armament kinds', () => {
    expect(entityBucketLabel('weapon')).toBe('weapons');
    expect(entityBucketLabel('armor', true)).toBe("character's armor");
  });
});
