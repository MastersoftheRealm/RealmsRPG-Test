'use client';

import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCostDisplay } from '@/lib/game/creator-constants';
import { chipVariants } from '@/components/ui/chip';
import { gridListChipVariant } from '@/lib/chip/grid-list-chip-variant';
import type { ChipData } from './grid-list-row-types';

export interface ExpandableGridListChipProps {
  chip: ChipData;
  index: number;
  costLabel: string;
  isExpanded: boolean;
  optionsOpen: boolean;
  onChipClick: (index: number, e: React.MouseEvent) => void;
  onToggleOptions: (index: number) => void;
}

export function ExpandableGridListChip({
  chip,
  index,
  costLabel,
  isExpanded,
  optionsOpen,
  onChipClick,
  onToggleOptions,
}: ExpandableGridListChipProps) {
  const hasCost = (chip.cost ?? 0) > 0;
  const category = chip.category || (hasCost ? 'cost' : 'default');
  const isExpandable =
    !!(chip.description || hasCost || (chip.options?.length ?? 0) > 0) && category !== 'tag';
  const showOptions = isExpanded && (chip.options?.length ?? 0) > 0;

  return (
    <div
      className={cn(
        'inline-flex flex-col items-start rounded-xl text-sm font-medium transition-all duration-base ease-standard border',
        chipVariants({ variant: gridListChipVariant(category) }),
        isExpanded ? 'w-full ring-2 ring-offset-1 ring-current px-3 py-2' : 'px-3 py-1.5'
      )}
    >
      <button
        type="button"
        onClick={isExpandable ? (e) => onChipClick(index, e) : (e) => e.stopPropagation()}
        className={cn('text-left w-full', isExpandable ? 'cursor-pointer' : 'cursor-default')}
      >
        <span className="inline-flex items-center gap-1.5">
          <span>{chip.name}</span>
          {chip.level && chip.level > 1 && (
            <span className="text-xs text-text-secondary">(Lv.{chip.level})</span>
          )}
          {hasCost && (
            <>
              <span className="opacity-40">|</span>
              <span className="text-xs font-semibold text-text-secondary dark:text-text-primary">
                {chip.costLabel || costLabel}:{' '}
                {typeof chip.cost === 'number' ? formatCostDisplay(chip.cost) : chip.cost}
              </span>
            </>
          )}
        </span>
      </button>
      {isExpanded && chip.description && (
        <p className="block mt-1.5 pt-1.5 border-t border-current/15 text-xs font-normal text-left text-text-secondary leading-relaxed whitespace-pre-line w-full">
          {chip.description}
        </p>
      )}
      {showOptions && (
        <div className="mt-2 w-full">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleOptions(index);
            }}
            className="flex items-center gap-1 text-xs font-medium text-text-secondary hover:text-text-primary"
          >
            <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', optionsOpen && 'rotate-180')} />
            Options ({chip.options!.length})
          </button>
          {optionsOpen && (
            <ul className="mt-1.5 space-y-2 pl-4 border-l-2 border-border-light dark:border-border">
              {chip.options!.map((opt, oi) => (
                <li key={oi} className="text-xs">
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
      )}
    </div>
  );
}
