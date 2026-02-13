'use client';

/**
 * TabSummarySection - Compact Top Section for Tab Summary Info
 * ============================================================
 * A unified component for displaying summary information at the top of tabs.
 * Used for: innate energy/pools, currency, armament proficiency, physical attributes, etc.
 * 
 * Design Goals:
 * - Compact and clean - doesn't waste vertical space
 * - Sleek gradient background to distinguish from main content
 * - Flexible layout for different content types
 * - Consistent padding and rounded corners
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
  default: 'bg-gradient-to-r from-surface-alt to-surface border-border-light dark:from-surface dark:to-surface-alt',
  power: 'bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-900/30 dark:to-indigo-900/30 border-violet-200 dark:border-violet-700/50',
  martial: 'bg-gradient-to-r from-success-50 to-success-100 dark:from-success-900/30 dark:to-success-800/20 border-success-200 dark:border-success-700/50',
  currency: 'bg-gradient-to-r from-warning-50 to-warning-100 dark:from-warning-900/30 dark:to-warning-800/20 border-warning-200 dark:border-warning-700/50',
  physical: 'bg-gradient-to-r from-info-50 to-info-100 dark:from-info-900/30 dark:to-info-800/20 border-info-200 dark:border-info-700/50',
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
  primary: 'text-primary-600 dark:text-primary-400',
  success: 'text-success-600 dark:text-success-400',
  warning: 'text-warning-600 dark:text-warning-400',
  danger: 'text-danger-600 dark:text-danger-400',
  power: 'text-violet-600 dark:text-violet-400',
  martial: 'text-success-700 dark:text-success-400',
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
