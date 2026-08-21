import { describe, expect, it } from 'vitest';
import { buildPathLoadoutPool, isItemSelectedInDraft } from '@/lib/guided-creator/loadout-pool';

describe('loadout-pool', () => {
  it('builds pool from flat path recommendations only', () => {
    const pool = buildPathLoadoutPool({
      armamentRecommendations: [
        { id: 'w1', quantity: 1 },
        { id: 'w2', quantity: 1 },
      ],
      equipmentRecommendations: [{ id: 'e1', quantity: 2 }],
      sharedEquipment: [{ id: 'e2', quantity: 1 }],
      loadouts: [
        {
          id: 'legacy-kit',
          title: 'Legacy',
          armaments: [{ id: 'kit-only', quantity: 1 }],
        },
      ],
    });
    expect(pool.map((p) => p.id).sort()).toEqual(['e1', 'e2', 'w1', 'w2']);
    expect(pool.find((p) => p.id === 'kit-only')).toBeUndefined();
  });

  it('tracks draft selection by id', () => {
    const draft = {
      loadoutWeapons: [{ id: 'w1', quantity: 1 }],
      loadoutArmor: [],
      armaments: [{ id: 'w1', quantity: 1 }],
      equipment: [],
    };
    expect(isItemSelectedInDraft(draft, 'w1')).toBe(true);
    expect(isItemSelectedInDraft(draft, 'w2')).toBe(false);
  });
});
