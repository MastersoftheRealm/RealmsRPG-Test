/**
 * FilterSection Component
 * =======================
 * Collapsible filter container (USM/L3 + ListSearchToolbar browse).
 * Search + Filters share one row via toolbarStart when provided.
 */

'use client';

import { useId, useState, type ReactNode } from 'react';
import { ChevronDown, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';

interface FilterSectionProps {
  children: ReactNode;
  /** Initial expand state (default collapsed). */
  defaultExpanded?: boolean | undefined;
  /** Controlled expanded state (e.g. reset when a modal reopens). */
  expanded?: boolean | undefined;
  onExpandedChange?: ((expanded: boolean) => void) | undefined;
  /** Shown on the toggle when collapsed and > 0 (active filter count). */
  activeCount?: number | undefined;
  /** Optional one-line hint when collapsed (e.g. current source). */
  summary?: ReactNode | undefined;
  /** Accessible / visible label stem (default "Filters"). */
  label?: string | undefined;
  /**
   * Content placed before the Filters toggle (typically SearchInput).
   * Creates a single toolbar row so the list stays the main focus below.
   * Used by USM/L3 and ListSearchToolbar browse lists (TASK-721).
   */
  toolbarStart?: ReactNode | undefined;
  /**
   * After the Filters toggle (e.g. Create / Sync). Must not replace
   * the Filters slot — searchTrailing stays to the right of Filters.
   */
  toolbarEnd?: ReactNode | undefined;
  /** toolbarStart wrapper classes (default min-w-0). Browse lists pass min-w-[200px]. */
  toolbarStartClassName?: string | undefined;
  /** Toolbar row classes. Browse lists pass flex-wrap; USM/L3 omit. */
  toolbarClassName?: string | undefined;
  /**
   * Always-visible content between the toolbar row and the panel
   * (e.g. primary mode tabs — TASK-564 scopeExtra).
   */
  belowToolbar?: ReactNode | undefined;
  className?: string | undefined;
}

export function FilterSection({
  children,
  defaultExpanded = false,
  expanded: expandedControlled,
  onExpandedChange,
  activeCount = 0,
  summary,
  label = 'Filters',
  toolbarStart,
  toolbarEnd,
  toolbarStartClassName,
  toolbarClassName,
  belowToolbar,
  className,
}: FilterSectionProps) {
  const [uncontrolledExpanded, setUncontrolledExpanded] = useState(defaultExpanded);
  const isControlled = expandedControlled !== undefined;
  const isExpanded = isControlled ? expandedControlled : uncontrolledExpanded;
  const panelId = useId();

  const setExpanded = (next: boolean) => {
    if (!isControlled) setUncontrolledExpanded(next);
    onExpandedChange?.(next);
  };

  const toggleLabel = isExpanded ? `Hide ${label}` : label;

  const toggleButton = (
    <Button
      type="button"
      variant="ghost"
      size="md"
      aria-expanded={isExpanded}
      aria-controls={panelId}
      onClick={() => setExpanded(!isExpanded)}
      className="shrink-0 gap-1.5 px-3"
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
    <div className={cn('mb-0', className)}>
      {toolbarStart ? (
        <div className={cn('flex items-center gap-2', toolbarClassName)}>
          <div className={cn('min-w-0 flex-1', toolbarStartClassName)}>{toolbarStart}</div>
          {toggleButton}
          {toolbarEnd ? <div className="shrink-0">{toolbarEnd}</div> : null}
        </div>
      ) : (
        toggleButton
      )}

      {belowToolbar ? <div className="mt-2 shrink-0">{belowToolbar}</div> : null}

      {!isExpanded && summary ? <p className="mt-2 text-xs text-text-muted">{summary}</p> : null}

      {/* Keep mounted so aria-controls always resolves when collapsed. */}
      <div
        id={panelId}
        hidden={!isExpanded}
        className="mt-2 space-y-3 rounded-lg border border-border-light bg-surface-alt p-3"
      >
        {children}
      </div>
    </div>
  );
}

export type { FilterSectionProps };
