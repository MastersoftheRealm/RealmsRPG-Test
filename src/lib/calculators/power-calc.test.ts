import { describe, expect, it } from 'vitest';
import type { PowerPart } from '@/hooks/codex-types';
import { PART_IDS } from '@/lib/id-constants';
import { buildMechanicParts } from './mechanic-builder';
import {
  calculatePowerCosts,
  calculatePowerSectionContribution,
  derivePowerDisplay,
} from './power-calc';

const elementalDamagePart: PowerPart = {
  id: String(PART_IDS.ELEMENTAL_DAMAGE),
  name: 'Elemental Damage',
  description: 'Elemental damage part',
  category: 'Damage',
  mechanic: true,
  base_en: 3,
  base_tp: 2,
  op_1_en: 1,
  op_1_tp: 0.5,
  percentage: false,
  duration: false,
};

const magicDamagePart: PowerPart = {
  id: String(PART_IDS.MAGIC_DAMAGE),
  name: 'Magic Damage',
  description: 'Magic damage part',
  category: 'Damage',
  mechanic: true,
  base_en: 3,
  base_tp: 2,
  op_1_en: 1,
  op_1_tp: 0.5,
  percentage: false,
  duration: false,
};

describe('calculatePowerSectionContribution', () => {
  it('includes duration multiplier in section EN when applyDuration is set', () => {
    const spherePart: PowerPart = {
      id: String(PART_IDS.SPHERE_OF_EFFECT),
      name: 'Sphere of Effect',
      description: 'Sphere of Effect',
      category: 'Area of Effect',
      mechanic: true,
      base_en: 4,
      base_tp: 1,
      percentage: false,
      duration: false,
    };
    const durationPart: PowerPart = {
      id: '377',
      name: 'Duration (Minute)',
      description: 'Duration (Minute)',
      category: 'Duration',
      mechanic: true,
      base_en: 2,
      base_tp: 0,
      percentage: false,
      duration: true,
    };
    const areaParts = [
      {
        id: spherePart.id,
        name: spherePart.name,
        op_1_lvl: 0,
        op_2_lvl: 0,
        op_3_lvl: 0,
        applyDuration: true,
      },
    ];
    const durationParts = [
      {
        id: durationPart.id,
        name: durationPart.name,
        op_1_lvl: 0,
        op_2_lvl: 0,
        op_3_lvl: 0,
        applyDuration: false,
      },
    ];

    const isolated = calculatePowerCosts(areaParts, [spherePart, durationPart]);
    const section = calculatePowerSectionContribution(
      areaParts,
      [spherePart, durationPart],
      durationParts
    );

    expect(isolated.energyRaw).toBe(4);
    // dur_all=2 → section share 4 + 2*4 = 12
    expect(section.energyRaw).toBe(12);
    expect(section.totalTP).toBe(1);
  });
});

describe('calculatePowerCosts', () => {
  it('counts each elemental damage row independently', () => {
    const mechanicParts = buildMechanicParts({
      creatorType: 'power',
      partsDb: [elementalDamagePart],
      powerDamage: [
        { type: 'fire', diceAmount: 1, dieSize: 6 },
        { type: 'ice', diceAmount: 1, dieSize: 6 },
        { type: 'lightning', diceAmount: 1, dieSize: 6 },
      ],
    });

    const payload = mechanicParts.map((mp) => ({
      id: mp.id,
      name: mp.name,
      op_1_lvl: mp.op_1_lvl,
      op_2_lvl: mp.op_2_lvl,
      op_3_lvl: mp.op_3_lvl,
    }));

    expect(mechanicParts).toHaveLength(3);
    expect(mechanicParts.every((mp) => mp.op_1_lvl === 1)).toBe(true);

    const costs = calculatePowerCosts(payload, [elementalDamagePart]);
    // 1d6 -> opt1 level 1 -> 3 base + 1 option = 4 EN per row, 3 rows = 12
    expect(costs.totalEnergy).toBe(12);
    expect(costs.totalTP).toBe(6);
  });

  it('counts mixed damage part ids independently', () => {
    const mechanicParts = buildMechanicParts({
      creatorType: 'power',
      partsDb: [elementalDamagePart, magicDamagePart],
      powerDamage: [
        { type: 'fire', diceAmount: 1, dieSize: 6 },
        { type: 'magic', diceAmount: 1, dieSize: 6 },
      ],
    });

    const payload = mechanicParts.map((mp) => ({
      id: mp.id,
      name: mp.name,
      op_1_lvl: mp.op_1_lvl,
      op_2_lvl: mp.op_2_lvl,
      op_3_lvl: mp.op_3_lvl,
    }));

    const costs = calculatePowerCosts(payload, [elementalDamagePart, magicDamagePart]);
    // elemental 4 EN + magic 4 EN = 8
    expect(costs.totalEnergy).toBe(8);
  });
});

describe('derivePowerDisplay', () => {
  it('rebuilds multi-row elemental damage from the damage array', () => {
    const display = derivePowerDisplay(
      {
        name: 'Tri-Element Bolt',
        damage: [
          { amount: 1, size: 6, type: 'fire' },
          { amount: 1, size: 6, type: 'ice' },
          { amount: 1, size: 6, type: 'lightning' },
        ],
        parts: [],
      },
      [elementalDamagePart]
    );

    expect(display.energy).toBe(12);
    expect(display.tp).toBe(6);
  });

  it('dedupes mechanic parts when promoted columns and payload.parts both exist (Menace)', () => {
    const partsDb: PowerPart[] = [
      {
        id: '205',
        name: 'Frighten',
        description: 'Frighten',
        category: 'Charm',
        mechanic: false,
        base_en: 0,
        base_tp: 3,
        percentage: false,
        duration: false,
      },
      {
        id: '387',
        name: 'Immune to Effect on Overcome',
        description: 'Immune to Effect on Overcome',
        category: 'Restriction',
        mechanic: true,
        base_en: 0,
        base_tp: 0,
        percentage: false,
        duration: false,
      },
      {
        id: '232',
        name: 'Sphere of Effect',
        description: 'Sphere of Effect',
        category: 'Area of Effect',
        mechanic: true,
        base_en: 0,
        base_tp: 0,
        percentage: false,
        duration: false,
      },
      {
        id: '303',
        name: 'No Harm or Adaptation for Duration',
        description: 'No Harm or Adaptation for Duration',
        category: 'Duration',
        mechanic: true,
        base_en: 0,
        base_tp: 0,
        percentage: true,
        duration: false,
      },
      {
        id: '377',
        name: 'Duration (Minute)',
        description: 'Duration (Minute)',
        category: 'Duration',
        mechanic: true,
        base_en: 0,
        base_tp: 0,
        percentage: true,
        duration: false,
      },
    ];

    const display = derivePowerDisplay(
      {
        name: 'Menace',
        actionType: 'basic',
        area: { type: 'sphere', level: 1 },
        duration: { type: 'minutes', value: 1 },
        parts: [
          { id: 205, name: 'Frighten', op_1_lvl: 1, applyDuration: true },
          { id: 387, name: 'Immune to Effect on Overcome', isAdvanced: true },
          { id: 232, name: 'Sphere of Effect' },
          { id: 303, name: 'No Harm or Adaptation for Duration' },
          { id: 377, name: 'Duration (Minute)' },
        ],
      },
      partsDb
    );

    const chipNames = display.partChips.map((c) => c.text.replace(/\s\| TP:.*/, ''));
    expect(chipNames.filter((n) => n === 'Duration (Minute)')).toHaveLength(1);
    expect(chipNames.filter((n) => n === 'Sphere of Effect')).toHaveLength(1);
    expect(chipNames).toHaveLength(5);
  });

  it('applies area applyDuration into energy when duration is present', () => {
    const spherePart: PowerPart = {
      id: String(PART_IDS.SPHERE_OF_EFFECT),
      name: 'Sphere of Effect',
      description: 'Sphere of Effect',
      category: 'Area of Effect',
      mechanic: true,
      base_en: 4,
      base_tp: 1,
      op_1_en: 2,
      op_1_tp: 0.5,
      percentage: false,
      duration: false,
    };
    const durationPart: PowerPart = {
      id: '377',
      name: 'Duration (Minute)',
      description: 'Duration (Minute)',
      category: 'Duration',
      mechanic: true,
      base_en: 2,
      base_tp: 0,
      percentage: false,
      duration: true,
    };

    const withoutApply = derivePowerDisplay(
      {
        name: 'Zone',
        actionType: 'basic',
        area: { type: 'sphere', level: 1, applyDuration: false },
        duration: { type: 'minutes', value: 1 },
        parts: [],
      },
      [spherePart, durationPart]
    );
    const withApply = derivePowerDisplay(
      {
        name: 'Zone',
        actionType: 'basic',
        area: { type: 'sphere', level: 1, applyDuration: true },
        duration: { type: 'minutes', value: 1 },
        parts: [],
      },
      [spherePart, durationPart]
    );

    // Sphere base 4 + duration multiplier: without apply → flat only; with apply → flat + dur*flat
    expect(withApply.energy).toBeGreaterThan(withoutApply.energy);
    expect(withoutApply.energy).toBe(4);
    // dur_all = 2, flat_normal = 4, flat_duration = 4 → 4 + 2*4 = 12
    expect(withApply.energy).toBe(12);
  });
});
