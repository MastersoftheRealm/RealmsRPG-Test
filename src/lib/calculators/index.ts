/**
 * Calculators Index
 * ==================
 * Export all calculator utilities
 */

// Unified Mechanic Builder (shared by Power, Technique, and future Empowered Technique creators)
export {
  buildMechanicParts,
  type CreatorType,
  type MechanicPartResult,
  type MechanicBuilderContext,
  type ActionConfig,
  type PowerDamageConfig,
  type TechniqueDamageConfig,
  type RangeConfig,
  type AreaConfig,
  type DurationConfig,
} from './mechanic-builder';

export {
  POWER_CALC_SECTION_BY_NAME,
  POWER_DURATION_TYPE_PART_NAMES,
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
  formatPowerDamage,
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
  expandLegacyRandomizeFace,
  isRandomizeDieComplete,
  powerCreatorSaveBlockReason,
  randomizeFacesNotOnDieWarning,
  isPowerCompositionMechanicPart,
  powerCompositionHelpText,
  resolvePowerComposition,
  composedPowerDamage,
  reverseDiscountApplied,
  powerCompositionEnergyLines,
  composedPowerProficiencyParts,
  plainPowerProficiencyParts,
  formatPowerCompositionSummary,
  formatEnergyIntermediate,
  reverseActionDivisorNote,
  powerSpecHasContent,
  type PowerComposition,
  type PowerCompositionStructure,
  type PowerCompositionResolution,
  type PowerVariantSpec,
  type PowerVariantOverrideField,
  type PowerVariantPolarity,
  type ResolvedPowerVariant,
} from './power-composition';

export {
  buildPowerAdvancedCalculationGroups,
  formatDamageEnergyLabel,
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

export {
  combineTechniqueCostSlices,
  techniqueDamageSectionCostFromAnalysis,
  techniqueManualPartsSectionCost,
  techniqueNamedBadgeCost,
} from './technique-creator-section-costs';

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
  resolveItemMarketPricing,
  resolveWeaponRangeDisplay,
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
  resolveShieldBlockDisplay,
  resolveShieldDamageDisplay,
  isGeneralProperty,
  isMechanicProperty,
  filterSavedItemPropertiesForList,
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
