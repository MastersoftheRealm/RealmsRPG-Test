import { describe, expect, it } from 'vitest';
import type { PowerPart, TechniquePart } from '@/hooks/codex-types';
import { PART_IDS } from '@/lib/id-constants';
import { analyzePowerEnergy, calculatePowerCosts } from './power-calc';
import { calculateEmpoweredTechniqueCosts } from './empowered-technique-calc';
import { buildEmpoweredAdvancedCalculationGroups } from './empowered-energy-breakdown';
import { calculateTechniqueCosts } from './technique-calc';
import { analyzeTechniqueEnergy } from './technique-energy-breakdown';

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
    mechanic: true,
    base_en: 0,
    base_tp: 0,
    percentage: false,
    ...partial,
  };
}

const magicDamage = powerPart({
  id: String(PART_IDS.MAGIC_DAMAGE),
  name: 'Magic Damage',
  category: 'Damage',
  base_en: 4,
});

const additionalDamage = techniquePart({
  id: String(PART_IDS.ADDITIONAL_DAMAGE),
  name: 'Additional Damage',
  category: 'Damage',
  base_en: 1,
});

const techniquePercent = techniquePart({
  id: '9991',
  name: 'Test Technique Percent',
  category: 'General',
  mechanic: false,
  percentage: true,
  base_en: 1.5,
});

describe('buildEmpoweredAdvancedCalculationGroups', () => {
  it('calls out technique % on the power side and uses Rounded Up', () => {
    const powerPayload = [{ id: magicDamage.id, name: magicDamage.name }];
    const techniquePayload = [
      {
        id: Number(additionalDamage.id),
        name: additionalDamage.name,
        calcSection: 'damage' as const,
      },
      {
        id: Number(techniquePercent.id),
        name: techniquePercent.name,
        calcSection: 'parts' as const,
      },
    ];
    const powerDb = [magicDamage];
    const techniqueDb = [additionalDamage, techniquePercent];

    const costs = calculateEmpoweredTechniqueCosts({
      powerPartsPayload: powerPayload,
      techniquePartsPayload: techniquePayload,
      powerPartsDb: powerDb,
      techniquePartsDb: techniqueDb,
    });

    const groups = buildEmpoweredAdvancedCalculationGroups({
      powerAnalysis: analyzePowerEnergy(powerPayload, powerDb),
      techniqueAnalysis: analyzeTechniqueEnergy(techniquePayload, techniqueDb),
      techniquePercentageMultiplier: costs.techniquePercentageMultiplier,
      energyRaw: costs.energyRaw,
      totalEnergy: costs.totalEnergy,
    });

    const text = JSON.stringify(groups);
    expect(text).not.toMatch(/ceil|floor|toFixed/i);
    expect(text).toContain('Power · Damage');
    expect(text).toContain('Technique · Damage');
    expect(text).toContain('Technique % multiplier');
    expect(text).toContain('+50%');
    expect(text).toContain('Rounded Up');

    const combined = groups.find((g) => g.title === 'Combined Energy');
    expect(
      combined?.rows.some(
        (r) => r.label === 'Energy Cost' && r.value === String(costs.totalEnergy),
      ),
    ).toBe(true);
    expect(calculatePowerCosts(powerPayload, powerDb).energyRaw).toBe(4);
    expect(calculateTechniqueCosts(techniquePayload, techniqueDb).energyRaw).toBe(1.5);
  });
});
