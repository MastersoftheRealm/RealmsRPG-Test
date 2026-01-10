/**
 * Calculators Index
 * ==================
 * Export all calculator utilities
 */

// Re-export shared ID constants and utilities
export { PART_IDS, PROPERTY_IDS, GENERAL_PROPERTY_IDS, GENERAL_PROPERTY_NAMES, findByIdOrName, findByIdOrNameValue, normalizeRef, normalizeRefsArray } from '@/lib/id-constants';
export type { HasIdAndName } from '@/lib/id-constants';

// Power Calculator
export {
  calculatePowerCosts,
  computeActionType as computePowerActionType,
  computeActionTypeFromSelection as computePowerActionTypeFromSelection,
  deriveRange,
  deriveArea,
  deriveDuration,
  formatPowerPartChip,
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
  computeActionType as computeTechniqueActionType,
  computeActionTypeFromSelection as computeTechniqueActionTypeFromSelection,
  computeSplits as computeTechniqueSplits,
  computeAdditionalDamageLevel,
  buildMechanicPartPayload,
  formatTechniquePartChip,
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

// Item Calculator
export {
  calculateItemCosts,
  calculateCurrencyCostAndRarity,
  calculateGoldCostAndRarity,
  computeSplits as computeItemSplits,
  formatDamage as formatItemDamage,
  formatRange,
  deriveDamageReductionFromProperties,
  extractProficiencies,
  deriveItemDisplay,
  formatProficiencyChip,
  isGeneralProperty,
  type ItemPropertyPayload,
  type ItemCostResult,
  type RarityResult,
  type ProficiencyInfo,
  type ItemDamage,
  type ItemDocument,
  type ItemDisplayData,
} from './item-calc';
