'use client';

/**
 * ItemCard - Unified Item Display Component
 * =========================================
 * Reusable card component for displaying any game item
 * Used in Codex, Library, Character Creator, and Character Sheet
 */

import { useState, memo } from 'react';
import { Check, Edit, Copy, Eye, AlertCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { IconButton } from '@/components/ui';
import { SelectionToggle } from './selection-toggle';
import type { DisplayItem, ListMode, ItemActions } from '@/types/items';

interface ItemCardProps {
  item: DisplayItem;
  mode?: ListMode;
  actions?: ItemActions;
  showDetails?: boolean;
  compact?: boolean;
  className?: string;
}

// Badge variants with design token classes
const badgeVariants = {
  default: 'bg-surface-alt text-text-secondary',
  primary: 'bg-primary-subtle-bg text-primary-subtle-fg',
  success: 'bg-success-100 text-success-fg',
  warning: 'bg-warning-100 text-warning-fg',
  danger: 'bg-danger-100 text-danger-fg',
  info: 'bg-info-100 text-info-fg',
};

export const ItemCard = memo(function ItemCard({ 
  item, 
  mode = 'view', 
  actions,
  showDetails = false,
  compact = false,
  className = '',
}: ItemCardProps) {
  const [isExpanded, setIsExpanded] = useState(showDetails);
  
  const hasDetails = (item.details && item.details.length > 0) || item.description;
  const isSelectable = mode === 'select';
  const isManageable = mode === 'manage';
  
  const handleClick = () => {
    if (isSelectable && !item.isDisabled) {
      if (item.isSelected) {
        actions?.onDeselect?.(item);
      } else {
        actions?.onSelect?.(item);
      }
    } else if (hasDetails) {
      setIsExpanded(!isExpanded);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      className={cn(
        'rounded-lg border transition-all duration-base ease-standard',
        item.isSelected 
          ? 'border-primary-outline-border bg-primary-subtle-bg ring-1 ring-primary-subtle-border' 
          : 'border-border-light bg-surface hover:border-primary-outline-border',
        item.isDisabled 
          ? 'opacity-50 cursor-not-allowed' 
          : (isSelectable || hasDetails) && 'cursor-pointer',
        compact ? 'p-2' : 'p-3',
        className
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={isSelectable && !item.isDisabled ? 0 : undefined}
      role={isSelectable && !item.isDisabled ? 'button' : undefined}
      aria-pressed={isSelectable && !item.isDisabled ? item.isSelected : undefined}
    >
      {/* Header Row */}
      <div className="flex items-start justify-between gap-2">
        {/* Left: Selection indicator + Name */}
        <div className="flex items-start gap-2 flex-1 min-w-0">
          {/* Selection toggle (select mode) - uses unified SelectionToggle */}
          {isSelectable && (
            <SelectionToggle
              isSelected={!!item.isSelected}
              onToggle={() => {
                if (item.isSelected) {
                  actions?.onDeselect?.(item);
                } else {
                  actions?.onSelect?.(item);
                }
              }}
              disabled={item.isDisabled}
              size="sm"
              label={item.isSelected ? `Remove ${item.name}` : `Add ${item.name}`}
            />
          )}
          
          {/* Name and subtitle */}
          <div className="min-w-0 flex-1">
            <h3 className={cn('font-medium text-text-primary break-words lg:truncate', compact && 'text-sm')}>
              {item.name}
            </h3>
            {item.subtitle && (
              <p className="text-xs text-text-muted dark:text-text-secondary truncate">{item.subtitle}</p>
            )}
          </div>
        </div>
        
        {/* Right: Stats and actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Quick stats */}
          {!compact && item.stats && item.stats.length > 0 && (
            <div className="flex items-center gap-3 text-sm text-text-secondary">
              {item.stats.slice(0, 3).map((stat, i) => (
                <span key={i} className="whitespace-nowrap">
                  <span className="text-xs text-text-secondary">{stat.label}:</span>{' '}
                  <span className="font-medium text-text-primary">{stat.value}</span>
                </span>
              ))}
            </div>
          )}
          
          {/* Cost display */}
          {item.cost !== undefined && (
            <span className="text-sm font-medium text-primary-link-fg whitespace-nowrap">
              {item.cost} {item.costLabel}
            </span>
          )}
          
          {/* Manage mode actions */}
          {isManageable && (
            <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
              {actions?.onView && (
                <IconButton
                  variant="ghost"
                  size="sm"
                  onClick={() => actions.onView?.(item)}
                  label="View"
                >
                  <Eye className="w-4 h-4" />
                </IconButton>
              )}
              {actions?.onEdit && (
                <IconButton
                  variant="ghost"
                  size="sm"
                  onClick={() => actions.onEdit?.(item)}
                  label="Edit"
                >
                  <Edit className="w-4 h-4" />
                </IconButton>
              )}
              {actions?.onDuplicate && (
                <IconButton
                  variant="ghost"
                  size="sm"
                  onClick={() => actions.onDuplicate?.(item)}
                  label="Duplicate"
                >
                  <Copy className="w-4 h-4" />
                </IconButton>
              )}
              {actions?.onDelete && (
                <IconButton
                  variant="ghost"
                  size="sm"
                  onClick={() => actions.onDelete?.(item)}
                  label="Remove"
                  className="text-danger-fg hover:opacity-80 hover:bg-transparent"
                >
                  <X className="w-4 h-4" />
                </IconButton>
              )}
            </div>
          )}
          
          {/* Expand/collapse indicator */}
        </div>
      </div>
      
      {/* Badges row */}
      {item.badges && item.badges.length > 0 && (
        <div className={cn('flex flex-wrap gap-1', compact ? 'mt-1' : 'mt-2')}>
          {item.badges.map((badge, i) => (
            <span 
              key={i}
              className={cn('text-xs px-2 py-0.5 rounded-full', badgeVariants[badge.variant])}
            >
              {badge.label}
            </span>
          ))}
        </div>
      )}
      
      {/* Tags row (compact display) */}
      {item.tags && item.tags.length > 0 && !compact && (
        <div className="flex flex-wrap gap-1 mt-2">
          {item.tags.map((tag, i) => (
            <span 
              key={i}
              className="text-xs px-1.5 py-0.5 rounded bg-surface-alt text-text-muted dark:text-text-secondary"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
      
      {/* Disabled reason */}
      {item.isDisabled && item.disabledReason && (
        <div className="flex items-center gap-1.5 mt-2 text-xs text-danger-fg">
          <AlertCircle className="w-3 h-3 flex-shrink-0" />
          <span>{item.disabledReason}</span>
        </div>
      )}
      
      {/* Expanded details */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-border-light space-y-2">
          {/* Description */}
          {item.description && (
            <p className="text-sm text-text-secondary">{item.description}</p>
          )}
          
          {/* Detail rows */}
          {item.details && item.details.map((detail, i) => (
            <div key={i} className="text-sm">
              <span className="font-medium text-text-primary">{detail.label}: </span>
              <span className="text-text-secondary">
                {Array.isArray(detail.value) 
                  ? detail.value.join(', ') 
                  : detail.value
                }
              </span>
            </div>
          ))}
          
          {/* Requirements */}
          {item.requirements && item.requirements.length > 0 && (
            <div className="text-sm">
              <span className="font-medium text-text-primary">Requirements: </span>
              <span className="text-text-secondary">
                {item.requirements.map((req, i) => (
                  <span 
                    key={i}
                    className={cn(req.met ? 'text-success-fg' : 'text-danger-fg')}
                  >
                    {req.name} {req.value}
                    {i < item.requirements!.length - 1 ? ', ' : ''}
                  </span>
                ))}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export default ItemCard;
