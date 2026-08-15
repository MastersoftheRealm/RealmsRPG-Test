/**
 * ArchetypePathFilter Component
 * =============================
 * Filters a browse list down to the entities the selected archetype paths recommend
 * (ADR-0014 / TASK-751). Multi-select is a **union**: Monk + Berserker shows anything either path
 * recommends. Options are player-visible paths only, grouped by archetype type.
 *
 * Pair it with `usePathRecommendationIndex` + `pathRecommendedEntityIds`; it never resolves
 * recommendations itself, so Codex, Library, and creator surfaces share one match rule.
 */

'use client';

import { useMemo } from 'react';
import { InfoTippy } from '@/components/shared/info-tippy';
import { PATH_CATEGORY_GROUPS, pathCategoryGroupLabel } from '@/lib/game/archetype-edit';
import type { PathFilterOption } from '@/lib/game/path-recommendation-index';
import { cn } from '@/lib/utils';
import { ChipSelect, type ChipSelectOption } from './chip-select';

const ARCHETYPE_PATH_FILTER_HELP =
  'Show only entries an archetype path recommends. Choose several paths to see everything any of them recommends. Other filters still apply.';

export interface ArchetypePathFilterProps {
  /** Player-visible paths — `usePathRecommendationIndex().options`. */
  options: PathFilterOption[];
  selectedPathIds: string[];
  onChange: (pathIds: string[]) => void;
  label?: string;
  placeholder?: string;
  className?: string;
}

/** Last control in a 4-col filter grid — niche, so it sits bottom-right. */
export const ARCHETYPE_PATH_FILTER_CLASS = 'min-w-0 xl:col-start-4';

export function ArchetypePathFilter({
  options,
  selectedPathIds,
  onChange,
  label = 'Archetype Path',
  placeholder = 'Choose path',
  className,
}: ArchetypePathFilterProps) {
  const chipOptions = useMemo<ChipSelectOption[]>(() => {
    const byType = PATH_CATEGORY_GROUPS.flatMap((type) =>
      options
        .filter((option) => option.type === type)
        .map((option) => ({
          value: option.id,
          label: option.name,
          group: pathCategoryGroupLabel(type),
        }))
    );
    // Paths whose type is missing/unknown still list, ungrouped.
    const grouped = new Set(byType.map((option) => option.value));
    const rest = options
      .filter((option) => !grouped.has(option.id))
      .map((option) => ({ value: option.id, label: option.name }));
    return [...rest, ...byType];
  }, [options]);

  return (
    <ChipSelect
      label={label}
      placeholder={placeholder}
      options={chipOptions}
      selectedValues={selectedPathIds}
      onSelect={(id) => onChange([...selectedPathIds, id])}
      onRemove={(id) => onChange(selectedPathIds.filter((value) => value !== id))}
      labelAccessory={
        <InfoTippy
          content={ARCHETYPE_PATH_FILTER_HELP}
          label="Archetype path filter help"
          size="inline"
        />
      }
      className={cn(ARCHETYPE_PATH_FILTER_CLASS, className)}
    />
  );
}
