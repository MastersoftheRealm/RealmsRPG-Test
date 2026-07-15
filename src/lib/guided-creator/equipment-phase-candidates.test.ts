import { describe, expect, it } from 'vitest';
import {
  filterPoolToPhase,
  getPhaseL1Candidates,
} from '@/lib/guided-creator/equipment-phase-candidates';
import type { EligibleEquipmentRow } from '@/lib/guided-creator/equipment-eligibility';
import type { LibraryItem } from '@/types/library';

describe('equipment-phase-candidates', () => {
  const officialItems = [
    {
      id: 'w1',
      docId: 'w1',
      name: 'Battleaxe',
      type: 'weapon' as const,
      properties: [],
      rarity: 'common',
      costs: { totalTP: 4 },
    },
    {
      id: 'a1',
      docId: 'a1',
      name: 'Chain shirt',
      type: 'armor' as const,
      properties: [],
      rarity: 'common',
      costs: { totalTP: 3 },
    },
  ] as unknown as LibraryItem[];

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

  const rankCtx = {
    pathRecommendedIds: new Set(['w1']),
    martAbil: 'strength' as string | null,
    powAbil: null as string | null,
  };

  it('filters pool to weapon phase refs', () => {
    const pool = [
      { id: 'w1', quantity: 1 },
      { id: 'a1', quantity: 1 },
    ];
    const weapons = filterPoolToPhase(pool, 'weapon', officialItems, []);
    expect(weapons.map((p) => p.id)).toEqual(['w1']);
  });

  it('returns path L1 weapon candidates without eligibility filtering', () => {
    const pool = [{ id: 'w1', quantity: 1 }];
    const candidates = getPhaseL1Candidates(pool, 'weapon', catalog, rankCtx, officialItems, []);
    expect(candidates.map((c) => c.id)).toEqual(['w1']);
  });

  it('keeps selected items visible even when not in the path pool', () => {
    const pool: { id: string; quantity: number }[] = [];
    const candidates = getPhaseL1Candidates(
      pool,
      'weapon',
      catalog,
      rankCtx,
      officialItems,
      [],
      ['w1']
    );
    expect(candidates.map((c) => c.id)).toEqual(['w1']);
  });
});
