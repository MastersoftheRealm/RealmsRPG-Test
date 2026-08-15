/**
 * Crafting tool derived helpers (TASK-666e)
 * =========================================
 * Pure derived/sync helpers for `use-crafting-tool-page` — keeps the hook under ~500 LOC.
 */

import { computeSkillRollResult } from '@/lib/game/encounter-utils';
import {
  getCraftingSessionLabels,
  getEnhancedCraftingRequirements,
  getConsumableEnhancedRequirements,
  getEnhancedMarketPrice,
  calculateCraftingOutcome,
  type CraftingRequirements,
} from '@/lib/game/crafting-utils';
import type {
  CraftingSession as CraftingSessionType,
  CraftingRollSession,
  CraftingPowerRef,
  CraftingItemRef,
  CraftingCustomBaseItem,
} from '@/types/crafting';
import { derivePowerDisplay, type PowerDocument } from '@/lib/calculators/power-calc';
import type { PowerPart } from '@/hooks/codex-types';
import type { LibraryPower } from '@/types/library';
import type { CraftingRules } from '@/types/core-rules';
import {
  type PowerOption,
  type UsesType,
  type RequirementsBreakdown,
  resolveMultipleUseIndex,
  getEffectiveCraftingEnergy,
  getSessionDsForIndex,
} from './crafting-tool-helpers';

type CraftingOutcome = ReturnType<typeof calculateCraftingOutcome>;

/** Minimal power shape for energy derivation (user library + official rows). */
type PowerEnergySource = Pick<
  LibraryPower,
  | 'id'
  | 'name'
  | 'description'
  | 'parts'
  | 'damage'
  | 'actionType'
  | 'isReaction'
  | 'range'
  | 'area'
  | 'duration'
>;

const CRAFT_BASE_SKILL_ID = 13;

type CraftSkillFilterable = {
  base_skill_id?: number;
  craft_success_desc?: string;
  craft_failure_desc?: string;
};

export function filterCraftSubSkills<T extends CraftSkillFilterable>(codexSkills: T[]): T[] {
  const withCraftDesc = codexSkills.filter((s) => s.craft_success_desc || s.craft_failure_desc);
  const craftSubs = withCraftDesc.filter((s) => s.base_skill_id === CRAFT_BASE_SKILL_ID);
  return craftSubs.length > 0 ? craftSubs : withCraftDesc;
}

export function buildCraftingPowerOptions(
  userPowers: PowerEnergySource[],
  officialPowers: PowerEnergySource[],
  powerPartsDb: PowerPart[],
): PowerOption[] {
  const map = new Map<string, PowerOption>();
  const toEnergyCost = (raw: PowerEnergySource) => {
    const doc: PowerDocument = {
      name: raw.name,
      description: raw.description,
      parts: raw.parts,
      damage: raw.damage,
      actionType: raw.actionType,
      isReaction: raw.isReaction,
      range: raw.range,
      area: raw.area,
      duration: raw.duration,
    };
    return derivePowerDisplay(doc, powerPartsDb).energy;
  };

  userPowers.forEach((p) => {
    const powerId = String(p.id);
    map.set(powerId, {
      source: 'library',
      id: powerId,
      name: p.name,
      energyCost: toEnergyCost(p),
    });
  });

  officialPowers.forEach((p) => {
    const powerId = String(p.id ?? '');
    if (!powerId || map.has(powerId)) return;
    map.set(powerId, {
      source: 'official',
      id: powerId,
      name: String(p.name ?? powerId),
      energyCost: toEnergyCost(p),
    });
  });

  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

/** Live power metadata for display/requirements; persist only on explicit power select. */
export function resolveLiveCraftingPowerRef(
  isEnhanced: boolean | undefined,
  ref: CraftingPowerRef | null | undefined,
  powerOptions: PowerOption[],
): CraftingPowerRef | null | undefined {
  if (!isEnhanced || !ref) return ref;
  const latest = powerOptions.find((p) => p.id === ref.id);
  if (!latest) return ref;
  if (
    latest.name === ref.name &&
    latest.energyCost === ref.energyCost &&
    latest.source === ref.source
  ) {
    return ref;
  }
  return {
    ...ref,
    name: latest.name,
    source: latest.source,
    energyCost: latest.energyCost,
  };
}

export function buildRequirementsSyncPatch(args: {
  session: CraftingSessionType;
  requirements: CraftingRequirements;
  requirementsBreakdown: RequirementsBreakdown | null;
  rulesData: CraftingRules;
  isEnhanced: boolean;
  isConsumable: boolean;
  resolvedPowerRef: CraftingPowerRef | null | undefined;
  usesType: UsesType;
  usesCount: number;
  quantity: number;
}): Partial<CraftingSessionType['data']> | null {
  const {
    session,
    requirements,
    requirementsBreakdown,
    rulesData,
    isEnhanced,
    isConsumable,
    resolvedPowerRef,
    usesType,
    usesCount,
    quantity,
  } = args;

  const needsSync =
    session.data.difficultyScore !== requirements.difficultyScore ||
    session.data.requiredSuccesses !== requirements.requiredSuccesses ||
    session.data.materialCost !== requirements.materialCost ||
    session.data.timeValue !== requirements.timeValue ||
    session.data.sessionCount !== requirements.sessionCount;
  if (!needsSync) return null;

  let labels: string[];
  if (isEnhanced && session.data.craftBaseItemAlso && requirementsBreakdown) {
    const baseLabels = getCraftingSessionLabels(
      requirementsBreakdown.baseItemReq.timeValue,
      requirementsBreakdown.baseItemReq.timeUnit,
      requirementsBreakdown.baseItemReq.sessionCount,
    );
    const enhancementLabels = getCraftingSessionLabels(
      requirementsBreakdown.enhancementReq.timeValue,
      requirementsBreakdown.enhancementReq.timeUnit,
      requirementsBreakdown.enhancementReq.sessionCount,
    );
    labels = [...baseLabels, ...enhancementLabels];
  } else {
    labels = getCraftingSessionLabels(
      requirements.timeValue,
      requirements.timeUnit,
      requirements.sessionCount,
    );
  }

  const existingSessions = session.data.sessions ?? [];
  const newSessions: CraftingRollSession[] = labels.map((label, i) => {
    if (i < existingSessions.length) {
      return { ...existingSessions[i], label };
    }
    return { label, roll: null, successes: 0, failures: 0 };
  });

  let enhancementMaterialCost: number | undefined;
  if (isEnhanced && resolvedPowerRef?.energyCost != null) {
    const idx = resolveMultipleUseIndex(
      rulesData,
      usesType,
      usesCount,
      session.data.multipleUseTableIndex,
    );
    const effEnergy = getEffectiveCraftingEnergy(resolvedPowerRef.energyCost, idx, rulesData);
    const req = isConsumable
      ? getConsumableEnhancedRequirements(effEnergy, rulesData)
      : getEnhancedCraftingRequirements(effEnergy, rulesData);
    enhancementMaterialCost = req?.materialCost;
  }

  return {
    status: 'in_progress',
    difficultyScore: requirements.difficultyScore,
    requiredSuccesses: requirements.requiredSuccesses,
    materialCost: requirements.materialCost,
    enhancementMaterialCost: isEnhanced ? enhancementMaterialCost : undefined,
    timeValue: requirements.timeValue,
    timeUnit: requirements.timeUnit,
    sessionCount: requirements.sessionCount,
    sessions: newSessions,
    isBulk: quantity === (rulesData.bulkCraftCount ?? 4),
  };
}

export function mapDisplaySessionsWithRollResults(args: {
  sessions: CraftingRollSession[];
  effectiveDS: number;
  dsModifier: number;
  isEnhanced: boolean;
  craftBaseItemAlso: boolean;
  requirementsBreakdown: RequirementsBreakdown | null;
}): CraftingRollSession[] {
  const {
    sessions,
    effectiveDS,
    dsModifier,
    isEnhanced,
    craftBaseItemAlso,
    requirementsBreakdown,
  } = args;
  if (!sessions.length) return sessions;
  return sessions.map((s, index) => {
    if (s.roll == null) return s;
    const dsForSession = getSessionDsForIndex({
      index,
      effectiveDS,
      dsModifier,
      isEnhanced,
      craftBaseItemAlso,
      requirementsBreakdown,
    });
    const { successes, failures } = computeSkillRollResult(s.roll, dsForSession);
    if (successes === s.successes && failures === s.failures) return s;
    return { ...s, successes, failures };
  });
}

export type CraftingSessionTallies = {
  baseSessionSuccesses: number;
  baseSessionFailures: number;
  enhSessionSuccesses: number;
  enhSessionFailures: number;
  enhancementRequired: number;
  baseRequired: number;
  required: number;
  totalEnhSuccesses: number;
  totalEnhFailures: number;
  netDelta: number;
};

export function computeCraftingSessionTallies(args: {
  displaySessions: CraftingRollSession[];
  requirementsBreakdown: RequirementsBreakdown | null;
  isEnhanced: boolean;
  craftBaseItemAlso: boolean;
  requiredSuccesses: number;
  additionalSuccesses: number;
  additionalFailures: number;
}): CraftingSessionTallies {
  const {
    displaySessions,
    requirementsBreakdown,
    isEnhanced,
    craftBaseItemAlso,
    requiredSuccesses,
    additionalSuccesses,
    additionalFailures,
  } = args;

  let baseSessionSuccesses = 0;
  let baseSessionFailures = 0;
  let enhSessionSuccesses = 0;
  let enhSessionFailures = 0;

  if (displaySessions.length && requirementsBreakdown && isEnhanced && craftBaseItemAlso) {
    const baseCount = requirementsBreakdown.baseItemReq.requiredSuccesses;
    displaySessions.forEach((s, index) => {
      if (index < baseCount) {
        baseSessionSuccesses += s.successes;
        baseSessionFailures += s.failures;
      } else {
        enhSessionSuccesses += s.successes;
        enhSessionFailures += s.failures;
      }
    });
  } else {
    const totals = displaySessions.reduce(
      (acc, s) => {
        acc.s += s.successes;
        acc.f += s.failures;
        return acc;
      },
      { s: 0, f: 0 },
    );
    enhSessionSuccesses = totals.s;
    enhSessionFailures = totals.f;
  }

  const enhancementRequired =
    isEnhanced && requirementsBreakdown && craftBaseItemAlso
      ? requirementsBreakdown.enhancementReq.requiredSuccesses
      : requiredSuccesses;

  const baseRequired =
    isEnhanced && requirementsBreakdown && craftBaseItemAlso
      ? requirementsBreakdown.baseItemReq.requiredSuccesses
      : 0;

  const totalEnhSuccesses = enhSessionSuccesses + additionalSuccesses;
  const totalEnhFailures = enhSessionFailures + additionalFailures;
  const netDelta = totalEnhSuccesses - totalEnhFailures - enhancementRequired;

  return {
    baseSessionSuccesses,
    baseSessionFailures,
    enhSessionSuccesses,
    enhSessionFailures,
    enhancementRequired,
    baseRequired,
    required: enhancementRequired,
    totalEnhSuccesses,
    totalEnhFailures,
    netDelta,
  };
}

export function computeLiveCraftingOutcome(args: {
  rulesData: CraftingRules | undefined;
  isEnhanced: boolean;
  materialCost: number;
  item: CraftingItemRef | null;
  customBaseItem: CraftingCustomBaseItem | null;
  netDelta: number;
}): CraftingOutcome | null {
  const { rulesData, isEnhanced, materialCost, item, customBaseItem, netDelta } = args;
  if (!rulesData) return null;
  const baseMarketPrice = isEnhanced
    ? getEnhancedMarketPrice(materialCost, rulesData)
    : (item?.marketPrice ?? customBaseItem?.marketPrice ?? 0);
  if (!baseMarketPrice) return null;
  return calculateCraftingOutcome(
    netDelta,
    materialCost,
    baseMarketPrice,
    rulesData.successesTable,
  );
}

export function computeBaseOutcomeForDisplay(args: {
  rulesData: CraftingRules | undefined;
  requirementsBreakdown: RequirementsBreakdown | null;
  isEnhanced: boolean;
  craftBaseItemAlso: boolean;
  item: CraftingItemRef | null;
  customBaseItem: CraftingCustomBaseItem | null;
  baseRequired: number;
  baseSessionSuccesses: number;
  baseSessionFailures: number;
}): CraftingOutcome | null {
  const {
    rulesData,
    requirementsBreakdown,
    isEnhanced,
    craftBaseItemAlso,
    item,
    customBaseItem,
    baseRequired,
    baseSessionSuccesses,
    baseSessionFailures,
  } = args;
  if (!rulesData || !requirementsBreakdown || !isEnhanced || !craftBaseItemAlso) {
    return null;
  }
  const baseMarketPrice = item?.marketPrice ?? customBaseItem?.marketPrice ?? 0;
  if (!baseMarketPrice) return null;
  const baseMaterialCost = requirementsBreakdown.baseItemReq.materialCost;
  const baseNetDelta =
    baseRequired > 0 ? baseSessionSuccesses - baseSessionFailures - baseRequired : 0;
  return calculateCraftingOutcome(
    baseNetDelta,
    baseMaterialCost,
    baseMarketPrice,
    rulesData.successesTable,
  );
}
