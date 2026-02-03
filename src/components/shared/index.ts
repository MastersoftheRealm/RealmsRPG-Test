/**
 * Shared Components
 * =================
 * Reusable UI components used across multiple pages
 */

// ============================================================================
// UNIFIED INTERACTIVE COMPONENTS
// ============================================================================
// These components are the source of truth for their patterns across the site.
// Use these instead of creating inline/duplicate implementations.

// RollButton - Unified dice roll button (character sheet, creatures, encounters)
export { RollButton, rollButtonVariants, type RollButtonProps } from './roll-button';

// PointStatus - Unified point allocation display (creators, character sheet edit mode)
export { PointStatus, type PointStatusProps } from './point-status';

// ValueStepper - Unified +/- controls (abilities, skills, quantities)
export { ValueStepper, DecrementButton, IncrementButton, type ValueStepperProps, type StepperButtonProps } from './value-stepper';

// EditSectionToggle - Blue pencil icon for edit mode sections
export { EditSectionToggle, getEditState, type EditState } from './edit-section-toggle';

// ============================================================================
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

// SectionHeader - UNIFIED section header with optional add button
// Use for ALL section headers: Powers, Techniques, Weapons, Armor, Equipment, Feats, Skills
export { SectionHeader } from './section-header';
export type { SectionHeaderProps } from './section-header';

// Part/Property chip components (reusable across Library, Character Sheet, Codex)
export { PartChip as PartChipComponent, PartChipDetails, PartChipList, PropertyChipList } from './part-chip';
export type { PartData } from './part-chip';

// CollapsibleListItem - Simple collapsible item for traits, feats, etc.
export { CollapsibleListItem } from './collapsible-list-item';
export type { CollapsibleListItemProps } from './collapsible-list-item';

// List components (shared between Codex and Library)
export {
  SearchInput,
  SortHeader,
  FilterSection,
  ResultsCount,
  ColumnHeaders,
  ListContainer,
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
  EmptyStateProps,
  ErrorDisplayProps,
} from './list-components';

// Creature components
export { CreatureStatBlock } from './creature-stat-block';
export type { CreatureData, CreatureStatBlockProps } from './creature-stat-block';

// Species trait components
export { SpeciesTraitCard, TraitGroup } from './species-trait-card';
export type { TraitData, TraitCategory, SpeciesTraitCardProps, TraitGroupProps } from './species-trait-card';

// Modals
export { LoginPromptModal } from './login-prompt-modal';
export { DeleteConfirmModal } from './delete-confirm-modal';
