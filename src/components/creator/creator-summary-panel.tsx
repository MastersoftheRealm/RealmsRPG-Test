/**
 * Creator Summary Panel
 * =====================
 * Unified sticky sidebar for all creator tools.
 * Supports:
 * - Cost stat boxes (Energy, TP, Currency, etc.)
 * - Quick stats (HP, EN, SPD, etc.)
 * - Resource items with remaining points
 * - Stat rows (key-value pairs)
 * - Breakdown lists (TP sources, properties, etc.)
 * - Custom content via children
 */

'use client';

import { cn } from '@/lib/utils';
import { Card, DescriptorChip } from '@/components/ui';
import type { chipVariants } from '@/components/ui/chip';
import type { VariantProps } from 'class-variance-authority';
import type { ReactNode } from 'react';

type ChipVariant = NonNullable<VariantProps<typeof chipVariants>['variant']>;

export interface SummaryItem {
  /** Label for the resource */
  label: string;
  /** Remaining/available points */
  remaining: number;
  /** Total points available (optional, for display) */
  total?: number;
  /** Custom color variant */
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}

export interface CostStat {
  /** Label below the value */
  label: string;
  /** The stat value */
  value: string | number;
  /** Lucide icon component */
  icon?: ReactNode;
  /** Color theme: energy (blue), tp (purple), health (red), currency (amber) */
  color: 'energy' | 'tp' | 'health' | 'currency';
  /** Optional InfoTippy beside the label */
  help?: ReactNode;
}

export interface StatRow {
  /** Left-side label */
  label: string;
  /** Right-side value */
  value: string | number;
  /** Optional custom color for value (for negative values, etc.) */
  valueColor?: string;
}

export interface BreakdownList {
  /** Section title */
  title: string;
  /** List items (can be strings or objects with label and optional detail) */
  items: Array<string | { label: string; detail?: string }>;
}

export interface CreatorSummaryPanelProps {
  /** Title of the summary panel */
  title: string;
  /** Large cost stat boxes at top (Energy/TP/Currency) */
  costStats?: CostStat[];
  /** Badge displayed prominently (for rarity, etc.) */
  badge?: {
    label: string;
    variant?: ChipVariant;
    /** @deprecated Prefer `variant` (canonical chip token) */
    className?: string;
  };
  /** Summary items to display (resource tracking with remaining points) */
  items?: SummaryItem[];
  /** Optional quick stats section (HP, EN, SPD chips) */
  quickStats?: {
    label: string;
    value: string | number;
    color?: string;
  }[];
  /** Key-value stat rows */
  statRows?: StatRow[];
  /** Breakdown lists (TP sources, properties, etc.) */
  breakdowns?: BreakdownList[];
  /** Compact resource boxes at top (e.g. ability pts, skill pts - for creature creator) */
  resourceBoxes?: Array<{
    label: string;
    value: number | string;
    variant?: SummaryItem['variant'];
  }>;
  /** Line items as sentences: "Skills: Stealth +3, Athletics -1" (D&D stat block style) */
  lineItems?: Array<{ label: string; items: string[] }>;
  /** Abilities as chips (e.g. STR +2, VIT +1) — rendered in a section "Abilities" below quickStats with border/chip style */
  abilitiesChips?: Array<{ abbr: string; value: number }>;
  /** Additional content at the bottom */
  children?: ReactNode;
  /** Help row under cost stats (e.g. Innate Power tip) */
  costHelp?: ReactNode;
  /** Additional class names */
  className?: string;
}

const COST_STAT_COLORS: Record<CostStat['color'], { bg: string; text: string }> = {
  energy: { bg: 'bg-energy-light', text: 'text-energy-text' },
  tp: { bg: 'bg-tp-light', text: 'text-tp-text' },
  health: { bg: 'bg-health-light', text: 'text-health' },
  currency: { bg: 'bg-currency-light', text: 'text-currency-text' },
};

function getVariantClasses(variant: SummaryItem['variant'], remaining: number | string): string {
  const numericRemaining = typeof remaining === 'number' ? remaining : Number.NaN;
  // Auto-determine variant based on remaining if not specified
  if (!variant) {
    if (!Number.isNaN(numericRemaining) && numericRemaining < 0) variant = 'danger';
    else if (!Number.isNaN(numericRemaining) && numericRemaining === 0) variant = 'success';
    else variant = 'info';
  }

  switch (variant) {
    case 'danger':
      return 'bg-danger-light text-danger-fg';
    case 'success':
      return 'bg-success-light text-success-fg';
    case 'warning':
      return 'bg-warning-light text-warning-fg';
    case 'info':
      return 'bg-info-light text-info-fg';
    default:
      return 'bg-surface-alt text-secondary';
  }
}

export function CreatorSummaryPanel({
  title,
  costStats,
  badge,
  items,
  quickStats,
  statRows,
  breakdowns,
  resourceBoxes,
  lineItems,
  abilitiesChips,
  children,
  costHelp,
  className,
}: CreatorSummaryPanelProps) {
  return (
    <Card className={cn('p-6 shadow-md', className)}>
      <h2 className="mb-4 text-lg font-bold text-text-primary">{title}</h2>

      {/* Resource boxes (compact, for creature creator - ability/skill/feat/training/currency) */}
      {resourceBoxes && resourceBoxes.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {resourceBoxes.map((box, i) => (
            <div
              key={i}
              className={cn(
                // w-fit lets each box grow with long current/max values; max-w-full avoids overflow on narrow sidebars
                'w-fit max-w-full min-w-[5rem] shrink-0 rounded-lg px-3 py-2 text-center text-sm',
                getVariantClasses(box.variant, box.value),
              )}
            >
              <div className="max-w-full [scrollbar-width:thin] overflow-x-auto">
                <div className="mx-auto w-max max-w-none text-base font-bold whitespace-nowrap text-inherit tabular-nums">
                  {typeof box.value === 'number' ? box.value.toLocaleString() : box.value}
                </div>
              </div>
              <div className="text-[10px] tracking-wide break-words whitespace-normal text-inherit uppercase opacity-80">
                {box.label}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Badge (Rarity, etc.) */}
      {badge && (
        <div className="mb-6 text-center">
          {badge.variant ? (
            <DescriptorChip variant={badge.variant} size="lg" className="font-bold">
              {badge.label}
            </DescriptorChip>
          ) : (
            <DescriptorChip size="lg" className={cn('font-bold', badge.className)}>
              {badge.label}
            </DescriptorChip>
          )}
        </div>
      )}

      {/* Cost Stats (Energy/TP/Currency boxes) */}
      {costStats && costStats.length > 0 && (
        <div
          className={cn(
            'mb-6 grid gap-4',
            costStats.length === 2
              ? 'grid-cols-2'
              : costStats.length === 3
                ? 'grid-cols-3'
                : 'grid-cols-2',
          )}
        >
          {costStats.map((stat, index) => {
            const colors = COST_STAT_COLORS[stat.color];
            return (
              <div key={index} className={cn('rounded-lg p-4 text-center', colors.bg)}>
                {stat.icon && (
                  <div className={cn('mx-auto mb-1 h-6 w-6', colors.text)}>{stat.icon}</div>
                )}
                <div className={cn('text-2xl font-bold', colors.text)}>
                  {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                </div>
                <div
                  className={cn(
                    'inline-flex items-center justify-center gap-0.5 text-xs',
                    colors.text,
                  )}
                >
                  {stat.label}
                  {stat.help}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {costHelp ? <div className="-mt-2 mb-4">{costHelp}</div> : null}

      {/* Quick Stats (HP, EN, SPD chips) */}
      {quickStats && quickStats.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2 border-b border-border-light pb-4">
          {quickStats.map((stat, index) => (
            <div
              key={index}
              className={cn(
                'flex items-center gap-2 rounded-lg border border-border-light px-3 py-1.5 text-sm',
                stat.color || 'bg-surface-alt',
              )}
            >
              <span className="text-text-muted">{stat.label}</span>
              <span className="font-bold text-text-primary">{stat.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Abilities (chip/border style, same family as HP/EVA) */}
      {abilitiesChips && abilitiesChips.length > 0 && (
        <div className="mb-4 border-b border-border-light pb-4">
          <h3 className="mb-2 text-sm font-semibold text-text-secondary dark:text-text-primary">
            Abilities
          </h3>
          <div className="flex flex-wrap gap-2">
            {abilitiesChips.map((ab, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 rounded-lg border border-border-light bg-surface-alt px-3 py-1.5 text-sm font-medium text-text-primary"
              >
                <span className="text-text-muted">{ab.abbr}</span>
                <span>
                  {ab.value >= 0 ? '+' : ''}
                  {ab.value}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Stat Rows (key-value pairs) */}
      {statRows && statRows.length > 0 && (
        <div className="mb-6 space-y-2 text-sm">
          {statRows.map((row, index) => (
            <div key={index} className="flex justify-between">
              <span className="text-text-secondary dark:text-text-primary">{row.label}:</span>
              <span className={cn('font-medium text-text-primary', row.valueColor)}>
                {row.value}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Resource Items (with remaining points) */}
      {items && items.length > 0 && (
        <div className="space-y-3">
          {items.map((item, index) => (
            <div
              key={index}
              className={cn(
                'flex items-center justify-between rounded-lg p-3',
                getVariantClasses(item.variant, item.remaining),
              )}
            >
              <span className="text-sm font-medium text-inherit opacity-80">{item.label}</span>
              <span className="font-bold">
                {item.remaining}
                {typeof item.total === 'number' && (
                  <span className="ml-1 text-xs text-text-muted">/ {item.total}</span>
                )}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Line items (D&D stat block style: "Skills: X, Y, Z") */}
      {lineItems && lineItems.length > 0 && (
        <div className="mt-4 space-y-2 border-t border-border-subtle pt-4 text-sm">
          {lineItems
            .filter((li) => li.items.length > 0)
            .map((li, i) => (
              <div key={i}>
                <span className="font-medium text-text-secondary dark:text-text-primary">
                  {li.label}:{' '}
                </span>
                <span className="text-text-primary">{li.items.join(', ')}</span>
              </div>
            ))}
        </div>
      )}

      {/* Breakdown Lists (TP sources, properties, etc.) */}
      {breakdowns && breakdowns.length > 0 && (
        <>
          {breakdowns.map((breakdown, index) => (
            <div key={index} className="mt-4 border-t border-border-subtle pt-4">
              <h3 className="mb-2 text-sm font-medium text-text-secondary dark:text-text-primary">
                {breakdown.title}
              </h3>
              <ul className="space-y-1 text-xs text-text-secondary dark:text-text-primary">
                {breakdown.items.map((item, i) => (
                  <li key={i}>
                    •{' '}
                    {typeof item === 'string' ? (
                      item
                    ) : (
                      <>
                        {item.label}
                        {item.detail && (
                          <span className="ml-1 text-text-muted">({item.detail})</span>
                        )}
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </>
      )}

      {/* Additional Content */}
      {children && <div className="mt-4 border-t border-border-light pt-4">{children}</div>}
    </Card>
  );
}
