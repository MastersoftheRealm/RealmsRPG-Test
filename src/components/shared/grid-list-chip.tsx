'use client';

import { ExpandableChip } from '@/components/ui';
import { DescriptorChipWithTip } from '@/components/shared/descriptor-chip-with-tip';
import { expandableChipPropsFromChipData } from '@/lib/chip/expandable-chip-props';
import { isGridListChipExpandable } from '@/lib/chip/grid-list-chip-utils';
import type { ChipData } from './grid-list-row-types';

export interface GridListChipProps {
  chip: ChipData;
  costLabel: string;
  expanded: boolean;
  onToggle: (e: React.MouseEvent) => void;
  optionsOpen: boolean;
  onOptionsOpenChange: (open: boolean) => void;
}

/**
 * GridListRow chip — expandable when the chip has expandable content;
 * otherwise DescriptorChipWithTip so property descriptions stay on InfoTippy
 * (TASK-454/461 compact-fact grammar).
 */
export function GridListChip({
  chip,
  costLabel,
  expanded,
  onToggle,
  optionsOpen,
  onOptionsOpenChange,
}: GridListChipProps) {
  if (!isGridListChipExpandable(chip)) {
    return <DescriptorChipWithTip chip={chip} />;
  }

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
