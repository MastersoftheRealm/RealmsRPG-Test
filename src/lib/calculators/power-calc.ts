/**
 * Power Calculation Utilities
 * ============================
 * Ported from public/js/calculators/power-calc.js
 * Provides cost calculation and display helpers for powers.
 */

import type { PowerPart } from '@/hooks/codex-types';
import { PART_IDS, findByIdOrName } from '@/lib/id-constants';
import {
  computePartTrainingPoints,
  computePartTrainingPointsRaw,
} from '@/lib/calculators/part-training-points';
import { dedupeSavedParts } from '@/lib/game/dedupe-saved-parts';
import type { AllowUndefinedOptionals } from '@/lib/utils/exact-optional';
import { formatDurationFromTypeAndValue, formatDurationWithModifiers } from '@/lib/utils/duration';
import { formatActionTypeForDisplay } from '@/lib/utils/action-type';
import { deriveActionType, actionTypeFromSelection } from './action-type';
import { buildMechanicParts, type AreaConfig, type DurationConfig } from './mechanic-builder';
import {
  POWER_ADVANCED_MECHANIC_CATEGORY_SET,
  POWER_AUTO_MECHANIC_PART_NAMES,
} from './power-mechanic-constants';

// =============================================================================
// Types
// =============================================================================

export interface PowerPartPayload {
  id?: number | string | undefined; // codex may use string ids e.g. "s377"
  name?: string | undefined;
  part?: PowerPart | undefined;
  op_1_lvl?: number | undefined;
  op_2_lvl?: number | undefined;
  op_3_lvl?: number | undefined;
  opt1Level?: number | undefined; // Legacy format
  opt2Level?: number | undefined;
  opt3Level?: number | undefined;
  applyDuration?: boolean | undefined;
}

export interface PowerCostResult {
  totalEnergy: number;
  totalTP: number;
  /** Sum of per-part TP before `Math.floor` (for debug / advanced cost display). */
  tpRaw: number;
  tpSources: string[];
  energyRaw: number;
}

export interface PowerDisplayData {
  name: string;
  description: string;
  actionType: string;
  range: string;
  area: string;
  duration: string;
  energy: number;
  tp: number;
  tpSources: string[];
  partChips: PartChipData[];
}

export interface PartChipData {
  text: string;
  description: string;
  finalTP: number;
  hasTP: boolean;
  /** Max option level when > 0; omit at 0. */
  optionLevel?: number | undefined;
}

/**
 * Get option level from payload, supporting both formats
 */
function getOptionLevel(pl: PowerPartPayload, option: 1 | 2 | 3): number {
  const isUiShape = pl.part !== undefined;
  if (option === 1) return isUiShape ? (pl.op_1_lvl ?? pl.opt1Level ?? 0) : (pl.op_1_lvl ?? 0);
  if (option === 2) return isUiShape ? (pl.op_2_lvl ?? pl.opt2Level ?? 0) : (pl.op_2_lvl ?? 0);
  return isUiShape ? (pl.op_3_lvl ?? pl.opt3Level ?? 0) : (pl.op_3_lvl ?? 0);
}

// =============================================================================
// Core Cost Calculator
// =============================================================================

/**
 * Calculate total energy, TP and list TP sources for a power.
 * Uses the unified equation:
 * (flat_normal * perc_all) + ((dur_all + 1) * flat_duration * perc_dur) - (flat_duration * perc_dur)
 */
export function calculatePowerCosts(
  partsPayload: PowerPartPayload[] = [],
  partsDb: PowerPart[] = [],
): PowerCostResult {
  let flat_normal = 0;
  let flat_duration = 0;
  let perc_all = 1;
  let perc_dur = 1;
  let dur_all = 1;
  let hasDurationParts = false;
  let totalTP = 0;
  let tpRaw = 0;
  const tpSources: string[] = [];

  // Each payload entry is an independent cost contribution (e.g. multiple elemental
  // damage rows share a part id but must each add base_en + option energy).
  partsPayload.forEach((pl) => {
    // Normalize to support both saved-format and UI-format
    const isUiShape = pl.part !== undefined;

    // Get part definition - prefer ID lookup, fallback to name
    let def: PowerPart | undefined;
    if (isUiShape) {
      def = pl.part;
    } else {
      def = findByIdOrName(partsDb, pl);
    }
    if (!def) return;

    const l1 = getOptionLevel(pl, 1);
    const l2 = getOptionLevel(pl, 2);
    const l3 = getOptionLevel(pl, 3);
    const applyToDuration = pl.applyDuration || false;

    // Energy contribution (effective energy)
    const energyContribution =
      (def.base_en || 0) +
      (def.op_1_en || 0) * l1 +
      (def.op_2_en || 0) * l2 +
      (def.op_3_en || 0) * l3;

    // Categorize based on part flags
    const isDuration = def.duration;
    const isPercentage = def.percentage;

    if (isDuration) {
      // Duration parts multiply into dur_all (used in formula: (dur_all + 1) * flat_duration * perc_dur)
      dur_all *= energyContribution;
      hasDurationParts = true;
    } else if (isPercentage) {
      perc_all *= energyContribution;
      if (applyToDuration) perc_dur *= energyContribution;
    } else {
      flat_normal += energyContribution;
      if (applyToDuration) flat_duration += energyContribution;
    }

    const tpLevels = { op_1_lvl: l1, op_2_lvl: l2, op_3_lvl: l3 };
    tpRaw += computePartTrainingPointsRaw(def, tpLevels, 'power');
    const partTP = computePartTrainingPoints(def, tpLevels, 'power');
    if (partTP > 0) {
      let src = `${partTP} TP: ${def.name}`;
      if (l1 > 0) src += ` (Opt1 ${l1})`;
      if (l2 > 0) src += ` (Opt2 ${l2})`;
      if (l3 > 0) src += ` (Opt3 ${l3})`;
      tpSources.push(src);
    }
    totalTP += partTP;
  });

  // If no duration parts exist, dur_all should be 0 (not 1)
  if (!hasDurationParts) dur_all = 0;

  // Unified power energy equation
  const totalEnergyRaw =
    flat_normal * perc_all + (dur_all + 1) * flat_duration * perc_dur - flat_duration * perc_dur;
  // Reduction parts (e.g. No Attack) and negative base_en rows can drive the sum below
  // zero; Energy cannot be negative (GAME_RULES "Energy Below Zero").
  const totalEnergy = Math.max(0, Math.ceil(totalEnergyRaw));

  return { totalEnergy, totalTP, tpRaw, tpSources, energyRaw: totalEnergyRaw };
}

/**
 * Section EN/TP contribution for creator badges.
 * When section parts use `applyDuration`, duration parts must be included so
 * `dur_all` multiplies correctly — then duration-only energy is subtracted so
 * the badge reflects only this section's share.
 */
export function calculatePowerSectionContribution(
  sectionParts: PowerPartPayload[] = [],
  partsDb: PowerPart[] = [],
  durationParts: PowerPartPayload[] = [],
): Pick<PowerCostResult, 'energyRaw' | 'totalTP'> {
  const sectionOnly = calculatePowerCosts(sectionParts, partsDb);
  const needsDurationContext =
    durationParts.length > 0 && sectionParts.some((pl) => !!pl.applyDuration);
  if (!needsDurationContext) {
    return { energyRaw: sectionOnly.energyRaw, totalTP: sectionOnly.totalTP };
  }
  const withDuration = calculatePowerCosts([...sectionParts, ...durationParts], partsDb);
  const durationOnly = calculatePowerCosts(durationParts, partsDb);
  return {
    energyRaw: withDuration.energyRaw - durationOnly.energyRaw,
    totalTP: sectionOnly.totalTP,
  };
}

// =============================================================================
// Action Type
// =============================================================================

/**
 * Compute action type from parts payload
 */
export function computeActionType(
  partsPayload: PowerPartPayload[] = [],
  partsDb: PowerPart[] = [],
): string {
  const resolved = partsPayload.map((p) => {
    let partId: number | undefined;
    if (p.part?.id !== undefined) {
      partId = Number(p.part.id);
    } else if (p.id !== undefined) {
      partId = Number(p.id);
    } else if (p.part?.name || p.name) {
      const name = p.part?.name || p.name;
      const def = findByIdOrName(partsDb, { name: name! });
      partId = def ? Number(def.id) : undefined;
    }
    return { partId, level: getOptionLevel(p, 1) };
  });

  return deriveActionType(resolved, {
    reaction: PART_IDS.POWER_REACTION,
    quickOrFree: PART_IDS.POWER_QUICK_OR_FREE_ACTION,
    longAction: PART_IDS.POWER_LONG_ACTION,
  });
}

/**
 * Helper when UI stores selector value
 */
export const computeActionTypeFromSelection = actionTypeFromSelection;

// =============================================================================
// Mechanic Part Assembly
// =============================================================================

// =============================================================================
// Range / Area / Duration Derivation
// =============================================================================

/**
 * Convert power creator `range.steps` to a display string (steps 1 → "3 spaces").
 * steps 0 is melee — handle that case separately.
 */
export function formatPowerRangeFromSteps(steps: number): string {
  const spaces = 3 + 3 * (steps - 1);
  return `${spaces} ${spaces > 1 ? 'spaces' : 'space'}`;
}

/**
 * Derive range string from parts
 */
export function deriveRange(partsPayload: PowerPartPayload[] = []): string {
  const pr = partsPayload.find((p) => {
    const partId = p.part?.id ?? p.id;
    if (Number(partId) === PART_IDS.POWER_RANGE) return true;
    const name = p.part?.name || p.name;
    return name === 'Power Range';
  });
  if (!pr) return '1 space';
  const lvl = getOptionLevel(pr, 1);
  const spaces = 3 + 3 * lvl;
  return `${spaces} ${spaces > 1 ? 'spaces' : 'space'}`;
}

/** Area type to part mapping for lookup */
const AREA_TYPE_TO_PART: Record<string, { id: number; name: string }> = {
  sphere: { id: PART_IDS.SPHERE_OF_EFFECT, name: 'Sphere of Effect' },
  cylinder: { id: PART_IDS.CYLINDER_OF_EFFECT, name: 'Cylinder of Effect' },
  cone: { id: PART_IDS.CONE_OF_EFFECT, name: 'Cone of Effect' },
  line: { id: PART_IDS.LINE_OF_EFFECT, name: 'Line of Effect' },
  trail: { id: PART_IDS.TRAIL_OF_EFFECT, name: 'Trail of Effect' },
};

/**
 * Get area part for display (description, op_1_desc) from area config.
 * Used in power creator to show part description when area is selected.
 */
export function getAreaPartForDisplay(
  areaType: string,
  areaLevel: number,
  partsDb: PowerPart[] = [],
): { part: PowerPart; description: string; op1Desc?: string | undefined; op1Level: number } | null {
  const info = AREA_TYPE_TO_PART[areaType];
  if (!info) return null;
  const part = findByIdOrName(partsDb, { id: info.id, name: info.name });
  if (!part) return null;
  const op1Level = Math.max(0, areaLevel - 1);
  return {
    part,
    description: part.description || '',
    op1Desc: part.op_1_desc,
    op1Level,
  };
}

/**
 * Format area for collapsed summary (e.g. "Level 3 Sphere", "Level 1 Cone").
 */
export function formatAreaForDisplay(areaType: string, areaLevel: number): string {
  if (areaType === 'none') return 'Single target';
  const names: Record<string, string> = {
    sphere: 'Sphere',
    cylinder: 'Cylinder',
    cone: 'Cone',
    line: 'Line',
    trail: 'Trail',
  };
  const shape = names[areaType] || areaType;
  return `Level ${areaLevel} ${shape}`;
}

/**
 * Derive area string from parts
 */
export function deriveArea(partsPayload: PowerPartPayload[] = []): string {
  const areaPartIds = [
    PART_IDS.SPHERE_OF_EFFECT,
    PART_IDS.CYLINDER_OF_EFFECT,
    PART_IDS.CONE_OF_EFFECT,
    PART_IDS.LINE_OF_EFFECT,
    PART_IDS.TRAIL_OF_EFFECT,
  ];
  const areaNames = ['Sphere', 'Cylinder', 'Cone', 'Line', 'Trail'];

  for (let i = 0; i < areaPartIds.length; i++) {
    const found = partsPayload.find((p) => {
      const partId = p.part?.id ?? p.id;
      if (Number(partId) === areaPartIds[i]) return true;
      const name = p.part?.name || p.name;
      return name === `${areaNames[i]} of Effect`;
    });
    if (found) {
      const areaName = areaNames[i];
      if (areaName !== undefined) return areaName;
    }
  }
  return '1 target';
}

/**
 * Derive duration string from parts (value + unit with proper pluralization).
 * Uses shared formatDurationFromTypeAndValue for consistency with character sheet, library, codex.
 */
export function deriveDuration(partsPayload: PowerPartPayload[] = []): string {
  const findPartById = (partId: number, fallbackName: string) =>
    partsPayload.find((p) => {
      const id = p.part?.id ?? p.id;
      if (Number(id) === partId) return true;
      const name = p.part?.name || p.name;
      return name === fallbackName;
    });
  const getLvl = (p: PowerPartPayload | undefined) => (p ? getOptionLevel(p, 1) : 0);

  const permanentPart = findPartById(PART_IDS.DURATION_PERMANENT, 'Duration (Permanent)');
  if (permanentPart) return formatDurationFromTypeAndValue('permanent', 0);

  const roundPart = findPartById(PART_IDS.DURATION_ROUND, 'Duration (Round)');
  if (roundPart) {
    const lvl = getLvl(roundPart);
    const rounds = 2 + lvl;
    return formatDurationFromTypeAndValue('rounds', rounds);
  }

  const minutePart = findPartById(PART_IDS.DURATION_MINUTE, 'Duration (Minute)');
  if (minutePart) {
    const lvl = getLvl(minutePart);
    const minutes = [1, 10, 30][lvl] ?? 1;
    return formatDurationFromTypeAndValue('minutes', minutes);
  }

  const hourPart = findPartById(PART_IDS.DURATION_HOUR, 'Duration (Hour)');
  if (hourPart) {
    const lvl = getLvl(hourPart);
    const hours = [1, 6, 12][lvl] ?? 1;
    return formatDurationFromTypeAndValue('hours', hours);
  }

  const dayPart = findPartById(PART_IDS.DURATION_DAYS, 'Duration (Days)');
  if (dayPart) {
    const lvl = getLvl(dayPart);
    const days = [1, 10, 20, 30][lvl] ?? 1;
    return formatDurationFromTypeAndValue('days', days);
  }

  return formatDurationFromTypeAndValue('instant', 0);
}

// =============================================================================
// Chip Formatting
// =============================================================================

/**
 * Format a single power part as a chip
 */
export function formatPowerPartChip(def: PowerPart, pl: PowerPartPayload): PartChipData {
  const l1 = pl.op_1_lvl || 0;
  const l2 = pl.op_2_lvl || 0;
  const l3 = pl.op_3_lvl || 0;

  const finalTP = computePartTrainingPoints(def, pl, 'power');
  const optionLevel = Math.max(l1, l2, l3);
  let text = def.name;
  if (l1 > 0) text += ` (Opt1 ${l1})`;
  if (l2 > 0) text += ` (Opt2 ${l2})`;
  if (l3 > 0) text += ` (Opt3 ${l3})`;
  if (finalTP > 0) text += ` | TP: ${finalTP}`;

  return {
    text,
    description: def.description || '',
    finalTP,
    hasTP: finalTP > 0,
    optionLevel: optionLevel > 0 ? optionLevel : undefined,
  };
}

// =============================================================================
// High-level Display Builder
// =============================================================================

type SavedPowerPart = NonNullable<PowerDocument['parts']>[number];

function isUserOrAdvancedSavedPart(savedPart: SavedPowerPart, partsDb: PowerPart[]): boolean {
  const def = findByIdOrName(partsDb, savedPart);
  if (!def) return false;
  const name = savedPart.name ?? def.name;
  if (name && POWER_AUTO_MECHANIC_PART_NAMES.has(name)) return false;
  if (!def.mechanic) return true;
  if (savedPart.isAdvanced) return true;
  return POWER_ADVANCED_MECHANIC_CATEGORY_SET.has(def.category || '');
}

function powerDocHasCreatorStyleFields(powerDoc: PowerDocument): boolean {
  const hasDamage = (powerDoc.damage ?? []).some(
    (d) => d.type && d.type !== 'none' && Number(d.amount) > 0,
  );
  return (
    hasDamage ||
    !!powerDoc.actionType ||
    !!powerDoc.isReaction ||
    powerDoc.range?.steps !== undefined ||
    (!!powerDoc.area?.type && powerDoc.area.type !== 'none') ||
    (!!powerDoc.duration?.type && powerDoc.duration.type !== 'instant')
  );
}

function buildPowerPartsPayloadForCost(
  powerDoc: PowerDocument,
  partsDb: PowerPart[],
): PowerPartPayload[] {
  const savedParts = Array.isArray(powerDoc.parts) ? powerDoc.parts : [];

  if (!powerDocHasCreatorStyleFields(powerDoc)) {
    return dedupeSavedParts(
      savedParts.map((p) => ({
        id: p.id,
        name: p.name,
        op_1_lvl: p.op_1_lvl || 0,
        op_2_lvl: p.op_2_lvl || 0,
        op_3_lvl: p.op_3_lvl || 0,
        applyDuration: p.applyDuration || false,
      })),
    );
  }

  const userParts: PowerPartPayload[] = savedParts
    .filter((p) => isUserOrAdvancedSavedPart(p, partsDb))
    .map((p) => ({
      id: p.id,
      name: p.name,
      op_1_lvl: p.op_1_lvl || 0,
      op_2_lvl: p.op_2_lvl || 0,
      op_3_lvl: p.op_3_lvl || 0,
      applyDuration: p.applyDuration || false,
    }));

  const mechanicParts = buildMechanicParts({
    creatorType: 'power',
    partsDb,
    action: {
      type: powerDoc.actionType ?? 'basic',
      isReaction: !!powerDoc.isReaction,
    },
    powerDamage: (powerDoc.damage ?? []).map((d) => ({
      type: d.type ?? 'none',
      diceAmount: Number(d.amount) || 0,
      dieSize: Number(d.size) || 6,
      applyDuration: d.applyDuration ?? false,
    })),
    range: powerDoc.range
      ? { steps: powerDoc.range.steps ?? 0, applyDuration: powerDoc.range.applyDuration }
      : undefined,
    area:
      powerDoc.area?.type && powerDoc.area.type !== 'none'
        ? {
            type: powerDoc.area.type as AreaConfig['type'],
            level: powerDoc.area.level ?? 1,
            applyDuration: powerDoc.area.applyDuration,
          }
        : undefined,
    duration:
      powerDoc.duration?.type && powerDoc.duration.type !== 'instant'
        ? {
            type: powerDoc.duration.type as DurationConfig['type'],
            value: powerDoc.duration.value ?? 1,
            applyDuration: powerDoc.duration.applyDuration,
            focus: powerDoc.duration.focus,
            noHarm: powerDoc.duration.noHarm,
            endsOnActivation: powerDoc.duration.endsOnActivation,
            sustain: powerDoc.duration.sustain,
          }
        : undefined,
  });

  const mechanicPayload: PowerPartPayload[] = mechanicParts.map((mp) => ({
    id: mp.id,
    name: mp.name,
    op_1_lvl: mp.op_1_lvl,
    op_2_lvl: mp.op_2_lvl,
    op_3_lvl: mp.op_3_lvl,
    applyDuration: mp.applyDuration ?? false,
  }));

  const rebuiltMechanicNames = new Set(mechanicParts.map((mp) => mp.name));
  const legacyAutoMechanics: PowerPartPayload[] = savedParts
    .filter((p) => {
      const name = p.name ?? '';
      return name && POWER_AUTO_MECHANIC_PART_NAMES.has(name) && !rebuiltMechanicNames.has(name);
    })
    .map((p) => ({
      id: p.id,
      name: p.name,
      op_1_lvl: p.op_1_lvl || 0,
      op_2_lvl: p.op_2_lvl || 0,
      op_3_lvl: p.op_3_lvl || 0,
      applyDuration: p.applyDuration || false,
    }));

  // Dedupe saved-side rows only — mechanicPayload may intentionally repeat the same
  // part id per damage row (e.g. three Elemental Damage lines for fire/ice/lightning).
  return [...dedupeSavedParts([...userParts, ...legacyAutoMechanics]), ...mechanicPayload];
}

interface PowerDocumentFields {
  name?: string | undefined;
  description?: string | undefined;
  parts?:
    | Array<{
        id?: number | undefined;
        name?: string | undefined;
        op_1_lvl?: number | undefined;
        op_2_lvl?: number | undefined;
        op_3_lvl?: number | undefined;
        applyDuration?: boolean | undefined;
        isAdvanced?: boolean | undefined;
      }>
    | undefined;
  damage?:
    | Array<{
        amount?: number | string | undefined;
        size?: number | string | undefined;
        type?: string | undefined;
        applyDuration?: boolean | undefined;
      }>
    | undefined;
  // Directly saved fields from power creator
  actionType?: string | undefined;
  isReaction?: boolean | undefined;
  range?:
    | {
        steps?: number | undefined;
        applyDuration?: boolean | undefined;
      }
    | undefined;
  area?:
    | {
        type?: string | undefined;
        level?: number | undefined;
        applyDuration?: boolean | undefined;
      }
    | undefined;
  duration?:
    | {
        type?: string | undefined;
        value?: number | undefined;
        applyDuration?: boolean | undefined;
        focus?: boolean | undefined;
        noHarm?: boolean | undefined;
        endsOnActivation?: boolean | undefined;
        sustain?: number | undefined;
      }
    | undefined;
}

export type PowerDocument = AllowUndefinedOptionals<PowerDocumentFields>;

/**
 * Build complete display data from a saved power document
 */
export function derivePowerDisplay(
  powerDoc: PowerDocument,
  partsDb: PowerPart[],
): PowerDisplayData {
  const partsPayload: PowerPartPayload[] = buildPowerPartsPayloadForCost(powerDoc, partsDb);

  const calc = calculatePowerCosts(partsPayload, partsDb);

  // Use directly saved actionType if available, otherwise derive from parts; format for display (e.g. Long (3 AP))
  const derivedAction = computeActionType(partsPayload, partsDb);
  const savedAction = powerDoc.actionType
    ? computeActionTypeFromSelection(powerDoc.actionType, !!powerDoc.isReaction)
    : null;
  const actionType = formatActionTypeForDisplay(savedAction || derivedAction);

  // Use directly saved range if available, otherwise derive from parts
  let rangeStr: string;
  if (powerDoc.range && powerDoc.range.steps !== undefined && powerDoc.range.steps > 0) {
    rangeStr = formatPowerRangeFromSteps(powerDoc.range.steps);
  } else {
    rangeStr = deriveRange(partsPayload);
  }

  // Use directly saved area if available, otherwise derive from parts
  let areaStr: string;
  if (powerDoc.area && powerDoc.area.type && powerDoc.area.type !== 'none') {
    const areaNames: Record<string, string> = {
      sphere: 'Sphere',
      cylinder: 'Cylinder',
      cone: 'Cone',
      line: 'Line',
      trail: 'Trail',
    };
    areaStr = areaNames[powerDoc.area.type] || powerDoc.area.type;
    if (powerDoc.area.level && powerDoc.area.level > 1) {
      areaStr += ` ${powerDoc.area.level}`;
    }
  } else {
    areaStr = deriveArea(partsPayload);
  }

  // Use directly saved duration if available, otherwise derive from parts
  let durationStr: string;
  if (powerDoc.duration && powerDoc.duration.type && powerDoc.duration.type !== 'instant') {
    const durType = powerDoc.duration.type;
    const durValue = powerDoc.duration.value ?? 1;
    durationStr = formatDurationWithModifiers(durType, durValue, {
      focus: powerDoc.duration.focus,
      sustain: powerDoc.duration.sustain,
    });
  } else {
    durationStr = deriveDuration(partsPayload);
  }

  // Build part chips
  const partChips: PartChipData[] = partsPayload
    .map((pl) => {
      const def = findByIdOrName(partsDb, pl);
      if (!def) return null;
      return formatPowerPartChip(def, pl);
    })
    .filter((chip): chip is PartChipData => chip !== null);

  return {
    name: powerDoc.name || '',
    description: powerDoc.description || '',
    actionType,
    range: rangeStr,
    area: areaStr,
    duration: durationStr,
    energy: calc.totalEnergy,
    tp: calc.totalTP,
    tpSources: calc.tpSources,
    partChips,
  };
}

// =============================================================================
// Damage Formatting
// =============================================================================

/**
 * Format power damage as [amount]d[size] [type]. Supports multiple damage types (e.g. "2d6 slashing, 1d4 fire").
 */
export function formatPowerDamage(
  damageArr?: Array<{
    amount?: number | string | undefined;
    size?: number | string | undefined;
    type?: string | undefined;
  }>,
): string {
  if (!Array.isArray(damageArr)) return '';
  const parts = damageArr
    .filter((d) => d && d.amount && d.size && d.type && d.type !== 'none')
    .map((d) => `${d.amount}d${d.size} ${d.type}`);
  return parts.join(', ') || '';
}
