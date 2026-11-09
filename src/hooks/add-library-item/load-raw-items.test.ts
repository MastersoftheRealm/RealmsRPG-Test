import { describe, expect, it } from 'vitest';
import { loadRawItemsForType } from './load-raw-items';

const idleLoading = {
  powersLoading: false,
  techniquesLoading: false,
  itemsLoading: false,
  equipmentLoading: false,
  publicPowersLoading: false,
  publicTechniquesLoading: false,
  publicItemsLoading: false,
};

describe('loadRawItemsForType equipment', () => {
  it('does not copy properties from official codex equipment rows', () => {
    const { rawItems } = loadRawItemsForType({
      itemType: 'equipment',
      userPowers: [],
      userTechniques: [],
      userItems: [],
      codexEquipment: [
        {
          id: 'eq-rope',
          name: 'Rope',
          description: 'Hemp rope.',
          type: 'equipment',
        },
      ],
      publicPowers: [],
      publicTechniques: [],
      publicItems: [],
      loading: idleLoading,
    });

    expect(rawItems).toHaveLength(1);
    expect(rawItems[0]).not.toHaveProperty('properties');
    expect((rawItems[0] as { _source?: string })._source).toBe('public');
  });
});
