/**
 * Crafting Utility Functions
 * ===========================
 * Lookup and calculations for crafting (general table, successes table, outcome).
 * Uses CRAFTING core rules from useGameRules().
 */

import type {
  CraftingRules,
  CraftingTableRow,
  SuccessesTableRow,
  EnhancedCraftingTableRow,
  ConsumableEnhancedTableRow,
  MultipleUseEnergyRow,
} from '@/types/core-rules';

/**
 * Find the general crafting table row for a given currency cost (market price).
 * Uses first row where currencyMin <= cost and (currencyMax is null or cost <= currencyMax).
 */
function findGeneralRow(currencyCost: number, table: CraftingTableRow[]): CraftingTableRow | null {
  for (const row of table) {
    if (currencyCost < row.currencyMin) continue;
    if (row.currencyMax != null && currencyCost > row.currencyMax) continue;
    return row;
  }
  return null;
}

/**
 * Get crafting requirements from currency cost (market price).
 * Consumable: time is multiplied by consumableTimeMultiplier (¼).
 * Bulk: not applied here — caller multiplies requiredSuccesses and session count by bulkCraftMaterialCount.
 */
export function getCraftingRequirements(
  currencyCost: number,
  isConsumable: boolean,
  rules: CraftingRules
): {
  rarity: string;
  difficultyScore: number;
  requiredSuccesses: number;
  materialCost: number;
  timeValue: number;
  timeUnit: 'hours' | 'days';
  /** Number of roll sessions (1 per 5 days, or 1 for 8h Common) */
  sessionCount: number;
} | null {
  const row = findGeneralRow(currencyCost, rules.generalTable);
  if (!row) return null;

  const materialCost = currencyCost * rules.craftingCostMultiplier;
  let timeValue = row.timeValue;
  if (isConsumable) {
    timeValue = Math.max(1, Math.ceil(row.timeValue * rules.consumableTimeMultiplier));
  }

  const requiredSuccesses = row.successes;
  const timeUnit = row.timeUnit;
  const sessionCount = requiredSuccesses; // 1 roll per 5-day period (or 1 for 8h Common)

  return {
    rarity: row.rarity,
    difficultyScore: row.difficultyScore,
    requiredSuccesses,
    materialCost,
    timeValue,
    timeUnit,
    sessionCount,
  };
}

/**
 * Build session labels for roll inputs (e.g. "Hours 1–8", "Days 1–5", "Days 6–10").
 */
export function getCraftingSessionLabels(
  timeValue: number,
  timeUnit: 'hours' | 'days',
  sessionCount: number
): string[] {
  const labels: string[] = [];
  if (timeUnit === 'hours') {
    if (sessionCount <= 1) {
      labels.push(`Hours 1–${timeValue}`);
    } else {
      const perSession = Math.ceil(timeValue / sessionCount);
      for (let i = 0; i < sessionCount; i++) {
        const start = i * perSession + 1;
        const end = Math.min((i + 1) * perSession, timeValue);
        labels.push(`Hours ${start}–${end}`);
      }
    }
  } else {
    if (sessionCount <= 1) {
      labels.push(`Days 1–${timeValue}`);
    } else {
      const perSession = Math.ceil(timeValue / sessionCount);
      for (let i = 0; i < sessionCount; i++) {
        const start = i * perSession + 1;
        const end = Math.min((i + 1) * perSession, timeValue);
        labels.push(`Days ${start}–${end}`);
      }
    }
  }
  return labels;
}

/**
 * Get the successes table row for a given delta (net successes - required).
 * Delta 8+ uses the row with delta 8 (or last row with delta >= 8).
 */
export function getSuccessesTableEffect(
  delta: number,
  table: SuccessesTableRow[]
): { failureEffect?: string; successEffect?: string; row?: SuccessesTableRow } | null {
  const absDelta = Math.abs(delta);
  const isFailure = delta < 0;

  const rowForDelta = (d: number) => table.find((r) => r.delta === d) ?? table.find((r) => r.delta >= 8 && d >= 8);
  const row = absDelta <= 7 ? rowForDelta(absDelta) : table.find((r) => r.delta >= 8) ?? table[table.length - 1];
  if (!row) return null;

  return {
    failureEffect: isFailure ? row.failureEffect : undefined,
    successEffect: !isFailure ? row.successEffect : undefined,
    row,
  };
}

/**
 * Auto-calculate final material cost, retained materials, item worth, extra items from delta + successes table.
 */
export function calculateCraftingOutcome(
  delta: number,
  materialCost: number,
  marketPrice: number,
  table: SuccessesTableRow[]
): {
  finalMaterialCost: number;
  materialsRetained: number;
  itemWorth: number;
  extraItemCount: number;
  choiceExtraOrEnhance: boolean;
  effectText: string;
} {
  const effect = getSuccessesTableEffect(delta, table);
  const isFailure = delta < 0;
  const absDelta = Math.abs(delta);

  const row = effect?.row;
  let finalMaterialCost = materialCost;
  let materialsRetained = 0;
  let itemWorth = marketPrice;
  let extraItemCount = 0;
  let choiceExtraOrEnhance = false;
  let effectText = '';

  if (row) {
    effectText = isFailure ? (row.failureEffect ?? '') : (row.successEffect ?? '');
    if (!isFailure) {
      const retainPct = (row.materialsRetainedPercent ?? 0) / 100;
      materialsRetained = materialCost * retainPct;
      finalMaterialCost = materialCost - materialsRetained;
      const worthPct = (row.successItemWorthPercent ?? 100) / 100;
      itemWorth = marketPrice * worthPct;
      choiceExtraOrEnhance = row.choiceExtraItemOrEnhance ?? false;
      if (absDelta > 7) {
        extraItemCount = absDelta - 7;
      }
    } else {
      const worthPct = (row.failureItemWorthPercent ?? 0) / 100;
      itemWorth = marketPrice * worthPct;
    }
  }

  return {
    finalMaterialCost,
    materialsRetained,
    itemWorth,
    extraItemCount,
    choiceExtraOrEnhance,
    effectText,
  };
}

/**
 * Find the enhanced crafting table row for a given (effective) energy cost.
 * Uses first row where energyMin <= energy and (energyMax is null or energy <= energyMax).
 */
function findEnhancedRow(
  energyCost: number,
  table: EnhancedCraftingTableRow[]
): EnhancedCraftingTableRow | null {
  for (const row of table) {
    if (energyCost < row.energyMin) continue;
    if (row.energyMax != null && energyCost > row.energyMax) continue;
    return row;
  }
  return null;
}

/**
 * Find the consumable enhanced table row for a given (effective) energy cost.
 */
function findConsumableEnhancedRow(
  energyCost: number,
  table: ConsumableEnhancedTableRow[]
): ConsumableEnhancedTableRow | null {
  for (const row of table) {
    if (energyCost < row.energyMin) continue;
    if (row.energyMax != null && energyCost > row.energyMax) continue;
    return row;
  }
  return null;
}

/**
 * Get adjusted energy for multiple-use enhanced items.
 * tableIndex: index into rules.multipleUseTable; -1 or out of range = 100% (single use per full recovery).
 */
export function getMultipleUseAdjustedEnergy(
  baseEnergy: number,
  tableIndex: number,
  rules: CraftingRules
): number {
  const table = rules.multipleUseTable ?? [];
  if (tableIndex < 0 || tableIndex >= table.length) return baseEnergy;
  const pct = table[tableIndex].adjustedEnergyPercent ?? 100;
  return baseEnergy * (pct / 100);
}

/**
 * Get crafting requirements for enhanced (multiple-use) equipment.
 * Uses effective energy cost (base power energy × multiple-use adjustment).
 * Material cost = effectiveEnergy × currencyPerEnergy from the enhanced table.
 */
export function getEnhancedCraftingRequirements(
  effectiveEnergyCost: number,
  rules: CraftingRules
): {
  rarity: string;
  difficultyScore: number;
  requiredSuccesses: number;
  materialCost: number;
  timeValue: number;
  timeUnit: 'hours' | 'days';
  sessionCount: number;
} | null {
  const row = findEnhancedRow(effectiveEnergyCost, rules.enhancedTable ?? []);
  if (!row) return null;
  const materialCost = effectiveEnergyCost * row.currencyPerEnergy;
  return {
    rarity: row.rarity,
    difficultyScore: row.difficultyScore,
    requiredSuccesses: row.successes,
    materialCost,
    timeValue: row.timeValue,
    timeUnit: row.timeUnit,
    sessionCount: row.successes,
  };
}

/**
 * Get crafting requirements for consumable (single-use) enhanced items.
 * Uses consumableEnhancedTable; duration ≤ 1 day, potency ≤ 25 per rules.
 */
export function getConsumableEnhancedRequirements(
  energyCost: number,
  rules: CraftingRules
): {
  rarity: string;
  difficultyScore: number;
  requiredSuccesses: number;
  materialCost: number;
  timeValue: number;
  timeUnit: 'hours' | 'days';
  sessionCount: number;
} | null {
  const row = findConsumableEnhancedRow(
    energyCost,
    rules.consumableEnhancedTable ?? []
  );
  if (!row) return null;
  const materialCost = energyCost * row.costPerEnergy;
  return {
    rarity: row.rarity,
    difficultyScore: row.difficultyScore,
    requiredSuccesses: row.successes,
    materialCost,
    timeValue: row.timeValue,
    timeUnit: row.timeUnit,
    sessionCount: row.successes,
  };
}

/**
 * Get market price for enhanced item: material cost × enhancedSellPriceMultiplier,
 * capped by general table max for the item's rarity bracket (optional; caller can cap).
 */
export function getEnhancedMarketPrice(
  materialCost: number,
  rules: CraftingRules
): number {
  const mult = rules.enhancedSellPriceMultiplier ?? 1.25;
  return materialCost * mult;
}

/**
 * Get requirements for upgrading an enhanced item's potency (25% of original time, cost, successes; same DS).
 * Uses the same enhanced table as initial craft; effectiveEnergyCost should match the item's power (base or multiple-use adjusted).
 */
export function getUpgradePotencyRequirements(
  effectiveEnergyCost: number,
  rules: CraftingRules
): CraftingRequirements | null {
  const base = getEnhancedCraftingRequirements(effectiveEnergyCost, rules);
  if (!base) return null;
  return {
    rarity: base.rarity,
    difficultyScore: base.difficultyScore,
    requiredSuccesses: Math.max(1, Math.ceil(base.requiredSuccesses * 0.25)),
    materialCost: base.materialCost * 0.25,
    timeValue: Math.max(1, Math.ceil(base.timeValue * 0.25)),
    timeUnit: base.timeUnit,
    sessionCount: Math.max(1, Math.ceil(base.sessionCount * 0.25)),
  };
}

/** Requirements shape used by getCraftingRequirements, getUpgradeRequirements, and optional modifiers */
export interface CraftingRequirements {
  rarity: string;
  difficultyScore: number;
  requiredSuccesses: number;
  materialCost: number;
  timeValue: number;
  timeUnit: 'hours' | 'days';
  sessionCount: number;
}

/**
 * Get upgrade requirements: 75% of price difference, time difference, DS = upgraded item, successes = difference.
 * Both prices use the general table; time is normalized to days for difference (8 hours = 1 day).
 */
export function getUpgradeRequirements(
  oldMarketPrice: number,
  newMarketPrice: number,
  rules: CraftingRules
): CraftingRequirements | null {
  if (newMarketPrice <= oldMarketPrice) return null;
  const oldRow = findGeneralRow(oldMarketPrice, rules.generalTable);
  const newRow = findGeneralRow(newMarketPrice, rules.generalTable);
  if (!oldRow || !newRow) return null;

  const mult = rules.upgradeMaterialCostMultiplier ?? 0.75;
  const materialCost = (newMarketPrice - oldMarketPrice) * mult;

  const hoursPerDay = rules.craftingDayHours ?? 8;
  const oldDays = oldRow.timeUnit === 'hours' ? oldRow.timeValue / hoursPerDay : oldRow.timeValue;
  const newDays = newRow.timeUnit === 'hours' ? newRow.timeValue / hoursPerDay : newRow.timeValue;
  let timeDiffDays = Math.max(0, newDays - oldDays);
  if (timeDiffDays < 1) timeDiffDays = 1;
  const timeValue = Math.round(timeDiffDays);
  const timeUnit = 'days' as const;

  const requiredSuccesses = Math.max(1, newRow.successes - oldRow.successes);
  const sessionCount = requiredSuccesses;

  return {
    rarity: newRow.rarity,
    difficultyScore: newRow.difficultyScore,
    requiredSuccesses,
    materialCost,
    timeValue,
    timeUnit,
    sessionCount,
  };
}

/**
 * Apply optional "reduce time by increasing difficulty": +2 DS per step, -5 days, -1 success; max 5 steps.
 * For projects < 5 days: can halve time once (no success reduction).
 */
export function applyReduceTimeByDifficulty(
  base: CraftingRequirements,
  steps: number,
  rules: CraftingRules
): CraftingRequirements {
  const opt = rules.optionalReduceTimeByDifficulty;
  if (!opt || steps <= 0) return base;
  const daysThreshold = 5;
  const isShort = base.timeUnit === 'days' && base.timeValue < daysThreshold || base.timeUnit === 'hours';
  if (isShort && opt.halfTimeWhenUnder5Days && steps >= 1) {
    const timeValue = Math.max(1, Math.floor(base.timeValue / 2));
    return { ...base, timeValue };
  }
  const capped = Math.min(steps, opt.maxSteps);
  const newSuccesses = Math.max(1, base.requiredSuccesses - capped * opt.successesReductionPerStep);
  return {
    ...base,
    difficultyScore: base.difficultyScore + capped * opt.dsIncreasePerStep,
    timeValue: Math.max(1, base.timeValue - capped * opt.daysReductionPerStep),
    requiredSuccesses: newSuccesses,
    sessionCount: newSuccesses,
  };
}

/**
 * Apply optional "reduce time by increasing cost": +50% cost per step, -5 days, -1 success; max 5 steps.
 */
export function applyReduceTimeByCost(
  base: CraftingRequirements,
  steps: number,
  rules: CraftingRules
): CraftingRequirements {
  const opt = rules.optionalReduceTimeByCost;
  if (!opt || steps <= 0) return base;
  const isShort = base.timeUnit === 'days' && base.timeValue < 5 || base.timeUnit === 'hours';
  if (isShort && opt.halfTimeWhenUnder5Days && steps >= 1) {
    const timeValue = Math.max(1, Math.floor(base.timeValue / 2));
    return { ...base, timeValue, materialCost: base.materialCost * 1.5 };
  }
  const capped = Math.min(steps, opt.maxSteps);
  const newSuccesses = Math.max(1, base.requiredSuccesses - capped * opt.successesReductionPerStep);
  const costMultiplier = 1 + (capped * opt.costIncreasePercentPerStep) / 100;
  return {
    ...base,
    materialCost: base.materialCost * costMultiplier,
    timeValue: Math.max(1, base.timeValue - capped * opt.daysReductionPerStep),
    requiredSuccesses: newSuccesses,
    sessionCount: newSuccesses,
  };
}

/**
 * Apply optional "reduce difficulty by spending more time": +1 day (common) or +5 days (other), -1 DS, +1 success.
 */
export function applyReduceDifficultyByTime(
  base: CraftingRequirements,
  isCommonOrConsumableCommonToRare: boolean,
  rules: CraftingRules
): CraftingRequirements {
  const opt = rules.optionalReduceDifficultyByTime;
  if (!opt) return base;
  const extraDays = isCommonOrConsumableCommonToRare ? opt.additionalDaysCommon : opt.additionalDaysOther;
  return {
    ...base,
    difficultyScore: Math.max(1, base.difficultyScore - opt.dsReduction),
    timeValue: base.timeValue + extraDays,
    requiredSuccesses: base.requiredSuccesses + opt.successesIncrease,
    sessionCount: base.sessionCount + opt.successesIncrease,
  };
}

/**
 * Apply optional "reduce difficulty by spending more resources": +25% cost per step, -2 DS; max 4 steps.
 */
export function applyReduceDifficultyByCost(
  base: CraftingRequirements,
  steps: number,
  rules: CraftingRules
): CraftingRequirements {
  const opt = rules.optionalReduceDifficultyByCost;
  if (!opt || steps <= 0) return base;
  const capped = Math.min(steps, opt.maxSteps);
  const costMultiplier = 1 + (capped * opt.costIncreasePercent) / 100;
  return {
    ...base,
    materialCost: base.materialCost * costMultiplier,
    difficultyScore: Math.max(1, base.difficultyScore - capped * opt.dsReduction),
  };
}
