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

// Category-specific colors matching vanilla site
const categoryStyles: Record<string, string> = {
  action: 'bg-[#e7f0ff] text-[#0b5ed7]',
  activation: 'bg-[#e6fffa] text-[#0f766e]',
  area: 'bg-[#eafbe7] text-[#166534]',
  duration: 'bg-[#f3e8ff] text-[#6b21a8]',
  target: 'bg-[#fff4e5] text-[#9a3412]',
  special: 'bg-[#fffbe6] text-[#854d0e]',
  restriction: 'bg-[#ffe5e5] text-[#b91c1c]',
  cost: 'bg-[#e7f0ff] text-[#0b5ed7]',
  default: 'bg-gray-100 text-gray-700',
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
