/**
 * Calculators Index
 * ==================
 * Export all calculator utilities
 */

// Unified Mechanic Builder (shared by Power, Technique, and future Empowered Technique creators)
export {
  buildMechanicParts,
  calculateDamageOptionLevel,
  type CreatorType,
  type MechanicPartResult,
  type MechanicBuilderContext,
  type ActionConfig,
  type PowerDamageConfig,
  type TechniqueDamageConfig,
  type RangeConfig,
  type AreaConfig,
  type DurationConfig,
  type LegacyPowerMechanicContext,
  type LegacyTechniqueMechanicContext,
} from './mechanic-builder';

export {
  POWER_ADVANCED_MECHANIC_CATEGORIES,
  POWER_ADVANCED_MECHANIC_CATEGORY_SET,
  POWER_AUTO_MECHANIC_PART_NAMES,
  type PowerAdvancedMechanicCategory,
} from './power-mechanic-constants';

// Power Calculator
export {
  calculatePowerCosts,
  calculatePowerSectionContribution,
  computeActionTypeFromSelection as computePowerActionTypeFromSelection,
  formatPowerRangeFromSteps,
  deriveRange,
  deriveArea,
  deriveDuration,
  getAreaPartForDisplay,
  formatAreaForDisplay,
  derivePowerDisplay,
  formatPowerDamage,
  type PowerPartPayload,
  type PowerCostResult,
  type PowerDisplayData,
  type PartChipData,
  type PowerDocument,
} from './power-calc';

// Technique Calculator
export {
  calculateTechniqueCosts,
  computeActionTypeFromSelection as computeTechniqueActionTypeFromSelection,
  deriveTechniqueDisplay,
  formatTechniqueDamage,
  type TechniquePart,
  type TechniquePartPayload,
  type TechniqueCostResult,
  type TechniqueDisplayData,
  type TechniqueChipData,
  type TechniqueDocument,
  type MechanicContext,
} from './technique-calc';

// Empowered Technique Calculator
export {
  calculateEmpoweredTechniqueCosts,
  type EmpoweredTechniqueCostResult,
  type CalculateEmpoweredTechniqueCostsInput,
} from './empowered-technique-calc';

export {
  pickCheaperEnPart,
  toEmpoweredAutoMechanicPart,
  type EmpoweredPartSide,
  type EmpoweredPartCostCandidate,
} from './empowered-overlap-parts';

// Item Calculator
export {
  calculateItemCosts,
  calculateCurrencyCostAndRarity,
  resolveItemMarketPricing,
  resolveWeaponRangeDisplay,
  formatWeaponRangeDisplayCompact,
  deriveDamageReductionFromProperties,
  deriveAgilityReductionFromProperties,
  deriveCriticalRangeIncreaseFromProperties,
  deriveShieldAmountFromProperties,
  deriveShieldDamageFromProperties,
  deriveItemDisplay,
  isGeneralProperty,
  isMechanicProperty,
  filterSavedItemPropertiesForList,
  resolveItemPropertyCodexRow,
  trainingPointsForItemPropertyRef,
  type ItemPropertyTpRow,
  type ItemPropertyPayload,
  type ItemCostResult,
  type ItemMarketPricing,
  type ItemStoredCostSums,
  type RarityResult,
  type ProficiencyInfo,
  type ItemDamage,
  type ItemDocument,
  type ItemDisplayData,
} from './item-calc';
