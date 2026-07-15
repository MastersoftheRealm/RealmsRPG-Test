/**
 * Collapsible Section
 * ===================
 * Expandable card section for creator optional/primary blocks.
 * Expand control is a dedicated <button>; rightSlot/Remove sit outside it (no nested interactives).
 */

'use client';

import { useState, type ReactNode } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button, Card } from '@/components/ui';

export interface CollapsibleSectionProps {
  title: string;
  subtitle?: string;
  collapsedSummary?: string;
  optional?: boolean;
  enabled?: boolean;
  onEnabledChange?: (enabled: boolean) => void;
  defaultExpanded?: boolean;
  itemCount?: number;
  points?: { spent: number; total: number };
  icon?: ReactNode;
  /** Actions next to the expand control (not nested inside it) */
  rightSlot?: ReactNode;
  children: ReactNode;
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

  if (optional && !enabled) {
    return (
      <div
        className={cn(
          'rounded-xl border-2 border-dashed border-border-light bg-surface-secondary p-6',
          className
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {icon && (
              <span className="text-2xl text-text-muted dark:text-text-secondary" aria-hidden>
                {icon}
              </span>
            )}
            <div className="min-w-0">
              <h2 className="font-bold text-text-secondary dark:text-text-primary">{title}</h2>
              {subtitle && (
                <p className="text-sm text-text-muted dark:text-text-secondary">{subtitle}</p>
              )}
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={() => onEnabledChange?.(true)}>
            + Enable {title}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Card className={cn('overflow-hidden p-0', className)}>
      <div className="p-4 flex items-start gap-2">
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="min-w-0 flex-1 flex items-center gap-3 hover:bg-surface-alt -m-2 p-2 rounded-lg transition-colors text-left"
          aria-expanded={isExpanded}
          aria-label={isExpanded ? `Collapse ${title}` : `Expand ${title}`}
        >
          {icon && <span className="text-xl flex-shrink-0">{icon}</span>}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-bold text-primary-fg">{title}</h2>
              {!isExpanded && collapsedSummary && (
                <span className="text-sm font-medium text-text-secondary dark:text-text-primary truncate">
                  {collapsedSummary}
                </span>
              )}
              {points && (
                <span
                  className={cn(
                    'px-2 py-0.5 text-xs font-medium rounded-full flex-shrink-0',
                    points.spent > points.total
                      ? 'bg-danger-light text-danger-fg'
                      : 'bg-warning-light text-warning-fg'
                  )}
                >
                  {points.spent}/{points.total} pts
                </span>
              )}
              {itemCount !== undefined && itemCount > 0 && (
                <span className="text-xs text-text-muted dark:text-text-secondary">({itemCount})</span>
              )}
            </div>
            {isExpanded && subtitle && (
              <p className="text-sm text-text-muted dark:text-text-secondary mt-0.5">{subtitle}</p>
            )}
          </div>
          <span className="flex-shrink-0 text-text-muted dark:text-text-secondary" aria-hidden>
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </span>
        </button>

        {(rightSlot || optional) && (
          <div className="flex items-center gap-2 flex-shrink-0 pt-0.5">
            {rightSlot}
            {optional && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEnabledChange?.(false)}
                className="text-danger-fg hover:bg-danger-light dark:hover:bg-danger-900/20"
              >
                Remove
              </Button>
            )}
          </div>
        )}
      </div>

      {isExpanded && <div className="p-4 pt-0">{children}</div>}
    </Card>
  );
}
