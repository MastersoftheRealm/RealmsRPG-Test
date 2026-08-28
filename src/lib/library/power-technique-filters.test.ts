import { describe, expect, it } from 'vitest';
import {
  applyPowerTechniqueFilters,
  EMPTY_POWER_TECHNIQUE_FILTERS,
  normalizeActionTypeFilterKey,
  withCharacterContextApplied,
  withInnateThresholdSelected,
  type PowerTechniqueFilterableRow,
} from './power-technique-filters';
import { defined } from '@/lib/utils';
import type { PowerTechniqueCharacterContext } from './power-technique-character-context';

const rows: (PowerTechniqueFilterableRow & { tp?: number | undefined })[] = [
  {
    categories: ['Offense'],
    energy: 6,
    tp: 2,
    actionTypeRaw: 'basic',
    action: 'Basic Action',
    isReaction: false,
    partIds: ['1'],
    partNames: ['Fire'],
    partCategories: ['Damage'],
    durationType: 'instant',
    durationValue: 0,
  },
  {
    categories: ['Defense', 'Utility'],
    energy: 10,
    tp: 5,
    actionTypeRaw: 'quick',
    action: 'Quick Action',
    isReaction: false,
    partIds: ['307'],
    partNames: ['Heal'],
    partCategories: ['Healing'],
    durationType: 'instant',
    durationValue: 0,
  },
  {
    categories: ['Control'],
    energy: 4,
    tp: 4,
    actionTypeRaw: 'basic',
    action: 'Basic Reaction',
    isReaction: true,
    partIds: ['5'],
    partNames: ['Fog'],
    partCategories: ['Control'],
    durationType: 'instant',
    durationValue: 0,
  },
  {
    categories: ['Utility'],
    energy: 5,
    tp: 3,
    actionTypeRaw: 'basic',
    action: 'Basic Action',
    isReaction: false,
    partIds: ['10'],
    partNames: ['Long Veil'],
    partCategories: ['Control'],
    durationType: 'minutes',
    durationValue: 10,
  },
];

const characterCtx: PowerTechniqueCharacterContext = {
  maxEnergy: 8,
  innateThreshold: 6,
  tpTotal: 25,
  tpSpent: 22,
  tpRemaining: 3,
};

describe('power-technique-filters (TASK-673 / TASK-676)', () => {
  it('normalizes action type keys from display strings', () => {
    expect(normalizeActionTypeFilterKey('Basic Action')).toBe('basic');
    expect(normalizeActionTypeFilterKey('Long (3 AP) Action')).toBe('long3');
    expect(normalizeActionTypeFilterKey('quick')).toBe('quick');
  });

  it('filters by category (OR)', () => {
    const result = applyPowerTechniqueFilters(
      rows,
      { ...EMPTY_POWER_TECHNIQUE_FILTERS, categories: ['Utility', 'Control'] },
      'power',
    );
    expect(result).toHaveLength(3);
    expect(result.map((r) => r.categories?.[0])).toEqual(['Defense', 'Control', 'Utility']);
  });

  it('filters by max energy and reaction mode', () => {
    const result = applyPowerTechniqueFilters(
      rows,
      {
        ...EMPTY_POWER_TECHNIQUE_FILTERS,
        energyMax: 6,
        reactionMode: 'reaction',
      },
      'technique',
    );
    expect(result).toHaveLength(1);
    expect(defined(result[0]).isReaction).toBe(true);
  });

  it('innate eligible excludes heal parts, long duration, and high energy vs threshold', () => {
    const result = applyPowerTechniqueFilters(
      rows,
      {
        ...EMPTY_POWER_TECHNIQUE_FILTERS,
        innateEligibleOnly: true,
        innateThreshold: 8,
      },
      'power',
    );
    expect(result).toHaveLength(2);
    expect(result.every((r) => (r.partNames ?? []).every((n) => n !== 'Heal'))).toBe(true);
    expect(result.every((r) => Number(r.energy) <= 8)).toBe(true);
    expect(result.every((r) => r.durationValue == null || r.durationValue <= 1)).toBe(true);
  });

  it('selecting threshold auto-enables innate eligible', () => {
    const next = withInnateThresholdSelected(EMPTY_POWER_TECHNIQUE_FILTERS, '8');
    expect(next.innateThreshold).toBe(8);
    expect(next.innateEligibleOnly).toBe(true);
  });

  it('character caps energy and innate threshold when eligible', () => {
    const result = applyPowerTechniqueFilters(
      rows,
      {
        ...EMPTY_POWER_TECHNIQUE_FILTERS,
        innateEligibleOnly: true,
        innateThreshold: 14,
      },
      'power',
      characterCtx,
    );
    expect(result.every((r) => Number(r.energy) <= 8)).toBe(true);
    expect(result.every((r) => Number(r.energy) <= 6)).toBe(true);
    expect(result.every((r) => (r.partNames ?? []).every((n) => n !== 'Heal'))).toBe(true);
  });

  it('filters by max TP and affordable remaining TP', () => {
    const byMax = applyPowerTechniqueFilters(
      rows,
      { ...EMPTY_POWER_TECHNIQUE_FILTERS, tpMax: 3 },
      'technique',
    );
    expect(byMax).toHaveLength(2);
    expect(defined(byMax[0]).tp).toBe(2);

    const affordable = applyPowerTechniqueFilters(
      rows,
      { ...EMPTY_POWER_TECHNIQUE_FILTERS, affordableTpOnly: true },
      'technique',
      characterCtx,
    );
    expect(affordable.every((r) => (r.tp ?? 0) <= 3)).toBe(true);
    expect(affordable).toHaveLength(2);
  });

  it('withCharacterContextApplied sets energy max from character', () => {
    const next = withCharacterContextApplied(EMPTY_POWER_TECHNIQUE_FILTERS, characterCtx);
    expect(next.energyMax).toBe(8);
    expect(next.affordableTpOnly).toBe(false);
  });
});
