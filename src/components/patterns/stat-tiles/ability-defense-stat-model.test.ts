import { describe, expect, it } from 'vitest';
import { calculateAbilityScoreCost } from '@/lib/game/formulas';
import { ABILITIES_AND_DEFENSES, DEFENSE_DISPLAY_NAMES } from '@/lib/game/constants';
import type { Abilities, AbilityName } from '@/types';
import {
  ABILITY_INFO,
  ABILITY_ORDER,
  DEFENSE_INFO,
  canDecreaseAbility,
} from './ability-defense-stat-model';

const ZERO_ABILITIES: Abilities = {
  strength: 0,
  vitality: 0,
  agility: 0,
  acuity: 0,
  intelligence: 0,
  charisma: 0,
};

function abilityPointsRemaining(abilities: Abilities, total: number): number {
  const spent = ABILITY_ORDER.reduce(
    (sum, name) => sum + calculateAbilityScoreCost(abilities[name] ?? 0),
    0,
  );
  return total - spent;
}

describe('Sheet ability/defense tile labels (TASK-835)', () => {
  it('uses GAME_RULES full names from ABILITIES_AND_DEFENSES (no Mental Fort.)', () => {
    const defenseNames = Object.values(DEFENSE_INFO).map((info) => info.name);
    const abilityNames = Object.values(ABILITY_INFO).map((info) => info.name);
    expect([...abilityNames, ...defenseNames]).toEqual([...ABILITIES_AND_DEFENSES]);
    expect(DEFENSE_DISPLAY_NAMES.reflex).toBe('Reflexes');
    expect(DEFENSE_DISPLAY_NAMES.mentalFortitude).toBe('Mental Fortitude');
    expect(defenseNames.join(' ')).not.toMatch(/Fort\./);
  });
});

describe('canDecreaseAbility floor (86e3jv3yv)', () => {
  it('stops at −2 so eight more clicks do not refund ability points', () => {
    const total = 8;
    const atFloor: Abilities = { ...ZERO_ABILITIES, strength: -2 };
    const before = abilityPointsRemaining(atFloor, total);

    for (let step = 0; step < 8; step += 1) {
      expect(canDecreaseAbility(atFloor, 'strength')).toBe(false);
    }

    expect(atFloor.strength).toBe(-2);
    expect(abilityPointsRemaining(atFloor, total)).toBe(before);
    expect(calculateAbilityScoreCost(atFloor.strength)).toBe(-2);

    const sunk: Abilities = { ...atFloor, strength: -10 };
    expect(abilityPointsRemaining(sunk, total) - before).toBe(8);
    expect(calculateAbilityScoreCost(-10)).toBe(-10);
  });

  it('still blocks when negative abilities already total −3', () => {
    const spread: Abilities = { ...ZERO_ABILITIES, strength: -2, intelligence: -1 };
    const blocked: AbilityName[] = ['strength', 'intelligence', 'charisma'];
    for (const ability of blocked) {
      expect(canDecreaseAbility(spread, ability)).toBe(false);
    }
  });

  it('still allows one ability to reach −2 when the negative total stays within −3', () => {
    const oneDown: Abilities = { ...ZERO_ABILITIES, strength: -1 };
    expect(canDecreaseAbility(oneDown, 'strength')).toBe(true);
    expect(canDecreaseAbility({ ...oneDown, strength: -2 }, 'strength')).toBe(false);
  });

  it('does not lower a score that is already below −2', () => {
    expect(canDecreaseAbility({ ...ZERO_ABILITIES, strength: -10 }, 'strength')).toBe(false);
  });
});
