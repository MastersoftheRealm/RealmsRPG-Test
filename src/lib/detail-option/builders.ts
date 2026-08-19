/**
 * Builders that map domain entities → DetailOptionItem for deep-dive catalogs.
 * Keep free of JSX so both server and client modules can import.
 *
 * Facts that used to sit in a Stats column must be labeled chips in the expanded row
 * so values are self-describing. Prefer `@/lib/detail-option/compact-facts` formatters
 * (TASK-454) for Ability Requirement, handedness, damage, weapon Ability, Range,
 * Spaces, Action Type, Currency, and Training Points — do not recreate those strings
 * in feature components.
 */

import type { ChipData } from '@/components/patterns/list/grid-list-row-types';
import { descriptorChipData } from '@/lib/chip/chip-data-helpers';
import type { CodexFeat } from '@/types/codex';
import { formatTraitRecoveryLabel } from './format-recovery';

/** Minimal trait shape (codex Trait / ResolvedTrait). */
export interface DetailOptionTraitLike {
  id: string | number;
  name: string;
  description?: string | null | undefined;
  uses_per_rec?: number | null | undefined;
  rec_period?: string | null | undefined;
}

export interface DetailOptionItemModel {
  id: string;
  name: string;
  description?: string | undefined;
  /**
   * @deprecated Prefer labeled expanded chips. Still accepted for migration; DetailOptionList ignores it.
   */
  stats?: string | undefined;
  chips?: ChipData[] | undefined;
  chipsLabel?: string | undefined;
  /** Plain-text expanded hint (legacy). Prefer chips with descriptions. */
  expandedHint?: string | undefined;
  hideUsesInName?: boolean | undefined;
  /** Dim row (e.g. unresolved legacy refs) — maps to GridListRow disabled opacity. */
  disabled?: boolean | undefined;
}

/** Self-describing fact chip for expanded GridListRow details. */
export function factChip(label: string): ChipData {
  return descriptorChipData(label, 'default');
}

/**
 * Uses/recovery as a self-describing DescriptorChip (TASK-579).
 * Label already states the fact — do not attach expandable restatement copy.
 */
export function usesFactChips(uses: number, recPeriod: string | undefined): ChipData[] {
  if (uses <= 0) return [];
  const recovery = formatTraitRecoveryLabel(recPeriod);
  const label = recovery ? `Uses ${uses} / ${recovery}` : `Uses ${uses}`;
  return [descriptorChipData(label, 'default')];
}

export function traitToDetailOption(trait: DetailOptionTraitLike): DetailOptionItemModel {
  const uses = trait.uses_per_rec ?? 0;
  return {
    id: String(trait.id),
    name: trait.name,
    description: trait.description?.trim() || undefined,
    hideUsesInName: true,
    chips: usesFactChips(uses, trait.rec_period ?? undefined),
  };
}

export function featToDetailOption(feat: CodexFeat): DetailOptionItemModel {
  const uses = feat.uses_per_rec ?? 0;
  return {
    id: String(feat.id),
    name: feat.name,
    description: feat.description?.trim() || undefined,
    chips: usesFactChips(uses, feat.rec_period),
  };
}
