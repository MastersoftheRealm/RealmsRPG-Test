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
  POWER_CALC_SECTION_TITLES,
  POWER_CALC_SECTION_BY_NAME,
  POWER_DURATION_TYPE_PART_NAMES,
  POWER_DURATION_MODIFIER_PART_NAMES,
  type PowerAdvancedMechanicCategory,
  type PowerCalcSectionId,
} from './power-mechanic-constants';

// Power Calculator
export {
  calculatePowerCosts,
  calculatePowerSectionContribution,
  analyzePowerEnergy,
  computeActionTypeFromSelection as computePowerActionTypeFromSelection,
  formatPowerRangeFromSteps,
  deriveRange,
  deriveArea,
  deriveDuration,
  getAreaPartForDisplay,
  formatAreaForDisplay,
  derivePowerDisplay,
  derivePlainPowerDisplay,
  formatPowerDamage,
  finalizePowerEnergy,
  formatEnergyStat,
  type DerivePowerDisplayOptions,
  type PowerPartPayload,
  type PowerCostResult,
  type PowerDisplayData,
  type PartChipData,
  type PowerDocument,
  type PowerEnergyAnalysis,
  type PowerEnergyLine,
} from './power-calc';

// Power composition / built-in variants (ADR-0029)
export {
  POWER_COMPOSITION_STRUCTURES,
  POWER_COMPOSITION_STRUCTURE_LABELS,
  POWER_RANDOMIZE_DIE_SIDES,
  normalizePowerComposition,
  isIndependentRandomizeFace,
  expandLegacyRandomizeFace,
  isRandomizeDieComplete,
  powerCreatorSaveBlockReason,
  isPowerCompositionMechanicPart,
  powerCompositionHelpText,
  resolvePowerComposition,
  selectedResolvedVariant,
  composedPowerDamage,
  composedPowerCategoryDamage,
  reverseDiscountApplied,
  powerCompositionEnergyLines,
  composedPowerSavedParts,
  composedPowerProficiencyParts,
  formatPowerCompositionSummary,
  formatEnergyIntermediate,
  reverseActionDivisorNote,
  powerSpecHasContent,
  type PowerComposition,
  type PowerCompositionStructure,
  type PowerCompositionResolution,
  type PowerVariantSpec,
  POWER_VARIANT_OVERRIDE_FIELDS,
  type PowerVariantOverrideField,
  type PowerVariantPolarity,
  type ResolvedPowerVariant,
} from './power-composition';

export {
  buildPowerAdvancedCalculationGroups,
  formatEnergyNumber,
  formatSignedPercent,
  formatPercentagePartModifier,
  formatDurationPartModifier,
  formatDamageEnergyLabel,
  defaultPowerEnergyLineLabel,
  type PowerAdvancedCalcGroup,
  type PowerAdvancedCalcRow,
} from './power-energy-breakdown';

// Technique Calculator
export {
  calculateTechniqueCosts,
  computeActionTypeFromSelection as computeTechniqueActionTypeFromSelection,
  deriveTechniqueDisplay,
  formatTechniqueDamage,
  type TechniquePart,
  type TechniquePartPayload,
  type TechniqueCalcSectionId,
  type TechniqueCostResult,
  type TechniqueDisplayData,
  type TechniqueChipData,
  type TechniqueDocument,
  type MechanicContext,
} from './technique-calc';

export {
  analyzeTechniqueEnergy,
  buildTechniqueAdvancedCalculationGroups,
  TECHNIQUE_CALC_SECTION_BY_NAME,
  type TechniqueAdvancedCalcGroup,
  type TechniqueAdvancedCalcRow,
  type TechniqueEnergyAnalysis,
  type TechniqueEnergyLine,
} from './technique-energy-breakdown';

// Empowered Technique Calculator
export {
  calculateEmpoweredTechniqueCosts,
  type EmpoweredTechniqueCostResult,
  type CalculateEmpoweredTechniqueCostsInput,
} from './empowered-technique-calc';

export {
  buildEmpoweredAdvancedCalculationGroups,
  type EmpoweredAdvancedCalcGroup,
  type BuildEmpoweredAdvancedCalculationGroupsInput,
} from './empowered-energy-breakdown';

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
  analyzeItemMarketCurrency,
  resolveItemMarketPricing,
  resolveWeaponRangeDisplay,
  formatWeaponRangeDisplayCompact,
  formatWeaponRangeConfig,
  deriveWeaponRangeConfig,
  weaponRangeSpaceLadder,
  weaponRangeOpLevelFromSpaces,
  weaponRangeLegacyLevel,
  snapWeaponRangeSpaces,
  type WeaponRangeType,
  type WeaponRangeConfig,
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
  type ItemCalcSectionId,
  type ItemCostResult,
  type ItemMarketPricing,
  type ItemStoredCostSums,
  type RarityResult,
  type ProficiencyInfo,
  type ItemDamage,
  type ItemDocument,
  type ItemDisplayData,
} from './item-calc';

export {
  buildItemAdvancedCalculationGroups,
  type ItemAdvancedCalcGroup,
  type ItemAdvancedCalcRow,
} from './item-cost-breakdown';
