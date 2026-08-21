import { describe, expect, it } from 'vitest';
import type { PowerPart, TechniquePart } from '@/hooks/codex-types';
import { calculateEmpoweredTechniqueCosts } from './empowered-technique-calc';
import { calculateTechniqueCosts } from './technique-calc';
import { calculatePowerCosts } from './power-calc';

const powerPart: PowerPart = {
  id: '1',
  name: 'Spark',
  description: 'Spark',
  category: 'Damage',
  mechanic: false,
  base_en: 4,
  base_tp: 1,
  percentage: false,
  duration: false,
};

const flatTechnique: TechniquePart = {
  id: '2',
  name: 'Strike',
  description: 'Strike',
  category: 'Attack',
  base_en: 3,
  base_tp: 1,
  percentage: false,
};

const percentTechnique: TechniquePart = {
  id: '3',
  name: 'Focus',
  description: 'Focus',
  category: 'Modifier',
  base_en: 2,
  base_tp: 0,
  percentage: true,
};

describe('calculateEmpoweredTechniqueCosts (T8 / N2)', () => {
  it('applies a duplicated percentage part once, matching technique EN', () => {
    const powerPartsPayload = [{ id: 1, name: powerPart.name }];
    const uniqueTechnique = [
      { id: 2, name: flatTechnique.name },
      { id: 3, name: percentTechnique.name },
    ];
    const duplicatedTechnique = [...uniqueTechnique, { id: 3, name: percentTechnique.name }];

    const unique = calculateEmpoweredTechniqueCosts({
      powerPartsPayload,
      techniquePartsPayload: uniqueTechnique,
      powerPartsDb: [powerPart],
      techniquePartsDb: [flatTechnique, percentTechnique],
    });
    const duplicated = calculateEmpoweredTechniqueCosts({
      powerPartsPayload,
      techniquePartsPayload: duplicatedTechnique,
      powerPartsDb: [powerPart],
      techniquePartsDb: [flatTechnique, percentTechnique],
    });

    const powerRaw = calculatePowerCosts(powerPartsPayload, [powerPart]).energyRaw;
    const techniqueRaw = calculateTechniqueCosts(uniqueTechnique, [
      flatTechnique,
      percentTechnique,
    ]).energyRaw;

    expect(unique.techniquePercentageMultiplier).toBe(2);
    expect(duplicated.techniquePercentageMultiplier).toBe(2);
    expect(duplicated.totalEnergy).toBe(unique.totalEnergy);
    expect(duplicated.energyRaw).toBe(powerRaw * 2 + techniqueRaw);
  });
});
