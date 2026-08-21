'use client';

/**
 * TabSummarySection - Compact Top Section for Tab Summary Info
 * ============================================================
 * A unified component for displaying summary information at the top of tabs.
 * Used for: innate energy/pools, currency, armament proficiency, physical attributes, etc.
 *
 * Variants use solid theme-aware domain fills (power/martial/currency/info/surface) —
 * no gradients, numbered ramps, or ad-hoc `dark:` pairs.
 */

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface TabSummarySectionProps {
  /** Content to display in the summary section */
  children: ReactNode;
  /** Variant controls the color scheme */
  variant?: 'default' | 'power' | 'martial' | 'currency' | 'physical' | undefined;
  /** Additional className */
  className?: string | undefined;
}

const variantStyles = {
  default: 'bg-surface-alt border-border-light',
  power: 'bg-power-light border-power-border',
  martial: 'bg-martial-light border-martial-border',
  currency: 'bg-currency-light border-currency-border',
  physical: 'bg-info-light border-info-border',
};

export function TabSummarySection({
  children,
  variant = 'default',
  className,
}: TabSummarySectionProps) {
  return (
    <div className={cn('mb-4 rounded-lg border px-4 py-3', variantStyles[variant], className)}>
      {children}
    </div>
  );
}

/**
 * SummaryItem - Individual item within a TabSummarySection
 * Displays a label/value pair in a compact format
 */
export interface SummaryItemProps {
  /** Label text */
  label: string;
  /** Value to display (can be string, number, or ReactNode) */
  value: ReactNode;
  /** Optional icon/emoji before the label */
  icon?: ReactNode | undefined;
  /** Optional help control beside the label (e.g. InfoTippy) — same slot as PointStatus.labelAccessory */
  labelAccessory?: ReactNode | undefined;
  /** Highlight the value with color */
  highlight?: boolean | undefined;
  /** Color variant for highlighting */
  highlightColor?: 'primary' | 'success' | 'warning' | 'danger' | 'power' | 'martial' | undefined;
  /** Additional className */
  className?: string | undefined;
}

const highlightColors = {
  primary: 'text-primary-link-fg',
  success: 'text-success-fg',
  warning: 'text-warning-fg',
  danger: 'text-danger-fg',
  power: 'text-power-fg',
  martial: 'text-martial-fg',
};

export function SummaryItem({
  label,
  value,
  icon,
  labelAccessory,
  highlight = false,
  highlightColor = 'primary',
  className,
}: SummaryItemProps) {
  return (
    <div className={cn('flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5', className)}>
      {icon && <span className="shrink-0 text-sm">{icon}</span>}
      <span className="inline-flex min-w-0 items-center gap-0.5 text-sm text-text-secondary">
        <span>{label}</span>
        {labelAccessory}
        <span aria-hidden="true">:</span>
      </span>
      <span
        className={cn(
          'shrink-0 text-sm font-bold',
          highlight ? highlightColors[highlightColor] : 'text-text-primary',
        )}
      >
        {value}
      </span>
    </div>
  );
}

/**
 * SummaryRow - Horizontal row of summary items
 * Provides consistent spacing and layout
 */
export interface SummaryRowProps {
  children: ReactNode;
  className?: string | undefined;
}

export function SummaryRow({ children, className }: SummaryRowProps) {
  return <div className={cn('flex flex-wrap items-center gap-4', className)}>{children}</div>;
}
