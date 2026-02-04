'use client';

/**
 * ItemCard - Unified Item Display Component
 * =========================================
 * Reusable card component for displaying any game item
 * Used in Codex, Library, Character Creator, and Character Sheet
 */

import { useState } from 'react';
import { Check, Edit, Trash2, Copy, Eye, AlertCircle } from 'lucide-react';
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
  primary: 'bg-primary-100 text-primary-700',
  success: 'bg-success-100 text-success-700',
  warning: 'bg-warning-100 text-warning-700',
  danger: 'bg-danger-100 text-danger-700',
  info: 'bg-info-100 text-info-700',
};

export function ItemCard({ 
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
      className={`
        rounded-lg border transition-all duration-200
        ${item.isSelected 
          ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500' 
          : 'border-border-light bg-surface hover:border-primary-300'
        }
        ${item.isDisabled 
          ? 'opacity-50 cursor-not-allowed' 
          : isSelectable || hasDetails ? 'cursor-pointer' : ''
        }
        ${compact ? 'p-2' : 'p-3'}
        ${className}
      `}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={isSelectable && !item.isDisabled ? 0 : undefined}
      role={isSelectable ? 'button' : undefined}
      aria-pressed={isSelectable ? item.isSelected : undefined}
      aria-disabled={item.isDisabled}
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
            <h3 className={`font-medium text-text-primary truncate ${compact ? 'text-sm' : ''}`}>
              {item.name}
            </h3>
            {item.subtitle && (
              <p className="text-xs text-text-muted truncate">{item.subtitle}</p>
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
                  <span className="text-xs opacity-70">{stat.label}:</span>{' '}
                  <span className="font-medium text-text-primary">{stat.value}</span>
                </span>
              ))}
            </div>
          )}
          
          {/* Cost display */}
          {item.cost !== undefined && (
            <span className="text-sm font-medium text-primary-600 whitespace-nowrap">
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
                  variant="danger"
                  size="sm"
                  onClick={() => actions.onDelete?.(item)}
                  label="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </IconButton>
              )}
            </div>
          )}
          
          {/* Expand/collapse indicator */}
        </div>
      </div>
      
      {/* Badges row */}
      {item.badges && item.badges.length > 0 && (
        <div className={`flex flex-wrap gap-1 ${compact ? 'mt-1' : 'mt-2'}`}>
          {item.badges.map((badge, i) => (
            <span 
              key={i}
              className={`text-xs px-2 py-0.5 rounded-full ${badgeVariants[badge.variant]}`}
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
              className="text-xs px-1.5 py-0.5 rounded bg-surface-alt text-text-muted"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
      
      {/* Disabled reason */}
      {item.isDisabled && item.disabledReason && (
        <div className="flex items-center gap-1.5 mt-2 text-xs text-danger-600">
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
                    className={req.met ? 'text-success-600' : 'text-danger-600'}
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
}

export default ItemCard;
