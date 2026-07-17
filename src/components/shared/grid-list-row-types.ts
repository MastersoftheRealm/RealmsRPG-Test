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
