/**
 * Crafting Session Types
 * ======================
 * Types for crafting sessions (hub list + full session data).
 */

export type CraftingSessionStatus = 'planned' | 'in_progress' | 'completed';

/** One roll session (one time period: e.g. Days 1–5) */
export interface CraftingRollSession {
  label: string;
  roll: number | null;
  successes: number;
  failures: number;
}

/** Item reference: library/codex item used as craft target */
export interface CraftingItemRef {
  source: 'library' | 'codex';
  id: string;
  name: string;
  /** Market price (currency) for general crafting */
  marketPrice: number;
  /** Sub-skill id for flavor text (e.g. codex_skills id) */
  subSkillId?: string | null;
}

/** Custom base item for enhanced crafting (e.g. "Ring", "Amulet") when not from codex/library */
export interface CraftingCustomBaseItem {
  name: string;
  marketPrice: number;
}

/** Power reference for enhanced crafting */
export interface CraftingPowerRef {
  source: 'library' | 'official';
  id: string;
  name: string;
  /** Base energy cost of the power (before multiple-use adjustment) */
  energyCost: number;
}

export interface CraftingSessionData {
  name?: string;
  status: CraftingSessionStatus;
  /** Selected item (equipment/armament from library or codex) — or base item for enhanced */
  item: CraftingItemRef | null;
  /** General crafting only for Phase 2 */
  isConsumable: boolean;
  isBulk: boolean;
  /** Enhanced: power imbued; uses Enhanced or Consumable Enhanced table */
  isEnhanced?: boolean;
  /** When isEnhanced: power to imbue (drives energy cost and table lookup) */
  powerRef?: CraftingPowerRef | null;
  /** When isEnhanced: custom base item if not from library/codex */
  customBaseItem?: CraftingCustomBaseItem | null;
  /** When isEnhanced: potency at crafting time; number or 'creator' */
  potency?: number | 'creator';
  /** When isEnhanced + multiple use: index into multipleUseTable; -1 = single use per full recovery */
  multipleUseTableIndex?: number;
  /** Upgrade mode: upgrading an existing item to a higher-tier one */
  isUpgrade?: boolean;
  /** Upgrade potency: re-craft session to raise an enhanced item's potency (25% time/cost/successes, same DS) */
  isUpgradePotency?: boolean;
  /** When isUpgradePotency: user_enhanced_items id to update on completion */
  upgradePotencyEnhancedItemId?: string;
  /** When isUpgrade: the original item being upgraded (library/codex or custom) */
  upgradeOriginalItem?: CraftingItemRef | CraftingCustomBaseItem | null;
  /** Optional crafting mechanics applied at session start (stored for display and recalculation) */
  optionalModifiers?: {
    reduceTimeByDifficultySteps?: number;
    reduceTimeByCostSteps?: number;
    reduceDifficultyByTime?: boolean;
    reduceDifficultyByCostSteps?: number;
  };
  /** DS modifier (e.g. finer tools) applied to difficultyScore */
  dsModifier: number;
  /** Manual additional successes/failures (like skill encounters) */
  additionalSuccesses: number;
  additionalFailures: number;
  /** Required values from rules at session start (snapshot) */
  requiredSuccesses: number;
  difficultyScore: number;
  materialCost: number;
  /** When isEnhanced: enhancement material cost; base item cost may be separate */
  enhancementMaterialCost?: number;
  timeValue: number;
  timeUnit: 'hours' | 'days';
  sessionCount: number;
  /** Roll sessions (one per time period) */
  sessions: CraftingRollSession[];
  /** Set when status becomes completed */
  netDelta?: number;
  /** Outcome snapshot when completed */
  outcome?: {
    finalMaterialCost: number;
    materialsRetained: number;
    itemWorth: number;
    extraItemCount: number;
    choiceExtraOrEnhance: boolean;
    effectText: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface CraftingSession {
  id: string;
  data: CraftingSessionData;
  createdAt?: string;
  updatedAt?: string;
}

export interface CraftingSessionSummary {
  id: string;
  status: CraftingSessionStatus;
  itemName: string;
  currencyCost: number;
  updatedAt?: string;
  createdAt?: string;
}

/** Enhanced equipment saved to library (base item + power) */
export interface UserEnhancedItem {
  id: string;
  name: string;
  /** Base item: from library/codex or custom */
  baseItem: CraftingItemRef | CraftingCustomBaseItem;
  /** Power imbued */
  powerRef: CraftingPowerRef;
  description?: string;
  /** 'full' | 'partial' | 'permanent' */
  usesType?: string;
  usesCount?: number;
  potency?: number;
  createdAt?: string;
  updatedAt?: string;
}
