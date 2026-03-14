/**
 * Collapsible Section
 * ===================
 * A collapsible card section with opt-in functionality.
 * Used for optional sections like Powers, Techniques, Armaments.
 * When collapsed, shows collapsedSummary (e.g. "Basic Reaction", "12 Spaces").
 */

'use client';

import { useState, type ReactNode } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';

export interface CollapsibleSectionProps {
  /** Section title */
  title: string;
  /** Section subtitle or description (shown when expanded) */
  subtitle?: string;
  /** Shorthand summary shown when collapsed (e.g. "Basic Reaction", "12 Spaces") */
  collapsedSummary?: string;
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
  /** Right-side content (e.g. cost badge, add button) - shown in header */
  rightSlot?: ReactNode;
  /** Children content */
  children: ReactNode;
  /** Additional class names */
  className?: string;
}

export function CollapsibleSection({
  title,
  subtitle,
  collapsedSummary,
  optional = false,
  enabled = true,
  onEnabledChange,
  defaultExpanded = true,
  itemCount,
  points,
  icon,
  rightSlot,
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
            {icon && <span className="text-2xl text-text-muted dark:text-text-secondary">{icon}</span>}
            <div>
              <h3 className="font-bold text-text-secondary dark:text-text-primary">{title}</h3>
              {subtitle && <p className="text-sm text-text-muted dark:text-text-secondary">{subtitle}</p>}
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onEnabledChange?.(true)}
          >
            + Enable {title}
          </Button>
        </div>
      </div>
    );
  }

  const handleHeaderKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsExpanded((prev) => !prev);
    }
  };

  return (
    <div className={cn(
      'rounded-xl border border-border-light bg-surface shadow-sm overflow-hidden',
      className
    )}>
      {/* Header: div with role="button" so rightSlot can contain real <button>s without nesting */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsExpanded(!isExpanded)}
        onKeyDown={handleHeaderKeyDown}
        className="w-full p-4 flex items-center justify-between gap-3 hover:bg-surface-alt transition-colors text-left cursor-pointer"
        aria-expanded={isExpanded}
        aria-label={isExpanded ? `Collapse ${title}` : `Expand ${title}`}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {icon && <span className="text-xl flex-shrink-0">{icon}</span>}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-primary dark:text-primary-300">{title}</h3>
              {!isExpanded && collapsedSummary && (
                <span className="text-sm font-medium text-text-secondary dark:text-text-primary truncate">
                  {collapsedSummary}
                </span>
              )}
              {points && (
                <span className={cn(
                  'px-2 py-0.5 text-xs font-medium rounded-full flex-shrink-0',
                  points.spent > points.total 
                    ? 'bg-danger-light text-danger-700 dark:text-danger-400' 
                    : 'bg-warning-light text-warning-700 dark:text-warning-300'
                )}>
                  {points.spent}/{points.total} pts
                </span>
              )}
              {itemCount !== undefined && itemCount > 0 && (
                <span className="text-xs text-text-muted dark:text-text-secondary">({itemCount})</span>
              )}
            </div>
            {isExpanded && subtitle && <p className="text-sm text-text-muted dark:text-text-secondary mt-0.5">{subtitle}</p>}
          </div>
          <span className="flex-shrink-0 text-text-muted dark:text-text-secondary" aria-hidden>
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </span>
        </div>
        
        <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          {rightSlot}
          {optional && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEnabledChange?.(false);
              }}
              className="text-danger-600 dark:text-danger-400 hover:bg-danger-light dark:hover:bg-danger-900/20"
            >
              Remove
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 pt-0">
          {children}
        </div>
      )}
    </div>
  );
}
