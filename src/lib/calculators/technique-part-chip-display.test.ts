import { describe, expect, it } from 'vitest';
import { PART_IDS } from '@/lib/id-constants';
import { snapshotParts } from './power-composition.fixture';
import { calculateTechniqueCosts, deriveTechniqueDisplay } from './technique-calc';

describe('deriveTechniqueDisplay part chips', () => {
  it('matches TP breakdown option levels for Additional Damage +1d6', () => {
    const additional = snapshotParts([PART_IDS.ADDITIONAL_DAMAGE])[0]!;
    const usedLevel = 1;
    const doc = {
      name: 'Strike',
      parts: [{ id: Number(additional.id), name: additional.name, op_1_lvl: usedLevel }],
    };
    const costs = calculateTechniqueCosts(doc.parts, [additional]);
    const display = deriveTechniqueDisplay(doc, [additional]);
    const chip = display.partChips.find((c) => c.text.startsWith('Additional Damage'));
    expect(chip).toBeDefined();
    expect(costs.tpSources.join(' ')).toContain('(Opt1 2)');
    expect(chip!.text).toContain('(Opt1 2)');
    expect(chip!.text).not.toContain('(Opt1 1)');
    expect(chip!.optionLevel).toBe(2);
  });
});
