import type { ReactNode } from 'react';
import type { MetadataDetailSection } from '@/lib/chip/list-row-metadata';
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
export interface ChipOptionData {
  label: string;
  description?: string;
  level: number;
}

export interface ChipData {
  /** Chip label/name */
  name: string;
  /** Description (shown when chip is expanded) */
  description?: string;
  /** Cost value (TP, IP, etc.) */
  cost?: number;
  /**
   * Cost label on expandable chips (`{costLabel}: N`).
   * Guided L1/L2: `Training Points`. Character sheet / dense play lists: `TP`.
   */
  costLabel?: string;
  /** Optional level indicator */
  level?: number;
  /**
   * Expandability role. `descriptor` = opaque metadata chip (never expands).
   * Omit for parts/properties (expand when description, cost, or options exist).
   */
  kind?: 'descriptor' | 'expandable';
  /** Semantic styling category (not expandability) */
  category?: 'default' | 'cost' | 'warning' | 'success' | 'archetype' | 'skill';
  /** Options with level > 0 (shown below description in expanded chip, collapsible) */
  options?: ChipOptionData[];
}

export interface ColumnValue {
  /** Column key (for identity, sort, accessibility) */
  key: string;
  /** Optional display label (use for UI; falls back to key if missing) */
  label?: string;
  /** Display value */
  value: string | number | ReactNode;
  /** Optional highlight styling (primary color) */
  highlight?: boolean;
  /** Custom className for styling */
  className?: string;
  /** Hide on mobile */
  hideOnMobile?: boolean;
  /** Text alignment */
  align?: 'left' | 'center' | 'right';
}

export interface GridListRowProps {
  /** Unique item ID */
  id: string;
  /** Display name (first column) */
  name: string;
  /** Optional rich name content (overrides plain name text when set) */
  nameContent?: ReactNode;
  /**
   * Item description (shown in default expanded view).
   * When expanded, any collapsed-row column with `key: 'description'` (or the mobile
   * description summary) is hidden so the full text is not duplicated in the header.
   */
  description?: string;
  /** Column values to display in collapsed row */
  columns?: ColumnValue[];
  /** Optional span per column (e.g. [3] = first column spans 3 grid columns). Use so description can span Uses/Recovery when they are empty. */
  columnSpans?: (number | undefined)[];
  /** Grid template columns CSS (must match headers) */
  gridColumns?: string;

  // ===== Expanded Content Options =====
  /** Chips to show in expanded view (parts, properties, tags, etc.) */
  chips?: ChipData[];
  /** Label for chips section */
  chipsLabel?: string;
  /** Multiple labeled chip sections for consistent metadata display (Tags, Requirements, Type, etc.). When provided, replaces chips/chipsLabel. */
  detailSections?: MetadataDetailSection[];
  /** Total cost (TP, etc.) to display */
  totalCost?: number;
  /** Cost label */
  costLabel?: string;
  /** Custom badges/tags to show */
  badges?: Array<{ label: string; color?: 'blue' | 'purple' | 'green' | 'amber' | 'gray' | 'red' }>;
  /** Requirements or additional info */
  requirements?: ReactNode;
  /** Custom expanded content (replaces default slots) */
  expandedContent?: ReactNode;
  /** Extra content appended after the default expanded body (description, chips, etc.) */
  supplementalExpandedContent?: ReactNode;

  // ===== Selection Mode (for modals) =====
  /** Enable selection mode */
  selectable?: boolean;
  /** Is currently selected */
  isSelected?: boolean;
  /** Selection callback */
  onSelect?: () => void;
  /** Disable selection */
  disabled?: boolean;
  /** Warning message (shown when disabled or for requirements) */
  warningMessage?: string;

  // ===== Action Buttons (for editable content) =====
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  /** Add to my library (for Realms Library items) */
  onAddToLibrary?: () => void;

  // ===== Character Sheet Slots (Phase 1 Unification) =====
  /** Left slot content (e.g., innate toggle, equip checkbox) - renders before name */
  leftSlot?: ReactNode;
  /** Small thumbnail left of name (D&D Beyond list style). Click opens preview modal. */
  thumbnail?: ListRowThumbnailProps;
  /** Right slot content (e.g., use button, roll buttons) - renders after columns */
  rightSlot?: ReactNode;
  /** Visual state: item is equipped (green border/bg styling) */
  equipped?: boolean;
  /** Visual state: item is innate (purple styling) */
  innate?: boolean;
  /** When true, do not show the innate star badge (e.g. already in innate section) */
  hideInnateBadge?: boolean;
  /** Uses tracking for feats with limited uses */
  uses?: { current: number; max: number };
  /** When true, do not show (current/max) after name (e.g. when Uses column has a stepper) */
  hideUsesInName?: boolean;
  /** Quantity for stackable items (equipment, consumables) */
  quantity?: number;
  /** Callback when quantity changes (enables +/- controls) */
  onQuantityChange?: (delta: number) => void;
  /** Minimum quantity when steppers are shown (default 1; use 0 for quantity-first selection) */
  quantityMin?: number;
  /** Accessible decrement label for quantity steppers */
  quantityDecrementLabel?: string;
  /** Accessible increment label for quantity steppers */
  quantityIncrementLabel?: string;

  // ===== UI Options =====
  /** Start expanded */
  defaultExpanded?: boolean;
  /** Control expanded state externally */
  expanded?: boolean;
  /** Callback when expand state changes */
  onExpandChange?: (expanded: boolean) => void;
  /** Compact mode (smaller padding) */
  compact?: boolean;
  /** Additional className */
  className?: string;
  /** Override hover class for colored rows (e.g. senses/movement) - use hover:bg-* to match row color */
  rowHoverClass?: string;
}
