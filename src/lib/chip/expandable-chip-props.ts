import type { ExpandableChipProps } from '@/components/ui/expandable-chip';
import type { ChipData } from '@/components/shared/grid-list-row-types';
import type { PartData } from '@/lib/chip/part-data';
import {
  formatGridListChipLabel,
  gridListChipStyleVariant,
  isGridListChipExpandable,
} from '@/lib/chip/grid-list-chip-utils';

export function expandableChipPropsFromPartData(
  part: PartData,
  ctx?: {
    isExpanded?: boolean;
    onClick?: (e: React.MouseEvent) => void;
    size?: 'sm' | 'md';
    fullWidthWhenExpanded?: boolean;
    className?: string;
  }
): ExpandableChipProps {
  const hasTP = (part.tpCost ?? 0) > 0;
  const hasDescription = !!part.description;
  const hasOptions = (part.options?.length ?? 0) > 0;
  const canExpand = (hasDescription || hasOptions) && !!ctx?.onClick;

  return {
    label: part.name,
    description: part.description ?? part.text,
    category: part.category || (hasTP ? 'proficiency' : 'default'),
    tpCost: hasTP ? part.tpCost : undefined,
    energyCost: part.energyCost,
    options: part.options,
    size: ctx?.size,
    expanded: ctx?.isExpanded,
    onToggle: ctx?.onClick,
    fullWidthWhenExpanded: ctx?.fullWidthWhenExpanded,
    className: ctx?.className,
    expandable: canExpand,
  };
}

export function expandableChipPropsFromChipData(
  chip: ChipData,
  costLabel: string
): ExpandableChipProps {
  const hasCost = (chip.cost ?? 0) > 0;
  const isExpandable = isGridListChipExpandable(chip);
  const styleVariant = gridListChipStyleVariant(chip);

  if (!isExpandable) {
    return {
      label: formatGridListChipLabel(chip),
      descriptor: true,
      descriptorVariant: styleVariant,
    };
  }

  return {
    label: chip.name,
    description: chip.description,
    variant: styleVariant,
    level: chip.level && chip.level > 0 ? chip.level : undefined,
    cost: hasCost ? chip.cost : undefined,
    costLabel: chip.costLabel || costLabel,
    options: chip.options,
    expandable: true,
    expandOnCost: hasCost,
  };
}
