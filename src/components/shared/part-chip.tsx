/**
 * Part Chip Components
 * ====================
 * Unified chip components for displaying parts (powers/techniques) and 
 * properties (items) with expandable descriptions and TP cost badges.
 * 
 * Used in: Library page (via GridListRow), Character Sheet, Codex (via GridListRow)
 * 
 * These components handle detailed part/property display with category-based styling.
 */

'use client';

import { useState } from 'react';
import { Zap, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

// =============================================================================
// Types
// =============================================================================

export interface PartData {
  /** Part/property name */
  name: string;
  /** Full text including option levels (e.g., "Elemental Damage (Opt1 3)") */
  text?: string;
  /** Part description */
  description?: string;
  /** TP cost of this part (0 if none) */
  tpCost?: number;
  /** Energy cost if applicable */
  energyCost?: number;
  /** Option levels if increased */
  optionLevels?: {
    opt1?: number;
    opt2?: number;
    opt3?: number;
  };
  /** Category for styling (action, activation, area, duration, target, special, restriction) */
  category?: string;
}

// Category-specific colors using design tokens from globals.css
const categoryStyles: Record<string, string> = {
  action: 'bg-category-action-bg text-category-action-text border-category-action-border',
  activation: 'bg-category-activation-bg text-category-activation-text border-category-activation-border',
  area: 'bg-category-area-bg text-category-area-text border-category-area-border',
  duration: 'bg-category-duration-bg text-category-duration-text border-category-duration-border',
  target: 'bg-category-target-bg text-category-target-text border-category-target-border',
  special: 'bg-category-special-bg text-category-special-text border-category-special-border',
  restriction: 'bg-category-restriction-bg text-category-restriction-text border-category-restriction-border',
  cost: 'bg-tp-light text-tp-text border-tp-border',
  proficiency: 'bg-tp-light text-tp-text border-tp-border',
  property: 'bg-surface-alt text-text-secondary border-border-light',
  default: 'bg-primary-50 text-primary-700 border-primary-200',
};

// =============================================================================
// PartChip - Single clickable chip
// =============================================================================

interface PartChipProps {
  part: PartData;
  isExpanded?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  size?: 'sm' | 'md';
  className?: string;
}

export function PartChip({ 
  part, 
  isExpanded = false, 
  onClick, 
  size = 'md',
  className 
}: PartChipProps) {
  const hasTP = (part.tpCost ?? 0) > 0;
  const hasDescription = !!part.description;
  const canExpand = hasDescription && onClick;
  const category = part.category || (hasTP ? 'proficiency' : 'default');
  const styleClass = categoryStyles[category] || categoryStyles.default;

  return (
    <button
      onClick={onClick}
      disabled={!canExpand}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium transition-all border',
        styleClass,
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1.5 text-sm',
        canExpand && 'cursor-pointer hover:shadow-md',
        !canExpand && 'cursor-default',
        isExpanded && 'ring-2 ring-offset-1',
        isExpanded && hasTP ? 'ring-tp' : isExpanded && 'ring-primary-400',
        className
      )}
    >
      <span>{part.name}</span>
      {hasTP && (
        <>
          <span className="opacity-40">|</span>
          <span className="flex items-center gap-0.5 text-xs font-semibold">
            <Zap className="w-3 h-3" />
            {part.tpCost}
          </span>
        </>
      )}
      {part.energyCost !== undefined && part.energyCost > 0 && (
        <>
          <span className="opacity-40">|</span>
          <span className="text-xs font-semibold text-energy">
            {part.energyCost} EP
          </span>
        </>
      )}
      {canExpand && (
        <ChevronDown 
          className={cn(
            'w-3 h-3 transition-transform duration-200',
            isExpanded && 'rotate-180'
          )} 
        />
      )}
    </button>
  );
}

// =============================================================================
// PartChipDetails - Expanded detail panel
// =============================================================================

interface PartChipDetailsProps {
  part: PartData;
  className?: string;
}

export function PartChipDetails({ part, className }: PartChipDetailsProps) {
  const hasOptions = part.optionLevels && (
    (part.optionLevels.opt1 ?? 0) > 0 ||
    (part.optionLevels.opt2 ?? 0) > 0 ||
    (part.optionLevels.opt3 ?? 0) > 0
  );

  return (
    <div className={cn(
      'mt-2 p-3 rounded-lg bg-surface border border-border shadow-sm',
      className
    )}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <h5 className="font-semibold text-text-primary">{part.name}</h5>
        {(part.tpCost ?? 0) > 0 && (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-tp-light text-tp-text">
            <Zap className="w-3 h-3" />
            {part.tpCost} TP
          </span>
        )}
      </div>

      {part.description && (
        <p className="text-sm text-text-secondary mb-2">{part.description}</p>
      )}

      {hasOptions && part.optionLevels && (
        <div className="flex flex-wrap gap-2 text-xs">
          {(part.optionLevels.opt1 ?? 0) > 0 && (
            <span className="px-2 py-1 rounded bg-surface-alt text-text-secondary">
              Option 1: Level {part.optionLevels.opt1}
            </span>
          )}
          {(part.optionLevels.opt2 ?? 0) > 0 && (
            <span className="px-2 py-1 rounded bg-surface-alt text-text-secondary">
              Option 2: Level {part.optionLevels.opt2}
            </span>
          )}
          {(part.optionLevels.opt3 ?? 0) > 0 && (
            <span className="px-2 py-1 rounded bg-surface-alt text-text-secondary">
              Option 3: Level {part.optionLevels.opt3}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// PartChipList - Container that manages expansion state
// =============================================================================

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
  className 
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
        <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
          {label}
        </h4>
      )}

      {/* Chips */}
      <div className="flex flex-wrap gap-2">
        {parts.map((part, index) => (
          <PartChip
            key={index}
            part={part}
            size={size}
            isExpanded={expandedIndex === index}
            onClick={part.description ? (e) => handleChipClick(index, e) : undefined}
          />
        ))}
      </div>

      {/* Expanded Details */}
      {expandedIndex !== null && parts[expandedIndex] && (
        <PartChipDetails part={parts[expandedIndex]} />
      )}
    </div>
  );
}

// =============================================================================
// PropertyChipList - Simpler variant for item properties
// =============================================================================

interface PropertyChipListProps {
  properties: Array<string | { name: string; description?: string }>;
  label?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export function PropertyChipList({ 
  properties, 
  label = 'Properties',
  size = 'sm',
  className 
}: PropertyChipListProps) {
  // Convert string properties to PartData format
  const parts: PartData[] = properties.map(prop => {
    if (typeof prop === 'string') {
      return { name: prop, category: 'property' };
    }
    return { 
      name: prop.name, 
      description: prop.description,
      category: 'property' 
    };
  });

  return (
    <PartChipList 
      parts={parts} 
      label={label} 
      size={size}
      className={className}
    />
  );
}
