'use client';

import { DescriptorChip, ExpandableChip } from '@/components/ui';
import { DescriptorChipWithTip } from '@/components/patterns/help/descriptor-chip-with-tip';
import { InfoTippy } from '@/components/patterns/help/info-tippy';
import { expandableChipPropsFromChipData } from '@/lib/chip/expandable-chip-props';
import {
  descriptorChipVariantForGridList,
  isGridListChipExpandable,
} from '@/lib/chip/grid-list-chip-utils';
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
 * otherwise DescriptorChipWithTip (guided L1/metadata facts with InfoTippy).
 * `ChipData.onSelect` is a control (button + sibling tip — no nested buttons).
 * Character sheet parts/properties should pass `kind: 'expandable'` + `costLabel: 'TP'`.
 */
export function GridListChip({
  chip,
  costLabel,
  expanded,
  onToggle,
  optionsOpen,
  onOptionsOpenChange,
}: GridListChipProps) {
  if (chip.onSelect && !chip.disabled) {
    return <GridListSelectChip chip={chip} />;
  }

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

function GridListSelectChip({ chip }: { chip: ChipData }) {
  const variant = descriptorChipVariantForGridList(chip.category ?? 'default');
  const tip = chip.description?.trim();
  const showTip = Boolean(tip && tip !== 'No additional details.');

  return (
    <span className="inline-flex max-w-full items-center gap-0.5">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          chip.onSelect?.();
        }}
        className="hit-area-dense inline-flex items-center rounded-md focus-visible:ring-2 focus-visible:ring-primary-outline-border focus-visible:outline-none"
        aria-label={chip.selectAriaLabel ?? `Select ${chip.name}`}
      >
        <DescriptorChip
          variant={variant}
          className="cursor-pointer hover:border-border hover:text-text-primary"
        >
          {chip.name}
        </DescriptorChip>
      </button>
      {showTip ? (
        <span className="inline-flex shrink-0" onClick={(e) => e.stopPropagation()}>
          <InfoTippy content={tip!} label={`${chip.name} details`} />
        </span>
      ) : null}
    </span>
  );
}
