/**
 * Collapsible Section
 * ===================
 * Expandable card section for creator optional/primary blocks.
 * Expand control is a dedicated <button>; rightSlot/Remove sit outside it (no nested interactives).
 * Header stays put on expand (stable expand toggle — content opens below).
 */

'use client';

import { useState, type ElementType, type ReactNode } from 'react';
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
  /**
   * Heading level for the section title. Default `2` for page sections under an `h1`.
   * Use `3` inside dialogs whose accessible name / title is already an `h2` (e.g. deep-dive modals).
   */
  headingLevel?: 2 | 3 | 4;
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
  headingLevel = 2,
}: CollapsibleSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const HeadingTag = `h${headingLevel}` as ElementType;
  const showMetaLine = Boolean(subtitle || collapsedSummary);
  const metaText = isExpanded
    ? subtitle?.trim() || ''
    : (collapsedSummary?.trim() || subtitle?.trim() || '');

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
              <HeadingTag className="font-bold text-text-secondary dark:text-text-primary">
                {title}
              </HeadingTag>
              {subtitle && (
                <p className="text-sm text-text-muted dark:text-text-secondary">{subtitle}</p>
              )}
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onEnabledChange?.(true)}
            className="min-h-[44px]"
          >
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
          className="min-h-[44px] min-w-0 flex-1 flex items-center gap-3 hover:bg-surface-alt -m-2 p-2 rounded-lg transition-colors text-left"
          aria-expanded={isExpanded}
          aria-label={isExpanded ? `Collapse ${title}` : `Expand ${title}`}
        >
          {icon && <span className="text-xl flex-shrink-0 mt-0.5">{icon}</span>}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <HeadingTag className="font-bold text-primary-fg">{title}</HeadingTag>
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
            {/* Fixed one-line meta slot — swaps collapsed summary / subtitle without shifting chevron. */}
            {showMetaLine ? (
              <p className="text-sm text-text-muted dark:text-text-secondary mt-0.5 min-h-[1.25rem] truncate">
                {metaText || '\u00a0'}
              </p>
            ) : null}
          </div>
          <span
            className="flex-shrink-0 mt-0.5 text-text-muted dark:text-text-secondary"
            aria-hidden
          >
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </span>
        </button>

        {(rightSlot || optional) && (
          <div className="flex items-center gap-2 flex-shrink-0 self-stretch min-h-[44px]">
            {rightSlot}
            {optional && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEnabledChange?.(false)}
                className="min-h-[44px] text-danger-fg hover:bg-danger-light dark:hover:bg-danger-900/20"
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
