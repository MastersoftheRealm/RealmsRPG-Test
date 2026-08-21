/**
 * Crafting tool page helpers (TASK-607)
 * =====================================
 * Pure helpers co-located with the crafting session facade — no parallel crafting system.
 */

import type { CraftingSelectedItem } from '@/components/crafting/CraftingItemSelectModal';
import {
  getCraftingRequirements,
  getUpgradeRequirements,
  getEnhancedCraftingRequirements,
  getConsumableEnhancedRequirements,
  getMultipleUseAdjustedEnergy,
  applyReduceTimeByDifficulty,
  applyReduceTimeByCost,
  applyReduceDifficultyByTime,
  applyReduceDifficultyByCost,
  type CraftingRequirements,
} from '@/lib/game/crafting-utils';
import type {
  CraftingSession as CraftingSessionType,
  CraftingItemRef,
  CraftingCustomBaseItem,
  CraftingPowerRef,
} from '@/types/crafting';
import type { CraftingRules } from '@/types/core-rules';

export type PowerOption = {
  source: 'library' | 'official';
  id: string;
  name: string;
  energyCost: number;
};

export type UsesType = 'full' | 'partial' | 'permanent';

export type RequirementsBreakdown = {
  baseItemReq: CraftingRequirements;
  enhancementReq: CraftingRequirements;
};

export function toCraftingItemRef(c: CraftingSelectedItem): CraftingItemRef {
  return {
    source: c.source === 'library' ? 'library' : 'codex',
    id: c.id,
    name: c.name,
    marketPrice: c.marketPrice,
  };
}

export function findMultipleUseIndexForConfig(
  rules: CraftingRules | undefined,
  usesType: UsesType | undefined,
  usesCount: number | undefined,
): number {
  if (!rules || !usesType) return -1;
  const table = rules.multipleUseTable ?? [];
  if (usesType === 'permanent') {
    return table.findIndex(
      (row) => row.partialRecovery === 'permanent' && row.fullRecovery === 'permanent',
    );
  }
  if (!usesCount) return -1;
  if (usesType === 'full') {
    return table.findIndex(
      (row) => typeof row.fullRecovery === 'number' && row.fullRecovery === usesCount,
    );
  }
  if (usesType === 'partial') {
    return table.findIndex(
      (row) => typeof row.partialRecovery === 'number' && row.partialRecovery === usesCount,
    );
  }
  return -1;
}

export function resolveMultipleUseIndex(
  rules: CraftingRules | undefined,
  usesType: UsesType | undefined,
  usesCount: number | undefined,
  explicitIndex: number | undefined,
): number {
  const fromConfig = findMultipleUseIndexForConfig(rules, usesType, usesCount);
  return fromConfig >= 0 ? fromConfig : (explicitIndex ?? -1);
}

export function getEffectiveCraftingEnergy(
  energyCost: number,
  multiIdx: number,
  rules: CraftingRules,
): number {
  return multiIdx >= 0 ? getMultipleUseAdjustedEnergy(energyCost, multiIdx, rules) : energyCost;
}

/** Uses-count choices for full/partial recovery selects. */
export function getUsesCountOptions(
  rules: CraftingRules | undefined,
  usesType: UsesType,
): number[] {
  const table = rules?.multipleUseTable ?? [];
  const values =
    usesType === 'full'
      ? table
          .map((row) => (typeof row.fullRecovery === 'number' ? row.fullRecovery : null))
          .filter((n): n is number => n != null)
      : table
          .map((row) => (typeof row.partialRecovery === 'number' ? row.partialRecovery : null))
          .filter((n): n is number => n != null);
  const unique = Array.from(new Set(values)).sort((a, b) => a - b);
  return unique.length ? unique : [1];
}

export function getSessionDsForIndex(args: {
  index: number;
  effectiveDS: number;
  dsModifier: number;
  isEnhanced: boolean;
  craftBaseItemAlso: boolean;
  requirementsBreakdown: RequirementsBreakdown | null;
}): number {
  const { index, effectiveDS, dsModifier, isEnhanced, craftBaseItemAlso, requirementsBreakdown } =
    args;
  if (isEnhanced && craftBaseItemAlso && requirementsBreakdown) {
    const baseCount = requirementsBreakdown.baseItemReq.requiredSuccesses;
    const baseDs = requirementsBreakdown.baseItemReq.difficultyScore;
    const enhDs = requirementsBreakdown.enhancementReq.difficultyScore;
    const baseOrEnhDs = index < baseCount ? baseDs : enhDs;
    return baseOrEnhDs + dsModifier;
  }
  return effectiveDS;
}

export function computeCraftingRequirements(args: {
  rulesData: CraftingRules;
  session: CraftingSessionType;
  item: CraftingItemRef | null;
  customBaseItem: CraftingCustomBaseItem | null;
  upgradeOriginalItem: CraftingItemRef | CraftingCustomBaseItem | null;
  isConsumable: boolean;
  quantity: number;
  isEnhanced: boolean;
  isUpgrade: boolean;
  resolvedPowerRef: CraftingPowerRef | null | undefined;
  usesType: UsesType;
  usesCount: number;
}): CraftingRequirements | null {
  const {
    rulesData,
    session,
    item,
    customBaseItem,
    upgradeOriginalItem,
    isConsumable,
    quantity,
    isEnhanced,
    isUpgrade,
    resolvedPowerRef,
    usesType,
    usesCount,
  } = args;

  if (!item && !customBaseItem) return null;
  let base: CraftingRequirements | null = null;

  if (isUpgrade && (item || customBaseItem) && upgradeOriginalItem) {
    const oldPrice = upgradeOriginalItem.marketPrice;
    const newPrice = item?.marketPrice ?? customBaseItem?.marketPrice ?? 0;
    if (!oldPrice || !newPrice) return null;
    const req = getUpgradeRequirements(oldPrice, newPrice, rulesData);
    if (!req) return null;
    base = req;
  } else if (isEnhanced && resolvedPowerRef) {
    const multiIdx = resolveMultipleUseIndex(
      rulesData,
      usesType,
      usesCount,
      session.data.multipleUseTableIndex,
    );
    const energyCost = resolvedPowerRef.energyCost ?? 10;
    const effectiveEnergy = getEffectiveCraftingEnergy(energyCost, multiIdx, rulesData);
    const enhancementReq = isConsumable
      ? getConsumableEnhancedRequirements(effectiveEnergy, rulesData)
      : getEnhancedCraftingRequirements(effectiveEnergy, rulesData);
    if (!enhancementReq) return null;

    if (session.data.craftBaseItemAlso) {
      const baseItemMarketPrice = item?.marketPrice ?? customBaseItem?.marketPrice ?? 0;
      const baseItemReq = getCraftingRequirements(baseItemMarketPrice, false, rulesData);
      if (baseItemReq) {
        const dayHours = rulesData.craftingDayHours ?? 8;
        const toHours = (req: CraftingRequirements) =>
          req.timeUnit === 'days' ? req.timeValue * dayHours : req.timeValue;
        const combinedHours = toHours(baseItemReq) + toHours(enhancementReq);
        const combinedTimeUnit: 'hours' | 'days' = combinedHours >= dayHours ? 'days' : 'hours';
        const combinedTimeValue =
          combinedTimeUnit === 'days'
            ? Math.max(1, Math.ceil(combinedHours / dayHours))
            : Math.max(1, Math.ceil(combinedHours));

        base = {
          rarity: enhancementReq.rarity,
          difficultyScore: Math.max(baseItemReq.difficultyScore, enhancementReq.difficultyScore),
          requiredSuccesses: baseItemReq.requiredSuccesses + enhancementReq.requiredSuccesses,
          materialCost: baseItemReq.materialCost + enhancementReq.materialCost,
          timeValue: combinedTimeValue,
          timeUnit: combinedTimeUnit,
          sessionCount: baseItemReq.sessionCount + enhancementReq.sessionCount,
        };
      } else {
        base = enhancementReq;
      }
    } else {
      base = enhancementReq;
    }
  } else {
    const baseMarketPrice = item?.marketPrice ?? customBaseItem?.marketPrice ?? 0;
    if (!baseMarketPrice) return null;
    const req = getCraftingRequirements(baseMarketPrice, isConsumable, rulesData);
    if (!req) return null;
    base = req;
  }

  const bulkItems = rulesData.bulkCraftCount ?? 4;
  const bulkMaterialCount = rulesData.bulkCraftMaterialCount ?? 3;
  const isBulkQuantity = quantity === bulkItems;
  const multiplier = isBulkQuantity ? bulkMaterialCount : quantity;
  if (multiplier > 1) {
    base = {
      ...base,
      requiredSuccesses: base.requiredSuccesses * multiplier,
      sessionCount: base.sessionCount * multiplier,
      materialCost: base.materialCost * multiplier,
      timeValue: base.timeValue * multiplier,
    };
  }

  let r = base;
  const mods = session.data.optionalModifiers;
  const isCommonOrConsumableCommonToRare =
    r.rarity === 'Common' || (isConsumable && ['Common', 'Uncommon', 'Rare'].includes(r.rarity));
  if (
    mods?.reduceDifficultyByTime &&
    typeof mods.reduceDifficultyByTime === 'number' &&
    mods.reduceDifficultyByTime > 0
  ) {
    for (let i = 0; i < mods.reduceDifficultyByTime; i++) {
      r = applyReduceDifficultyByTime(r, isCommonOrConsumableCommonToRare, rulesData);
    }
  }
  if ((mods?.reduceDifficultyByCostSteps ?? 0) > 0) {
    r = applyReduceDifficultyByCost(r, mods!.reduceDifficultyByCostSteps!, rulesData);
  }
  if ((mods?.reduceTimeByDifficultySteps ?? 0) > 0) {
    r = applyReduceTimeByDifficulty(r, mods!.reduceTimeByDifficultySteps!, rulesData);
  }
  if ((mods?.reduceTimeByCostSteps ?? 0) > 0) {
    r = applyReduceTimeByCost(r, mods!.reduceTimeByCostSteps!, rulesData);
  }
  return r;
}

export function computeRequirementsBreakdown(args: {
  rulesData: CraftingRules;
  session: CraftingSessionType;
  item: CraftingItemRef | null;
  customBaseItem: CraftingCustomBaseItem | null;
  isConsumable: boolean;
  isEnhanced: boolean;
  resolvedPowerRef: CraftingPowerRef | null | undefined;
  usesType: UsesType;
  usesCount: number;
}): RequirementsBreakdown | null {
  const {
    rulesData,
    session,
    item,
    customBaseItem,
    isConsumable,
    isEnhanced,
    resolvedPowerRef,
    usesType,
    usesCount,
  } = args;

  if (
    !isEnhanced ||
    !session.data.craftBaseItemAlso ||
    !resolvedPowerRef ||
    (!item && !customBaseItem)
  ) {
    return null;
  }
  const baseItemMarketPrice = item?.marketPrice ?? customBaseItem?.marketPrice ?? 0;
  const baseItemReq = getCraftingRequirements(baseItemMarketPrice, false, rulesData);
  const multiIdx = resolveMultipleUseIndex(
    rulesData,
    usesType,
    usesCount,
    session.data.multipleUseTableIndex,
  );
  const energyCost = resolvedPowerRef.energyCost ?? 10;
  const effectiveEnergy = getEffectiveCraftingEnergy(energyCost, multiIdx, rulesData);
  const enhancementReq = isConsumable
    ? getConsumableEnhancedRequirements(effectiveEnergy, rulesData)
    : getEnhancedCraftingRequirements(effectiveEnergy, rulesData);
  if (!baseItemReq || !enhancementReq) return null;
  return { baseItemReq, enhancementReq };
}

export function computeOptionalModifierMaxSteps(
  rulesData: CraftingRules | undefined,
  requirements: CraftingRequirements | null,
): {
  maxReduceTimeByDifficultySteps: number;
  maxReduceTimeByCostSteps: number;
  maxReduceDifficultyByTimeSteps: number;
  maxReduceDifficultyByCostSteps: number;
} {
  const empty = {
    maxReduceTimeByDifficultySteps: 0,
    maxReduceTimeByCostSteps: 0,
    maxReduceDifficultyByTimeSteps: 0,
    maxReduceDifficultyByCostSteps: 0,
  };
  if (!rulesData || !requirements) {
    return {
      ...empty,
      maxReduceDifficultyByCostSteps: rulesData?.optionalReduceDifficultyByCost?.maxSteps ?? 0,
    };
  }

  const isShort =
    (requirements.timeUnit === 'days' && requirements.timeValue < 5) ||
    requirements.timeUnit === 'hours';

  let maxReduceTimeByDifficultySteps = 0;
  if (rulesData.optionalReduceTimeByDifficulty) {
    const opt = rulesData.optionalReduceTimeByDifficulty;
    if (isShort) {
      maxReduceTimeByDifficultySteps = opt.halfTimeWhenUnder5Days ? 1 : 0;
    } else {
      const maxByTime = Math.floor((requirements.timeValue - 1) / opt.daysReductionPerStep);
      const maxBySuccesses = requirements.requiredSuccesses - 1;
      maxReduceTimeByDifficultySteps = Math.min(opt.maxSteps, maxByTime, maxBySuccesses);
    }
  }

  let maxReduceTimeByCostSteps = 0;
  if (rulesData.optionalReduceTimeByCost) {
    const opt = rulesData.optionalReduceTimeByCost;
    if (isShort) {
      maxReduceTimeByCostSteps = opt.halfTimeWhenUnder5Days ? 1 : 0;
    } else {
      const maxByTime = Math.floor((requirements.timeValue - 1) / opt.daysReductionPerStep);
      const maxBySuccesses = requirements.requiredSuccesses - 1;
      maxReduceTimeByCostSteps = Math.min(opt.maxSteps, maxByTime, maxBySuccesses);
    }
  }

  const maxReduceDifficultyByTimeSteps = rulesData.optionalReduceDifficultyByTime
    ? Math.min(
        5,
        Math.max(
          0,
          Math.floor(
            (requirements.difficultyScore - 1) /
              (rulesData.optionalReduceDifficultyByTime.dsReduction || 1),
          ),
        ),
      )
    : 0;

  const maxReduceDifficultyByCostSteps = rulesData.optionalReduceDifficultyByCost?.maxSteps ?? 0;

  return {
    maxReduceTimeByDifficultySteps,
    maxReduceTimeByCostSteps,
    maxReduceDifficultyByTimeSteps,
    maxReduceDifficultyByCostSteps,
  };
}
