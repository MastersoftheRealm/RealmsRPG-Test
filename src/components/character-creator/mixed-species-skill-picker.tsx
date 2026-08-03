/**
 * Mixed species skill picker — shared by Advanced AncestryStep and sheet Edit Species.
 * TraitSection-style selectable rows with truncated skill descriptions.
 */

'use client';

import { useCallback, useState } from 'react';
import { cn } from '@/lib/utils';
import { SelectionToggle } from '@/components/shared';
import { GUIDED_CREATOR_COPY } from '@/lib/constants/site-copy';
import type { NamedIdOption } from '@/lib/ancestry/ancestry-selection';

const LONG_DESCRIPTION_THRESHOLD = 120;
const choiceCardCopy = GUIDED_CREATOR_COPY.choiceCard;

export interface MixedSpeciesSkillPickerProps {
  options: NamedIdOption[];
  selectedIds: string[];
  onToggle: (skillId: string) => void;
  className?: string;
}

export function MixedSpeciesSkillPicker({
  options,
  selectedIds,
  onToggle,
  className,
}: MixedSpeciesSkillPickerProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());

  const toggleDescription = useCallback((skillId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(skillId)) next.delete(skillId);
      else next.add(skillId);
      return next;
    });
  }, []);

  return (
    <div className={cn('border rounded-xl overflow-hidden border-border-light', className)}>
      <div className="divide-y divide-border-subtle">
        {options.map((opt) => {
          const isSelected = selectedIds.includes(opt.id);
          const description = opt.description?.trim();
          const isLong = Boolean(description && description.length > LONG_DESCRIPTION_THRESHOLD);
          const isExpanded = expandedIds.has(opt.id);

          return (
            <div
              key={opt.id}
              className={cn(
                'px-4 py-3 transition-colors hover:bg-surface-alt',
                isSelected && 'bg-primary-subtle-bg',
              )}
            >
              <div className="flex items-start gap-3">
                <div className="shrink-0 self-center">
                  <SelectionToggle
                    isSelected={isSelected}
                    onToggle={() => onToggle(opt.id)}
                    size="lg"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-text-primary">{opt.name}</h4>
                  {description ? (
                    <>
                      <p
                        className={cn(
                          'text-sm text-text-secondary mt-1',
                          isLong && !isExpanded && 'line-clamp-3',
                        )}
                      >
                        {description}
                      </p>
                      {isLong ? (
                        <button
                          type="button"
                          onClick={() => toggleDescription(opt.id)}
                          className="mt-1 text-sm font-medium text-primary-link-fg hover:text-primary-fg-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
                          aria-expanded={isExpanded}
                        >
                          {isExpanded ? choiceCardCopy.seeLess : choiceCardCopy.seeMore}
                        </button>
                      ) : null}
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
