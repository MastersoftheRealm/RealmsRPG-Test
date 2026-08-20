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
  listClassName?: string | undefined;
  size?: 'sm' | 'md' | undefined;
}) {
  const bodyText = size === 'md' ? 'text-sm' : 'text-xs';

  return (
    <div className="mt-2 w-full" data-expand-ignore onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          'hit-area-dense -mx-1 flex min-h-11 items-center gap-1 px-1 font-medium text-text-secondary hover:text-text-primary',
          bodyText,
        )}
      >
        <ChevronDown
          className={cn('h-3.5 w-3.5 transition-transform', optionsOpen && 'rotate-180')}
        />
        Options ({options.length})
      </button>
      {optionsOpen && (
        <ul
          className={cn(
            'mt-1.5 space-y-2 border-l-2 border-border-light pl-4 dark:border-border',
            listClassName,
          )}
        >
          {options.map((opt, oi) => (
            <li key={oi} className={bodyText}>
              <span className="font-medium text-text-primary">
                {opt.label}: Level {opt.level}
              </span>
              {opt.description && (
                <p className="mt-0.5 leading-relaxed text-text-secondary">{opt.description}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
