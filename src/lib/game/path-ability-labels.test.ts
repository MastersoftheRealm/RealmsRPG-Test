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
  it('resolves power path primary and distinct secondary recommended', () => {
    expect(
      resolvePathAbilityLabels(
        path({
          type: 'power',
          archetype_ability: 'intelligence',
          secondary_ability: 'charisma',
        }),
      ),
    ).toEqual({
      primaryAbilities: ['intelligence'],
      secondaryAbility: 'charisma',
      powAbil: 'intelligence',
      martAbil: null,
    });
  });

  it('omits secondary when it matches the archetype ability', () => {
    expect(
      resolvePathAbilityLabels(
        path({
          type: 'power',
          archetype_ability: 'intelligence',
          secondary_ability: 'intelligence',
        }),
      ),
    ).toEqual({
      primaryAbilities: ['intelligence'],
      secondaryAbility: null,
      powAbil: 'intelligence',
      martAbil: null,
    });
  });

  it('resolves martial archetype ability with optional distinct secondary', () => {
    expect(
      resolvePathAbilityLabels(
        path({
          type: 'martial',
          mart_abil: 'strength',
          secondary_ability: 'vitality',
        }),
      ),
    ).toEqual({
      primaryAbilities: ['strength'],
      secondaryAbility: 'vitality',
      powAbil: null,
      martAbil: 'strength',
    });
  });

  it('treats powered-martial power + martial as two primary archetype abilities', () => {
    expect(
      resolvePathAbilityLabels(
        path({
          type: 'powered-martial',
          pow_abil: 'acuity',
          mart_abil: 'agility',
        }),
      ),
    ).toEqual({
      primaryAbilities: ['acuity', 'agility'],
      secondaryAbility: null,
      powAbil: 'acuity',
      martAbil: 'agility',
    });
  });

  it('does not treat martial-side secondary_ability fallback as Secondary chip', () => {
    expect(
      resolvePathAbilityLabels(
        path({
          type: 'powered-martial',
          archetype_ability: 'intelligence',
          secondary_ability: 'strength',
        }),
      ),
    ).toEqual({
      primaryAbilities: ['intelligence', 'strength'],
      secondaryAbility: null,
      powAbil: 'intelligence',
      martAbil: 'strength',
    });
  });

  it('can show a third Secondary when mart_abil and secondary_ability both exist', () => {
    expect(
      resolvePathAbilityLabels(
        path({
          type: 'powered-martial',
          pow_abil: 'intelligence',
          mart_abil: 'strength',
          secondary_ability: 'charisma',
        }),
      ),
    ).toEqual({
      primaryAbilities: ['intelligence', 'strength'],
      secondaryAbility: 'charisma',
      powAbil: 'intelligence',
      martAbil: 'strength',
    });
  });
});
