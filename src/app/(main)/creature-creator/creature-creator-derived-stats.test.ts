import { describe, expect, it } from 'vitest';
import {
  calculateCreatureCreatorStats,
  isCreatureOverBudget,
} from './creature-creator-derived-stats';
import { CREATURE_FEAT_IDS } from '@/lib/id-constants';
import { initialState } from './creature-creator-constants';

describe('calculateCreatureCreatorStats', () => {
  const featPointsMap = new Map<string, number>([
    [String(CREATURE_FEAT_IDS.RESISTANCE), 1],
    [String(CREATURE_FEAT_IDS.IMMUNITY), 2],
    [String(CREATURE_FEAT_IDS.WEAKNESS), -1],
    [String(CREATURE_FEAT_IDS.CONDITION_IMMUNITY), 1],
  ]);

  it('Speedy and Slow change the SPD chip (86e3jx63c)', () => {
    const base = calculateCreatureCreatorStats(initialState, featPointsMap, new Set(), undefined);
    const speedy = calculateCreatureCreatorStats(
      { ...initialState, movementTypes: ['Speedy'] },
      featPointsMap,
      new Set(),
      undefined,
    );
    const slow = calculateCreatureCreatorStats(
      { ...initialState, movementTypes: ['Slow'] },
      featPointsMap,
      new Set(),
      undefined,
    );
    expect(speedy.speed).toBe(base.speed + 2);
    expect(slow.speed).toBe(base.speed - 2);
  });

  it('returns positive remaining budgets for a fresh level-1 creature', () => {
    const stats = calculateCreatureCreatorStats(initialState, featPointsMap, new Set(), undefined);
    expect(stats.featRemaining).toBeGreaterThanOrEqual(0);
    expect(stats.trainingRemaining).toBeGreaterThanOrEqual(0);
    expect(stats.abilityRemaining).toBeGreaterThanOrEqual(0);
    expect(isCreatureOverBudget(stats)).toBe(false);
  });

  it('counts mechanical feat spend from resistances', () => {
    const creature = {
      ...initialState,
      resistances: ['fire'],
    };
    const stats = calculateCreatureCreatorStats(creature, featPointsMap, new Set(), undefined);
    expect(stats.featSpent).toBe(1);
  });

  it('uses doubled ability cost above +4 in summary (86e3jx4dk)', () => {
    const creature = {
      ...initialState,
      level: 1,
      abilities: { ...initialState.abilities, strength: 7 },
    };
    const stats = calculateCreatureCreatorStats(creature, featPointsMap, new Set(), undefined);
    expect(stats.abilityPoints).toBe(7);
    expect(stats.abilitySpent).toBe(10);
    expect(stats.abilityRemaining).toBe(-3);
    expect(isCreatureOverBudget(stats)).toBe(true);
  });

  it('an orphaned sub-skill does not spend skill points (86e3jx4dp)', () => {
    const withParent = calculateCreatureCreatorStats(
      {
        ...initialState,
        skills: [
          { id: 'craft', name: 'Craft', value: 0, proficient: true },
          {
            id: 'smith',
            name: 'Smith',
            value: 1,
            proficient: true,
            isSubSkill: true,
            baseSkillId: 'craft',
          },
        ],
      },
      featPointsMap,
      new Set(),
      undefined,
    );
    const orphan = calculateCreatureCreatorStats(
      {
        ...initialState,
        skills: [
          { id: 'athletics', name: 'Athletics', value: 0, proficient: true },
          {
            id: 'smith',
            name: 'Smith',
            value: 1,
            proficient: true,
            isSubSkill: true,
            baseSkillId: 'craft',
          },
        ],
      },
      featPointsMap,
      new Set(),
      undefined,
    );
    expect(orphan.skillRemaining).toBeGreaterThan(withParent.skillRemaining);
  });

  it('uses past-cap skill costs in summary remaining (86e3jx4dm)', () => {
    const creature = {
      ...initialState,
      level: 3,
      skills: [
        { id: 'athletics', name: 'Athletics', value: 7, proficient: true },
        {
          id: 'smith',
          name: 'Smith',
          value: 1,
          proficient: true,
          isSubSkill: true,
          baseSkillId: 'athletics',
        },
      ],
    };
    const stats = calculateCreatureCreatorStats(creature, featPointsMap, new Set(), undefined);
    expect(stats.skillPoints).toBe(11);
    expect(stats.skillRemaining).toBe(-6);
    expect(isCreatureOverBudget(stats)).toBe(true);
  });

  it('sums currency and TP from kind buckets (TASK-812)', () => {
    const creature = {
      ...initialState,
      enableArmaments: true,
      weapons: [
        {
          id: 'w1',
          name: 'Axe',
          type: 'weapon',
          tp: 2,
          currency: 10,
          rarity: 'Common',
        },
      ],
      equipment: [
        {
          id: 'e1',
          name: 'Torch',
          type: 'equipment',
          tp: 0,
          currency: 3,
          rarity: 'Common',
          quantity: 2,
        },
      ],
    };
    const stats = calculateCreatureCreatorStats(creature, featPointsMap, new Set(), undefined);
    expect(stats.trainingSpent).toBe(2);
    expect(stats.currencySpent).toBe(16);
  });

  it('uses one armor Damage Reduction: the highest currency cost (86e3t17av)', () => {
    const creature = {
      ...initialState,
      enableArmaments: true,
      weapons: [
        {
          id: 'w1',
          name: 'Mace',
          type: 'weapon',
          tp: 1,
          currency: 5,
          rarity: 'Common',
          damageReduction: 2,
        },
      ],
      shields: [
        {
          id: 's1',
          name: 'Buckler',
          type: 'shield',
          tp: 1,
          currency: 80,
          rarity: 'Common',
          damageReduction: 5,
        },
      ],
      armor: [
        {
          id: 'a1',
          name: 'Thick Hide',
          type: 'armor',
          tp: 2,
          currency: 8,
          rarity: 'Common',
          properties: [{ id: 1, name: 'Damage Reduction', op_1_lvl: 3 }],
        },
        {
          id: 'a2',
          name: 'Plate',
          type: 'armor',
          tp: 3,
          currency: 40,
          rarity: 'Common',
          damageReduction: 6,
        },
        {
          id: 'a3',
          name: 'Mail',
          type: 'armor',
          tp: 2,
          currency: 40,
          rarity: 'Common',
          damageReduction: 9,
        },
      ],
    };
    const stats = calculateCreatureCreatorStats(creature, featPointsMap, new Set(), undefined);
    expect(stats.damageReduction).toBe(6);
  });

  it('hidden Inventory does not spend Currency or TP (86e3jx639)', () => {
    const creature = {
      ...initialState,
      enableArmaments: false,
      weapons: [
        {
          id: 'w1',
          name: 'Axe',
          type: 'weapon',
          tp: 2,
          currency: 10,
          rarity: 'Common',
        },
      ],
      armor: [
        {
          id: 'a1',
          name: 'Plate',
          type: 'armor',
          tp: 3,
          currency: 40,
          rarity: 'Common',
          damageReduction: 6,
        },
      ],
    };
    const stats = calculateCreatureCreatorStats(creature, featPointsMap, new Set(), undefined);
    expect(stats.trainingSpent).toBe(0);
    expect(stats.currencySpent).toBe(0);
    expect(stats.damageReduction).toBe(0);
  });
});
