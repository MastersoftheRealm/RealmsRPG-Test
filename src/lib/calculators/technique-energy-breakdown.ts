/**
 * Technique Advanced Calculations — display-only energy breakdown.
 * Math comes from `analyzeTechniqueEnergy` / `calculateTechniqueCosts`. This file
 * only formats groups and user-facing copy (Rounded Up, percents, omitted empties).
 */

import type { TechniquePart } from '@/hooks/codex-types';
import { findByIdOrName } from '@/lib/id-constants';
import { dedupeSavedParts } from '@/lib/game/dedupe-saved-parts';
import { formatEnergyNumber, formatPercentagePartModifier } from './power-energy-breakdown';
import { type TechniqueCalcSectionId, type TechniquePartPayload } from './technique-calc';

export type { TechniqueCalcSectionId };

export const TECHNIQUE_CALC_SECTION_IDS: TechniqueCalcSectionId[] = [
  'action',
  'attack',
  'damage',
  'parts',
];

export const TECHNIQUE_CALC_SECTION_TITLES: Record<TechniqueCalcSectionId, string> = {
  action: 'Action Type',
  attack: 'Attack',
  damage: 'Damage',
  parts: 'Technique Parts',
};

export const TECHNIQUE_CALC_SECTION_BY_NAME: Record<string, TechniqueCalcSectionId> = {
  'Quick or Free Action': 'action',
  'Long Action': 'action',
  Reaction: 'action',
  'Add Weapon to Technique': 'attack',
  'Add Weapon Attack': 'attack',
  'No Attack': 'attack',
  'Additional Damage': 'damage',
  'Split Damage Dice': 'damage',
};

export type TechniqueEnergyLineKind = 'flat' | 'percentage';

export interface TechniqueEnergyLine {
  name: string;
  displayLabel?: string | undefined;
  section: TechniqueCalcSectionId;
  kind: TechniqueEnergyLineKind;
  contribution: number;
  optionLevels: { op1: number; op2: number; op3: number };
}

export interface TechniqueEnergyAnalysis {
  lines: TechniqueEnergyLine[];
  sumNonPercentage: number;
  productPercentage: number;
  energyRaw: number;
  totalEnergy: number;
}

export interface TechniqueAdvancedCalcRow {
  label: string;
  value: string;
  note?: string | undefined;
}

export interface TechniqueAdvancedCalcGroup {
  title: string;
  rows: TechniqueAdvancedCalcRow[];
}

const NEAR_ONE = 1e-9;
const NEAR_ZERO = 1e-9;

function nearlyEqual(a: number, b: number, epsilon = NEAR_ONE): boolean {
  return Math.abs(a - b) < epsilon;
}

function formatOptionSuffix(op1: number, op2: number, op3: number): string {
  const bits: string[] = [];
  if (op1 > 0) bits.push(`option 1 × ${op1}`);
  if (op2 > 0) bits.push(`option 2 × ${op2}`);
  if (op3 > 0) bits.push(`option 3 × ${op3}`);
  return bits.length > 0 ? ` (${bits.join(', ')})` : '';
}

export function defaultTechniqueEnergyLineLabel(line: TechniqueEnergyLine): string {
  if (line.displayLabel && line.displayLabel.trim()) return line.displayLabel;

  const { name, optionLevels } = line;
  const { op1, op2, op3 } = optionLevels;

  if (name === 'Quick or Free Action') {
    return op1 >= 1 ? 'Free Action' : 'Quick Action';
  }
  if (name === 'Long Action') {
    return op1 >= 1 ? 'Long Action (4 AP)' : 'Long Action (3 AP)';
  }
  if (name === 'Reaction') return 'Reaction';
  if (name === 'Add Weapon to Technique' || name === 'Add Weapon Attack') return 'Weapon Attack';
  if (name === 'No Attack') return 'No Attack';
  if (name === 'Additional Damage') {
    // Levels map via calculateDamageOptionLevel; label without dice falls back to name.
    return 'Additional Damage';
  }
  if (name === 'Split Damage Dice') return 'Split damage dice';

  return `${name}${formatOptionSuffix(op1, op2, op3)}`;
}

function resolveTechniqueCalcSection(
  pl: TechniquePartPayload,
  def: TechniquePart,
): TechniqueCalcSectionId {
  if (pl.calcSection) return pl.calcSection;
  const byName = TECHNIQUE_CALC_SECTION_BY_NAME[def.name];
  if (byName) return byName;
  return 'parts';
}

function partEnergyContribution(def: TechniquePart, l1: number, l2: number, l3: number): number {
  return (
    (def.base_en || 0) + (def.op_1_en || 0) * l1 + (def.op_2_en || 0) * l2 + (def.op_3_en || 0) * l3
  );
}

/**
 * Per-part energy classification matching `calculateTechniqueCosts` (including dedupe).
 * Display-only fields (`calcSection`, `displayLabel`) are ignored for math.
 */
export function analyzeTechniqueEnergy(
  partsPayload: TechniquePartPayload[] = [],
  partsDb: TechniquePart[] = [],
): TechniqueEnergyAnalysis {
  let sumNonPercentage = 0;
  let productPercentage = 1;
  const lines: TechniqueEnergyLine[] = [];

  const uniqueParts = dedupeSavedParts(partsPayload);
  uniqueParts.forEach((pl) => {
    const def = findByIdOrName(partsDb, {
      id: pl.id ?? pl.part?.id,
      name: pl.name ?? pl.part?.name,
    });
    if (!def) return;

    const l1 = pl.op_1_lvl || 0;
    const l2 = pl.op_2_lvl || 0;
    const l3 = pl.op_3_lvl || 0;
    const energyContribution = partEnergyContribution(def, l1, l2, l3);
    const kind: TechniqueEnergyLineKind = def.percentage ? 'percentage' : 'flat';

    if (kind === 'percentage') {
      productPercentage *= energyContribution;
    } else {
      sumNonPercentage += energyContribution;
    }

    lines.push({
      name: def.name,
      displayLabel: pl.displayLabel,
      section: resolveTechniqueCalcSection(pl, def),
      kind,
      contribution: energyContribution,
      optionLevels: { op1: l1, op2: l2, op3: l3 },
    });
  });

  const energyRaw = sumNonPercentage * productPercentage;
  const totalEnergy = Math.max(0, Math.ceil(energyRaw));

  return {
    lines,
    sumNonPercentage,
    productPercentage,
    energyRaw,
    totalEnergy,
  };
}

function lineHasDisplayableEnergy(line: TechniqueEnergyLine): boolean {
  if (line.kind === 'percentage') {
    return !nearlyEqual(line.contribution, 1);
  }
  return !nearlyEqual(line.contribution, 0, NEAR_ZERO);
}

function formatLineValue(line: TechniqueEnergyLine): string {
  if (line.kind === 'percentage') return formatPercentagePartModifier(line.contribution);
  return formatEnergyNumber(line.contribution);
}

/**
 * Per-section Energy rows only (no Combined Energy totals).
 */
export function buildTechniqueEnergySectionGroups(
  analysis: TechniqueEnergyAnalysis,
  titlePrefix = '',
): TechniqueAdvancedCalcGroup[] {
  const groups: TechniqueAdvancedCalcGroup[] = [];

  for (const sectionId of TECHNIQUE_CALC_SECTION_IDS) {
    const sectionLines = analysis.lines.filter(
      (line) => line.section === sectionId && lineHasDisplayableEnergy(line),
    );
    if (sectionLines.length === 0) continue;

    const rows: TechniqueAdvancedCalcRow[] = sectionLines.map((line) => ({
      label: defaultTechniqueEnergyLineLabel(line),
      value: formatLineValue(line),
    }));

    const flatSum = sectionLines
      .filter((line) => line.kind === 'flat')
      .reduce((sum, line) => sum + line.contribution, 0);
    const showSubtotal = sectionLines.filter((line) => line.kind === 'flat').length > 1;
    if (showSubtotal && !nearlyEqual(flatSum, 0, NEAR_ZERO)) {
      rows.push({
        label: 'Section total',
        value: formatEnergyNumber(flatSum),
      });
    }

    groups.push({
      title: `${titlePrefix}${TECHNIQUE_CALC_SECTION_TITLES[sectionId]}`,
      rows,
    });
  }

  return groups;
}

function buildTotalsGroup(analysis: TechniqueEnergyAnalysis): TechniqueAdvancedCalcGroup {
  const rows: TechniqueAdvancedCalcRow[] = [];
  const { sumNonPercentage, productPercentage, energyRaw, totalEnergy } = analysis;

  if (!nearlyEqual(sumNonPercentage, 0, NEAR_ZERO)) {
    rows.push({ label: 'Base Energy', value: formatEnergyNumber(sumNonPercentage) });
  }

  if (!nearlyEqual(productPercentage, 1)) {
    rows.push({
      label: 'Percentage modifiers',
      value: `× ${formatEnergyNumber(productPercentage)} (${formatPercentagePartModifier(productPercentage)})`,
    });
    if (!nearlyEqual(sumNonPercentage, 0, NEAR_ZERO)) {
      rows.push({
        label: 'Energy after percentages',
        value: formatEnergyNumber(energyRaw),
      });
    }
  }

  const needsRoundUp = totalEnergy > 0 && !nearlyEqual(energyRaw, totalEnergy) && energyRaw > 0;
  const clampedFromNegative = energyRaw < 0 && totalEnergy === 0;

  if (clampedFromNegative) {
    rows.push({ label: 'Combined Energy', value: formatEnergyNumber(energyRaw) });
    rows.push({
      label: 'Cannot go below 0',
      value: formatEnergyNumber(totalEnergy),
    });
  } else if (needsRoundUp) {
    rows.push({ label: 'Combined Energy', value: formatEnergyNumber(energyRaw) });
    rows.push({ label: 'Rounded Up', value: formatEnergyNumber(totalEnergy) });
  }

  rows.push({ label: 'Energy Cost', value: formatEnergyNumber(totalEnergy) });

  return { title: 'Combined Energy', rows };
}

/**
 * Grouped Advanced Calculations for the technique creator.
 * Omits sections with no Energy contribution. Does not include Training Points.
 */
export function buildTechniqueAdvancedCalculationGroups(
  analysis: TechniqueEnergyAnalysis,
): TechniqueAdvancedCalcGroup[] {
  return [...buildTechniqueEnergySectionGroups(analysis), buildTotalsGroup(analysis)];
}
