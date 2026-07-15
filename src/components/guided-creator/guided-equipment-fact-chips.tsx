'use client';

import { useState } from 'react';
import { ExpandableChip } from '@/components/ui';
import { InfoTippy } from '@/components/shared';
import { expandableChipPropsFromChipData } from '@/lib/chip/expandable-chip-props';
import type { ChipData } from '@/components/shared/grid-list-row-types';
import { isGridListChipExpandable } from '@/lib/chip/grid-list-chip-utils';
import { cn } from '@/lib/utils';

export interface GuidedEquipmentFactChipsProps {
  chips: ChipData[];
  /**
   * `tooltip` — hover/focus tip when chip has a description (card surface).
   * `expand` — click ExpandableChip for full text (More details disclosure).
   * `static` — non-interactive descriptors.
   */
  mode?: 'tooltip' | 'expand' | 'static';
  /** @deprecated Prefer `mode`. When true with no mode, behaves as `expand`. */
  expandable?: boolean;
  className?: string;
}

function DescriptorWithOptionalTip({ chip }: { chip: ChipData }) {
  const tip = chip.description?.trim();
  const chipNode = (
    <ExpandableChip
      {...expandableChipPropsFromChipData(chip, chip.costLabel || 'TP')}
      size="sm"
    />
  );

  if (!tip) return chipNode;

  return (
    <InfoTippy content={tip} label={`${chip.name} details`}>
      <span className="inline-flex max-w-full">{chipNode}</span>
    </InfoTippy>
  );
}

/** Fact chips for guided equipment cards. */
export function GuidedEquipmentFactChips({
  chips,
  mode,
  expandable = false,
  className,
}: GuidedEquipmentFactChipsProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const resolvedMode: 'tooltip' | 'expand' | 'static' =
    mode ?? (expandable ? 'expand' : 'static');

  if (chips.length === 0) return null;

  return (
    <div
      data-chip-group
      className={cn('flex flex-wrap gap-2 items-start', className)}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      {chips.map((chip, index) => {
        if (resolvedMode === 'tooltip') {
          return <DescriptorWithOptionalTip key={`${chip.name}-${index}`} chip={chip} />;
        }

        if (resolvedMode === 'static' || !isGridListChipExpandable(chip)) {
          return (
            <ExpandableChip
              key={`${chip.name}-${index}`}
              {...expandableChipPropsFromChipData(chip, chip.costLabel || 'TP')}
              size="sm"
            />
          );
        }

        const isExpanded = expandedIndex === index;
        return (
          <ExpandableChip
            key={`${chip.name}-${index}`}
            {...expandableChipPropsFromChipData(chip, chip.costLabel || 'TP')}
            size="sm"
            expanded={isExpanded}
            fullWidthWhenExpanded
            onToggle={(e) => {
              e.stopPropagation();
              setExpandedIndex(isExpanded ? null : index);
            }}
          />
        );
      })}
    </div>
  );
}
