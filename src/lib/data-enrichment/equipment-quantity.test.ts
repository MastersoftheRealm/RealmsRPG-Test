import { describe, expect, it } from 'vitest';
import type { UserItem } from '@/hooks/use-user-library';
import type { Character } from '@/types';
import { cleanForSave, enrichCharacterData } from '@/lib/data-enrichment';

const bedRoll: UserItem = {
  id: 'bed-roll',
  docId: 'bed-roll',
  name: 'Bed Roll',
  type: 'equipment',
  properties: [],
};

function gearSheet(): Character {
  return {
    equipment: {
      items: [
        { id: 'bed-roll', name: 'Bed Roll', quantity: 0 },
        { id: 'spare-rope', name: 'Spare Rope', quantity: 0 },
        { id: 'rations', name: 'Rations', quantity: 2 },
        { id: 'torch', name: 'Torch' },
      ],
    },
  } as unknown as Character;
}

function enrichGear(character: Character) {
  return enrichCharacterData(character, [], [], [bedRoll]);
}

describe('gear quantity 0', () => {
  it('stays 0 through enrich and save, and a missing quantity still defaults to 1', () => {
    const shown = enrichGear(gearSheet());
    const byId = Object.fromEntries(shown.equipment.map((item) => [item.id, item.quantity]));

    expect(shown.equipment).toHaveLength(4);
    expect(byId['bed-roll']).toBe(0);
    expect(byId['spare-rope']).toBe(0);
    expect(byId.rations).toBe(2);
    expect(byId.torch).toBe(1);

    const saved = cleanForSave(gearSheet());
    const savedItems = (saved.equipment?.items ?? []) as Array<{
      id?: string;
      quantity?: number;
    }>;
    const savedById = Object.fromEntries(savedItems.map((item) => [item.id, item.quantity]));

    expect(savedItems).toHaveLength(4);
    expect(savedById['bed-roll']).toBe(0);
    expect(savedById['spare-rope']).toBe(0);
    expect(savedById.rations).toBe(2);
    expect(savedById.torch).toBeUndefined();

    const reloaded = enrichGear(saved as Character);
    const reloadedById = Object.fromEntries(
      reloaded.equipment.map((item) => [item.id, item.quantity]),
    );
    expect(reloaded.equipment).toHaveLength(4);
    expect(reloadedById['bed-roll']).toBe(0);
    expect(reloadedById['spare-rope']).toBe(0);
    expect(reloadedById.rations).toBe(2);
    expect(reloadedById.torch).toBe(1);
  });
});
