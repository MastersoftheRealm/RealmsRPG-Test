/**
 * TASK-457 — titleChips vs detailChips layout for guided equipment cards.
 */

import { describe, expect, it } from 'vitest';
import { PROPERTY_IDS } from '@/lib/id-constants';
import { buildEquipmentPhaseCardStats } from '@/lib/guided-creator/equipment-phase-stats';

describe('buildEquipmentPhaseCardStats (TASK-457)', () => {
  it('puts Currency and Training Points in titleChips only for weapons', () => {
    const stats = buildEquipmentPhaseCardStats({
      category: 'weapon',
      properties: [{ name: 'One-handed' }, { name: 'Finesse' }, { name: 'Graze' }],
      damageLine: '1d6 Slashing',
      unitCost: 12,
      trainingPoints: 4,
      itemProperties: [{ name: 'Graze', description: 'Graze on miss', op_1_lvl: 0 } as never],
    });

    expect(stats.titleChips.map((c) => c.name)).toEqual(['Currency 12', 'Training Points 4']);
    expect(stats.detailChips.some((c) => /^currency\s/i.test(c.name))).toBe(false);
    expect(stats.detailChips.some((c) => /^training points\s/i.test(c.name))).toBe(false);
  });

  it('puts mechanic facts and named properties in detailChips, not titleChips', () => {
    const stats = buildEquipmentPhaseCardStats({
      category: 'weapon',
      properties: [{ name: 'One-handed' }, { name: 'Finesse' }, { name: 'Graze' }],
      damageLine: '1d6 Slashing',
      unitCost: 5,
      trainingPoints: 2,
      itemProperties: [{ name: 'Graze', description: 'Graze on miss', op_1_lvl: 0 } as never],
    });

    const detailNames = stats.detailChips.map((c) => c.name);
    expect(detailNames).toContain('One-handed');
    expect(detailNames.some((n) => /\bdamage\b/i.test(n))).toBe(true);
    expect(detailNames).toContain('Agility Weapon');
    expect(detailNames).toContain('Graze');
    expect(detailNames).not.toContain('Finesse');

    expect(stats.titleChips.map((c) => c.name)).not.toContain('Graze');
    expect(stats.titleChips.map((c) => c.name)).not.toContain('Agility Weapon');
    expect(stats.cardChips.map((c) => c.name)).toEqual(['Graze']);
  });

  it('armor titleChips are budgets; ability req, DR and named props go to detailChips', () => {
    const stats = buildEquipmentPhaseCardStats({
      category: 'armor',
      properties: [
        { name: 'Bulwark' },
        { name: 'Strength Requirement', op_1_lvl: 0 },
        { name: 'Armor Base' },
        { name: 'Damage Reduction' },
      ],
      damageReduction: 2,
      agilityPenalty: -1,
      unitCost: 20,
      trainingPoints: 3,
      itemProperties: [
        { name: 'Bulwark', description: 'Hard to move', op_1_lvl: 0 } as never,
        { name: 'Armor Base', description: 'Calc', op_1_lvl: 0 } as never,
        { name: 'Damage Reduction', description: 'DR', op_1_lvl: 0 } as never,
      ],
    });

    expect(stats.titleChips.map((c) => c.name)).toEqual(['Currency 20', 'Training Points 3']);
    expect(stats.detailChips.map((c) => c.name)).toEqual([
      'Strength Requirement 1+',
      'Damage Reduction 2',
      'Agility Reduction -1',
      'Bulwark',
    ]);
    expect(stats.detailChips.find((c) => c.name === 'Bulwark')?.cost).toBeUndefined();
  });

  it('equipment titleChips are Currency only; never duplicates description as Use', () => {
    const stats = buildEquipmentPhaseCardStats({
      category: 'equipment',
      unitCost: 8,
      shortUse: 'A rope for climbing',
    });
    expect(stats.titleChips.map((c) => c.name)).toEqual(['Currency 8']);
    expect(stats.detailChips).toEqual([]);
    expect(stats.factChips.map((c) => c.name)).toEqual(['Currency 8']);
    expect(stats.tags.some((t) => /^use\b/i.test(t))).toBe(false);
  });

  it('chips Range from properties and rejects corrupt stored range (TASK-716)', () => {
    const ranged = buildEquipmentPhaseCardStats({
      category: 'weapon',
      properties: [{ id: PROPERTY_IDS.RANGE, name: 'Range', op_1_lvl: 1 }],
      storedRange: '0',
    });
    expect(ranged.detailChips.map((c) => c.name)).toContain('Range 16 Spaces');
    expect(ranged.detailChips.map((c) => c.name)).toContain('Ranged');
    expect(ranged.detailChips.map((c) => c.name)).toContain('Acuity Weapon');

    const corruptMelee = buildEquipmentPhaseCardStats({
      category: 'weapon',
      properties: [],
      storedRange: '0',
    });
    const corruptNames = corruptMelee.detailChips.map((c) => c.name);
    expect(corruptNames.some((n) => /^range\b/i.test(n))).toBe(false);
    expect(corruptNames).toContain('One-handed');
    expect(corruptNames).toContain('Strength Weapon');
    expect(corruptNames).not.toContain('0');
  });
});
