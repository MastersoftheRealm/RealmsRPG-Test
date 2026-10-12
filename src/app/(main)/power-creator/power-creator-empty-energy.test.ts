import { describe, expect, it } from 'vitest';
import {
  buildMechanicParts,
  calculatePowerCosts,
  formatEnergyStat,
} from '@/lib/calculators';
import { loadRepoCodexParts } from '@/lib/calculators/power-composition.fixture';
import { emptyPowerCreatorFormState } from './power-creator-bootstrap';

function emptyCreatorPayload(partsDb: ReturnType<typeof loadRepoCodexParts>) {
  const form = emptyPowerCreatorFormState();
  const mechanicParts = buildMechanicParts({
    creatorType: 'power',
    partsDb,
    action: { type: form.actionType, isReaction: form.isReaction },
    powerDamage: form.damages.map((d) => ({
      type: d.type,
      diceAmount: d.amount,
      dieSize: d.size,
      applyDuration: d.applyDuration ?? false,
    })),
    range: { steps: form.range.steps },
  });
  return mechanicParts.map((mp) => ({
    id: mp.id,
    name: mp.name,
    op_1_lvl: mp.op_1_lvl,
    op_2_lvl: mp.op_2_lvl,
    op_3_lvl: mp.op_3_lvl,
    applyDuration: mp.applyDuration,
  }));
}

describe('empty power creator energy display (86e3k01ja)', () => {
  it('publishes dash energy for reset form with only default mechanics', () => {
    const partsDb = loadRepoCodexParts();
    const costs = calculatePowerCosts(emptyCreatorPayload(partsDb), partsDb);
    expect(costs.totalEnergy).toBe(0);
    expect(formatEnergyStat(costs.totalEnergy)).toBe('—');
  });
});
