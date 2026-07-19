/**
 * Part Chip Components
 * ====================
 * Thin ExpandableChip wrapper. Prefer `ExpandableChip` + `expandableChipPropsFromPartData` directly.
 */

'use client';

import { ExpandableChip } from '@/components/ui';
import { expandableChipPropsFromPartData } from '@/lib/chip/expandable-chip-props';
import type { PartData } from '@/lib/chip/part-data';

export type { PartData } from '@/lib/chip/part-data';

interface PartChipProps {
  part: PartData;
  isExpanded?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  size?: 'sm' | 'md';
  fullWidthWhenExpanded?: boolean;
  className?: string;
}

/** @deprecated Prefer `ExpandableChip` + `expandableChipPropsFromPartData` directly. */
export function PartChip(props: PartChipProps) {
  return <ExpandableChip {...expandableChipPropsFromPartData(props.part, {
    isExpanded: props.isExpanded,
    onClick: props.onClick,
    size: props.size,
    fullWidthWhenExpanded: props.fullWidthWhenExpanded,
    className: props.className,
  })} />;
}
