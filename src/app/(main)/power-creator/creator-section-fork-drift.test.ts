// @vitest-environment happy-dom
import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { PowerPart, TechniquePart } from '@/hooks/codex-types';
import { PART_IDS } from '@/lib/id-constants';
import {
  analyzePowerEnergy,
  calculatePowerCosts,
  calculateTechniqueCosts,
  type DurationConfig,
} from '@/lib/calculators';
import { useEmpoweredTechniqueCostDerivation } from '@/app/(main)/empowered-technique-creator/empowered-technique-cost-derivation';
import { usePowerCreatorCostDerivation } from './power-creator-cost-derivation';

function powerPart(partial: Partial<PowerPart> & Pick<PowerPart, 'id' | 'name'>): PowerPart {
  return {
    description: partial.name,
    category: 'Test',
    mechanic: true,
    base_en: 0,
    base_tp: 0,
    percentage: false,
    duration: false,
    ...partial,
  };
}

function techniquePart(
  partial: Partial<TechniquePart> & Pick<TechniquePart, 'id' | 'name'>,
): TechniquePart {
  return {
    description: partial.name,
    category: 'Test',
    base_tp: 0,
    mechanic: true,
    ...partial,
  };
}

const magicDamage = powerPart({
  id: String(PART_IDS.MAGIC_DAMAGE),
  name: 'Magic Damage',
  category: 'Damage',
  base_en: 4,
  base_tp: 1,
});

const sphere = powerPart({
  id: String(PART_IDS.SPHERE_OF_EFFECT),
  name: 'Sphere of Effect',
  category: 'Area of Effect',
  base_en: 4,
  base_tp: 1,
});

const durationMinute = powerPart({
  id: String(PART_IDS.DURATION_MINUTE),
  name: 'Duration (Minute)',
  category: 'Duration',
  base_en: 2,
  duration: true,
});

const powerQuick = powerPart({
  id: String(PART_IDS.POWER_QUICK_OR_FREE_ACTION),
  name: 'Power Quick or Free Action',
  category: 'Action',
  base_en: 1.5,
  percentage: true,
});

const additionalDamage = techniquePart({
  id: String(PART_IDS.ADDITIONAL_DAMAGE),
  name: 'Additional Damage',
  category: 'Damage',
  base_en: 4,
});

const minuteDuration: DurationConfig = {
  type: 'minutes',
  value: 1,
  applyDuration: false,
  focus: false,
  noHarm: false,
  endsOnActivation: false,
  sustain: 0,
};

const powerDb = [magicDamage, sphere, durationMinute, powerQuick];

describe('creator section forks — duration on damage and area', () => {
  it('charges the same duration-adjusted damage and area energy in both creators', () => {
    const damages = [{ amount: 1, size: 4, type: 'magic', applyDuration: true }];
    const area = { type: 'sphere' as const, level: 1, applyDuration: true };

    const power = renderHook(() =>
      usePowerCreatorCostDerivation({
        actionType: 'basic',
        isReaction: false,
        damages,
        range: { steps: 0 },
        area,
        duration: minuteDuration,
        attackMode: 'unarmed',
        selectedParts: [],
        selectedAdvancedParts: [],
        powerParts: powerDb,
      }),
    );
    const empowered = renderHook(() =>
      useEmpoweredTechniqueCostDerivation({
        actionType: 'basic',
        isReaction: false,
        powerDamages: damages,
        techniqueDamage: { amount: 0, size: 6 },
        range: { steps: 0 },
        area,
        duration: minuteDuration,
        attackMode: 'unarmed',
        selectedPowerParts: [],
        selectedPowerAdvancedParts: [],
        selectedTechniqueParts: [],
        powerParts: powerDb,
        techniqueParts: [],
      }),
    );

    const damageWithoutDuration = calculatePowerCosts(
      [
        {
          id: magicDamage.id,
          name: magicDamage.name,
          op_1_lvl: 0,
          op_2_lvl: 0,
          op_3_lvl: 0,
          applyDuration: true,
        },
      ],
      powerDb,
    );

    expect(power.result.current.sectionCosts.damage.energyRaw).toBeGreaterThan(
      damageWithoutDuration.energyRaw,
    );
    expect({
      damage: empowered.result.current.sectionCosts.powerDamage.energyRaw,
      area: empowered.result.current.sectionCosts.area.energyRaw,
    }).toEqual({
      damage: power.result.current.sectionCosts.damage.energyRaw,
      area: power.result.current.sectionCosts.area.energyRaw,
    });
  });
});

describe('creator section forks — action type on both halves', () => {
  it('scales the technique half by the same Quick Action multiplier as the power half', () => {
    const damages = [{ amount: 1, size: 4, type: 'magic', applyDuration: false }];
    const empowered = renderHook(() =>
      useEmpoweredTechniqueCostDerivation({
        actionType: 'quick',
        isReaction: false,
        powerDamages: damages,
        techniqueDamage: { amount: 1, size: 4 },
        range: { steps: 0 },
        area: { type: 'none', level: 1, applyDuration: false },
        duration: {
          type: 'instant',
          value: 1,
          applyDuration: false,
          focus: false,
          noHarm: false,
          endsOnActivation: false,
          sustain: 0,
        },
        attackMode: 'unarmed',
        selectedPowerParts: [],
        selectedPowerAdvancedParts: [],
        selectedTechniqueParts: [],
        powerParts: powerDb,
        techniqueParts: [additionalDamage],
      }),
    );

    const derived = empowered.result.current;
    const powerFlat = calculatePowerCosts(
      derived.powerPayload.filter((row) => row.name !== powerQuick.name),
      powerDb,
    ).energyRaw;
    const techniqueFlat = calculateTechniqueCosts(
      [
        {
          id: Number(additionalDamage.id),
          name: additionalDamage.name,
          op_1_lvl: 0,
          op_2_lvl: 0,
          op_3_lvl: 0,
        },
      ],
      [additionalDamage],
    ).energyRaw;
    const actionMultiplier = analyzePowerEnergy(derived.powerPayload, powerDb).percAll;

    expect(actionMultiplier).toBeGreaterThan(1);
    expect({
      techniqueHalf: derived.costs.techniqueEnergyRaw,
      total: derived.costs.energyRaw,
    }).toEqual({
      techniqueHalf: techniqueFlat * actionMultiplier,
      total: (powerFlat + techniqueFlat) * actionMultiplier,
    });
  });
});
