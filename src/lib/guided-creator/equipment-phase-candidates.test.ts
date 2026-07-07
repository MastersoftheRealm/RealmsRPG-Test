import { describe, expect, it } from 'vitest';
import {
  filterPoolToPhase,
  getPhaseL1Candidates,
} from '@/lib/guided-creator/equipment-phase-candidates';
import type { EligibleEquipmentRow } from '@/lib/guided-creator/equipment-eligibility';
import type { EquipmentEligibilityContext } from '@/lib/guided-creator/equipment-eligibility';

describe('equipment-phase-candidates', () => {
  const officialItems = [
    {
      id: 'w1',
      name: 'Battleaxe',
      type: 'weapon' as const,
      properties: [],
      rarity: 'common',
      costs: { totalTP: 4 },
    },
    {
      id: 'a1',
      name: 'Chain shirt',
      type: 'armor' as const,
      properties: [],
      rarity: 'common',
      costs: { totalTP: 3 },
    },
  ];

  const catalog = new Map<string, EligibleEquipmentRow>([
    [
      'w1',
      {
        id: 'w1',
        name: 'Battleaxe',
        type: 'weapon',
        rarity: 'common',
        trainingPoints: 4,
        properties: [],
      },
    ],
    [
      'a1',
      {
        id: 'a1',
        name: 'Chain shirt',
        type: 'armor',
        rarity: 'common',
        trainingPoints: 3,
        properties: [],
      },
    ],
  ]);

  const ctx: EquipmentEligibilityContext = {
    phase: 'weapon',
    abilities: {
      strength: 3,
      vitality: 2,
      agility: 1,
      acuity: 1,
      intelligence: 0,
      charisma: 0,
    },
    martAbil: 'strength',
    powAbil: null,
    archetypeType: 'martial',
    pathRecommendedIds: new Set(['w1']),
    selectedTpSpent: 0,
    tpLimit: 30,
  };

  it('filters pool to weapon phase refs', () => {
    const pool = [
      { id: 'w1', quantity: 1 },
      { id: 'a1', quantity: 1 },
    ];
    const weapons = filterPoolToPhase(pool, 'weapon', officialItems, []);
    expect(weapons.map((p) => p.id)).toEqual(['w1']);
  });

  it('returns ranked eligible L1 weapon candidates from path pool', () => {
    const pool = [{ id: 'w1', quantity: 1 }];
    const candidates = getPhaseL1Candidates(pool, 'weapon', catalog, ctx, officialItems, []);
    expect(candidates.map((c) => c.id)).toEqual(['w1']);
  });
});
