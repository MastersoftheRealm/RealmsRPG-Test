/**
 * Creator Summary Panel
 * =====================
 * Sticky sidebar showing resource point summaries.
 * Used in creature creator and other creator tools.
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

export interface CreatorSummaryPanelProps {
  /** Title of the summary panel */
  title: string;
  /** Summary items to display */
  items: SummaryItem[];
  /** Optional quick stats section at top */
  quickStats?: {
    label: string;
    value: string | number;
    color?: string;
  }[];
  /** Additional content at the bottom */
  children?: ReactNode;
  /** Additional class names */
  className?: string;
}

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
      return 'bg-neutral-100 text-secondary';
  }
}

export function CreatorSummaryPanel({
  title,
  items,
  quickStats,
  children,
  className,
}: CreatorSummaryPanelProps) {
  return (
    <div className={cn(
      'bg-surface rounded-xl shadow-md p-6 sticky top-24',
      className
    )}>
      <h3 className="text-lg font-bold text-primary mb-4">{title}</h3>

      {/* Quick Stats (optional) */}
      {quickStats && quickStats.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b border-border-light">
          {quickStats.map((stat, index) => (
            <div
              key={index}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm',
                stat.color || 'bg-neutral-100'
              )}
            >
              <span className="text-tertiary">{stat.label}</span>
              <span className="font-bold">{stat.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Resource Items */}
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
                <span className="text-xs opacity-70 ml-1">/ {item.total}</span>
              )}
            </span>
          </div>
        ))}
      </div>

      {/* Additional Content */}
      {children && (
        <div className="mt-4 pt-4 border-t border-border-light">
          {children}
        </div>
      )}
    </div>
  );
}
