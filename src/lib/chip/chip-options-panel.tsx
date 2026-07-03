'use client';

import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ExpandableChipOption } from '@/components/ui/expandable-chip';

export function ChipOptionsPanel({
  options,
  optionsOpen,
  onToggle,
  listClassName,
  size = 'md',
}: {
  options: ExpandableChipOption[];
  optionsOpen: boolean;
  onToggle: (e: React.MouseEvent) => void;
  listClassName?: string;
  size?: 'sm' | 'md';
}) {
  const bodyText = size === 'md' ? 'text-sm' : 'text-xs';

  return (
    <div className="mt-2 w-full">
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          'flex items-center gap-1 font-medium text-text-secondary hover:text-text-primary',
          bodyText
        )}
      >
        <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', optionsOpen && 'rotate-180')} />
        Options ({options.length})
      </button>
      {optionsOpen && (
        <ul
          className={cn(
            'mt-1.5 space-y-2 pl-4 border-l-2 border-border-light dark:border-border',
            listClassName
          )}
        >
          {options.map((opt, oi) => (
            <li key={oi} className={bodyText}>
              <span className="font-medium text-text-primary">
                {opt.label}: Level {opt.level}
              </span>
              {opt.description && (
                <p className="mt-0.5 text-text-secondary leading-relaxed">{opt.description}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
