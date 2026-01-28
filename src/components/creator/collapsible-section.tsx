/**
 * Collapsible Section
 * ===================
 * A collapsible card section with opt-in functionality.
 * Used for optional sections like Powers, Techniques, Armaments.
 */

'use client';

import { useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface CollapsibleSectionProps {
  /** Section title */
  title: string;
  /** Section subtitle or description */
  subtitle?: string;
  /** Whether this section is optional (can be enabled/disabled) */
  optional?: boolean;
  /** Whether the section is enabled (for optional sections) */
  enabled?: boolean;
  /** Callback when enabled state changes */
  onEnabledChange?: (enabled: boolean) => void;
  /** Whether the section is expanded */
  defaultExpanded?: boolean;
  /** Number of items in the section (for badge display) */
  itemCount?: number;
  /** Points or resources associated with this section */
  points?: { spent: number; total: number };
  /** Icon to display */
  icon?: ReactNode;
  /** Children content */
  children: ReactNode;
  /** Additional class names */
  className?: string;
}

export function CollapsibleSection({
  title,
  subtitle,
  optional = false,
  enabled = true,
  onEnabledChange,
  defaultExpanded = true,
  itemCount,
  points,
  icon,
  children,
  className,
}: CollapsibleSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // If optional and not enabled, show enable button
  if (optional && !enabled) {
    return (
      <div className={cn(
        'rounded-xl border-2 border-dashed border-neutral-300 bg-surface-secondary p-6',
        className
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {icon && <span className="text-2xl text-tertiary">{icon}</span>}
            <div>
              <h3 className="font-bold text-secondary">{title}</h3>
              {subtitle && <p className="text-sm text-tertiary">{subtitle}</p>}
            </div>
          </div>
          <button
            onClick={() => onEnabledChange?.(true)}
            className="px-4 py-2 rounded-lg border border-primary-500 text-primary-600 hover:bg-primary-50 font-medium text-sm transition-colors"
          >
            + Enable {title}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      'rounded-xl border bg-surface shadow-sm overflow-hidden',
      className
    )}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-neutral-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {icon && <span className="text-xl">{icon}</span>}
          <div className="text-left">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-primary">{title}</h3>
              {typeof itemCount === 'number' && (
                <span className="px-2 py-0.5 text-xs font-medium bg-neutral-100 text-secondary rounded-full">
                  {itemCount}
                </span>
              )}
              {points && (
                <span className={cn(
                  'px-2 py-0.5 text-xs font-medium rounded-full',
                  points.spent > points.total 
                    ? 'bg-danger-light text-danger-600' 
                    : 'bg-warning-light text-warning-700'
                )}>
                  {points.spent}/{points.total} pts
                </span>
              )}
            </div>
            {subtitle && <p className="text-sm text-tertiary">{subtitle}</p>}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {optional && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEnabledChange?.(false);
              }}
              className="px-2 py-1 text-xs text-danger-600 hover:bg-danger-light rounded transition-colors"
            >
              Remove
            </button>
          )}
          <span className={cn(
            'text-xl text-tertiary transition-transform',
            isExpanded && 'rotate-180'
          )}>
            ▼
          </span>
        </div>
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 pt-0 border-t border-neutral-100">
          {children}
        </div>
      )}
    </div>
  );
}
