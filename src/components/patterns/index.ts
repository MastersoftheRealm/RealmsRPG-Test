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
export { RollButton } from './chrome/roll-button';

// PointStatus - Unified point allocation display (creators, character sheet edit mode)
export { PointStatus } from './chrome/point-status';

// LoadoutBudgetBar - Currency + Training Points budget row (Guided creator; ADR-0008)
export { LoadoutBudgetBar } from './chrome/loadout-budget-bar';

// AbilityScoreGrid - Six-ability tile row (sheet layout; display or edit)
export {
  AbilityScoreGrid,
  ABILITY_DISPLAY_ORDER,
  resolveDistinctSecondaryAbility,
} from './list/ability-score-grid';

// DefenseStatTile + ability/defense stat model (sheet + creators; TASK-881)
export {
  DefenseStatTile,
  ABILITY_ORDER,
  ABILITY_INFO,
  DEFENSE_INFO,
  ABILITY_CONSTRAINTS,
  SHEET_STAT_GRID_CLASS,
  SHEET_STAT_TILE_CLASS,
  SHEET_STAT_TIP_CLASS,
  SHEET_SCORE_TIP_CLASS,
  canDecreaseAbility,
} from './stat-tiles';

// ValueStepper - Unified +/- controls (ADR-0002: guided skills bonus chrome)
export { ValueStepper, DecrementButton, IncrementButton } from './select/value-stepper';

// EditSectionToggle - Blue pencil icon for edit mode sections
export { EditSectionToggle, getEditState, type EditState } from './chrome/edit-section-toggle';
export { TempModifierToggle } from './chrome/temp-modifier-toggle';

// ============================================================================
// Modal components
export { LoginPromptModal } from './chrome/login-prompt-modal';
export type { LoginPromptReason } from './chrome/login-prompt-modal';
export { DeleteConfirmModal } from './chrome/delete-confirm-modal';
export { ConfirmActionModal } from './chrome/confirm-action-modal';

// ============================================================================
// GridListRow - UNIFIED expandable list row component
// ============================================================================
// Use this for ALL expandable list rows across the site:
// - Library page (powers, techniques, armaments)
// - Codex page (feats, skills, species, equipment, properties, parts)
// - Character sheet modals (add feat, add power, add technique)
// - Creator pages (part selection)
export { GridListRow } from './list/grid-list-row';
export type { ColumnValue, ChipData, ChipOptionData, GridListRowProps } from './list/grid-list-row';
export { ListRowThumbnail } from './list/list-row-thumbnail';
export type { ListRowThumbnailProps } from './list/list-row-thumbnail';
export { ExpandableImage } from './help/expandable-image';
export type { ExpandableImageProps } from './help/expandable-image';

// DetailOptionList — elongated deep-dive / trait catalog rows (GuidedEntityDetailModal, species modal)
export { DetailOptionList } from './list/detail-option-list';
export type { DetailOptionItem, DetailOptionListProps } from './list/detail-option-list';

// SectionCostBadge - EN/TP/IP cost display next to section labels
export { SectionCostBadge } from './chrome/section-cost-badge';
export type { SectionCostBadgeProps } from './chrome/section-cost-badge';

// SectionHeader - UNIFIED section header with optional add button
// Use for ALL section headers: Powers, Techniques, Weapons, Armor, Equipment, Feats, Skills
export { SectionHeader } from './chrome/section-header';
export type { SectionHeaderProps } from './chrome/section-header';

// HubListRow - Unified list row for hub pages (Encounters, Crafting)
export { HubListRow } from './list/hub-list-row';
export type { HubListRowProps } from './list/hub-list-row';

// TabSummarySection - Compact top section for tab summary info
// Use for: innate energy, currency, armament proficiency, physical attributes, etc.
export { TabSummarySection, SummaryItem, SummaryRow } from './chrome/tab-summary-section';
export type {
  TabSummarySectionProps,
  SummaryItemProps,
  SummaryRowProps,
} from './chrome/tab-summary-section';

// ListHeader - Sortable column headers for list views
// Use for ALL list headers matching Codex/Library patterns
export { ListHeader } from './list/list-header';
export type { ListHeaderProps, ListColumn, ListHeaderRowChrome } from './list/list-header';
export {
  gridTemplateColumnsWithThumbnail,
  prependThumbnailHeaderColumn,
  gridColumnsWithInlineSelection,
  GRID_LIST_INLINE_SELECTION_COLUMN_TRACK,
  GRID_LIST_ROW_ACTION_ICON_BUTTON_SIZE,
  GRID_LIST_ROW_ACTION_ICON_CLASS,
  THUMBNAIL_HEADER_COLUMN_KEY,
  CHARACTER_SHEET_ENERGY_SPEND_ROW_CHROME,
} from './list/grid-list-row-chrome';

// ListSearchToolbar — search + Filters row + trailing slot (ADR-0011 / TASK-721)
export { ListSearchToolbar } from './list/list-search-toolbar';
export type { ListSearchToolbarProps } from './list/list-search-toolbar';

// CodexBrowseListShell — Admin Codex + Codex browse list chrome (ADR-0005)
export { CodexBrowseListShell } from './list/codex-browse-list-shell';
export type { CodexBrowseListShellProps } from './list/codex-browse-list-shell';

// OfficialPowerList - shared Realms Library powers grid (Library browse + Admin)
export { OfficialPowerList } from './list/official-power-list';
export type { OfficialPowerListProps, OfficialPowerRow } from './list/official-power-list';

// OfficialTechniqueList - shared Realms Library techniques grid
export { OfficialTechniqueList } from './list/official-technique-list';
export type {
  OfficialTechniqueListProps,
  OfficialTechniqueRow,
} from './list/official-technique-list';

// OfficialItemList - shared Realms Library armaments grid
export { OfficialItemList } from './list/official-item-list';
export type {
  OfficialItemListProps,
  OfficialItemRow,
  ArmamentLibraryKind,
} from './list/official-item-list';

// OfficialEnhancedList - shared Realms Library enhanced items grid (admin)
export { OfficialEnhancedList } from './list/official-enhanced-list';
export type { OfficialEnhancedListProps, OfficialEnhancedRow } from './list/official-enhanced-list';

// OfficialCreatureList - Realms Library stat blocks (library) + admin compact grid
export { OfficialCreatureList } from './list/official-creature-list';
export type { OfficialCreatureListProps, OfficialCreatureRow } from './list/official-creature-list';

export type { PartData } from '@/lib/chip/part-data';

// GridListRow chip adapter
export { GridListChip } from './list/grid-list-chip';
export type { GridListChipProps } from './list/grid-list-chip';

export { SummaryChipList } from './list/summary-chip-list';
export type { SummaryChipItem } from './list/summary-chip-list';

// SkillRow - UNIFIED skill display component
// Use for ALL skill rows across: character sheet, Guided creator, creature creator
export { SkillRow } from './list/skill-row';
export type { SkillRowProps } from './list/skill-row';

// SkillsAllocationPage - Shared skill allocation for character/creature creator
export { SkillsAllocationPage, DefenseBonusesCard } from './list/skills-allocation-page';
export type {
  SkillsAllocationPageProps,
  DefenseBonusesCardProps,
} from './list/skills-allocation-page';

// Add Skill / Add Sub-Skill modals — shared by character sheet and Guided creator
export { AddSkillModal } from './select/add-skill-modal';
export type { AddSkillModalProps } from './select/add-skill-modal';
export { AddSubSkillModal } from './select/add-sub-skill-modal';
export type {
  AddSubSkillModalProps,
  CharacterSkillForSubModal,
} from './select/add-sub-skill-modal';

// List error display (SearchInput / EmptyState / LoadingState live in `@/components/ui`)
export { ErrorDisplay } from './list/list-components';
export type { ErrorDisplayProps } from './list/list-components';

// SortState canonical export — from list-header.tsx
export type { SortState } from './list/list-header';

// Creature components
export { CreatureStatBlock } from './list/creature-stat-block';
export type { CreatureData, CreatureStatBlockProps } from './list/creature-stat-block';
export {
  CreatureLibraryStatBlockRow,
  CreatureLibraryStatBlockRows,
} from './list/creature-library-stat-block-rows';
export {
  LibraryAddToLibraryButton,
  LibraryAddToCharacterButton,
} from './list/library-add-to-library-button';
export { LibraryRowActionSlot } from './list/library-row-action-slot';

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
} from './list/entity-library-sections';
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
} from './list/entity-library-sections';

// Quick armaments tables (Archetype-style)
export {
  QuickWeaponsTable,
  QuickShieldsTable,
  QuickArmorTable,
  QUICK_WEAPON_COL,
} from './list/quick-armaments-sections';
export type { QuickArmamentItem, QuickArmamentAbilities } from './list/quick-armaments-sections';

// ============================================================================
// UNIFIED SELECTION COMPONENTS
// ============================================================================

// SelectionToggle - The unified + → ✓ selection button
// Use for ALL selection actions: add feats, select traits, pick equipment, etc.
export { SelectionToggle } from './select/selection-toggle';
export type { SelectionToggleProps } from './select/selection-toggle';

// EquipToggle - Circle toggle for equipped state (armor, weapons)
// Use for: armor/weapon equipped state toggle
export { EquipToggle } from './select/equip-toggle';
export type { EquipToggleProps } from './select/equip-toggle';

// UnifiedSelectionModal - Catalog / sheet / creator add-X selection (feats, skills, …)
export { UnifiedSelectionModal } from './select/unified-selection-modal';
export type {
  UnifiedSelectionModalProps,
  SelectableItem,
  ColumnHeader as SelectionColumnHeader,
} from './select/unified-selection-modal';

// QuantitySelector - Thin quantity wrapper over ValueStepper (ADR-0002)
// Use for: equipment quantity, item counts, stacks
export { QuantitySelector, QuantityBadge } from './select/quantity-selector';
export type { QuantitySelectorProps, QuantityBadgeProps } from './select/quantity-selector';

// SegmentedControl — My Library / Realms / All toggles (library page, modals, SourceFilter)
export { SegmentedControl } from './chrome/segmented-control';

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
export { ThemeToggle } from './chrome/theme-toggle';
export { InfoTippy, WordHelpTip } from './help/info-tippy';
export type { InfoTippyProps, InfoTippyTone, WordHelpTipProps } from './help/info-tippy';
export { DescriptorChipWithTip } from './help/descriptor-chip-with-tip';

// PoweredMartialSlider - Allocation slider for powered-martial characters
export { PoweredMartialSlider } from './select/powered-martial-slider';
export type { PoweredMartialSliderProps } from './select/powered-martial-slider';

// InnateToggle - Toggle for marking powers/techniques as innate
export { InnateToggle } from './select/innate-toggle';
export type { InnateToggleProps } from './select/innate-toggle';

// ImageUploadModal - Upload and crop images for portraits/profile pictures
export { ImageUploadModal } from './chrome/image-upload-modal';
export type { ImageUploadModalProps, CropShape } from './chrome/image-upload-modal';
export { RealmsImageField, RealmsImagePicker } from './chrome/realms-image-picker';
export type {
  RealmsImageFieldProps,
  RealmsImagePickerProps,
  RealmsImagePickerSelection,
} from './chrome/realms-image-picker';

// Guided layer nav + L3 inline catalog (three-layer model)
export { GuidedLayerNav, GuidedInlineCatalogList } from './guided-choice';
export type { GuidedLayerNavProps, GuidedInlineCatalogListProps } from './guided-choice';
export { AbilityPickButton } from './select/ability-pick-button';
export { MixedSpeciesModal } from './select/mixed-species-modal';
export { MixedSpeciesSkillPicker } from './select/mixed-species-skill-picker';
export { CreatorPortraitUpload } from './chrome/creator-portrait-upload';
export { TraitSection } from './chrome/trait-section';
export { ErrorBoundary } from './chrome/error-boundary';
export { PathHelpCard, PathNotes } from './help/path-help-card';
export type { PathHelpCardProps, PathNotesProps } from './help/path-help-card';
