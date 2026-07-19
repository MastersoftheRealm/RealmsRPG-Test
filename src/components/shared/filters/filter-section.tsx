/**
 * FilterSection Component
 * =======================
 * Collapsible filter container with consistent styling.
 * Used across Codex tabs (page variant) and selection modals (compact variant).
 */

'use client';

import { useId, useState, type ReactNode } from 'react';
import { ChevronDown, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';

interface FilterSectionProps {
  children: ReactNode;
  defaultExpanded?: boolean;
  /** Controlled expanded state (e.g. reset when a modal reopens). */
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  /**
   * `page` — Codex/Library browse (default, more vertical spacing).
   * `compact` — selection/add modals; optional toolbarStart for search + Filters on one row.
   */
  variant?: 'page' | 'compact';
  /** Shown on the toggle when collapsed and > 0 (active filter count). */
  activeCount?: number;
  /** Optional one-line hint when collapsed (e.g. current source). */
  summary?: ReactNode;
  /** Accessible / visible label stem (default "Filters"). */
  label?: string;
  /**
   * Compact only: content placed before the Filters toggle (typically SearchInput).
   * Creates a single toolbar row so the list stays the main focus below.
   */
  toolbarStart?: ReactNode;
  /**
   * Compact only: always-visible content between the toolbar row and the panel
   * (e.g. primary mode tabs — TASK-564 scopeExtra).
   */
  belowToolbar?: ReactNode;
  className?: string;
}

export function FilterSection({
  children,
  defaultExpanded = true,
  expanded: expandedControlled,
  onExpandedChange,
  variant = 'page',
  activeCount = 0,
  summary,
  label = 'Filters',
  toolbarStart,
  belowToolbar,
  className,
}: FilterSectionProps) {
  const [uncontrolledExpanded, setUncontrolledExpanded] = useState(defaultExpanded);
  const isControlled = expandedControlled !== undefined;
  const isExpanded = isControlled ? expandedControlled : uncontrolledExpanded;
  const panelId = useId();
  const isCompact = variant === 'compact';

  const setExpanded = (next: boolean) => {
    if (!isControlled) setUncontrolledExpanded(next);
    onExpandedChange?.(next);
  };

  // Compact toolbar: short "Filters" / "Hide Filters". Page: "Show Filters" / "Hide Filters".
  const toggleLabel = isExpanded
    ? `Hide ${label}`
    : isCompact
      ? label
      : `Show ${label}`;

  const toggleButton = (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      aria-expanded={isExpanded}
      aria-controls={panelId}
      onClick={() => setExpanded(!isExpanded)}
      className={cn(
        'shrink-0',
        isCompact
          ? 'min-h-11 gap-1.5 px-3'
          : 'mb-4'
      )}
    >
      <Filter className="w-4 h-4" aria-hidden />
      <span>{toggleLabel}</span>
      {activeCount > 0 && !isExpanded ? (
        <span
          className="inline-flex min-w-5 items-center justify-center rounded-full bg-primary-subtle-bg px-1.5 text-xs font-semibold text-primary-link-fg"
          aria-label={`${activeCount} active`}
        >
          {activeCount}
        </span>
      ) : null}
      <ChevronDown
        className={cn('w-4 h-4 transition-transform duration-base ease-standard', isExpanded && 'rotate-180')}
        aria-hidden
      />
    </Button>
  );

  return (
    <div className={cn(isCompact ? 'mb-0' : 'mb-6', className)}>
      {isCompact && toolbarStart ? (
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">{toolbarStart}</div>
          {toggleButton}
        </div>
      ) : (
        toggleButton
      )}

      {isCompact && belowToolbar ? (
        <div className="mt-2 shrink-0">{belowToolbar}</div>
      ) : null}

      {!isExpanded && summary ? (
        <p className="mt-2 text-xs text-text-muted dark:text-text-secondary">{summary}</p>
      ) : null}

      {/* Keep mounted so aria-controls always resolves when collapsed. */}
      <div
        id={panelId}
        hidden={!isExpanded}
        className={cn(
          'rounded-lg border border-border-light bg-surface-alt',
          isCompact ? 'mt-2 space-y-3 p-3' : 'p-4'
        )}
      >
        {children}
      </div>
    </div>
  );
}

export type { FilterSectionProps };
export default FilterSection;
