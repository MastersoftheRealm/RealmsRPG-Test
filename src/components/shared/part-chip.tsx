/**
 * Part Chip Components
 * ====================
 * List helpers built on unified `ExpandableChip`.
 */

'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
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

interface PartChipListProps {
  parts: PartData[];
  label?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export function PartChipList({
  parts,
  label = 'Parts & Properties',
  size = 'md',
  className,
}: PartChipListProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  if (parts.length === 0) return null;

  const handleChipClick = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <h3 className="text-xs font-semibold text-text-muted dark:text-text-secondary uppercase tracking-wider">
          {label}
        </h3>
      )}
      <div data-chip-group className="flex flex-wrap gap-2 items-start">
        {parts.map((part, index) => {
          const isExpanded = expandedIndex === index;
          const canExpand = !!(part.description || (part.options?.length ?? 0));
          return (
            <ExpandableChip
              key={`${part.name}-${index}`}
              {...expandableChipPropsFromPartData(part, {
                isExpanded,
                onClick: canExpand ? (e) => handleChipClick(index, e) : undefined,
                size,
                fullWidthWhenExpanded: true,
              })}
            />
          );
        })}
      </div>
    </div>
  );
}

interface PropertyChipListProps {
  properties: Array<string | { name: string; description?: string }>;
  label?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export function PropertyChipList({
  properties,
  label = 'Properties',
  size = 'md',
  className,
}: PropertyChipListProps) {
  const parts: PartData[] = properties.map((prop) => {
    if (typeof prop === 'string') {
      return { name: prop, category: 'property' };
    }
    return {
      name: prop.name,
      description: prop.description,
      category: 'property',
    };
  });

  return <PartChipList parts={parts} label={label} size={size} className={className} />;
}
