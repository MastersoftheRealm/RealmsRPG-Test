/**
 * Innate L2 catalog threshold filter + shared TP spend (DEV-V-013-T057 / TASK-590).
 */

import { describe, expect, it } from 'vitest';
import type { PowerPart } from '@/hooks/codex-types';
import type { LibraryPower } from '@/types/library';
import { combineGuidedTpBudgets } from '@/lib/guided-creator/loadout-tp';
import { TRAINING_POINTS_COST_LABEL } from '@/lib/detail-option/compact-facts';
import {
  buildPowersTechniquesL2Items,
  computeL2PowersTechniquesTpSpent,
} from './powers-techniques-l2';

function powerPart(
  partial: Pick<PowerPart, 'id' | 'name' | 'base_en' | 'base_tp'> & Partial<PowerPart>
): PowerPart {
  return {
    description: '',
    category: 'Damage',
    ...partial,
  } as PowerPart;
}

function power(
  partial: Pick<LibraryPower, 'id' | 'name'> & {
    partId: string;
    partName: string;
  }
): LibraryPower {
  return {
    id: partial.id,
    docId: partial.id,
    name: partial.name,
    description: '',
    parts: [{ id: Number(partial.partId) || partial.partId, name: partial.partName, op_1_lvl: 0 }],
  } as LibraryPower;
}

const partsDb: PowerPart[] = [
  powerPart({ id: '1', name: 'Spark', base_en: 4, base_tp: 2 }),
  powerPart({ id: '2', name: 'Bolt', base_en: 8, base_tp: 3 }),
  powerPart({ id: '3', name: 'Nova', base_en: 12, base_tp: 5 }),
];

const catalog: LibraryPower[] = [
  power({ id: 'spark', name: 'Spark', partId: '1', partName: 'Spark' }),
  power({ id: 'bolt', name: 'Bolt', partId: '2', partName: 'Bolt' }),
  power({ id: 'nova', name: 'Nova', partId: '3', partName: 'Nova' }),
];

const energyInput = {
  archetypeAbility: 'intelligence' as const,
  abilities: { intelligence: 2 },
  level: 1,
};

describe('buildPowersTechniquesL2Items innate threshold', () => {
  it('includes powers with Energy ≤ Innate Threshold and excludes above', () => {
    const rows = buildPowersTechniquesL2Items({
      kind: 'powers',
      mode: 'innate',
      items: catalog,
      powerPartsDb: partsDb,
      techniquePartsDb: [],
      pathRecommendedIds: [],
      energyInput,
      innateThreshold: 8,
    });

    const ids = rows.map((r) => r.id).sort();
    expect(ids).toEqual(['bolt', 'spark']);
    expect(rows.find((r) => r.id === 'nova')).toBeUndefined();
  });

  it('includes Energy exactly equal to threshold', () => {
    const rows = buildPowersTechniquesL2Items({
      kind: 'powers',
      mode: 'innate',
      items: [catalog[1]!],
      powerPartsDb: partsDb,
      techniquePartsDb: [],
      pathRecommendedIds: [],
      energyInput,
      innateThreshold: 8,
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]?.data).toMatchObject({ energy: 8 });
  });

  it('sets shared Training Points cost on innate rows (same as regular)', () => {
    const innate = buildPowersTechniquesL2Items({
      kind: 'powers',
      mode: 'innate',
      items: [catalog[0]!],
      powerPartsDb: partsDb,
      techniquePartsDb: [],
      pathRecommendedIds: [],
      energyInput,
      innateThreshold: 8,
    });
    const regular = buildPowersTechniquesL2Items({
      kind: 'powers',
      mode: 'regular',
      items: [catalog[0]!],
      powerPartsDb: partsDb,
      techniquePartsDb: [],
      pathRecommendedIds: [],
      energyInput,
    });

    expect(innate).toHaveLength(1);
    expect(regular).toHaveLength(1);
    expect(innate[0]?.totalCost).toBe(2);
    expect(innate[0]?.costLabel).toBe(TRAINING_POINTS_COST_LABEL);
    expect(innate[0]?.totalCost).toBe(regular[0]?.totalCost);
    expect(innate[0]?.data).toMatchObject({ tpCost: 2, energy: 4 });
  });

  it('uses Official Library columns and part sections, not budget chips (TASK-709)', () => {
    const rows = buildPowersTechniquesL2Items({
      kind: 'powers',
      mode: 'regular',
      items: [catalog[0]!],
      powerPartsDb: partsDb,
      techniquePartsDb: [],
      pathRecommendedIds: [],
      energyInput,
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]?.columns?.map((c) => c.key)).toEqual([
      'category',
      'energy',
      'action',
      'duration',
      'range',
      'area',
      'damage',
    ]);
    expect(rows[0]?.chips).toBeUndefined();
    expect(rows[0]?.detailSections?.[0]?.label).toMatch(/Parts/i);
    expect(rows[0]?.totalCost).toBe(2);
  });
});

describe('computeL2PowersTechniquesTpSpent + combineGuidedTpBudgets', () => {
  it('counts innate builder rows against the shared loadout budget', () => {
    const innateRows = buildPowersTechniquesL2Items({
      kind: 'powers',
      mode: 'innate',
      items: catalog,
      powerPartsDb: partsDb,
      techniquePartsDb: [],
      pathRecommendedIds: [],
      energyInput,
      innateThreshold: 8,
    });
    // spark (2 TP) + bolt (3 TP); nova excluded by threshold
    expect(innateRows).toHaveLength(2);

    const loadoutSpent = 10;
    const totalSpent = computeL2PowersTechniquesTpSpent(innateRows, loadoutSpent);
    expect(totalSpent).toBe(15);

    const combatOnly = totalSpent - loadoutSpent;
    const combined = combineGuidedTpBudgets(
      { spent: loadoutSpent, limit: 30, remaining: 20 },
      combatOnly
    );
    expect(combined).toEqual({ spent: 15, limit: 30, remaining: 15 });
  });
});
