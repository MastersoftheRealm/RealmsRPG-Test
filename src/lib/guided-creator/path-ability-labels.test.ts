import { describe, expect, it } from 'vitest';
import { resolvePathAbilityLabels } from './path-ability-labels';
import type { Archetype } from '@/types';

function path(partial: Partial<Archetype>): Archetype {
  return {
    id: 'test',
    name: 'Test',
    type: 'power',
    ...partial,
  };
}

describe('resolvePathAbilityLabels', () => {
  it('resolves power path primary and distinct secondary', () => {
    expect(
      resolvePathAbilityLabels(
        path({
          type: 'power',
          archetype_ability: 'intelligence',
          secondary_ability: 'charisma',
        })
      )
    ).toEqual({ primary: 'intelligence', secondary: 'charisma' });
  });

  it('omits secondary when it matches primary', () => {
    expect(
      resolvePathAbilityLabels(
        path({
          type: 'power',
          archetype_ability: 'intelligence',
          secondary_ability: 'intelligence',
        })
      )
    ).toEqual({ primary: 'intelligence', secondary: null });
  });

  it('resolves martial primary from mart_abil with optional distinct secondary', () => {
    expect(
      resolvePathAbilityLabels(
        path({
          type: 'martial',
          mart_abil: 'strength',
          secondary_ability: 'vitality',
        })
      )
    ).toEqual({ primary: 'strength', secondary: 'vitality' });
  });

  it('maps powered-martial power→primary and martial→secondary', () => {
    expect(
      resolvePathAbilityLabels(
        path({
          type: 'powered-martial',
          pow_abil: 'acuity',
          mart_abil: 'agility',
        })
      )
    ).toEqual({ primary: 'acuity', secondary: 'agility' });
  });
});
