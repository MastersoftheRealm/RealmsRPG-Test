/**
 * Builders that map domain entities → DetailOptionItem for deep-dive catalogs.
 * Keep free of JSX so both server and client modules can import.
 *
 * Facts that used to sit in a Stats column must be labeled chips in the expanded row
 * (e.g. "Uses: 2", "Damage Reduction 3") so values are self-describing.
 */

import type { ChipData } from '@/components/shared/grid-list-row-types';
import { descriptorChipData } from '@/lib/chip/chip-data-helpers';
import {
  trainingPointsForItemPropertyRef,
  type ItemPropertyTpRow,
} from '@/lib/calculators/item-calc';
import type { CodexFeat } from '@/types/codex';
import {
  formatLimitedUsesExpandedHint,
  formatTraitRecoveryLabel,
} from './format-recovery';

/** Minimal trait shape (codex Trait / ResolvedTrait). */
export interface DetailOptionTraitLike {
  id: string | number;
  name: string;
  description?: string | null;
  uses_per_rec?: number | null;
  rec_period?: string | null;
}

export interface DetailOptionItemModel {
  id: string;
  name: string;
  description?: string;
  /**
   * @deprecated Prefer labeled expanded chips. Still accepted for migration; DetailOptionList ignores it.
   */
  stats?: string;
  chips?: ChipData[];
  chipsLabel?: string;
  /** Plain-text expanded hint (legacy). Prefer chips with descriptions. */
  expandedHint?: string;
  hideUsesInName?: boolean;
  /** Dim row (e.g. unresolved legacy refs) — maps to GridListRow disabled opacity. */
  disabled?: boolean;
}

/** Self-describing fact chip for expanded GridListRow details. */
export function factChip(label: string): ChipData {
  return descriptorChipData(label, 'default');
}

export function usesFactChips(
  uses: number,
  recPeriod: string | undefined
): ChipData[] {
  if (uses <= 0) return [];
  const recovery = formatTraitRecoveryLabel(recPeriod);
  const label = recovery ? `Uses ${uses} / ${recovery}` : `Uses ${uses}`;
  const description = formatLimitedUsesExpandedHint(uses, recPeriod) ?? undefined;
  return [
    {
      name: label,
      description,
      category: 'default',
      kind: description ? undefined : 'descriptor',
    },
  ];
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

export function propertyChipsFromRefs(
  properties: Array<string | { name?: string; id?: unknown; op_1_lvl?: number }> | undefined,
  itemProperties: ItemPropertyTpRow[]
): ChipData[] {
  if (!properties?.length) return [];
  return properties
    .map((prop) => {
      const propName = typeof prop === 'string' ? prop : String(prop?.name ?? '');
      if (!propName.trim()) return null;
      const dbProp = itemProperties.find(
        (p) => String(p.name ?? '').toLowerCase() === propName.toLowerCase()
      );
      const tp = trainingPointsForItemPropertyRef(prop, itemProperties);
      const chip: ChipData = {
        name: dbProp?.name || propName,
        description: dbProp?.description,
        cost: tp > 0 ? tp : undefined,
        costLabel: 'TP',
        category: tp > 0 ? 'cost' : 'default',
      };
      if (!tp && !dbProp?.description) chip.kind = 'descriptor';
      return chip;
    })
    .filter((c): c is ChipData => Boolean(c));
}
