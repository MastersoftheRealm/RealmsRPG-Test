/**
 * SourceFilter Component
 * ======================
 * Unified source filter: All | Public | My library.
 * Used across Library, Codex, add-X modals, equipment-step.
 */

'use client';

import { cn } from '@/lib/utils';

export type SourceFilterValue = 'all' | 'public' | 'my';

interface SourceFilterProps {
  value: SourceFilterValue;
  onChange: (value: SourceFilterValue) => void;
  className?: string;
}

const OPTIONS: { value: SourceFilterValue; label: string }[] = [
  { value: 'all', label: 'All sources' },
  { value: 'public', label: 'Public library' },
  { value: 'my', label: 'My library' },
];

export function SourceFilter({ value, onChange, className }: SourceFilterProps) {
  return (
    <div className={cn('flex items-center gap-1 p-1 rounded-lg bg-surface-alt', className)}>
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            'px-2 py-1 rounded text-sm font-medium transition-colors',
            value === opt.value ? 'bg-primary-600 text-white' : 'text-text-muted hover:text-text-secondary'
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
