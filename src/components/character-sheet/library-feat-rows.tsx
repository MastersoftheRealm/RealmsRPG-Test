'use client';

/**
 * Maps character sheet feats/traits to FeatsTraitsListSection row shapes.
 */

import type { ReactNode } from 'react';
import { DecrementButton, IncrementButton, type ColumnValue } from '@/components/shared';
import type { ChipData } from '@/components/shared/grid-list-row';
import type { EntityFeatRow } from '@/components/shared/entity-library-sections';
import { FEAT_GRID } from '@/components/shared/entity-library-sections';

const DESCRIPTION_EXTENDED_TRUNCATE = 220;

function truncateText(text: string | undefined, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

function formatRecoveryAbbrev(recovery: string | undefined): string {
  if (!recovery) return '';
  const lower = recovery.toLowerCase();
  if (lower.includes('partial')) return 'PR';
  if (lower.includes('full')) return 'FR';
  if (lower.includes('short')) return 'SR';
  if (lower.includes('long')) return 'LR';
  return '';
}

export type TraitRowInput = {
  name: string;
  description?: string;
  maxUses?: number;
  recoveryPeriod?: string;
  category?: string;
};

export type FeatRowInput = {
  id?: string | number;
  name: string;
  description?: string;
  maxUses?: number;
  currentUses?: number;
  recovery?: string;
};

export type FeatRowContext = {
  showEditControls: boolean;
  traitUses: Record<string, number>;
  onTraitUsesChange?: (traitName: string, delta: number) => void;
  onFeatUsesChange?: (featId: string, delta: number) => void;
  onRemoveFeat?: (featId: string, featName?: string) => void;
  getFeatLevelDetailSections?: (
    featId: string | number
  ) => Array<{ label: string; chips: ChipData[]; hideLabelIfSingle?: boolean }> | undefined;
};

function buildUsesStepper(
  uses: { current: number; max: number } | undefined,
  onDecrement: (() => void) | undefined,
  onIncrement: (() => void) | undefined
): ReactNode {
  if (uses && onDecrement && onIncrement) {
    return (
      <div className="flex items-center justify-center gap-1">
        <DecrementButton onClick={onDecrement} disabled={uses.current <= 0} size="sm" />
        <span className="min-w-[2.5rem] text-center text-sm font-medium tabular-nums">
          {uses.current}/{uses.max}
        </span>
        <IncrementButton onClick={onIncrement} disabled={uses.current >= uses.max} size="sm" />
      </div>
    );
  }
  if (uses) {
    return <span className="text-sm text-text-secondary">{uses.current}/{uses.max}</span>;
  }
  return '-';
}

function buildFeatTraitColumns(
  description: string | undefined,
  uses: { current: number; max: number } | undefined,
  recovery: string | undefined,
  usesStepper: ReactNode
): { columns: ColumnValue[]; columnSpans?: (number | undefined)[] } {
  const recoveryDisplay = formatRecoveryAbbrev(recovery) || '-';
  const noUsesOrRecovery = !uses && recoveryDisplay === '-';
  if (noUsesOrRecovery) {
    return {
      columns: [{ key: 'description', value: truncateText(description, DESCRIPTION_EXTENDED_TRUNCATE), hideOnMobile: true }],
      columnSpans: [3],
    };
  }
  return {
    columns: [
      { key: 'description', value: truncateText(description, uses ? 60 : 100), hideOnMobile: true },
      { key: 'uses', value: usesStepper, align: 'center' },
      { key: 'recovery', value: recoveryDisplay, align: 'center' },
    ],
  };
}

export function mapTraitRows(traits: TraitRowInput[], ctx: FeatRowContext): EntityFeatRow[] {
  return traits.map((trait, index) => {
    const uses =
      (trait.maxUses ?? 0) > 0
        ? {
            current: ctx.traitUses[trait.name] ?? trait.maxUses ?? 0,
            max: trait.maxUses ?? 0,
          }
        : undefined;
    const usesStepper = buildUsesStepper(
      uses,
      uses && ctx.onTraitUsesChange ? () => ctx.onTraitUsesChange!(trait.name, -1) : undefined,
      uses && ctx.onTraitUsesChange ? () => ctx.onTraitUsesChange!(trait.name, 1) : undefined
    );
    const { columns, columnSpans } = buildFeatTraitColumns(
      trait.description,
      uses,
      trait.recoveryPeriod,
      usesStepper
    );
    const categoryLabel =
      trait.category && trait.category !== 'species'
        ? trait.category.charAt(0).toUpperCase() + trait.category.slice(1)
        : undefined;

    return {
      id: `${trait.category ?? 'trait'}-${index}`,
      name: trait.name,
      description: trait.description,
      gridColumns: FEAT_GRID,
      columns,
      columnSpans,
      badges: categoryLabel ? [{ label: categoryLabel, color: 'gray' }] : undefined,
      uses,
      hideUsesInName: !!(uses && ctx.onTraitUsesChange),
    };
  });
}

export function mapFeatRows(
  feats: FeatRowInput[],
  ctx: FeatRowContext,
  options?: {
    badge?: { label: string; color?: 'blue' | 'purple' | 'green' | 'amber' | 'gray' | 'red' };
  }
): EntityFeatRow[] {
  return feats.map((feat, index) => {
    const featId = String(feat.id ?? index);
    const uses =
      (feat.maxUses ?? 0) > 0
        ? {
            current: feat.currentUses ?? feat.maxUses ?? 0,
            max: feat.maxUses ?? 0,
          }
        : undefined;
    const usesStepper = buildUsesStepper(
      uses,
      uses && ctx.onFeatUsesChange ? () => ctx.onFeatUsesChange!(featId, -1) : undefined,
      uses && ctx.onFeatUsesChange ? () => ctx.onFeatUsesChange!(featId, 1) : undefined
    );
    const { columns, columnSpans } = buildFeatTraitColumns(feat.description, uses, feat.recovery, usesStepper);

    return {
      id: featId,
      name: feat.name,
      description: feat.description,
      gridColumns: FEAT_GRID,
      columns,
      columnSpans,
      badges: options?.badge ? [options.badge] : undefined,
      detailSections: ctx.getFeatLevelDetailSections?.(featId),
      uses,
      hideUsesInName: !!(uses && ctx.onFeatUsesChange),
      onDelete:
        ctx.showEditControls && ctx.onRemoveFeat ? () => ctx.onRemoveFeat!(featId, feat.name) : undefined,
    };
  });
}
