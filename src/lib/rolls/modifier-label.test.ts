import { describe, expect, it } from 'vitest';
import { resolveRollModifierLabel } from './modifier-label';

describe('resolveRollModifierLabel (TASK-893)', () => {
  it('returns undefined when the modifier is zero or absent', () => {
    expect(
      resolveRollModifierLabel({ type: 'ability', title: 'Strength', modifier: 0 }),
    ).toBeUndefined();
    expect(
      resolveRollModifierLabel({
        type: 'ability',
        title: 'Strength',
        modifier: 0,
        explicit: 'Strength',
      }),
    ).toBeUndefined();
  });

  it('names ability, defense, skill, attack, and power bonuses', () => {
    expect(resolveRollModifierLabel({ type: 'ability', title: 'Strength', modifier: 3 })).toBe(
      'Strength',
    );
    expect(resolveRollModifierLabel({ type: 'defense', title: 'Reflexes', modifier: 2 })).toBe(
      'Reflexes bonus',
    );
    expect(resolveRollModifierLabel({ type: 'skill', title: 'Athletics (STR)', modifier: 4 })).toBe(
      'Athletics bonus',
    );
    expect(
      resolveRollModifierLabel({ type: 'attack', title: 'Strength Attack', modifier: 5 }),
    ).toBe('Strength bonus');
    expect(
      resolveRollModifierLabel({ type: 'attack', title: 'Charisma Attack', modifier: 6 }),
    ).toBe('Charisma bonus');
    expect(
      resolveRollModifierLabel({
        type: 'attack',
        title: 'Charisma Attack',
        modifier: 6,
        explicit: 'Power bonus',
      }),
    ).toBe('Power bonus');
    expect(resolveRollModifierLabel({ type: 'attack', title: 'Longsword', modifier: 4 })).toBe(
      'Attack bonus',
    );
    expect(
      resolveRollModifierLabel({ type: 'damage', title: 'Slashing Damage', modifier: 2 }),
    ).toBe('Damage bonus');
    expect(resolveRollModifierLabel({ type: 'custom', title: 'Custom Roll', modifier: -1 })).toBe(
      'Modifier',
    );
  });
});
