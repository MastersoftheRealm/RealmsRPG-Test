/**
 * Collapsible Section
 * ===================
 * Expandable card section for creator optional/primary blocks.
 * Expand control is a dedicated <button> (full-header hit target via overlay).
 * titleAddon / rightSlot / Remove sit above it with pointer-events (no nested interactives).
 * Header stays put on expand (stable expand toggle — content opens below).
 * When expanded, do not reserve an empty summary line (TASK-764) — title size/padding
 * stay the same as collapsed.
 */

'use client';

import { useState, type ElementType, type ReactNode } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button, Card } from '@/components/ui';

export interface CollapsibleSectionProps {
  title: string;
  subtitle?: string | undefined;
  collapsedSummary?: string | undefined;
  optional?: boolean | undefined;
  enabled?: boolean | undefined;
  onEnabledChange?: ((enabled: boolean) => void) | undefined;
  /** Initial expand state (default collapsed). */
  defaultExpanded?: boolean | undefined;
  itemCount?: number | undefined;
  points?: { spent: number; total: number } | undefined;
  icon?: ReactNode | undefined;
  /**
   * Inline content immediately after the title (e.g. compact InfoTippy).
   * Rendered outside the expand control so it stays interactive without nesting.
   */
  titleAddon?: ReactNode | undefined;
  /** Actions next to the expand control (not nested inside it) */
  rightSlot?: ReactNode | undefined;
  children: ReactNode;
  className?: string | undefined;
  /**
   * Heading level for the section title. Default `2` for page sections under an `h1`.
   * Use `3` inside dialogs whose accessible name / title is already an `h2` (e.g. deep-dive modals).
   */
  headingLevel?: 2 | 3 | 4 | undefined;
}

export function CollapsibleSection({
  title,
  subtitle,
  collapsedSummary,
  optional = false,
  enabled = true,
  onEnabledChange,
  defaultExpanded = false,
  itemCount,
  points,
  icon,
  titleAddon,
  rightSlot,
  children,
  className,
  headingLevel = 2,
}: CollapsibleSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const HeadingTag = `h${headingLevel}` as ElementType;
  const subtitleText = subtitle?.trim() ?? '';
  const collapsedText = collapsedSummary?.trim() ?? '';
  const metaText = isExpanded ? subtitleText : collapsedText || subtitleText;
  const showMetaLine = Boolean(metaText);
  const hasTrailingActions = Boolean(rightSlot || optional);

  if (optional && !enabled) {
    return (
      <div
        className={cn(
          'rounded-xl border-2 border-dashed border-border-light bg-surface-secondary p-6',
          className,
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            {icon && (
              <span className="text-2xl text-text-muted" aria-hidden>
                {icon}
              </span>
            )}
            <div className="min-w-0">
              <HeadingTag className="font-bold text-text-secondary dark:text-text-primary">
                {title}
              </HeadingTag>
              {subtitleText ? <p className="text-sm text-text-muted">{subtitleText}</p> : null}
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
      <div className="relative p-4">
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="absolute inset-0 z-0 rounded-lg transition-colors hover:bg-surface-alt/80"
          aria-expanded={isExpanded}
          aria-label={isExpanded ? `Collapse ${title}` : `Expand ${title}`}
        />
        <div className="pointer-events-none relative z-10 flex items-center gap-2">
          {icon && <span className="flex-shrink-0 text-xl">{icon}</span>}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <HeadingTag className="font-bold text-primary-fg">{title}</HeadingTag>
              {titleAddon ? (
                <span className="pointer-events-auto inline-flex items-center">{titleAddon}</span>
              ) : null}
              {points && (
                <span
                  className={cn(
                    'flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium',
                    points.spent > points.total
                      ? 'bg-danger-light text-danger-fg'
                      : 'bg-warning-light text-warning-fg',
                  )}
                >
                  {points.spent}/{points.total} pts
                </span>
              )}
              {itemCount !== undefined && itemCount > 0 && (
                <span className="text-xs text-text-muted">({itemCount})</span>
              )}
            </div>
            {showMetaLine ? (
              <p className="mt-0.5 truncate text-sm text-text-muted">{metaText}</p>
            ) : null}
          </div>
          <span className="flex-shrink-0 text-text-muted" aria-hidden>
            {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </span>
          {hasTrailingActions ? (
            <div
              className={cn(
                'pointer-events-auto flex flex-shrink-0 items-center gap-2',
                optional ? 'min-h-[44px] self-stretch' : 'self-center',
              )}
            >
              {rightSlot}
              {optional && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEnabledChange?.(false)}
                  className="min-h-[44px] text-danger-fg hover:bg-danger-light"
                >
                  Remove
                </Button>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {isExpanded && <div className="p-4 pt-0">{children}</div>}
    </Card>
  );
}
