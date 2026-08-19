/**
 * SourceFilter Component
 * ======================
 * Unified source filter: All | Realms Library | My Library.
 * Used across Library, add-X modals, equipment-step.
 */

'use client';

import type { LibrarySourceScope } from '@/lib/library/source-scope';
import { SegmentedControl } from '../chrome/segmented-control';

/** Alias of `LibrarySourceScope` — keep identical to the catalog merge union. */
export type SourceFilterValue = LibrarySourceScope;

interface SourceFilterProps {
  value: SourceFilterValue;
  onChange: (value: SourceFilterValue) => void;
  className?: string;
}

const OPTIONS: { value: SourceFilterValue; label: string }[] = [
  { value: 'all', label: 'All sources' },
  { value: 'public', label: 'Realms Library' },
  { value: 'my', label: 'My Library' },
];

/** Human label for collapsed Filters summaries (TASK-564). */
export function sourceFilterLabel(value: SourceFilterValue): string {
  return OPTIONS.find((o) => o.value === value)?.label ?? 'All sources';
}

/** Summary only when source is non-default — avoids a permanent "All sources" chrome line. */
export function sourceFilterSummary(value: SourceFilterValue): string | undefined {
  return value === 'all' ? undefined : sourceFilterLabel(value);
}

export function SourceFilter({ value, onChange, className }: SourceFilterProps) {
  return (
    <SegmentedControl
      value={value}
      onChange={onChange}
      options={OPTIONS}
      aria-label="Content source"
      className={className}
    />
  );
}
