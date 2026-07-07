import { describe, expect, it } from 'vitest';
import { buildPathLoadoutPool, isItemSelectedInDraft } from '@/lib/guided-creator/loadout-pool';
import { validatePathDataForPublish } from '@/lib/game/path-validation';
import type { PathLoadout } from '@/types/archetype';

describe('loadout-pool', () => {
  const loadouts: PathLoadout[] = [
    {
      id: 'a',
      title: 'A',
      armaments: [{ id: 'w1', quantity: 1 }],
      equipment: [{ id: 'e1', quantity: 2 }],
    },
    {
      id: 'b',
      title: 'B',
      armaments: [{ id: 'w1', quantity: 1 }, { id: 'w2', quantity: 1 }],
    },
  ];

  it('dedupes pool items across loadouts', () => {
    const pool = buildPathLoadoutPool(loadouts, undefined);
    expect(pool).toHaveLength(3);
    expect(pool.map((p) => p.id).sort()).toEqual(['e1', 'w1', 'w2']);
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

describe('validatePathDataForPublish loadouts', () => {
  it('errors when loadout exceeds TP budget', () => {
    const issues = validatePathDataForPublish(
      {
        level1: {
          loadouts: [
            {
              id: 'heavy',
              title: 'Heavy kit',
              armaments: [
                { id: 'a', quantity: 1 },
                { id: 'b', quantity: 1 },
              ],
            },
          ],
        },
      },
      {
        resolveItemTrainingPoints: (id) => (id === 'a' ? 3 : 4),
        trainingPointLimit: 5,
      }
    );
    expect(issues.some((i) => i.severity === 'error' && i.message.includes('Heavy kit'))).toBe(true);
  });
});
