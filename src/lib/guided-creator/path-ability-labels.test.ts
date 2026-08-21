import { describe, expect, it } from 'vitest';
import { buildPathAbilityChipLabels } from './path-ability-labels';
import type { Archetype } from '@/types';

function path(partial: Partial<Archetype>): Archetype {
  return {
    id: 'test',
    name: 'Test',
    type: 'power',
    ...partial,
  };
}

describe('buildPathAbilityChipLabels', () => {
  it('formats primary and secondary chips with colons', () => {
    expect(
      buildPathAbilityChipLabels(
        path({
          type: 'power',
          archetype_ability: 'intelligence',
          secondary_ability: 'charisma',
        }),
      ),
    ).toEqual([
      {
        key: 'primary-intelligence',
        label: 'Primary Ability: Intelligence',
        role: 'primary',
      },
      {
        key: 'secondary-charisma',
        label: 'Secondary Ability: Charisma',
        role: 'secondary',
      },
    ]);
  });

  it('shows two primary chips for powered-martial paths', () => {
    expect(
      buildPathAbilityChipLabels(
        path({
          type: 'powered-martial',
          archetype_ability: 'intelligence',
          secondary_ability: 'strength',
        }),
      ),
    ).toEqual([
      {
        key: 'primary-intelligence',
        label: 'Primary Ability: Intelligence',
        role: 'primary',
      },
      {
        key: 'primary-strength',
        label: 'Primary Ability: Strength',
        role: 'primary',
      },
    ]);
  });
});
