import { describe, expect, it } from 'vitest';
import {
  evaluateInnatePowerEligibility,
  getLevel1InnateBudget,
  innateDurationToMinutes,
  isAdaptationCategoryPart,
  isHealingOrEnergyGainPart,
  isInnateEligibleActionType,
  isInnateEligibleDuration,
  isPowerInnateEligible,
  listInnateThresholdFilterOptions,
  validateRecommendedInnatePowers,
  type InnatePowerSnapshot,
} from './innate-eligibility';
import { defined } from '@/lib/utils';

function snap(partial: Partial<InnatePowerSnapshot> & { id: string }): InnatePowerSnapshot {
  return {
    energy: 0,
    partIds: [],
    partNames: [],
    partCategories: [],
    duration: { type: 'instant', value: 0 },
    actionType: 'basic',
    ...partial,
  };
}

describe('innate-eligibility', () => {
  it('getLevel1InnateBudget uses progression (Power 16 / PM 6), not ARCHETYPE_CONFIGS.innateEnergy threshold', () => {
    expect(getLevel1InnateBudget('power')).toEqual({
      innateThreshold: 8,
      innatePools: 2,
      innateEnergy: 16,
    });
    expect(getLevel1InnateBudget('powered-martial')).toEqual({
      innateThreshold: 6,
      innatePools: 1,
      innateEnergy: 6,
    });
    expect(getLevel1InnateBudget('martial').innateEnergy).toBe(0);
  });

  it('allows Basic Action and Basic Reaction only', () => {
    expect(isInnateEligibleActionType('basic')).toBe(true);
    expect(isInnateEligibleActionType('basic', true)).toBe(true);
    expect(isInnateEligibleActionType('Basic Action')).toBe(true);
    expect(isInnateEligibleActionType('Basic Reaction')).toBe(true);
    expect(isInnateEligibleActionType('reaction')).toBe(true);
    expect(isInnateEligibleActionType('quick')).toBe(false);
    expect(isInnateEligibleActionType('Quick Action')).toBe(false);
    expect(isInnateEligibleActionType('Free Reaction')).toBe(false);
  });

  it('flags healing and energy-gain parts', () => {
    expect(isHealingOrEnergyGainPart({ id: '307', name: 'Heal' })).toBe(true);
    expect(isHealingOrEnergyGainPart({ id: '250', name: 'Damage Siphon' })).toBe(true);
    expect(isHealingOrEnergyGainPart({ name: 'True Overheal' })).toBe(true);
    expect(isHealingOrEnergyGainPart({ name: 'Suppress Healing' })).toBe(false);
    expect(isHealingOrEnergyGainPart({ name: 'Fire Damage' })).toBe(false);
  });

  it('blocks over-threshold, wrong action, and healing parts', () => {
    const issues = evaluateInnatePowerEligibility(
      snap({
        id: 'p1',
        name: 'Big Blast',
        energy: 10,
        actionType: 'quick',
        partIds: ['307'],
        partNames: ['Heal'],
      }),
      8,
    );
    expect(issues.some((i) => i.message.includes('exceeds Innate Threshold'))).toBe(true);
    expect(issues.some((i) => i.message.includes('Basic or Basic Reaction'))).toBe(true);
    expect(issues.some((i) => i.message.includes('healing or energy-gain'))).toBe(true);
  });

  it('blocks recommended innate Energy sum over Innate Energy', () => {
    const issues = validateRecommendedInnatePowers(['a', 'b', 'c'], {
      archetypeType: 'powered-martial',
      resolvePower: (id) =>
        snap({
          id,
          name: id,
          energy: 3,
          actionType: 'basic',
        }),
    });
    expect(issues.some((i) => i.message.includes('exceeds Innate Energy'))).toBe(true);
  });

  it('allows a valid Power L1 innate set within budget', () => {
    const issues = validateRecommendedInnatePowers(['a', 'b'], {
      archetypeType: 'power',
      resolvePower: (id) =>
        snap({
          id,
          name: id,
          energy: 8,
          actionType: 'Basic Action',
        }),
    });
    expect(issues.filter((i) => i.severity === 'error')).toHaveLength(0);
  });

  it('lists distinct innate threshold filter options from progression', () => {
    const opts = listInnateThresholdFilterOptions();
    expect(opts).toContain(6);
    expect(opts).toContain(8);
    expect(opts).toContain(9);
    expect(opts).toContain(14);
    expect(opts).not.toContain(7); // PM first innate bump is 6→8, never 7
    expect(defined(opts[0])).toBeLessThan(defined(opts[opts.length - 1]));
  });

  it('isPowerInnateEligible enforces action, parts, duration, adaptation, and optional threshold', () => {
    expect(isPowerInnateEligible(snap({ id: '1', energy: 6, actionType: 'basic' }), 8)).toBe(true);
    expect(isPowerInnateEligible(snap({ id: '1', energy: 10, actionType: 'basic' }), 8)).toBe(
      false,
    );
    expect(
      isPowerInnateEligible(
        snap({
          id: '1',
          energy: 4,
          actionType: 'basic',
          partIds: ['307'],
          partNames: ['Heal'],
        }),
        8,
      ),
    ).toBe(false);
    expect(
      isPowerInnateEligible(
        snap({
          id: '1',
          energy: 4,
          actionType: 'basic',
          duration: { type: 'minutes', value: 10 },
        }),
        8,
      ),
    ).toBe(false);
    expect(
      isPowerInnateEligible(
        snap({
          id: '1',
          energy: 4,
          actionType: 'basic',
          partIds: ['99'],
          partNames: ['Shapeshift'],
          partCategories: ['Adaptation'],
        }),
        8,
      ),
    ).toBe(false);
    expect(
      isPowerInnateEligible(
        snap({
          id: '1',
          energy: 4,
          actionType: 'basic',
          duration: { type: 'rounds', value: 10 },
        }),
        8,
      ),
    ).toBe(true);
    expect(
      isPowerInnateEligible(snap({ id: '1', energy: 4, actionType: 'basic', duration: null }), 8),
    ).toBe(false);
  });

  it('duration helpers respect 1-minute cap and round conversion', () => {
    expect(innateDurationToMinutes({ type: 'rounds', value: 10 })).toBe(1);
    expect(innateDurationToMinutes({ type: 'rounds', value: 11 })).toBeCloseTo(1.1);
    expect(isInnateEligibleDuration({ type: 'minutes', value: 1 })).toBe(true);
    expect(isInnateEligibleDuration({ type: 'minutes', value: 2 })).toBe(false);
    expect(isInnateEligibleDuration({ type: 'hours', value: 1 })).toBe(false);
    expect(isAdaptationCategoryPart('Adaptation')).toBe(true);
    expect(isAdaptationCategoryPart('Offense')).toBe(false);
  });

  it('blocks Adaptation when category is only on saved payload', () => {
    expect(
      isPowerInnateEligible(
        snap({
          id: '1',
          energy: 4,
          actionType: 'basic',
          partIds: ['custom'],
          partNames: ['Custom Shift'],
          partCategories: ['Adaptation'],
        }),
        8,
      ),
    ).toBe(false);
  });
});
