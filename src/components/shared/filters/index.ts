/**
 * Shared Filter Components
 * =========================
 * Reusable filter components for any list/grid filtering needs.
 * These were originally created for the Codex but are now shared
 * across the application (Library, Character Sheet modals, etc.)
 *
 * Available filters:
 * - ChipSelect: Multi-select dropdown with chip display
 * - AbilityRequirementFilter: Filter by ability score requirements
 * - TagFilter: Multi-select tag filter with Any/All mode
 * - SelectFilter: Simple single-select dropdown
 * - CharacterFilter: Filter list content by a user's character (collapsible, default collapsed)
 * - PowerTechniqueFilters: Category / Energy / TP / Action / Innate — panel body only
 * - ArmamentFilters: Character + currency affordability; Codex mixed extras — panel body only
 * - FilterSection: Collapsible container (`page` for Advanced creator; `compact` + toolbarStart for USM/L3 and ListSearchToolbar browse lists)
 * - SourceFilter: All / Realms Library / My Library scope
 */

export { ChipSelect } from './chip-select';
export { AbilityRequirementFilter, type AbilityRequirement } from './ability-requirement-filter';
export { TagFilter } from './tag-filter';
export { SelectFilter } from './select-filter';
export { CharacterFilter, CHARACTER_FILTER_NONE_LABEL, type CharacterFilterProps } from './character-filter';
export {
  PowerTechniqueFilters,
  type PowerTechniqueFiltersProps,
} from './power-technique-filters';
export {
  ArmamentFilters,
  type ArmamentFiltersProps,
} from './armament-filters';
export {
  dedupeSelectOptions,
  dedupeStrings,
  shouldShowSelectPlaceholder,
  FILTER_CONTROL_CLASS,
  FILTER_CONTROL_ROW_CLASS,
  FILTER_LABEL_ROW_CLASS,
  type SelectOption,
} from './filter-utils';
export { FilterSection, type FilterSectionProps } from './filter-section';
export { FilterInput, FilterNativeSelect } from './filter-native-select';
export {
  SourceFilter,
  sourceFilterSummary,
  type SourceFilterValue,
} from './source-filter';
