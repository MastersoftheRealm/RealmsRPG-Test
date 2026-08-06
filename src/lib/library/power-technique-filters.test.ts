import { describe, expect, it } from 'vitest';
import {
  applyPowerTechniqueFilters,
  EMPTY_POWER_TECHNIQUE_FILTERS,
  normalizeActionTypeFilterKey,
  withInnateThresholdSelected,
  type PowerTechniqueFilterableRow,
} from './power-technique-filters';

const rows: PowerTechniqueFilterableRow[] = [
  {
    categories: ['Offense'],
    energy: 6,
    actionTypeRaw: 'basic',
    action: 'Basic Action',
    isReaction: false,
    partIds: ['1'],
    partNames: ['Fire'],
  },
  {
    categories: ['Defense', 'Utility'],
    energy: 10,
    actionTypeRaw: 'quick',
    action: 'Quick Action',
    isReaction: false,
    partIds: ['307'],
    partNames: ['Heal'],
  },
  {
    categories: ['Control'],
    energy: 4,
    actionTypeRaw: 'basic',
    action: 'Basic Reaction',
    isReaction: true,
    partIds: ['5'],
    partNames: ['Fog'],
  },
];

describe('power-technique-filters (TASK-673)', () => {
  it('normalizes action type keys from display strings', () => {
    expect(normalizeActionTypeFilterKey('Basic Action')).toBe('basic');
    expect(normalizeActionTypeFilterKey('Long (3 AP) Action')).toBe('long3');
    expect(normalizeActionTypeFilterKey('quick')).toBe('quick');
  });

  it('filters by category (OR)', () => {
    const result = applyPowerTechniqueFilters(
      rows,
      { ...EMPTY_POWER_TECHNIQUE_FILTERS, categories: ['Utility', 'Control'] },
      'power'
    );
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.categories?.[0])).toEqual(['Defense', 'Control']);
  });

  it('filters by energy range and reaction mode', () => {
    const result = applyPowerTechniqueFilters(
      rows,
      {
        ...EMPTY_POWER_TECHNIQUE_FILTERS,
        energyMax: 6,
        reactionMode: 'reaction',
      },
      'technique'
    );
    expect(result).toHaveLength(1);
    expect(result[0].isReaction).toBe(true);
  });

  it('innate eligible excludes heal parts and high energy vs threshold', () => {
    const result = applyPowerTechniqueFilters(
      rows,
      {
        ...EMPTY_POWER_TECHNIQUE_FILTERS,
        innateEligibleOnly: true,
        innateThreshold: 8,
      },
      'power'
    );
    expect(result).toHaveLength(2);
    expect(result.every((r) => (r.partNames ?? []).every((n) => n !== 'Heal'))).toBe(true);
    expect(result.every((r) => Number(r.energy) <= 8)).toBe(true);
  });

  it('selecting threshold auto-enables innate eligible', () => {
    const next = withInnateThresholdSelected(EMPTY_POWER_TECHNIQUE_FILTERS, '8');
    expect(next.innateThreshold).toBe(8);
    expect(next.innateEligibleOnly).toBe(true);
  });
});
