import { describe, expect, it } from 'vitest';
import { selectPowerParts } from '@/lib/codex/part-type';
import {
  buildMechanicParts,
  calculatePowerCosts,
  derivePowerDisplay,
  formatEnergyStat,
} from '@/lib/calculators';
import { loadRepoCodexParts } from '@/lib/calculators/power-composition.fixture';
import { emptyPowerCreatorFormState } from './power-creator-bootstrap';
import { tabFormToSpec } from './power-creator-composition';

/** Same catalog path as signed-out Power Creator (`useCodexPowerParts` → `selectPowerParts`). */
function signedOutPowerPartsDb() {
  return selectPowerParts(loadRepoCodexParts());
}

describe('default Add Part energy floor (86e3jrfyu)', () => {
  it('signed-out catalog: Attack / Potency Increase alone publishes 1 EN in display and save', () => {
    const partsDb = signedOutPowerPartsDb();
    const nonMechanic = partsDb.filter((p) => !p.mechanic);
    const defaultPart = nonMechanic[0];
    expect(defaultPart?.name).toBe('Attack / Potency Increase');

    const form = emptyPowerCreatorFormState();
    form.selectedParts = [
      {
        part: defaultPart!,
        op_1_lvl: 0,
        op_2_lvl: 0,
        op_3_lvl: 0,
        applyDuration: false,
        selectedCategory: 'any',
      },
    ];

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

    const payload = [
      ...form.selectedParts.map((sp) => ({
        id: sp.part.id,
        name: sp.part.name,
        op_1_lvl: sp.op_1_lvl,
        op_2_lvl: sp.op_2_lvl,
        op_3_lvl: sp.op_3_lvl,
        applyDuration: sp.applyDuration,
      })),
      ...mechanicParts,
    ];

    const costs = calculatePowerCosts(payload, partsDb);
    expect(costs.totalTP).toBe(2);
    expect(costs.energyRaw).toBe(0);
    expect(costs.hasPositiveEnergy).toBe(true);
    expect(costs.totalEnergy).toBe(1);
    expect(formatEnergyStat(costs.totalEnergy)).toBe(1);

    const saved = {
      name: 'Test',
      actionType: form.actionType,
      ...tabFormToSpec(form),
    };
    const display = derivePowerDisplay(saved, partsDb);
    expect(display.energy).toBe(1);
    expect(display.tp).toBe(2);
  });
});
