/**
 * Empowered Technique Advanced Calculations — display-only.
 * Combines power-side section groups, technique-side section groups, technique %
 * scaling of the power side, and Combined Energy. Does not change cost formulas.
 */

import type { PowerEnergyAnalysis } from './power-calc';
import {
  buildPowerEnergySectionGroups,
  formatEnergyNumber,
  formatPercentagePartModifier,
  type PowerAdvancedCalcGroup,
} from './power-energy-breakdown';
import type { TechniqueEnergyAnalysis } from './technique-energy-breakdown';
import { buildTechniqueEnergySectionGroups } from './technique-energy-breakdown';

export type EmpoweredAdvancedCalcGroup = PowerAdvancedCalcGroup;

const NEAR_ONE = 1e-9;

function nearlyEqual(a: number, b: number, epsilon = NEAR_ONE): boolean {
  return Math.abs(a - b) < epsilon;
}

export interface BuildEmpoweredAdvancedCalculationGroupsInput {
  powerAnalysis: PowerEnergyAnalysis;
  techniqueAnalysis: TechniqueEnergyAnalysis;
  techniquePercentageMultiplier: number;
  energyRaw: number;
  totalEnergy: number;
}

/**
 * Grouped Advanced Calculations for the empowered technique creator.
 * Power duration extra stays on the power side only. Technique % is called out
 * when it scales the power side. Empty sections omitted. No Training Points.
 */
export function buildEmpoweredAdvancedCalculationGroups(
  input: BuildEmpoweredAdvancedCalculationGroupsInput,
): EmpoweredAdvancedCalcGroup[] {
  const {
    powerAnalysis,
    techniqueAnalysis,
    techniquePercentageMultiplier,
    energyRaw,
    totalEnergy,
  } = input;

  const groups: EmpoweredAdvancedCalcGroup[] = [
    ...buildPowerEnergySectionGroups(powerAnalysis, 'Power · '),
    ...buildTechniqueEnergySectionGroups(techniqueAnalysis, 'Technique · '),
  ];

  const adjustedPowerRaw = powerAnalysis.energyRaw * techniquePercentageMultiplier;
  const totalsRows: EmpoweredAdvancedCalcGroup['rows'] = [];

  if (!nearlyEqual(powerAnalysis.energyRaw, 0)) {
    totalsRows.push({
      label: 'Power Energy (before technique %)',
      value: formatEnergyNumber(powerAnalysis.energyRaw),
    });
  }

  if (!nearlyEqual(techniquePercentageMultiplier, 1)) {
    totalsRows.push({
      label: 'Technique % multiplier',
      value: `× ${formatEnergyNumber(techniquePercentageMultiplier)} (${formatPercentagePartModifier(techniquePercentageMultiplier)})`,
      note: 'Scales the power side before adding technique Energy',
    });
    if (!nearlyEqual(powerAnalysis.energyRaw, 0)) {
      totalsRows.push({
        label: 'Power Energy (adjusted)',
        value: formatEnergyNumber(adjustedPowerRaw),
      });
    }
  }

  if (!nearlyEqual(techniqueAnalysis.energyRaw, 0)) {
    totalsRows.push({
      label: 'Technique Energy',
      value: formatEnergyNumber(techniqueAnalysis.energyRaw),
    });
  }

  const needsRoundUp = totalEnergy > 0 && !nearlyEqual(energyRaw, totalEnergy) && energyRaw > 0;
  const clampedFromNegative = energyRaw < 0 && totalEnergy === 0;

  if (clampedFromNegative) {
    totalsRows.push({ label: 'Combined Energy', value: formatEnergyNumber(energyRaw) });
    totalsRows.push({
      label: 'Cannot go below 0',
      value: formatEnergyNumber(totalEnergy),
    });
  } else if (needsRoundUp) {
    totalsRows.push({ label: 'Combined Energy', value: formatEnergyNumber(energyRaw) });
    totalsRows.push({ label: 'Rounded Up', value: formatEnergyNumber(totalEnergy) });
  }

  totalsRows.push({ label: 'Energy Cost', value: formatEnergyNumber(totalEnergy) });

  groups.push({ title: 'Combined Energy', rows: totalsRows });
  return groups;
}
