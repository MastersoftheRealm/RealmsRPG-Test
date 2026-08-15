/**
 * FilterSection Component
 * =======================
 * Collapsible filter container with consistent styling.
 * Used across browse lists (ListSearchToolbar compact + toolbarStart) and
 * selection modals (compact). Page variant remains for Advanced creator catalogs.
 */

'use client';

import { useId, useState, type ReactNode } from 'react';
import { ChevronDown, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';

interface FilterSectionProps {
  children: ReactNode;
  /** Initial expand state (default collapsed). */
  defaultExpanded?: boolean;
  /** Controlled expanded state (e.g. reset when a modal reopens). */
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  /**
   * `page` — stacked toggle (Advanced creator catalogs).
   * `compact` — USM/L3 and ListSearchToolbar browse; optional toolbarStart for search + Filters on one row.
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
   * Used by USM/L3 and ListSearchToolbar browse lists (TASK-721).
   */
  toolbarStart?: ReactNode;
  /**
   * Compact only: after the Filters toggle (e.g. Create / Sync). Must not replace
   * the Filters slot — searchTrailing stays to the right of Filters.
   */
  toolbarEnd?: ReactNode;
  /** Compact toolbarStart wrapper classes (default min-w-0). Browse lists pass min-w-[200px]. */
  toolbarStartClassName?: string;
  /** Compact toolbar row classes. Browse lists pass flex-wrap; USM/L3 omit. */
  toolbarClassName?: string;
  /** Extra classes on the Filters toggle. Browse lists pass max-md 44px min size. */
  toggleClassName?: string;
  /**
   * Compact only: always-visible content between the toolbar row and the panel
   * (e.g. primary mode tabs — TASK-564 scopeExtra).
   */
  belowToolbar?: ReactNode;
  className?: string;
}

export function FilterSection({
  children,
  defaultExpanded = false,
  expanded: expandedControlled,
  onExpandedChange,
  variant = 'page',
  activeCount = 0,
  summary,
  label = 'Filters',
  toolbarStart,
  toolbarEnd,
  toolbarStartClassName,
  toolbarClassName,
  toggleClassName,
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
  const toggleLabel = isExpanded ? `Hide ${label}` : isCompact ? label : `Show ${label}`;

  const toggleButton = (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      aria-expanded={isExpanded}
      aria-controls={panelId}
      onClick={() => setExpanded(!isExpanded)}
      className={cn('shrink-0', isCompact ? 'min-h-11 gap-1.5 px-3' : 'mb-4', toggleClassName)}
    >
      <Filter className="h-4 w-4" aria-hidden />
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
        className={cn(
          'duration-base h-4 w-4 transition-transform ease-standard',
          isExpanded && 'rotate-180',
        )}
        aria-hidden
      />
    </Button>
  );

  return (
    <div className={cn(isCompact ? 'mb-0' : 'mb-6', className)}>
      {isCompact && toolbarStart ? (
        <div className={cn('flex items-center gap-2', toolbarClassName)}>
          <div className={cn('min-w-0 flex-1', toolbarStartClassName)}>{toolbarStart}</div>
          {toggleButton}
          {toolbarEnd ? <div className="shrink-0">{toolbarEnd}</div> : null}
        </div>
      ) : (
        toggleButton
      )}

      {isCompact && belowToolbar ? <div className="mt-2 shrink-0">{belowToolbar}</div> : null}

      {!isExpanded && summary ? <p className="mt-2 text-xs text-text-muted">{summary}</p> : null}

      {/* Keep mounted so aria-controls always resolves when collapsed. */}
      <div
        id={panelId}
        hidden={!isExpanded}
        className={cn(
          'rounded-lg border border-border-light bg-surface-alt',
          isCompact ? 'mt-2 space-y-3 p-3' : 'p-4',
        )}
      >
        {children}
      </div>
    </div>
  );
}

export type { FilterSectionProps };
