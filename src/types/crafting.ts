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
  subSkillId?: string | null | undefined;
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
  name?: string | undefined;
  status: CraftingSessionStatus;
  /** Selected item (equipment/armament from library or codex) — or base item for enhanced */
  item: CraftingItemRef | null;
  /** General crafting only for Phase 2 */
  isConsumable: boolean;
  isBulk: boolean;
  /** Enhanced: power imbued; uses Enhanced or Consumable Enhanced table */
  isEnhanced?: boolean | undefined;
  /** When isEnhanced: power to imbue (drives energy cost and table lookup) */
  powerRef?: CraftingPowerRef | null | undefined;
  /** When isEnhanced: custom base item if not from library/codex */
  customBaseItem?: CraftingCustomBaseItem | null | undefined;
  /** Whether the custom base item editor is currently open */
  isEditingCustomBaseItem?: boolean | undefined;
  /** When isEnhanced: potency at crafting time; number or 'creator' */
  potency?: number | 'creator' | undefined;
  /** When isEnhanced + multiple use: index into multipleUseTable; -1 = single use per full recovery */
  multipleUseTableIndex?: number | undefined;
  /**
   * Enhanced item uses configuration.
   * usesType: 'full' | 'partial' | 'permanent' (or undefined for default single use per Full Recovery).
   * usesCount: number of uses per recovery when usesType is 'full' or 'partial'.
   */
  usesType?: 'full' | 'partial' | 'permanent' | undefined;
  usesCount?: number | undefined;
  /** When isEnhanced: include crafting requirements for the base item in addition to enhancement */
  craftBaseItemAlso?: boolean | undefined;
  /** Upgrade mode: upgrading an existing item to a higher-tier one */
  isUpgrade?: boolean | undefined;
  /** Upgrade potency: re-craft session to raise an enhanced item's potency (25% time/cost/successes, same DS) */
  isUpgradePotency?: boolean | undefined;
  /** When isUpgradePotency: user_enhanced_items id to update on completion */
  upgradePotencyEnhancedItemId?: string | undefined;
  /** When isUpgrade: the original item being upgraded (library/codex or custom) */
  upgradeOriginalItem?: CraftingItemRef | CraftingCustomBaseItem | null | undefined;
  /** Optional crafting mechanics applied at session start (stored for display and recalculation) */
  optionalModifiers?:
    | {
        reduceTimeByDifficultySteps?: number | undefined;
        reduceTimeByCostSteps?: number | undefined;
        /** Number of steps (was boolean in v1, now numeric for multi-step support) */
        reduceDifficultyByTime?: number | boolean | undefined;
        reduceDifficultyByCostSteps?: number | undefined;
      }
    | undefined;
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
  enhancementMaterialCost?: number | undefined;
  timeValue: number;
  timeUnit: 'hours' | 'days';
  sessionCount: number;
  /** Roll sessions (one per time period) */
  sessions: CraftingRollSession[];
  /** Set when status becomes completed */
  netDelta?: number | undefined;
  /** Outcome snapshot when completed */
  outcome?:
    | {
        finalMaterialCost: number;
        materialsRetained: number;
        itemWorth: number;
        extraItemCount: number;
        choiceExtraOrEnhance: boolean;
        effectText: string;
      }
    | undefined;
  /** How many copies of the item you intend to craft (1 by default) */
  quantity?: number | undefined;
  createdAt?: string | undefined;
  updatedAt?: string | undefined;
}

export interface CraftingSession {
  id: string;
  data: CraftingSessionData;
  createdAt?: string | undefined;
  updatedAt?: string | undefined;
}

export interface CraftingSessionSummary {
  id: string;
  status: CraftingSessionStatus;
  itemName: string;
  currencyCost: number;
  updatedAt?: string | undefined;
  createdAt?: string | undefined;
}

/** Enhanced equipment saved to library (base item + power) */
export interface UserEnhancedItem {
  id: string;
  name: string;
  /** Base item: from library/codex or custom */
  baseItem: CraftingItemRef | CraftingCustomBaseItem;
  /** Power imbued */
  powerRef: CraftingPowerRef;
  description?: string | undefined;
  /** Currency cost of the enhanced item (market price) */
  currencyCost?: number | undefined;
  /** Rarity of the enhanced item */
  rarity?: string | undefined;
  /** 'full' | 'partial' | 'permanent' */
  usesType?: string | undefined;
  usesCount?: number | undefined;
  potency?: number | undefined;
  createdAt?: string | undefined;
  updatedAt?: string | undefined;
}

/** Recovery / uses mode for official + admin enhanced items */
export type EnhancedItemUsesType = 'full' | 'partial' | 'permanent';

/**
 * JSONB `payload` on `official_enhanced_items`.
 * Known optional snapshot fields used by crafting/admin; open index for forward-compatible extensions.
 */
export interface OfficialEnhancedItemPayload {
  powerEnergy?: number | undefined;
  materialCost?: number | undefined;
  currencyCost?: number | undefined;
  rarity?: string | undefined;
  potency?: number | 'creator' | undefined;
  multipleUseTableIndex?: number | undefined;
  craftBaseItemAlso?: boolean | undefined;
  [key: string]: unknown;
}

/** Row from GET `/api/official/enhanced-items` (admin Realms Library). */
export interface OfficialEnhancedItem {
  id: string;
  name: string;
  description?: string | null | undefined;
  currency_cost: number;
  rarity: string;
  base_item_source: string;
  base_item_id: string | null;
  base_item_name: string;
  base_item_description?: string | null | undefined;
  power_source: string;
  power_id: string;
  power_name: string;
  uses_type: string;
  uses_count: number | null;
  /** JSONB; may be null from DB — hook normalizes to `{}` on fetch. */
  payload: OfficialEnhancedItemPayload | null;
  created_at?: string | undefined;
  updated_at?: string | undefined;
}

/** POST body for creating an official enhanced item (admin). */
export interface CreateOfficialEnhancedItemInput {
  name: string;
  description?: string | undefined;
  baseItemSource: 'codex' | 'public' | 'custom';
  baseItemId?: string | undefined;
  baseItemName: string;
  baseItemDescription?: string | undefined;
  powerSource: 'official' | 'public' | 'library';
  powerId: string;
  powerName: string;
  powerEnergy: number;
  usesType: EnhancedItemUsesType;
  usesCount?: number | undefined;
  payload?: OfficialEnhancedItemPayload | undefined;
}

/** PATCH body for updating an official enhanced item (admin). */
export interface UpdateOfficialEnhancedItemInput {
  name?: string | undefined;
  description?: string | null | undefined;
  usesType?: EnhancedItemUsesType | undefined;
  usesCount?: number | null | undefined;
  payload?: OfficialEnhancedItemPayload | undefined;
}
