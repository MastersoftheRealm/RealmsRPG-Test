/**
 * SourceFilter Component
 * ======================
 * Unified source filter: All | Realms Library | My Library.
 * Used across Library, add-X modals, equipment-step.
 */

'use client';

import { SegmentedControl } from '../segmented-control';

export type SourceFilterValue = 'all' | 'public' | 'my';

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
