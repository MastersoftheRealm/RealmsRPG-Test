import type { ReactNode } from 'react';
import type { MetadataDetailSection } from '@/lib/chip/list-row-metadata';
import type { AllowUndefinedOptionals } from '@/lib/utils/exact-optional';
import type { ListHeaderRowChrome } from './grid-list-row-chrome';
import type { ListRowThumbnailProps } from './list-row-thumbnail';

/**
 * GridListRow chip data model (TASK-415 chip unification).
 *
 * ## Two roles
 * - **`kind: 'descriptor'`** — opaque metadata (feat type, tags, range, requirements).
 *   Renders as non-expandable `DescriptorChip` via `GridListChip`. Never shows a chevron.
 * - **`kind` omitted** (expandable default) — parts, properties, leveled options.
 *   Expands when `description`, `cost > 0`, or `options` are present.
 *
 * Optional **control** fields (`onSelect` / `disabled` / `current`) stay on this type so
 * pickers (sheet feat rank) reuse `GridListChip` instead of a parallel chip renderer.
 *
 * ## Metadata visibility rule
 * Every meaningful field appears in **collapsed columns** OR **expanded descriptor chips**, not
 * neither and not both. See `lib/chip/list-row-metadata.ts`, `lib/detail-option/compact-facts.ts`,
 * and `CHIP_UNIFICATION_PLAN.md`. When compacting a column into a chip, use natural self-describing
 * language (e.g. `2d6 Slashing Damage`), not `Damage: 2d6…`.
 *
 * ## `category` (styling only — not expandability)
 * Semantic tint for expandable and descriptor chips: `default`, `cost`, `warning`, `success`,
 * `archetype`, `skill`. Do **not** overload category for behavior; use `kind: 'descriptor'`.
 *
 * ## Builders
 * - Metadata sections: `buildPartsAndMetadataDetailSections`, `metadataDescriptorChip`
 * - Parts/Properties & Proficiencies: `defaultCollapsed` + `labelHelpKey` (TASK-583)
 * - Calculator parts: `partChipsFromDisplay`
 * - Feat rows: `buildFeatDetailSections` (`lib/codex/feat-list.ts`)
 */

/** Option row for part/property chips (level > 0) with optional description */
interface ChipOptionDataFields {
  label: string;
  description?: string | undefined;
  level: number;
}

export type ChipOptionData = AllowUndefinedOptionals<ChipOptionDataFields>;

interface ChipDataFields {
  /** Chip label/name */
  name: string;
  /** Description (shown when chip is expanded) */
  description?: string | undefined;
  /** Cost value (TP, IP, etc.) */
  cost?: number | undefined;
  /**
   * Cost label on expandable chips (`{costLabel}: N`).
   * Dense browse / sheet / Library GLR default: `TP`. Guided L1/L2 surfaces pass `Training Points`.
   */
  costLabel?: string | undefined;
  /** Optional level indicator */
  level?: number | undefined;
  /**
   * Expandability role. `descriptor` = opaque metadata chip (never expands).
   * Omit for parts/properties (expand when description, cost, or options exist).
   */
  kind?: 'descriptor' | 'expandable' | undefined;
  /** Semantic styling category (not expandability) */
  category?: 'default' | 'cost' | 'warning' | 'success' | 'archetype' | 'skill' | undefined;
  /** Options with level > 0 (shown below description in expanded chip, collapsible) */
  options?: ChipOptionData[] | undefined;
  /**
   * Control chip (TASK-780). GridListChip renders a button; never expands.
   * Builders should also set `kind: 'descriptor'`.
   */
  onSelect?: (() => void) | undefined;
  /** Accessible name for `onSelect` (e.g. `Set Speedy to Level 2`). */
  selectAriaLabel?: string | undefined;
  /** Unavailable control — muted, not clickable. Description is the tip. */
  disabled?: boolean | undefined;
  /** Current selection among a chip group (`aria-current`). */
  current?: boolean | undefined;
}

export type ChipData = AllowUndefinedOptionals<ChipDataFields>;

interface ColumnValueFields {
  /** Column key (for identity, sort, accessibility) */
  key: string;
  /** Optional display label (use for UI; falls back to key if missing) */
  label?: string | undefined;
  /** Display value */
  value: string | number | ReactNode;
  /** Optional highlight styling (primary color) */
  highlight?: boolean | undefined;
  /** Custom className for styling */
  className?: string | undefined;
  /** Hide on mobile */
  hideOnMobile?: boolean | undefined;
  /** Text alignment */
  align?: 'left' | 'center' | 'right' | undefined;
}

export type ColumnValue = AllowUndefinedOptionals<ColumnValueFields>;

interface GridListRowPropsFields {
  /** Unique item ID */
  id: string;
  /** Display name (first column) */
  name: string;
  /** Optional rich name content (overrides plain name text when set) */
  nameContent?: ReactNode | undefined;
  /**
   * Item description (shown in default expanded view).
   * When expanded, any collapsed-row column with `key: 'description'` (or the mobile
   * description summary) is hidden so the full text is not duplicated in the header.
   */
  description?: string | undefined;
  /** Column values to display in collapsed row */
  columns?: ColumnValue[] | undefined;
  /** Optional span per column (e.g. [3] = first column spans 3 grid columns). Use so description can span Uses/Recovery when they are empty. */
  columnSpans?: (number | undefined)[] | undefined;
  /** Grid template columns CSS (must match headers) */
  gridColumns?: string | undefined;

  // ===== Expanded Content Options =====
  /** Chips to show in expanded view (parts, properties, tags, etc.) */
  chips?: ChipData[] | undefined;
  /** Label for chips section */
  chipsLabel?: string | undefined;
  /** Multiple labeled chip sections for consistent metadata display (Tags, Requirements, Type, etc.). When provided, replaces chips/chipsLabel. */
  detailSections?: MetadataDetailSection[] | undefined;
  /** Total cost (TP, etc.) to display */
  totalCost?: number | undefined;
  /** Cost label */
  costLabel?: string | undefined;
  /** Custom badges/tags to show */
  badges?:
    | Array<{
        label: string;
        color?: 'blue' | 'purple' | 'green' | 'amber' | 'gray' | 'red' | undefined;
      }>
    | undefined;
  /**
   * Render `badges` beside the name instead of in the expanded body (compact rows always do).
   * For state a browse row must show while a filter is active — e.g. the archetype paths that
   * recommend this feat (ADR-0014). Keeps the metadata in one place, not both.
   */
  showBadgesInName?: boolean | undefined;
  /** Requirements or additional info */
  requirements?: ReactNode | undefined;
  /** Custom expanded content (replaces default slots) */
  expandedContent?: ReactNode | undefined;
  /**
   * Extra content inside the expanded description surface, below the official
   * description and separated by a simple line when both exist (TASK-783).
   * Use for play-view player notes — not a second card or labeled field.
   */
  descriptionAfter?: ReactNode | undefined;
  /** Extra content appended after the default expanded body (description, chips, etc.) */
  supplementalExpandedContent?: ReactNode | undefined;

  // ===== Selection Mode (for modals) =====
  /** Enable selection mode */
  selectable?: boolean | undefined;
  /** Is currently selected */
  isSelected?: boolean | undefined;
  /** Selection callback */
  onSelect?: (() => void) | undefined;
  /** Disable selection */
  disabled?: boolean | undefined;
  /** Warning message (shown when disabled or for requirements) */
  warningMessage?: string | undefined;

  // ===== Action Buttons (for editable content) =====
  onEdit?: (() => void) | undefined;
  onDelete?: (() => void) | undefined;
  onDuplicate?: (() => void) | undefined;
  /** Add to my library (for Realms Library items) */
  onAddToLibrary?: (() => void) | undefined;

  // ===== Character Sheet Slots (Phase 1 Unification) =====
  /** Left slot content (e.g., innate toggle, equip checkbox) - renders before name */
  leftSlot?: ReactNode | undefined;
  /** Small thumbnail left of name (D&D Beyond list style). Click opens preview modal. */
  thumbnail?: ListRowThumbnailProps | undefined;
  /** Right slot content (e.g., use button, roll buttons) - renders after columns */
  rightSlot?: ReactNode | undefined;
  /**
   * Reserve the same outer flex chrome as `ListHeader` `rowChrome` when slot content is absent
   * (e.g. My Library sync button only on drifted rows). Pair with the shell/header flags.
   */
  rowChrome?: ListHeaderRowChrome | undefined;
  /** Visual state: item is equipped (green border/bg styling) */
  equipped?: boolean | undefined;
  /** Visual state: item is innate (purple styling) */
  innate?: boolean | undefined;
  /** When true, do not show the innate star badge (e.g. already in innate section) */
  hideInnateBadge?: boolean | undefined;
  /** Uses tracking for feats with limited uses */
  uses?: { current: number; max: number } | undefined;
  /** When true, do not show (current/max) after name (e.g. when Uses column has a stepper) */
  hideUsesInName?: boolean | undefined;
  /** Quantity for stackable items (equipment, consumables) */
  quantity?: number | undefined;
  /** Callback when quantity changes (enables +/- controls) */
  onQuantityChange?: ((delta: number) => void) | undefined;
  /** Minimum quantity when steppers are shown (default 1; use 0 for quantity-first selection) */
  quantityMin?: number | undefined;
  /** Accessible decrement label for quantity steppers */
  quantityDecrementLabel?: string | undefined;
  /** Accessible increment label for quantity steppers */
  quantityIncrementLabel?: string | undefined;

  // ===== UI Options =====
  /** Start expanded */
  defaultExpanded?: boolean | undefined;
  /** Control expanded state externally */
  expanded?: boolean | undefined;
  /** Callback when expand state changes */
  onExpandChange?: ((expanded: boolean) => void) | undefined;
  /** Compact mode (smaller padding) */
  compact?: boolean | undefined;
  /** Additional className */
  className?: string | undefined;
  /** Override hover class for colored rows (e.g. senses/movement) - use hover:bg-* to match row color */
  rowHoverClass?: string | undefined;
  /**
   * Fixed width for external `rightSlot` chrome (quantity steppers, etc.).
   * Must match ListHeader `rightSlotWidth` — default energy/use slot is narrower
   * (`GRID_LIST_ROW_RIGHT_SLOT_FLEX_WIDTH`). USM/guided quantity uses 7.5rem (TASK-702).
   */
  rightSlotWidth?: string | undefined;
}

export type GridListRowProps = AllowUndefinedOptionals<GridListRowPropsFields>;
