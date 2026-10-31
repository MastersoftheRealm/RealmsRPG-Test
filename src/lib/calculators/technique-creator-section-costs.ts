/**
 * Technique creator section badges — align header/sub-badge EN with Advanced Calculations.
 */

import type { TechniquePart } from '@/hooks/codex-types';
import { finalizePowerEnergy } from './power-calc';
import {
  analyzeTechniqueEnergy,
  type TechniqueCalcSectionId,
  type TechniqueEnergyAnalysis,
  type TechniqueEnergyLine,
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

/**
 * Flat EN matching `match`, times the technique-wide percentage product from
 * `analyzeTechniqueEnergy` (same chain as Advanced Calculations).
 * Percentage lines contribute through that product, not as their own flat EN.
 */
function attributedFlatEnergyRaw(
  analysis: TechniqueEnergyAnalysis,
  match: (line: TechniqueEnergyLine) => boolean,
): number {
  let flat = 0;
  for (const line of analysis.lines) {
    if (match(line) && line.kind !== 'percentage') flat += line.contribution;
  }
  return flat * analysis.productPercentage;
}

/** This section's flat EN times every percentage modifier on the technique. */
export function sectionAttributedEnergyRaw(
  analysis: TechniqueEnergyAnalysis,
  section: TechniqueCalcSectionId,
): number {
  return attributedFlatEnergyRaw(analysis, (line) => line.section === section);
}

/** Flat EN for named parts (Attack vs Action Type vs Reaction) times global percentages. */
export function techniqueNamesEnergyRaw(
  analysis: TechniqueEnergyAnalysis,
  names: ReadonlySet<string>,
): number {
  return attributedFlatEnergyRaw(analysis, (line) => names.has(line.name));
}

/** Badge EN from the full analysis; TP from the named slice alone. */
export function techniqueNamedBadgeCost(
  analysis: TechniqueEnergyAnalysis,
  names: ReadonlySet<string>,
  slicePayload: TechniquePartPayload[],
  partsDb: TechniquePart[],
): TechniqueCostResult {
  return withAttributedEnergy(
    calculateTechniqueCosts(slicePayload, partsDb),
    techniqueNamesEnergyRaw(analysis, names),
  );
}

function withAttributedEnergy(
  tpSlice: TechniqueCostResult,
  energyRaw: number,
): TechniqueCostResult {
  const hasPositiveEnergy = energyRaw > 1e-9;
  return {
    ...tpSlice,
    energyRaw,
    totalEnergy: finalizePowerEnergy(energyRaw, hasPositiveEnergy),
    hasPositiveEnergy,
  };
}

/** EN/TP for manual technique parts. EN is that section's share of the full technique. */
export function techniqueManualPartsSectionCost(
  fullPayload: TechniquePartPayload[],
  partsDb: TechniquePart[],
): TechniqueCostResult {
  const manual = fullPayload.filter((pl) => pl.calcSection === 'parts');
  const tpSlice = calculateTechniqueCosts(manual, partsDb);
  const analysis = analyzeTechniqueEnergy(fullPayload, partsDb);
  return withAttributedEnergy(tpSlice, sectionAttributedEnergyRaw(analysis, 'parts'));
}

export function techniqueDamageSectionCostFromAnalysis(
  analysis: TechniqueEnergyAnalysis,
  damagePayload: TechniquePartPayload[],
  partsDb: TechniquePart[],
): TechniqueCostResult {
  const tpSlice = calculateTechniqueCosts(damagePayload, partsDb);
  return withAttributedEnergy(tpSlice, sectionAttributedEnergyRaw(analysis, 'damage'));
}
