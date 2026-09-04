/**
 * Power Advanced Calculations — display-only energy breakdown.
 * Math comes from `analyzePowerEnergy` / `calculatePowerCosts`. This file only
 * formats groups and user-facing copy (Rounded Up, percents, omitted empty sections).
 */

import { formatCost } from '@/lib/game/creator-constants';
import { capitalizeWords } from '@/lib/utils/string';
import {
  POWER_CALC_SECTION_IDS,
  POWER_CALC_SECTION_TITLES,
  POWER_DURATION_MODIFIER_PART_NAMES,
  POWER_DURATION_TYPE_PART_NAMES,
  type PowerCalcSectionId,
} from './power-mechanic-constants';
import {
  formatPowerRangeFromSteps,
  type PowerEnergyAnalysis,
  type PowerEnergyLine,
} from './power-calc';

export interface PowerAdvancedCalcRow {
  label: string;
  value: string;
  note?: string | undefined;
}

export interface PowerAdvancedCalcGroup {
  title: string;
  rows: PowerAdvancedCalcRow[];
}

const NEAR_ONE = 1e-9;
const NEAR_ZERO = 1e-9;

function nearlyEqual(a: number, b: number, epsilon = NEAR_ONE): boolean {
  return Math.abs(a - b) < epsilon;
}

/** Strip trailing zeros; keep up to 3 decimals (same family as `formatCost`). */
export function formatEnergyNumber(value: number): string {
  return formatCost(value);
}

/**
 * Format a signed percent without trailing zeros.
 * 25 → "+25%", -12.5 → "-12.5%", 0 → "0%".
 */
export function formatSignedPercent(percent: number): string {
  const rounded = Math.round(percent * 1000) / 1000;
  if (nearlyEqual(rounded, 0, 1e-9)) return '0%';
  const body = formatEnergyNumber(Math.abs(rounded));
  return rounded > 0 ? `+${body}%` : `-${body}%`;
}

/** Percentage part multiplier 1.25 → "+25%". */
export function formatPercentagePartModifier(multiplier: number): string {
  return formatSignedPercent((multiplier - 1) * 100);
}

/**
 * Duration type part (Minute/Hour/…): factor 0.75 → "+75%".
 * Duration modifier (Focus/…): factor 0.5 → "-50%".
 */
export function formatDurationPartModifier(name: string, factor: number): string {
  if (POWER_DURATION_TYPE_PART_NAMES.has(name)) {
    return formatSignedPercent(factor * 100);
  }
  if (POWER_DURATION_MODIFIER_PART_NAMES.has(name)) {
    return formatPercentagePartModifier(factor);
  }
  return formatSignedPercent(factor * 100);
}

function formatOptionSuffix(op1: number, op2: number, op3: number): string {
  const bits: string[] = [];
  if (op1 > 0) bits.push(`option 1 × ${op1}`);
  if (op2 > 0) bits.push(`option 2 × ${op2}`);
  if (op3 > 0) bits.push(`option 3 × ${op3}`);
  return bits.length > 0 ? ` (${bits.join(', ')})` : '';
}

export function defaultPowerEnergyLineLabel(line: PowerEnergyLine): string {
  if (line.displayLabel && line.displayLabel.trim()) return line.displayLabel;

  const { name, optionLevels } = line;
  const { op1, op2, op3 } = optionLevels;

  if (name === 'Power Quick or Free Action') {
    return op1 >= 1 ? 'Free Action' : 'Quick Action';
  }
  if (name === 'Power Long Action') {
    return op1 >= 1 ? 'Long Action (4 AP)' : 'Long Action (3 AP)';
  }
  if (name === 'Power Reaction') return 'Reaction';
  if (name === 'Add Weapon to Power') return 'Weapon Attack';
  if (name === 'Power Range') {
    const steps = op1 + 1;
    const formatted = formatPowerRangeFromSteps(steps);
    return formatted.replace(/\bspaces\b/, 'Spaces').replace(/\bspace\b/, 'Space');
  }
  if (name.endsWith(' of Effect')) {
    const shape = name.replace(/ of Effect$/, '');
    const level = op1 + 1;
    return level > 1 ? `${shape}, level ${level}` : shape;
  }
  if (name === 'Focus for Duration') return 'Focus';
  if (name === 'No Harm or Adaptation for Duration') return 'No Harm or Adaptation';
  if (name === 'Duration Ends On Activation') return 'Ends on Activation';
  if (name === 'Sustain for Duration') {
    const ap = op1 + 1;
    return `Sustain (${ap} AP)`;
  }
  if (name === 'Power Split Damage Dice') return 'Split damage dice';

  return `${name}${formatOptionSuffix(op1, op2, op3)}`;
}

export function formatDamageEnergyLabel(type: string, amount: number, size: number): string {
  return `${capitalizeWords(type)} ${amount}d${size}`;
}

function lineHasDisplayableEnergy(line: PowerEnergyLine): boolean {
  if (line.kind === 'percentage') {
    return !nearlyEqual(line.contribution, 1);
  }
  if (line.kind === 'duration') {
    return true;
  }
  return !nearlyEqual(line.contribution, 0, NEAR_ZERO);
}

function formatLineValue(line: PowerEnergyLine): string {
  if (line.kind === 'percentage') return formatPercentagePartModifier(line.contribution);
  if (line.kind === 'duration') return formatDurationPartModifier(line.name, line.contribution);
  return formatEnergyNumber(line.contribution);
}

function lineNote(line: PowerEnergyLine, hasDurationAffectedFlat: boolean): string | undefined {
  if (line.kind === 'flat' && line.applyDuration) return 'Applied to duration';
  // Percentage Apply duration only scales Extra Energy when flat duration-affected Energy exists.
  if (line.kind === 'percentage' && line.applyDuration && hasDurationAffectedFlat) {
    return 'Also scales duration extra';
  }
  return undefined;
}

/**
 * Per-section Energy rows only (no Combined Energy totals).
 * Used by the power creator and by empowered technique (power side).
 */
export function buildPowerEnergySectionGroups(
  analysis: PowerEnergyAnalysis,
  titlePrefix = '',
): PowerAdvancedCalcGroup[] {
  const groups: PowerAdvancedCalcGroup[] = [];
  const hasDurationAffectedFlat = !nearlyEqual(analysis.flatDuration, 0, NEAR_ZERO);

  for (const sectionId of POWER_CALC_SECTION_IDS) {
    const sectionLines = analysis.lines.filter(
      (line) => line.section === sectionId && lineHasDisplayableEnergy(line),
    );
    if (sectionLines.length === 0) continue;

    const rows: PowerAdvancedCalcRow[] = sectionLines.map((line) => {
      const note = lineNote(line, hasDurationAffectedFlat);
      return {
        label: defaultPowerEnergyLineLabel(line),
        value: formatLineValue(line),
        ...(note ? { note } : {}),
      };
    });

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
      title: `${titlePrefix}${POWER_CALC_SECTION_TITLES[sectionId as PowerCalcSectionId]}`,
      rows,
    });
  }

  return groups;
}

function buildTotalsGroup(analysis: PowerEnergyAnalysis): PowerAdvancedCalcGroup {
  const rows: PowerAdvancedCalcRow[] = [];
  const {
    flatNormal,
    flatDuration,
    percAll,
    percDur,
    durAll,
    hasDurationParts,
    energyRaw,
    totalEnergy,
    lines,
  } = analysis;

  const afterPercentages = flatNormal * percAll;
  const durationExtra = durAll * flatDuration * percDur;
  const hasApplyDuration = lines.some((line) => line.applyDuration && line.kind === 'flat');

  if (!nearlyEqual(flatNormal, 0, NEAR_ZERO)) {
    rows.push({ label: 'Base Energy', value: formatEnergyNumber(flatNormal) });
  }

  if (!nearlyEqual(percAll, 1)) {
    rows.push({
      label: 'Percentage modifiers',
      value: `× ${formatEnergyNumber(percAll)} (${formatPercentagePartModifier(percAll)})`,
    });
    if (!nearlyEqual(flatNormal, 0, NEAR_ZERO)) {
      rows.push({
        label: 'Energy after percentages',
        value: formatEnergyNumber(afterPercentages),
      });
    }
  }

  if (hasDurationParts && !nearlyEqual(flatDuration, 0, NEAR_ZERO)) {
    rows.push({
      label: 'Duration-affected Energy',
      value: formatEnergyNumber(flatDuration),
    });
    rows.push({
      label: 'Duration extra',
      value: `${formatSignedPercent(durAll * 100)} of duration-affected Energy`,
    });
    if (!nearlyEqual(percDur, 1)) {
      rows.push({
        label: 'Duration extra percentages',
        value: `× ${formatEnergyNumber(percDur)} (${formatPercentagePartModifier(percDur)})`,
      });
    }
    rows.push({
      label: 'Extra Energy from duration',
      value: formatEnergyNumber(durationExtra),
    });
  } else if (hasApplyDuration && !hasDurationParts) {
    rows.push({
      label: 'Applied to duration',
      value: 'No effect',
      note: 'Duration is Instant, so Applied to duration does not add Energy',
    });
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
 * Grouped Advanced Calculations for the power creator.
 * Omits sections with no Energy contribution. Does not include Training Points.
 */
export function buildPowerAdvancedCalculationGroups(
  analysis: PowerEnergyAnalysis,
): PowerAdvancedCalcGroup[] {
  return [...buildPowerEnergySectionGroups(analysis), buildTotalsGroup(analysis)];
}
