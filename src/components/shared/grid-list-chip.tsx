'use client';

import { ExpandableChip } from '@/components/ui';
import { expandableChipPropsFromChipData } from '@/lib/chip/expandable-chip-props';
import type { ChipData } from './grid-list-row-types';

export interface GridListChipProps {
  chip: ChipData;
  costLabel: string;
  expanded: boolean;
  onToggle: (e: React.MouseEvent) => void;
  optionsOpen: boolean;
  onOptionsOpenChange: (open: boolean) => void;
}

/** GridListRow chip — adapter + unified ExpandableChip (descriptor or expandable). */
export function GridListChip({
  chip,
  costLabel,
  expanded,
  onToggle,
  optionsOpen,
  onOptionsOpenChange,
}: GridListChipProps) {
  return (
    <ExpandableChip
      {...expandableChipPropsFromChipData(chip, costLabel)}
      expanded={expanded}
      onToggle={onToggle}
      optionsOpen={optionsOpen}
      onOptionsOpenChange={onOptionsOpenChange}
    />
  );
}
