'use client';

/**
 * CollapsibleListItem - Unified Collapsible Item Display
 * =======================================================
 * A simple, consistent collapsible list item for traits, feats, powers, etc.
 * Matches library/codex style with truncated descriptions and expand on click.
 */

import { useState, ReactNode } from 'react';
import { ChevronDown, Plus, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

// =============================================================================
// Types
// =============================================================================

export interface CollapsibleListItemProps {
  /** Item name (displayed as title) */
  name: string;
  /** Item description (truncated when collapsed, full when expanded) */
  description?: string;
  /** Subtext shown after name (e.g., category type in italics) */
  subtext?: string;
  /** Additional info shown on right side of collapsed row */
  rightContent?: ReactNode;
  /** Max uses for limited-use items */
  maxUses?: number;
  /** Current uses remaining */
  currentUses?: number;
  /** Callback when uses change */
  onUsesChange?: (delta: number) => void;
  /** Recovery period text */
  recoveryPeriod?: string;
  /** Start expanded */
  defaultExpanded?: boolean;
  /** Custom expanded content (replaces default) */
  expandedContent?: ReactNode;
  /** Compact mode (smaller padding) */
  compact?: boolean;
  /** Additional className */
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

export function CollapsibleListItem({
  name,
  description,
  subtext,
  rightContent,
  maxUses = 0,
  currentUses,
  onUsesChange,
  recoveryPeriod,
  defaultExpanded = false,
  expandedContent,
  compact = false,
  className,
}: CollapsibleListItemProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  
  const hasLimitedUses = maxUses > 0;
  const usesRemaining = currentUses ?? maxUses;
  const hasExpandableContent = description || expandedContent || (hasLimitedUses && recoveryPeriod);
  
  // Truncate description for collapsed view
  const truncatedDescription = description && description.length > 80
    ? description.slice(0, 80) + '...'
    : description;

  const handleUsesChange = (e: React.MouseEvent, delta: number) => {
    e.stopPropagation();
    onUsesChange?.(delta);
  };

  return (
    <div className={cn(
      'border border-border-light rounded-lg overflow-hidden bg-surface transition-colors hover:border-primary-200',
      className
    )}>
      {/* Collapsed Header Row */}
      <button
        onClick={() => hasExpandableContent && setExpanded(!expanded)}
        className={cn(
          'w-full flex items-center justify-between text-left transition-colors',
          compact ? 'px-3 py-2' : 'px-4 py-3',
          hasExpandableContent && 'hover:bg-surface-alt cursor-pointer',
          !hasExpandableContent && 'cursor-default'
        )}
      >
        {/* Left: Name + Truncated Description */}
        <div className="flex-1 min-w-0 mr-3">
          <div className="flex items-center gap-2">
            {/* Expand chevron */}
            {hasExpandableContent && (
              <ChevronDown 
                className={cn(
                  'w-4 h-4 text-text-muted flex-shrink-0 transition-transform',
                  expanded && 'rotate-180'
                )} 
              />
            )}
            {/* Name */}
            <span className="font-medium text-text-primary">{name}</span>
            {/* Subtext (category) */}
            {subtext && (
              <span className="text-xs text-text-muted italic">{subtext}</span>
            )}
          </div>
          {/* Truncated description */}
          {truncatedDescription && !expanded && (
            <p className={cn(
              'text-sm text-text-secondary truncate mt-0.5',
              hasExpandableContent ? 'pl-6' : ''
            )}>
              {truncatedDescription}
            </p>
          )}
        </div>

        {/* Right: Uses tracking + custom content */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {rightContent}
          
          {/* Uses tracking */}
          {hasLimitedUses && (
            <div 
              className="flex items-center gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={(e) => handleUsesChange(e, -1)}
                disabled={usesRemaining <= 0}
                className={cn(
                  'w-6 h-6 rounded flex items-center justify-center text-sm font-bold transition-colors',
                  usesRemaining > 0
                    ? 'bg-surface-alt hover:bg-border-light text-text-secondary'
                    : 'bg-surface text-border-light cursor-not-allowed'
                )}
                title="Spend use"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className={cn(
                'min-w-[2rem] text-center text-sm font-medium',
                usesRemaining === 0 ? 'text-red-600' : 'text-text-secondary'
              )}>
                {usesRemaining}/{maxUses}
              </span>
              <button
                onClick={(e) => handleUsesChange(e, 1)}
                disabled={usesRemaining >= maxUses}
                className={cn(
                  'w-6 h-6 rounded flex items-center justify-center text-sm font-bold transition-colors',
                  usesRemaining < maxUses
                    ? 'bg-surface-alt hover:bg-border-light text-text-secondary'
                    : 'bg-surface text-border-light cursor-not-allowed'
                )}
                title="Recover use"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {expanded && hasExpandableContent && (
        <div className={cn(
          'border-t border-border-light bg-surface-alt',
          compact ? 'px-3 py-2' : 'px-4 py-3'
        )}>
          {expandedContent ? (
            expandedContent
          ) : (
            <>
              {/* Full description */}
              {description && (
                <p className="text-sm text-text-secondary">
                  {description}
                </p>
              )}
              
              {/* Recovery period */}
              {hasLimitedUses && recoveryPeriod && (
                <div className="text-xs text-text-muted mt-2">
                  <span className="font-medium">Recovery:</span> {recoveryPeriod}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default CollapsibleListItem;
