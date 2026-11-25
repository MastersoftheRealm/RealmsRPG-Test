import { describe, expect, it } from 'vitest';
import { PROPERTY_IDS } from '@/lib/id-constants';
import {
  buildCreatureDefensesSummaryLine,
  propertiesToChips,
} from './creature-stat-block-helpers';

const codexProperties = [
  {
    id: PROPERTY_IDS.TWO_HANDED,
    name: 'Two-Handed',
    base_tp: 2,
  },
  {
    id: PROPERTY_IDS.WEAPON_DAMAGE,
    name: 'Weapon Damage',
    base_tp: 2,
    op_1_tp: 1,
  },
];

describe('propertiesToChips', () => {
  it('matches shared TP for whole-number codex rates', () => {
    const chips = propertiesToChips(
      [
        { id: PROPERTY_IDS.TWO_HANDED, name: 'Two-Handed', op_1_lvl: 0 },
        { id: PROPERTY_IDS.WEAPON_DAMAGE, name: 'Weapon Damage', op_1_lvl: 3 },
      ],
      codexProperties,
    );
    expect(chips[0]?.name).toBe('Two-Handed');
    expect(chips[0]?.cost).toBe(2);
    expect(chips[1]?.name).toBe('Weapon Damage');
    expect(chips[1]?.cost).toBe(5);
    expect(chips[1]?.level).toBe(3);
  });
});

describe('buildCreatureDefensesSummaryLine', () => {
  it('lists all six defense scores as 10 + ability + defense rank', () => {
    const line = buildCreatureDefensesSummaryLine(
      { strength: 2, vitality: 0, agility: 1, acuity: 0, intelligence: 0, charisma: 0 },
      { might: 1, fortitude: 0, reflex: 0, discernment: 0, mentalFortitude: 0, resolve: 0 },
    );
    expect(line).toContain('Might 13');
    expect(line).toContain('Reflexes 11');
    expect(line.match(/Defenses/)?.[0]).toBe('Defenses');
    expect(line.split(',').length).toBe(6);
  });

  it('includes a negative ability in the score', () => {
    const line = buildCreatureDefensesSummaryLine(
      { strength: -4, vitality: 0, agility: 0, acuity: 0, intelligence: 0, charisma: 0 },
      { might: 1, fortitude: 0, reflex: 0, discernment: 0, mentalFortitude: 0, resolve: 0 },
    );
    expect(line).toContain('Might 7');
    expect(line).toContain('Fortitude 10');
  });
});
