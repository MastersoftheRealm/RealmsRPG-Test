import { describe, expect, it } from 'vitest';
import type { PowerPart } from '@/hooks/codex-types';
import { buildPowerVariantChips } from '@/lib/power-variant-chips';
import { calculatePowerCosts } from './power-calc';
import { resolvePowerComposition } from './power-composition';
import { snapshotParts } from './power-composition.fixture';
import { PART_IDS } from '@/lib/id-constants';

function part(p: Partial<PowerPart> & Pick<PowerPart, 'id' | 'name'>): PowerPart {
  return {
    description: p.name,
    category: 'General',
    mechanic: false,
    base_en: 0,
    base_tp: 0,
    percentage: false,
    duration: false,
    ...p,
  };
}

describe('final EN minimum 1 (86e3jrfyu)', () => {
  const spark = part({ id: '903', name: 'Spark', base_en: 4 });
  const limit = part({ id: '904', name: 'Limit', percentage: true, base_en: 0.1 });
  const partsDb: PowerPart[] = [
    ...snapshotParts([PART_IDS.SPHERE_OF_EFFECT]),
    spark,
    limit,
    part({ id: '900', name: 'Immobile', base_en: 4 }),
    part({ id: '901', name: 'Slow', base_en: 2, op_1_en: 1 }),
    part({ id: '902', name: 'Blinded', base_en: 4 }),
  ];

  it('plain power with positive flat reduced below 1 publishes 1 EN', () => {
    const costs = calculatePowerCosts(
      [
        { id: 903, name: 'Spark' },
        { id: 904, name: 'Limit' },
      ],
      partsDb,
    );
    expect(costs.energyRaw).toBeCloseTo(0.4);
    expect(costs.hasPositiveEnergy).toBe(true);
    expect(costs.totalEnergy).toBe(1);
  });

  it('Choice applies the floor on each option and the published total', () => {
    const res = resolvePowerComposition(
      {
        name: 'Pinned',
        actionType: 'basic',
        parts: [
          { id: 903, name: 'Spark' },
          { id: 904, name: 'Limit' },
        ],
        composition: {
          structure: 'choice',
          variants: [
            { id: 'a', label: 'A' },
            { id: 'b', label: 'B' },
          ],
        },
      },
      partsDb,
    )!;
    expect(res.shared?.rawEnergy).toBeCloseTo(0.4);
    expect(res.energy).toBe(1);
    for (const variant of res.variants) {
      expect(variant.energy).toBe(1);
    }
    for (const chip of buildPowerVariantChips(res)) {
      expect(chip.description).toMatch(/^1 Energy/);
    }
  });

  it('Choice still floors at 1 when Reverse zeros structure energy', () => {
    const res = resolvePowerComposition(
      {
        name: 'Choice reverse floor',
        actionType: 'basic',
        parts: [
          { id: 903, name: 'Spark' },
          { id: 904, name: 'Limit' },
        ],
        composition: {
          structure: 'choice',
          variants: [{ id: 'a', label: 'A' }],
          reverse: {
            parts: [
              { id: 902, name: 'Blinded' },
              { id: 900, name: 'Immobile' },
            ],
          },
        },
      },
      partsDb,
    )!;
    expect(res.structureEnergy).toBeCloseTo(0.4);
    expect(res.energy).toBe(1);
    expect(res.variants[0]!.energy).toBe(1);
  });
});
