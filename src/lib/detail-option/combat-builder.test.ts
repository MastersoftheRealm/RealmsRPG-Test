import { describe, expect, it } from 'vitest';
import type { PowerPart, TechniquePart } from '@/hooks/codex-types';
import { rankedGlrFactChips } from '@/lib/chip/list-row-metadata';
import {
  buildCombatLookup,
  powerToDetailOption,
  resolveCombatDetailOption,
  techniqueToDetailOption,
} from '@/lib/detail-option/combat-builder';
import { resolveSurfaceLayout } from '@/lib/glr';
import { assertRowFactCoverage } from '@/lib/glr/validate-glr-facts';
import type { LibraryPower, LibraryTechnique } from '@/types/library';

const powerPartsDb = [
  {
    id: 1,
    name: 'Spark',
    category: 'Offense',
    mechanic: false,
    base_tp: 2,
    base_en: 1,
    description: '',
  },
] as unknown as PowerPart[];

const techniquePartsDb = [
  {
    id: 10,
    name: 'Strike',
    category: 'Offense',
    mechanic: false,
    base_tp: 3,
    base_en: 2,
    description: '',
  },
] as unknown as TechniquePart[];

const boltPower: LibraryPower = {
  id: 'p1',
  docId: 'p1',
  name: 'Bolt',
  description: 'A bolt.',
  actionType: 'Action',
  range: { steps: 5 },
  area: { type: 'sphere', level: 1 },
  duration: { type: 'minutes', value: 1 },
  parts: [{ id: 1, name: 'Spark', op_1_lvl: 0 }],
  damage: [{ amount: 1, size: 8, type: 'fire' }],
};

const slashTechnique: LibraryTechnique = {
  id: 't1',
  docId: 't1',
  name: 'Slash',
  description: 'A slash.',
  actionType: 'Action',
  attackMode: 'weapon',
  parts: [{ id: 10, name: 'Strike', op_1_lvl: 0 }],
  damage: [{ amount: 1, size: 8 }],
};

function chipNames(chips: Array<{ name: string }> | undefined): string[] {
  return (chips ?? []).map((chip) => chip.name);
}

describe('combat-builder path More details chips (TASK-818)', () => {
  it('power chips follow detail-option-power chipFacts, not a parallel pushFact table', () => {
    const option = powerToDetailOption(boltPower, powerPartsDb);
    const labels = chipNames(option.chips);
    const layout = resolveSurfaceLayout('detail-option-power');
    expect(layout.chipFacts).toEqual([
      'category',
      'energy',
      'actionType',
      'duration',
      'range',
      'area',
      'damage',
      'trainingPoints',
    ]);
    expect(labels).toEqual(
      rankedGlrFactChips(layout.chipFacts, {
        category: 'Offense, Damage',
        energy: 1,
        actionType: 'Basic Action',
        duration: '1 Minute',
        range: '15 spaces',
        area: 'Sphere',
        damage: '1d8 fire',
        trainingPoints: 2,
      }).map((chip) => chip.name),
    );
    assertRowFactCoverage('detail-option-power', { columnKeys: [], chipLabels: labels });
    expect(labels.some((label) => /^category\b/i.test(label))).toBe(true);
    expect(labels.some((label) => /^energy\s+\d+/i.test(label))).toBe(true);
    expect(labels.some((label) => /^range\b/i.test(label))).toBe(true);
    expect(labels.some((label) => /\d+d\d+.*damage/i.test(label))).toBe(true);
    expect(labels.some((label) => /training points\s+\d+/i.test(label))).toBe(true);
  });

  it('omits unvalued power damage while keeping other catalog chips', () => {
    const option = powerToDetailOption({ ...boltPower, damage: undefined }, powerPartsDb);
    const labels = chipNames(option.chips);
    expect(labels.some((label) => /\bdamage$/i.test(label))).toBe(false);
    expect(labels.some((label) => /^energy\s+\d+/i.test(label))).toBe(true);
  });

  it('technique chips follow detail-option-technique chipFacts', () => {
    const option = techniqueToDetailOption(slashTechnique, techniquePartsDb);
    const labels = chipNames(option.chips);
    const layout = resolveSurfaceLayout('detail-option-technique');
    expect(layout.chipFacts).toEqual([
      'category',
      'energy',
      'trainingPoints',
      'actionType',
      'weapon',
      'damage',
    ]);
    expect(labels).toEqual(
      rankedGlrFactChips(layout.chipFacts, {
        category: 'Offense',
        energy: 2,
        trainingPoints: 3,
        actionType: 'Basic Action',
        weapon: 'Weapon',
        damage: '+1d8',
      }).map((chip) => chip.name),
    );
    assertRowFactCoverage('detail-option-technique', { columnKeys: [], chipLabels: labels });
    expect(labels.some((label) => /^attack\b/i.test(label))).toBe(true);
    expect(labels.some((label) => /\d+d\d+.*damage/i.test(label))).toBe(true);
  });

  it('resolveCombatDetailOption omits unresolved refs', () => {
    const lookup = buildCombatLookup([boltPower, slashTechnique]);
    expect(
      resolveCombatDetailOption('p1', lookup, 'power', powerPartsDb, techniquePartsDb)?.name,
    ).toBe('Bolt');
    expect(
      resolveCombatDetailOption('Slash', lookup, 'technique', powerPartsDb, techniquePartsDb)?.name,
    ).toBe('Slash');
    expect(
      resolveCombatDetailOption('missing', lookup, 'power', powerPartsDb, techniquePartsDb),
    ).toBeNull();
  });
});
