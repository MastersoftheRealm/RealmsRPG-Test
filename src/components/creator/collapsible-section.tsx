/**
 * Collapsible Section
 * ===================
 * A collapsible card section with opt-in functionality.
 * Used for optional sections like Powers, Techniques, Armaments.
 */

'use client';

import { useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';

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
        'rounded-xl border-2 border-dashed border-border-light bg-surface-secondary p-6',
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEnabledChange?.(true)}
          >
            + Enable {title}
          </Button>
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
        className="w-full p-4 flex items-center justify-between hover:bg-surface-alt transition-colors"
      >
        <div className="flex items-center gap-3">
          {icon && <span className="text-xl">{icon}</span>}
          <div className="text-left">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-primary">{title}</h3>
              {typeof itemCount === 'number' && (
                <span className="px-2 py-0.5 text-xs font-medium bg-surface-alt text-secondary rounded-full">
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
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEnabledChange?.(false);
              }}
              className="text-danger-600 hover:bg-danger-light"
            >
              Remove
            </Button>
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
        <div className="p-4 pt-0 border-t border-border-subtle">
          {children}
        </div>
      )}
    </div>
  );
}
