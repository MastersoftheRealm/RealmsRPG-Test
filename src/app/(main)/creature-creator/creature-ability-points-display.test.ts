import { describe, expect, it } from 'vitest';
import { formatCreatureAbilityPointsValue } from './creature-ability-points-display';

describe('formatCreatureAbilityPointsValue', () => {
  it('shows refund note instead of misleading remaining/budget when STR is negative', () => {
    const label = formatCreatureAbilityPointsValue(7, {
      strength: -4,
      vitality: 0,
      agility: 0,
      acuity: 0,
      intelligence: 0,
      charisma: 0,
    });
    expect(label).toBe('0/7 (+4 from negatives)');
  });

  it('shows remaining/budget when no negative abilities', () => {
    expect(
      formatCreatureAbilityPointsValue(7, {
        strength: 2,
        vitality: 0,
        agility: 0,
        acuity: 0,
        intelligence: 0,
        charisma: 0,
      }),
    ).toBe('5/7');
  });
});
