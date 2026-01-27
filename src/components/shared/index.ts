/**
 * Shared Components
 * =================
 * Reusable UI components used across multiple pages
 */

// Item display components
export { ItemCard } from './item-card';
export { ItemList } from './item-list';
export { ItemSelectionModal } from './item-selection-modal';

// ============================================================================
// GridListRow - UNIFIED expandable list row component
// ============================================================================
// Use this for ALL expandable list rows across the site:
// - Library page (powers, techniques, armaments)
// - Codex page (feats, skills, species, equipment, properties, parts)
// - Character sheet modals (add feat, add power, add technique)
// - Creator pages (part selection)
export { GridListRow } from './grid-list-row';
export type { ColumnValue, ChipData, GridListRowProps } from './grid-list-row';

// Part/Property chip components (reusable across Library, Character Sheet, Codex)
export { PartChip as PartChipComponent, PartChipDetails, PartChipList, PropertyChipList } from './part-chip';
export type { PartData } from './part-chip';

// List components (shared between Codex and Library)
export {
  SearchInput,
  SortHeader,
  FilterSection,
  ResultsCount,
  ColumnHeaders,
  ListContainer,
  ExpandableCard,
  EmptyState as ListEmptyState,
  LoadingSpinner,
  ErrorDisplay,
} from './list-components';
export type { 
  SearchInputProps, 
  SortState, 
  SortHeaderProps, 
  FilterSectionProps,
  ResultsCountProps,
  ColumnHeaderProps,
  ListContainerProps,
  ExpandableCardProps,
  EmptyStateProps,
  ErrorDisplayProps,
} from './list-components';

// Creature components
export { CreatureStatBlock } from './creature-stat-block';
export type { CreatureData, CreatureStatBlockProps } from './creature-stat-block';

// Species trait components
export { SpeciesTraitCard, TraitGroup } from './species-trait-card';
export type { TraitData, TraitCategory, SpeciesTraitCardProps, TraitGroupProps } from './species-trait-card';

// State display components
export { LoadingState } from './loading-state';
export { ErrorState } from './error-state';

// Modals
export { LoginPromptModal } from './login-prompt-modal';
export { DeleteConfirmModal } from './delete-confirm-modal';
