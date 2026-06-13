import type { PowerPart, TechniquePart } from '@/hooks/codex-types';
import { calculatePowerCosts, type PowerPartPayload } from './power-calc';
import { calculateTechniqueCosts, type TechniquePartPayload } from './technique-calc';
import { findByIdOrName } from '@/lib/id-constants';

export interface EmpoweredTechniqueCostResult {
  totalEnergy: number;
  totalTP: number;
  tpSources: string[];
  energyRaw: number;
  powerEnergyRaw: number;
  techniqueEnergyRaw: number;
  techniquePercentageMultiplier: number;
}

function getTechniquePartEnergyContribution(
  part: TechniquePart,
  payload: TechniquePartPayload
): number {
  return (
    (part.base_en || 0) +
    (part.op_1_en || 0) * (payload.op_1_lvl || 0) +
    (part.op_2_en || 0) * (payload.op_2_lvl || 0) +
    (part.op_3_en || 0) * (payload.op_3_lvl || 0)
  );
}

export function getTechniquePercentageMultiplier(
  techniquePartsPayload: TechniquePartPayload[],
  techniquePartsDb: TechniquePart[]
): number {
  let multiplier = 1;
  techniquePartsPayload.forEach((payload) => {
    const part = findByIdOrName(techniquePartsDb, {
      id: payload.id ?? payload.part?.id,
      name: payload.name ?? payload.part?.name,
    });
    if (!part || !part.percentage) return;
    multiplier *= getTechniquePartEnergyContribution(part, payload);
  });
  return multiplier;
}

export interface CalculateEmpoweredTechniqueCostsInput {
  powerPartsPayload: PowerPartPayload[];
  techniquePartsPayload: TechniquePartPayload[];
  powerPartsDb: PowerPart[];
  techniquePartsDb: TechniquePart[];
}

export function calculateEmpoweredTechniqueCosts(
  input: CalculateEmpoweredTechniqueCostsInput
): EmpoweredTechniqueCostResult {
  const {
    powerPartsPayload,
    techniquePartsPayload,
    powerPartsDb,
    techniquePartsDb,
  } = input;

  const powerCosts = calculatePowerCosts(powerPartsPayload, powerPartsDb);
  const techniqueCosts = calculateTechniqueCosts(techniquePartsPayload, techniquePartsDb);
  const techniquePercentageMultiplier = getTechniquePercentageMultiplier(
    techniquePartsPayload,
    techniquePartsDb
  );

  // Empowered rule: technique percentage mechanics also scale the power side.
  const adjustedPowerEnergyRaw = powerCosts.energyRaw * techniquePercentageMultiplier;
  const energyRaw = adjustedPowerEnergyRaw + techniqueCosts.energyRaw;

  return {
    totalEnergy: Math.ceil(energyRaw),
    totalTP: powerCosts.totalTP + techniqueCosts.totalTP,
    tpSources: [
      ...powerCosts.tpSources.map((src) => `[Power] ${src}`),
      ...techniqueCosts.tpSources.map((src) => `[Technique] ${src}`),
    ],
    energyRaw,
    powerEnergyRaw: adjustedPowerEnergyRaw,
    techniqueEnergyRaw: techniqueCosts.energyRaw,
    techniquePercentageMultiplier,
  };
}
