import { describe, expect, it } from 'vitest';
import { buildCreatureOverBudgetNotification } from './creature-over-budget-notification';
import type { CreatureCreatorDerivedStats } from './creature-creator-derived-stats';

function baseStats(overrides: Partial<CreatureCreatorDerivedStats>): CreatureCreatorDerivedStats {
  return {
    trainingPoints: 0,
    currency: 0,
    hePool: 0,
    proficiency: 0,
    abilityPoints: 0,
    skillPoints: 0,
    featPoints: 0,
    featSpent: 0,
    featRemaining: 0,
    trainingSpent: 0,
    trainingRemaining: 0,
    currencySpent: 0,
    currencyRemaining: 0,
    maxHealth: 0,
    minEnergy: 0,
    maxEnergy: 0,
    speed: 0,
    evasion: 0,
    damageReduction: 0,
    abilitySpent: 0,
    abilityRemaining: 0,
    heRemaining: 0,
    skillRemaining: 0,
    maxProficiencyPoints: 0,
    proficiencySpent: 0,
    proficiencyRemaining: 0,
    resistanceFeatCost: 0,
    immunityFeatCost: 0,
    weaknessFeatCost: 0,
    conditionImmunityFeatCost: 0,
    ...overrides,
  };
}

describe('buildCreatureOverBudgetNotification', () => {
  it('names overspent pools like the character sheet', () => {
    const note = buildCreatureOverBudgetNotification(
      baseStats({ abilityRemaining: -2, featRemaining: -1 }),
    );
    expect(note.show).toBe(true);
    expect(note.title).toContain('Over budget:');
    expect(note.title).toContain('2 ability points');
    expect(note.title).toContain('1 feat point');
  });

  it('is hidden when all pools are non-negative', () => {
    expect(buildCreatureOverBudgetNotification(baseStats({})).show).toBe(false);
  });

  it('keeps currency uninflected when more than one is overspent', () => {
    const note = buildCreatureOverBudgetNotification(baseStats({ currencyRemaining: -2 }));
    expect(note.title).toBe('Over budget: 2 currency');
  });
});
