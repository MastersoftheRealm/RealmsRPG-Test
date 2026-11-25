import type { PowerPart, TechniquePart } from '@/hooks/codex-types';
import {
  analyzePowerEnergy,
  calculatePowerCosts,
  energyFloorApplies,
  finalizePowerEnergy,
  type PowerPartPayload,
} from './power-calc';
import { calculateTechniqueCosts, type TechniquePartPayload } from './technique-calc';
import { findByIdOrName } from '@/lib/id-constants';
import { POWER_CALC_SECTION_BY_NAME } from './power-mechanic-constants';

export interface EmpoweredTechniqueCostResult {
  totalEnergy: number;
  totalTP: number;
  tpSources: string[];
  energyRaw: number;
  powerEnergyRaw: number;
  techniqueEnergyRaw: number;
  techniquePercentageMultiplier: number;
  actionEnergyMultiplier: number;
}

const TECHNIQUE_ACTION_PART_NAMES = new Set(['Reaction', 'Long Action', 'Quick or Free Action']);

function getTechniquePartEnergyContribution(
  part: TechniquePart,
  payload: TechniquePartPayload,
): number {
  return (
    (part.base_en || 0) +
    (part.op_1_en || 0) * (payload.op_1_lvl || 0) +
    (part.op_2_en || 0) * (payload.op_2_lvl || 0) +
    (part.op_3_en || 0) * (payload.op_3_lvl || 0)
  );
}

function isPowerActionPercentagePart(pl: PowerPartPayload, partsDb: PowerPart[]): boolean {
  const def = findByIdOrName(partsDb, {
    id: pl.id ?? pl.part?.id,
    name: pl.name ?? pl.part?.name,
  });
  if (!def?.percentage) return false;
  return POWER_CALC_SECTION_BY_NAME[def.name] === 'action';
}

function getPowerActionEnergyMultiplier(
  powerPartsPayload: PowerPartPayload[],
  powerPartsDb: PowerPart[],
): number {
  const actionPercentageRows = powerPartsPayload.filter((pl) =>
    isPowerActionPercentagePart(pl, powerPartsDb),
  );
  if (actionPercentageRows.length === 0) return 1;
  const analysis = analyzePowerEnergy(actionPercentageRows, powerPartsDb);
  return analysis.percAll > 1e-9 ? analysis.percAll : 1;
}

function withoutPowerActionPercentageParts(
  powerPartsPayload: PowerPartPayload[],
  powerPartsDb: PowerPart[],
): PowerPartPayload[] {
  return powerPartsPayload.filter((pl) => !isPowerActionPercentagePart(pl, powerPartsDb));
}

function getTechniqueNonActionPercentageMultiplier(
  techniquePartsPayload: TechniquePartPayload[],
  techniquePartsDb: TechniquePart[],
): number {
  let multiplier = 1;
  techniquePartsPayload.forEach((payload) => {
    const part = findByIdOrName(techniquePartsDb, {
      id: payload.id ?? payload.part?.id,
      name: payload.name ?? payload.part?.name,
    });
    if (!part || !part.percentage) return;
    if (TECHNIQUE_ACTION_PART_NAMES.has(part.name)) return;
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
  input: CalculateEmpoweredTechniqueCostsInput,
): EmpoweredTechniqueCostResult {
  const { powerPartsPayload, techniquePartsPayload, powerPartsDb, techniquePartsDb } = input;

  const actionEnergyMultiplier = getPowerActionEnergyMultiplier(powerPartsPayload, powerPartsDb);
  const techniquePercentageMultiplier = getTechniqueNonActionPercentageMultiplier(
    techniquePartsPayload,
    techniquePartsDb,
  );

  const powerPayloadWithoutActionPerc = withoutPowerActionPercentageParts(
    powerPartsPayload,
    powerPartsDb,
  );

  const powerCosts = calculatePowerCosts(powerPayloadWithoutActionPerc, powerPartsDb);
  const techniqueCosts = calculateTechniqueCosts(techniquePartsPayload, techniquePartsDb);

  const adjustedPowerEnergyRaw =
    powerCosts.energyRaw * actionEnergyMultiplier * techniquePercentageMultiplier;
  const adjustedTechniqueEnergyRaw = techniqueCosts.energyRaw * actionEnergyMultiplier;
  const energyRaw = adjustedPowerEnergyRaw + adjustedTechniqueEnergyRaw;

  const hasPositiveEnergy = energyFloorApplies(
    powerCosts.hasPositiveEnergy || techniqueCosts.hasPositiveEnergy,
    energyRaw,
  );

  return {
    totalEnergy: finalizePowerEnergy(energyRaw, hasPositiveEnergy),
    totalTP: powerCosts.totalTP + techniqueCosts.totalTP,
    tpSources: [
      ...powerCosts.tpSources.map((src) => `[Power] ${src}`),
      ...techniqueCosts.tpSources.map((src) => `[Technique] ${src}`),
    ],
    energyRaw,
    powerEnergyRaw: adjustedPowerEnergyRaw,
    techniqueEnergyRaw: adjustedTechniqueEnergyRaw,
    techniquePercentageMultiplier,
    actionEnergyMultiplier,
  };
}
