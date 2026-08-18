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
export { RollButton } from './roll-button';

// PointStatus - Unified point allocation display (creators, character sheet edit mode)
export { PointStatus } from './point-status';

// LoadoutBudgetBar - Currency + Training Points budget row (Guided + Advanced creators; ADR-0008)
export { LoadoutBudgetBar } from './loadout-budget-bar';

// AbilityScoreGrid - Six-ability tile row (sheet layout; display or edit)
export {
  AbilityScoreGrid,
  ABILITY_DISPLAY_ORDER,
  resolveDistinctSecondaryAbility,
} from './ability-score-grid';

// ValueStepper - Unified +/- controls (ADR-0002: guided skills bonus chrome)
export { ValueStepper, DecrementButton, IncrementButton } from './value-stepper';

// EditSectionToggle - Blue pencil icon for edit mode sections
export { EditSectionToggle, getEditState, type EditState } from './edit-section-toggle';
export { TempModifierToggle } from './temp-modifier-toggle';

// ============================================================================
// Modal components
export { LoginPromptModal } from './login-prompt-modal';
export type { LoginPromptReason } from './login-prompt-modal';
export { DeleteConfirmModal } from './delete-confirm-modal';
export { ConfirmActionModal } from './confirm-action-modal';

// ============================================================================
// GridListRow - UNIFIED expandable list row component
// ============================================================================
// Use this for ALL expandable list rows across the site:
// - Library page (powers, techniques, armaments)
// - Codex page (feats, skills, species, equipment, properties, parts)
// - Character sheet modals (add feat, add power, add technique)
// - Creator pages (part selection)
export { GridListRow } from './grid-list-row';
export type { ColumnValue, ChipData, ChipOptionData, GridListRowProps } from './grid-list-row';
export { ListRowThumbnail } from './list-row-thumbnail';
export type { ListRowThumbnailProps } from './list-row-thumbnail';
export { ExpandableImage } from './expandable-image';
export type { ExpandableImageProps } from './expandable-image';

// DetailOptionList — elongated deep-dive / trait catalog rows (GuidedEntityDetailModal, species modal)
export { DetailOptionList } from './detail-option-list';
export type { DetailOptionItem, DetailOptionListProps } from './detail-option-list';

export { ChoiceTraitOptionListPicker } from './choice-trait-option-select';

// SectionCostBadge - EN/TP/IP cost display next to section labels
export { SectionCostBadge } from './section-cost-badge';
export type { SectionCostBadgeProps } from './section-cost-badge';

// SectionHeader - UNIFIED section header with optional add button
// Use for ALL section headers: Powers, Techniques, Weapons, Armor, Equipment, Feats, Skills
export { SectionHeader } from './section-header';
export type { SectionHeaderProps } from './section-header';

// HubListRow - Unified list row for hub pages (Encounters, Crafting)
export { HubListRow } from './hub-list-row';
export type { HubListRowProps } from './hub-list-row';

// TabSummarySection - Compact top section for tab summary info
// Use for: innate energy, currency, armament proficiency, physical attributes, etc.
export { TabSummarySection, SummaryItem, SummaryRow } from './tab-summary-section';
export type {
  TabSummarySectionProps,
  SummaryItemProps,
  SummaryRowProps,
} from './tab-summary-section';

// ListHeader - Sortable column headers for list views
// Use for ALL list headers matching Codex/Library patterns
export { ListHeader } from './list-header';
export type { ListHeaderProps, ListColumn, ListHeaderRowChrome } from './list-header';
export {
  gridTemplateColumnsWithThumbnail,
  prependThumbnailHeaderColumn,
  gridColumnsWithInlineSelection,
  GRID_LIST_INLINE_SELECTION_COLUMN_TRACK,
  GRID_LIST_ROW_ACTION_ICON_BUTTON_SIZE,
  GRID_LIST_ROW_ACTION_ICON_CLASS,
  THUMBNAIL_HEADER_COLUMN_KEY,
  CHARACTER_SHEET_ENERGY_SPEND_ROW_CHROME,
} from './grid-list-row-chrome';

// ListSearchToolbar — search + Filters row + trailing slot (ADR-0011 / TASK-721)
export { ListSearchToolbar } from './list-search-toolbar';
export type { ListSearchToolbarProps } from './list-search-toolbar';

// CodexBrowseListShell — Admin Codex + Codex browse list chrome (ADR-0005)
export { CodexBrowseListShell } from './codex-browse-list-shell';
export type { CodexBrowseListShellProps } from './codex-browse-list-shell';

// OfficialPowerList - shared Realms Library powers grid (Library browse + Admin)
export { OfficialPowerList } from './official-power-list';
export type { OfficialPowerListProps, OfficialPowerRow } from './official-power-list';

// OfficialTechniqueList - shared Realms Library techniques grid
export { OfficialTechniqueList } from './official-technique-list';
export type { OfficialTechniqueListProps, OfficialTechniqueRow } from './official-technique-list';

// OfficialItemList - shared Realms Library armaments grid
export { OfficialItemList } from './official-item-list';
export type {
  OfficialItemListProps,
  OfficialItemRow,
  ArmamentLibraryKind,
} from './official-item-list';

// OfficialEnhancedList - shared Realms Library enhanced items grid (admin)
export { OfficialEnhancedList } from './official-enhanced-list';
export type { OfficialEnhancedListProps, OfficialEnhancedRow } from './official-enhanced-list';

// OfficialCreatureList - Realms Library stat blocks (library) + admin compact grid
export { OfficialCreatureList } from './official-creature-list';
export type { OfficialCreatureListProps, OfficialCreatureRow } from './official-creature-list';

export type { PartData } from '@/lib/chip/part-data';

// GridListRow chip adapter
export { GridListChip } from './grid-list-chip';
export type { GridListChipProps } from './grid-list-chip';

export { SummaryChipList } from './summary-chip-list';
export type { SummaryChipItem } from './summary-chip-list';

// SkillRow - UNIFIED skill display component
// Use for ALL skill rows across: character sheet, character creator, creature creator
export { SkillRow } from './skill-row';
export type { SkillRowProps } from './skill-row';

// SkillsAllocationPage - Shared skill allocation for character/creature creator
export { SkillsAllocationPage, DefenseBonusesCard } from './skills-allocation-page';
export type { SkillsAllocationPageProps, DefenseBonusesCardProps } from './skills-allocation-page';

// Add Skill / Add Sub-Skill modals — shared by character sheet and character creator
export { AddSkillModal } from './add-skill-modal';
export type { AddSkillModalProps } from './add-skill-modal';
export { AddSubSkillModal } from './add-sub-skill-modal';
export type { AddSubSkillModalProps, CharacterSkillForSubModal } from './add-sub-skill-modal';

// List components (shared between Codex and Library)
export {
  SearchInput,
  FilterSection,
  EmptyState as ListEmptyState,
  LoadingState,
  ErrorDisplay,
} from './list-components';
export type {
  SearchInputProps,
  FilterSectionProps,
  EmptyStateProps,
  ErrorDisplayProps,
} from './list-components';

// SortState canonical export — from list-header.tsx
export type { SortState } from './list-header';

// Creature components
export { CreatureStatBlock } from './creature-stat-block';
export type { CreatureData, CreatureStatBlockProps } from './creature-stat-block';
export {
  CreatureLibraryStatBlockRow,
  CreatureLibraryStatBlockRows,
} from './creature-library-stat-block-rows';
export {
  LibraryAddToLibraryButton,
  LibraryAddToCharacterButton,
} from './library-add-to-library-button';
export { LibraryRowActionSlot } from './library-row-action-slot';

// Entity library sections (shared list section renderers)
export {
  PowersListSection,
  TechniquesListSection,
  WeaponsListSection,
  ShieldsListSection,
  ArmorListSection,
  EquipmentListSection,
  FeatsTraitsListSection,
  LibraryCollapsibleSection,
} from './entity-library-sections';
export type {
  EntityPowerRow,
  EntityTechniqueRow,
  EntityWeaponRow,
  EntityShieldRow,
  EntityArmorRow,
  EntityEquipmentRow,
  EntityFeatRow,
  EntityRowExtras,
  EntityListControls,
} from './entity-library-sections';

// Quick armaments tables (Archetype-style)
export {
  QuickWeaponsTable,
  QuickShieldsTable,
  QuickArmorTable,
  QUICK_WEAPON_COL,
} from './quick-armaments-sections';
export type { QuickArmamentItem, QuickArmamentAbilities } from './quick-armaments-sections';

// ============================================================================
// UNIFIED SELECTION COMPONENTS
// ============================================================================

// SelectionToggle - The unified + → ✓ selection button
// Use for ALL selection actions: add feats, select traits, pick equipment, etc.
export { SelectionToggle } from './selection-toggle';
export type { SelectionToggleProps } from './selection-toggle';

// EquipToggle - Circle toggle for equipped state (armor, weapons)
// Use for: armor/weapon equipped state toggle
export { EquipToggle } from './equip-toggle';
export type { EquipToggleProps } from './equip-toggle';

// UnifiedSelectionModal - Catalog / sheet / creator add-X selection (feats, skills, …)
export { UnifiedSelectionModal } from './unified-selection-modal';
export type {
  UnifiedSelectionModalProps,
  SelectableItem,
  ColumnHeader as SelectionColumnHeader,
} from './unified-selection-modal';

// AddCombatantModal — Encounter / session participant picker (intentional non-USM; TASK-571).
// Extend for VTT, downtime, combat/skill encounters — do not fork or migrate to USM.
export { AddCombatantModal } from './add-combatant-modal';
export type { AddCombatantModalProps } from './add-combatant-modal';

// QuantitySelector - Thin quantity wrapper over ValueStepper (ADR-0002)
// Use for: equipment quantity, item counts, stacks
export { QuantitySelector, QuantityBadge } from './quantity-selector';
export type { QuantitySelectorProps, QuantityBadgeProps } from './quantity-selector';

// SegmentedControl — My Library / Realms / All toggles (library page, modals, SourceFilter)
export { SegmentedControl } from './segmented-control';

// ============================================================================
// FILTER COMPONENTS
// ============================================================================
// Reusable filter components for any list/grid filtering needs.
// Use for: Codex, Library, Character Sheet modals, etc.

export {
  ChipSelect,
  AbilityRequirementFilter,
  type AbilityRequirement,
  TagFilter,
  SelectFilter,
  CharacterFilter,
  type CharacterFilterProps,
  PowerTechniqueFilters,
  type PowerTechniqueFiltersProps,
  SourceFilter,
  sourceFilterSummary,
  type SourceFilterValue,
} from './filters';


// ThemeToggle - Dark/Light/System theme switcher
export { ThemeToggle } from './theme-toggle';
export { InfoTippy, WordHelpTip } from './info-tippy';
export type { InfoTippyProps, InfoTippyTone, WordHelpTipProps } from './info-tippy';
export { DescriptorChipWithTip } from './descriptor-chip-with-tip';

// PoweredMartialSlider - Allocation slider for powered-martial characters
export { PoweredMartialSlider } from './powered-martial-slider';
export type { PoweredMartialSliderProps } from './powered-martial-slider';

// InnateToggle - Toggle for marking powers/techniques as innate
export { InnateToggle } from './innate-toggle';
export type { InnateToggleProps } from './innate-toggle';

// ImageUploadModal - Upload and crop images for portraits/profile pictures
export { ImageUploadModal } from './image-upload-modal';
export type { ImageUploadModalProps, CropShape } from './image-upload-modal';
export { RealmsImageField, RealmsImagePicker } from './realms-image-picker';
export type {
  RealmsImageFieldProps,
  RealmsImagePickerProps,
  RealmsImagePickerSelection,
} from './realms-image-picker';

// GuidedChoiceShell - Unified Layer 1/2/3 chrome for creator steps (three-layer model)
export { GuidedChoiceShell, GuidedLayerNav, GuidedInlineCatalogList } from './guided-choice';
export type {
  GuidedChoiceShellProps,
  GuidedLayerNavProps,
  GuidedInlineCatalogListProps,
} from './guided-choice';
