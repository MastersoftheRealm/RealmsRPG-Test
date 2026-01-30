/**
 * Expandable Chip Component
 * =========================
 * Interactive chip that expands to show description.
 * Matches vanilla site's chip-expand behavior.
 */

'use client';

import * as React from 'react';
import { cn } from '@/lib/utils/cn';
import { ChevronDown } from 'lucide-react';

// Category-specific colors matching vanilla site and design system
const categoryStyles: Record<string, string> = {
  action: 'bg-category-action text-category-action-text',
  activation: 'bg-category-activation text-category-activation-text',
  area: 'bg-category-area text-category-area-text',
  duration: 'bg-category-duration text-category-duration-text',
  target: 'bg-category-target text-category-target-text',
  special: 'bg-category-special text-category-special-text',
  restriction: 'bg-category-restriction text-category-restriction-text',
  cost: 'bg-category-action text-category-action-text',
  default: 'bg-surface-alt text-text-secondary',
};

export interface ExpandableChipProps {
  label: string;
  description?: string;
  category?: keyof typeof categoryStyles | string;
  sublabel?: string;
  cost?: string | number;
  className?: string;
  defaultExpanded?: boolean;
  expandable?: boolean;
}

export function ExpandableChip({
  label,
  description,
  category = 'default',
  sublabel,
  cost,
  className,
  defaultExpanded = false,
  expandable = true,
}: ExpandableChipProps) {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);
  
  const hasContent = description || sublabel;
  const canExpand = expandable && hasContent;
  const styleClass = categoryStyles[category] || categoryStyles.default;

  const handleClick = () => {
    if (canExpand) {
      setIsExpanded(!isExpanded);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && canExpand) {
      e.preventDefault();
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <div
      className={cn(
        'inline-flex flex-col rounded-lg text-sm transition-all duration-200',
        styleClass,
        canExpand && 'cursor-pointer hover:shadow-md',
        isExpanded && 'shadow-md',
        className
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={canExpand ? 0 : undefined}
      role={canExpand ? 'button' : undefined}
      aria-expanded={canExpand ? isExpanded : undefined}
    >
      {/* Main content */}
      <div className="flex items-center gap-2 px-3 py-1.5">
        <span className="font-medium">{label}</span>
        {cost !== undefined && (
          <span className="text-xs opacity-75">({cost})</span>
        )}
        {canExpand && (
          <ChevronDown
            className={cn(
              'w-4 h-4 transition-transform duration-200',
              isExpanded && 'rotate-180'
            )}
          />
        )}
      </div>
      
      {/* Expanded content */}
      {isExpanded && hasContent && (
        <div className="px-3 pb-2 pt-0 text-xs opacity-90 border-t border-current/10">
          {sublabel && <div className="font-medium mt-1">{sublabel}</div>}
          {description && <div className="mt-1">{description}</div>}
        </div>
      )}
    </div>
  );
}

/**
 * ChipGroup - Displays multiple chips in a flex wrap layout
 */
export interface ChipGroupProps {
  children: React.ReactNode;
  className?: string;
}

export function ChipGroup({ children, className }: ChipGroupProps) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {children}
    </div>
  );
}
