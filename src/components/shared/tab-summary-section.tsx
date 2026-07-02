'use client';

/**
 * TabSummarySection - Compact Top Section for Tab Summary Info
 * ============================================================
 * A unified component for displaying summary information at the top of tabs.
 * Used for: innate energy/pools, currency, armament proficiency, physical attributes, etc.
 *
 * Variants use theme-aware domain tokens (power/martial/currency/info/surface) — no
 * numbered ramps or ad-hoc `dark:` gradient pairs (Phase 4).
 */

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface TabSummarySectionProps {
  /** Content to display in the summary section */
  children: ReactNode;
  /** Variant controls the color scheme */
  variant?: 'default' | 'power' | 'martial' | 'currency' | 'physical';
  /** Additional className */
  className?: string;
}

const variantStyles = {
  default: 'bg-gradient-to-r from-surface-alt to-surface border-border-light',
  power: 'bg-gradient-to-r from-power-light to-surface border-power-border',
  martial: 'bg-gradient-to-r from-martial-light to-surface border-martial-border',
  currency: 'bg-gradient-to-r from-currency-light to-surface border-currency-border',
  physical: 'bg-gradient-to-r from-info-light to-surface border-info-border',
};

export function TabSummarySection({
  children,
  variant = 'default',
  className,
}: TabSummarySectionProps) {
  return (
    <div
      className={cn(
        'px-4 py-3 rounded-lg border mb-4',
        variantStyles[variant],
        className
      )}
    >
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
  icon?: ReactNode;
  /** Highlight the value with color */
  highlight?: boolean;
  /** Color variant for highlighting */
  highlightColor?: 'primary' | 'success' | 'warning' | 'danger' | 'power' | 'martial';
  /** Additional className */
  className?: string;
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
  highlight = false,
  highlightColor = 'primary',
  className,
}: SummaryItemProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {icon && <span className="text-sm">{icon}</span>}
      <span className="text-sm text-text-secondary">{label}:</span>
      <span
        className={cn(
          'font-bold text-sm',
          highlight ? highlightColors[highlightColor] : 'text-text-primary'
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
  className?: string;
}

export function SummaryRow({ children, className }: SummaryRowProps) {
  return (
    <div className={cn('flex flex-wrap items-center gap-4', className)}>
      {children}
    </div>
  );
}

export default TabSummarySection;
