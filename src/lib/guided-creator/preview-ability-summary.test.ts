import { describe, expect, it } from 'vitest';
import {
  buildPreviewAbilityChips,
  formatPreviewAbilityValue,
  PREVIEW_ABILITY_ORDER,
  resolvePreviewArchetypeAbilities,
  shouldShowPreviewAbilityChips,
} from './preview-ability-summary';

describe('preview-ability-summary (TASK-686, TASK-694)', () => {
  it('formats signed values with unicode minus', () => {
    expect(formatPreviewAbilityValue(3)).toBe('+3');
    expect(formatPreviewAbilityValue(0)).toBe('0');
    expect(formatPreviewAbilityValue(-2)).toBe('−2');
  });

  it('returns all six abilities in canonical order including zeros', () => {
    const chips = buildPreviewAbilityChips({
      strength: 2,
      vitality: 0,
      agility: -1,
      acuity: 1,
      intelligence: 0,
      charisma: 0,
    });
    expect(chips.map((c) => c.ability)).toEqual(PREVIEW_ABILITY_ORDER);
    expect(chips).toHaveLength(6);
    expect(chips.find((c) => c.ability === 'strength')?.display).toBe('+2');
    expect(chips.find((c) => c.ability === 'vitality')?.display).toBe('0');
    expect(chips.find((c) => c.ability === 'agility')?.display).toBe('−1');
  });

  it('gates ability chips until selection or abilities step completion', () => {
    expect(
      shouldShowPreviewAbilityChips({ abilitiesMode: null, abilitiesStepCompleted: false }),
    ).toBe(false);
    expect(
      shouldShowPreviewAbilityChips({
        abilitiesMode: 'recommended',
        abilitiesStepCompleted: false,
      }),
    ).toBe(true);
    expect(
      shouldShowPreviewAbilityChips({ abilitiesMode: null, abilitiesStepCompleted: true }),
    ).toBe(true);
    expect(
      shouldShowPreviewAbilityChips({ abilitiesMode: 'custom', abilitiesStepCompleted: false }),
    ).toBe(true);
  });

  it('highlights only pow_abil and mart_abil archetype abilities', () => {
    const chips = buildPreviewAbilityChips(
      {
        strength: 2,
        vitality: 0,
        agility: -1,
        acuity: 1,
        intelligence: 0,
        charisma: 0,
      },
      { draftPowAbil: 'acuity', draftMartAbil: 'strength' },
    );

    expect(chips.find((c) => c.ability === 'acuity')).toMatchObject({
      highlight: 'power',
      chipVariant: 'power',
    });
    expect(chips.find((c) => c.ability === 'strength')).toMatchObject({
      highlight: 'martial',
      chipVariant: 'technique',
    });
    expect(chips.find((c) => c.ability === 'agility')).toMatchObject({
      highlight: null,
      chipVariant: 'descriptor',
    });
  });

  it('falls back to codex archetype abilities when draft values are unset', () => {
    const resolved = resolvePreviewArchetypeAbilities({
      draftPowAbil: null,
      draftMartAbil: null,
      archetypePowAbil: 'intelligence',
      archetypeMartAbil: 'agility',
    });
    expect(resolved).toEqual({ powAbil: 'intelligence', martAbil: 'agility' });
  });

  it('falls back to archetype_ability when pow/mart are absent on path', () => {
    const chips = buildPreviewAbilityChips(
      { strength: 2, vitality: 0, agility: 0, acuity: 0, intelligence: 0, charisma: 0 },
      {
        archetypePrimary: 'strength',
        archetypeType: 'martial',
      },
    );
    expect(chips.find((c) => c.ability === 'strength')).toMatchObject({
      highlight: 'martial',
      chipVariant: 'technique',
    });
  });
});
