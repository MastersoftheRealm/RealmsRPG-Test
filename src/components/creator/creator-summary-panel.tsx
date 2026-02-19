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
import type { ReactNode } from 'react';

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
  resourceBoxes?: Array<{ label: string; value: number; variant?: SummaryItem['variant'] }>;
  /** Line items as sentences: "Skills: Stealth +3, Athletics -1" (D&D stat block style) */
  lineItems?: Array<{ label: string; items: string[] }>;
  /** Additional content at the bottom */
  children?: ReactNode;
  /** Additional class names */
  className?: string;
}

const COST_STAT_COLORS: Record<CostStat['color'], { bg: string; text: string }> = {
  energy: { bg: 'bg-energy-light', text: 'text-energy' },
  tp: { bg: 'bg-tp-light', text: 'text-tp' },
  health: { bg: 'bg-health-light', text: 'text-health' },
  currency: { bg: 'bg-tp-light', text: 'text-tp' },
};

function getVariantClasses(variant: SummaryItem['variant'], remaining: number): string {
  // Auto-determine variant based on remaining if not specified
  if (!variant) {
    if (remaining < 0) variant = 'danger';
    else if (remaining === 0) variant = 'success';
    else variant = 'info';
  }

  switch (variant) {
    case 'danger':
      return 'bg-danger-light text-danger-600';
    case 'success':
      return 'bg-success-light text-success-600';
    case 'warning':
      return 'bg-warning-light text-warning-700';
    case 'info':
      return 'bg-info-light text-info-600';
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
  children,
  className,
}: CreatorSummaryPanelProps) {
  return (
    <div className={cn(
      'bg-surface rounded-xl shadow-md p-6',
      className
    )}>
      <h3 className="text-lg font-bold text-text-primary mb-4">{title}</h3>

      {/* Resource boxes (compact, for creature creator - ability/skill/feat/training/currency) */}
      {resourceBoxes && resourceBoxes.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mb-4">
          {resourceBoxes.map((box, i) => (
            <div
              key={i}
              className={cn(
                'rounded-lg p-2 text-center text-sm',
                getVariantClasses(box.variant, box.value)
              )}
            >
              <div className="font-bold text-base">{box.value}</div>
              <div className="text-[10px] uppercase tracking-wide opacity-90">{box.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Badge (Rarity, etc.) */}
      {badge && (
        <div className="text-center mb-6">
          <span className={cn(
            'inline-block px-4 py-1 rounded-full font-bold text-lg',
            badge.className || 'bg-surface-alt text-text-secondary'
          )}>
            {badge.label}
          </span>
        </div>
      )}

      {/* Cost Stats (Energy/TP/Currency boxes) */}
      {costStats && costStats.length > 0 && (
        <div className={cn(
          'grid gap-4 mb-6',
          costStats.length === 2 ? 'grid-cols-2' : 
          costStats.length === 3 ? 'grid-cols-3' : 
          'grid-cols-2'
        )}>
          {costStats.map((stat, index) => {
            const colors = COST_STAT_COLORS[stat.color];
            return (
              <div key={index} className={cn('rounded-lg p-4 text-center', colors.bg)}>
                {stat.icon && (
                  <div className={cn('w-6 h-6 mx-auto mb-1', colors.text)}>
                    {stat.icon}
                  </div>
                )}
                <div className={cn('text-2xl font-bold', colors.text)}>
                  {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                </div>
                <div className={cn('text-xs', colors.text)}>{stat.label}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Stats (HP, EN, SPD chips) */}
      {quickStats && quickStats.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b border-border-light">
          {quickStats.map((stat, index) => (
            <div
              key={index}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm',
                stat.color || 'bg-surface-alt'
              )}
            >
              <span className="text-text-muted">{stat.label}</span>
              <span className="font-bold">{stat.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Stat Rows (key-value pairs) */}
      {statRows && statRows.length > 0 && (
        <div className="space-y-2 text-sm mb-6">
          {statRows.map((row, index) => (
            <div key={index} className="flex justify-between">
              <span className="text-text-secondary">{row.label}:</span>
              <span className={cn('font-medium', row.valueColor)}>{row.value}</span>
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
                'flex justify-between items-center p-3 rounded-lg',
                getVariantClasses(item.variant, item.remaining)
              )}
            >
              <span className="text-sm font-medium text-inherit opacity-80">
                {item.label}
              </span>
              <span className="font-bold">
                {item.remaining}
                {typeof item.total === 'number' && (
                  <span className="text-xs text-text-muted ml-1">/ {item.total}</span>
                )}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Line items (D&D stat block style: "Skills: X, Y, Z") */}
      {lineItems && lineItems.length > 0 && (
        <div className="space-y-2 text-sm border-t border-border-subtle pt-4 mt-4">
          {lineItems.filter(li => li.items.length > 0).map((li, i) => (
            <div key={i}>
              <span className="font-medium text-text-secondary">{li.label}: </span>
              <span className="text-text-primary">{li.items.join(', ')}</span>
            </div>
          ))}
        </div>
      )}

      {/* Breakdown Lists (TP sources, properties, etc.) */}
      {breakdowns && breakdowns.length > 0 && (
        <>
          {breakdowns.map((breakdown, index) => (
            <div key={index} className="border-t border-border-subtle pt-4 mt-4">
              <h4 className="text-sm font-medium text-text-secondary mb-2">{breakdown.title}</h4>
              <ul className="text-xs text-text-secondary space-y-1">
                {breakdown.items.map((item, i) => (
                  <li key={i}>
                    • {typeof item === 'string' ? item : (
                      <>
                        {item.label}
                        {item.detail && <span className="text-text-muted ml-1">({item.detail})</span>}
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
      {children && (
        <div className="mt-4 pt-4 border-t border-border-light">
          {children}
        </div>
      )}
    </div>
  );
}
