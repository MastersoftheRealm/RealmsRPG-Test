import { describe, expect, it } from 'vitest';
import type { Character } from '@/types';
import { cleanForSave } from '@/lib/data-enrichment/clean-for-save';
import { prepareCharacterForSave } from '@/lib/character-save';
import {
  libraryAddDirtyFields,
  appendLibraryItemToCharacter,
} from '@/hooks/add-library-item/map-library-to-character';
import type { LibraryPower, LibraryItem } from '@/types/library';
import { RELATIONAL_SAVE_ENTRY_ALLOWLIST } from './relational-lean-save';

const baseCharacter = {
  id: 'char-1',
  name: 'Test',
  level: 1,
  abilities: { strength: 0, vitality: 0, agility: 0, acuity: 0, intelligence: 0, charisma: 0 },
  powers: [],
  techniques: [],
  equipment: { weapons: [], armor: [], shields: [] },
} satisfies Character;

const fatPower = {
  id: 'pwr-1',
  docId: 'pwr-1',
  name: 'Blast',
  parts: [{ id: 'p1', name: 'Part' }],
  cost: 5,
  damage: [],
} as unknown as LibraryPower;

const fatWeapon = {
  id: 'wpn-1',
  docId: 'wpn-1',
  name: 'Sword',
  type: 'weapon',
  properties: [{ id: 'prop-1', name: 'Sharp' }],
  damage: [],
} as unknown as LibraryItem;

function expectAllowlisted(
  collection: keyof typeof RELATIONAL_SAVE_ENTRY_ALLOWLIST,
  entries: unknown[] | undefined,
) {
  const allowed = new Set(RELATIONAL_SAVE_ENTRY_ALLOWLIST[collection]);
  for (const entry of entries ?? []) {
    if (!entry || typeof entry !== 'object') continue;
    for (const key of Object.keys(entry as Record<string, unknown>)) {
      expect([...allowed], `${collection} key ${key}`).toContain(key);
    }
  }
}

describe('relational lean save client paths', () => {
  it('libraryAddDirtyFields trims power, technique, and armament payloads', () => {
    const emptyDbs = { powerPartsDb: [], techniquePartsDb: [], itemPropertiesDb: [] };
    const withPower = appendLibraryItemToCharacter(baseCharacter, 'power', fatPower, emptyDbs);
    const powerDirty = libraryAddDirtyFields('power', withPower);
    expectAllowlisted('powers', powerDirty.powers);
    const addedPower = (powerDirty.powers ?? []).find(
      (p) => String((p as { id?: string }).id) === 'pwr-1',
    );
    expect(addedPower).toBeDefined();
    expect(addedPower).not.toHaveProperty('cost');
    expect(addedPower).not.toHaveProperty('parts');

    const withWeapon = appendLibraryItemToCharacter(baseCharacter, 'weapon', fatWeapon, emptyDbs);
    const weaponDirty = libraryAddDirtyFields('weapon', withWeapon);
    const weapons = weaponDirty.equipment?.weapons as Record<string, unknown>[] | undefined;
    expect(weapons?.[0]).not.toHaveProperty('properties');
    expect(weapons?.[0]).not.toHaveProperty('damage');
  });

  it('prepareCharacterForSave leans fat arrays for guest/API saves', () => {
    const cleaned = prepareCharacterForSave({
      name: 'Guest',
      level: 1,
      powers: [
        {
          id: 'p1',
          name: 'Power',
          cost: 9,
          parts: [],
          description: 'x',
        },
      ],
      equipment: {
        weapons: [
          {
            id: 'w1',
            name: 'W',
            properties: [{ id: '1' }],
            damage: [],
          },
        ],
      },
    } as unknown as Parameters<typeof prepareCharacterForSave>[0]);
    expectAllowlisted('powers', cleaned.powers as unknown[]);
    const weapons = (cleaned.equipment as { weapons?: unknown[] })?.weapons ?? [];
    for (const weapon of weapons) {
      expect(weapon).not.toHaveProperty('properties');
    }
  });

  it('cleanForSave powers and equipment stay on the relational allow-list', () => {
    const saved = cleanForSave({
      ...baseCharacter,
      powers: [{ id: 'p1', name: 'P', cost: 1, innate: false, selectedVariantId: 'v1' }],
      techniques: [{ id: 't1', name: 'T', cost: 2 }],
    } as Character);
    expectAllowlisted('powers', saved.powers);
    expectAllowlisted('techniques', saved.techniques);
  });
});
