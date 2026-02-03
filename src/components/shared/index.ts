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

// Modal components
export { LoginPromptModal } from './login-prompt-modal';
export { DeleteConfirmModal } from './delete-confirm-modal';

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

// ============================================================================
// UNIFIED SELECTION COMPONENTS
// ============================================================================

// SelectionToggle - The unified + → ✓ selection button
// Use for ALL selection actions: add feats, select traits, pick equipment, etc.
export { SelectionToggle } from './selection-toggle';
export type { SelectionToggleProps } from './selection-toggle';

// UnifiedSelectionModal - One modal pattern for all selection scenarios
// Use for: adding skills, feats, powers, techniques, equipment, etc.
// Works in: character sheet, character creator, creature creator
export { UnifiedSelectionModal } from './unified-selection-modal';
export type { 
  UnifiedSelectionModalProps, 
  SelectableItem, 
  ColumnHeader as SelectionColumnHeader,
  FilterOption as SelectionFilterOption,
} from './unified-selection-modal';

// QuantitySelector - Unified quantity +/- controls
// Use for: equipment quantity, item counts, stacks
export { QuantitySelector, QuantityBadge } from './quantity-selector';
export type { QuantitySelectorProps, QuantityBadgeProps } from './quantity-selector';

