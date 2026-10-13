/**
 * Technique creator section badges — align header/sub-badge EN with Advanced Calculations.
 */

import type { TechniquePart } from '@/hooks/codex-types';
import { finalizePowerEnergy } from './power-calc';
import {
  type TechniqueCalcSectionId,
  type TechniqueEnergyAnalysis,
} from './technique-energy-breakdown';
import {
  calculateTechniqueCosts,
  type TechniqueCostResult,
  type TechniquePartPayload,
} from './technique-calc';

const ATTACK_MECHANIC_NAMES = new Set([
  'Add Weapon to Technique',
  'Add Weapon Attack',
  'No Attack',
]);

export function isTechniqueAttackMechanicName(name: string): boolean {
  return ATTACK_MECHANIC_NAMES.has(name);
}

export function combineTechniqueCostSlices(...slices: TechniqueCostResult[]): TechniqueCostResult {
  const energyRaw = slices.reduce((sum, slice) => sum + slice.energyRaw, 0);
  const totalTP = slices.reduce((sum, slice) => sum + slice.totalTP, 0);
  const tpSources = slices.flatMap((slice) => slice.tpSources);
  const hasPositiveEnergy = slices.some((slice) => slice.hasPositiveEnergy);
  const totalEnergy = finalizePowerEnergy(energyRaw, hasPositiveEnergy);
  return { energyRaw, totalTP, tpSources, totalEnergy, hasPositiveEnergy };
}

/** Flat EN in a section times percentage parts that belong to the same section. */
export function sectionAttributedEnergyRaw(
  analysis: TechniqueEnergyAnalysis,
  section: TechniqueCalcSectionId,
): number {
  const lines = analysis.lines.filter((line) => line.section === section);
  let flat = 0;
  let product = 1;
  for (const line of lines) {
    if (line.kind === 'percentage') {
      product *= line.contribution;
    } else {
      flat += line.contribution;
    }
  }
  return flat * product;
}

/** EN/TP attributable to manual technique parts (including global percentage modifiers). */
export function techniqueManualPartsSectionCost(
  fullPayload: TechniquePartPayload[],
  partsDb: TechniquePart[],
): TechniqueCostResult {
  const withoutManual = fullPayload.filter((pl) => pl.calcSection !== 'parts');
  const full = calculateTechniqueCosts(fullPayload, partsDb);
  const base = calculateTechniqueCosts(withoutManual, partsDb);
  const energyRaw = full.energyRaw - base.energyRaw;
  const totalTP = full.totalTP - base.totalTP;
  const hasPositiveEnergy = energyRaw > 1e-9;
  return {
    energyRaw,
    totalTP,
    tpSources: full.tpSources.filter((src) => !base.tpSources.includes(src)),
    totalEnergy: finalizePowerEnergy(energyRaw, hasPositiveEnergy),
    hasPositiveEnergy,
  };
}

export function techniqueDamageSectionCostFromAnalysis(
  analysis: TechniqueEnergyAnalysis,
  damagePayload: TechniquePartPayload[],
  partsDb: TechniquePart[],
): TechniqueCostResult {
  const tpSlice = calculateTechniqueCosts(damagePayload, partsDb);
  const energyRaw = sectionAttributedEnergyRaw(analysis, 'damage');
  const hasPositiveEnergy = analysis.lines.some(
    (line) => line.section === 'damage' && line.kind === 'flat' && line.contribution > 1e-9,
  );
  return {
    ...tpSlice,
    energyRaw,
    totalEnergy: finalizePowerEnergy(energyRaw, hasPositiveEnergy),
    hasPositiveEnergy,
  };
}
