/**
 * Calculators Index
 * ==================
 * Export all calculator utilities
 */

// Re-export shared ID constants and utilities
export { PART_IDS, PROPERTY_IDS, GENERAL_PROPERTY_IDS, GENERAL_PROPERTY_NAMES, findByIdOrName, findByIdOrNameValue, normalizeRef, normalizeRefsArray } from '@/lib/id-constants';
export type { HasIdAndName } from '@/lib/id-constants';

// Unified Mechanic Builder (shared by Power, Technique, and future Empowered Technique creators)
export {
  buildMechanicParts,
  buildPowerMechanicParts,
  buildTechniqueMechanicParts,
  calculatePowerDamageLevel,
  calculateTechniqueDamageLevel,
  calculateSplitDiceLevel,
  type CreatorType,
  type MechanicPartResult,
  type MechanicBuilderContext,
  type ActionConfig,
  type PowerDamageConfig,
  type TechniqueDamageConfig,
  type RangeConfig,
  type AreaConfig,
  type DurationConfig,
  type WeaponConfig as MechanicWeaponConfig,
  type LegacyPowerMechanicContext,
  type LegacyTechniqueMechanicContext,
} from './mechanic-builder';

// Power Calculator
export {
  calculatePowerCosts,
  computeActionType as computePowerActionType,
  computeActionTypeFromSelection as computePowerActionTypeFromSelection,
  buildPowerMechanicPartPayload,
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
  type PowerMechanicContext,
} from './power-calc';

// Duration display (shared: character sheet, library, codex)
export { formatDurationFromTypeAndValue, formatDurationWithModifiers } from '@/lib/utils/duration';

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
  isMechanicProperty,
  filterSavedItemPropertiesForList,
  type ItemPropertyPayload,
  type ItemCostResult,
  type RarityResult,
  type ProficiencyInfo,
  type ItemDamage,
  type ItemDocument,
  type ItemDisplayData,
} from './item-calc';
