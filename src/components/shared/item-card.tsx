'use client';

/**
 * ItemCard - Unified Item Display Component
 * =========================================
 * Reusable card component for displaying any game item
 * Used in Codex, Library, Character Creator, and Character Sheet
 */

import { useState } from 'react';
import { ChevronDown, ChevronUp, Check, Edit, Trash2, Copy, Eye, AlertCircle } from 'lucide-react';
import type { DisplayItem, ListMode, ItemActions } from '@/types/items';

interface ItemCardProps {
  item: DisplayItem;
  mode?: ListMode;
  actions?: ItemActions;
  showDetails?: boolean;
  compact?: boolean;
  className?: string;
}

// Badge variants with Tailwind classes
const badgeVariants = {
  default: 'bg-muted text-muted-foreground',
  primary: 'bg-primary/20 text-primary',
  success: 'bg-green-500/20 text-green-400',
  warning: 'bg-yellow-500/20 text-yellow-400',
  danger: 'bg-red-500/20 text-red-400',
  info: 'bg-blue-500/20 text-blue-400',
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
          ? 'border-primary bg-primary/10 ring-1 ring-primary' 
          : 'border-border bg-card hover:border-primary/50'
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
          {/* Selection checkbox (select mode) */}
          {isSelectable && (
            <div 
              className={`
                mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors
                ${item.isSelected 
                  ? 'bg-primary border-primary' 
                  : 'border-muted-foreground/40'
                }
                ${item.isDisabled ? 'opacity-50' : ''}
              `}
            >
              {item.isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
            </div>
          )}
          
          {/* Name and subtitle */}
          <div className="min-w-0 flex-1">
            <h3 className={`font-medium text-foreground truncate ${compact ? 'text-sm' : ''}`}>
              {item.name}
            </h3>
            {item.subtitle && (
              <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>
            )}
          </div>
        </div>
        
        {/* Right: Stats and actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Quick stats */}
          {!compact && item.stats && item.stats.length > 0 && (
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              {item.stats.slice(0, 3).map((stat, i) => (
                <span key={i} className="whitespace-nowrap">
                  <span className="text-xs opacity-70">{stat.label}:</span>{' '}
                  <span className="font-medium text-foreground">{stat.value}</span>
                </span>
              ))}
            </div>
          )}
          
          {/* Cost display */}
          {item.cost !== undefined && (
            <span className="text-sm font-medium text-primary whitespace-nowrap">
              {item.cost} {item.costLabel}
            </span>
          )}
          
          {/* Manage mode actions */}
          {isManageable && (
            <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
              {actions?.onView && (
                <button
                  onClick={() => actions.onView?.(item)}
                  className="p-1.5 rounded hover:bg-muted transition-colors"
                  title="View"
                >
                  <Eye className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
              {actions?.onEdit && (
                <button
                  onClick={() => actions.onEdit?.(item)}
                  className="p-1.5 rounded hover:bg-muted transition-colors"
                  title="Edit"
                >
                  <Edit className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
              {actions?.onDuplicate && (
                <button
                  onClick={() => actions.onDuplicate?.(item)}
                  className="p-1.5 rounded hover:bg-muted transition-colors"
                  title="Duplicate"
                >
                  <Copy className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
              {actions?.onDelete && (
                <button
                  onClick={() => actions.onDelete?.(item)}
                  className="p-1.5 rounded hover:bg-destructive/20 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </button>
              )}
            </div>
          )}
          
          {/* Expand/collapse indicator */}
          {hasDetails && !isManageable && (
            <button 
              className="p-1 rounded hover:bg-muted transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
            >
              {isExpanded 
                ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> 
                : <ChevronDown className="w-4 h-4 text-muted-foreground" />
              }
            </button>
          )}
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
              className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
      
      {/* Disabled reason */}
      {item.isDisabled && item.disabledReason && (
        <div className="flex items-center gap-1.5 mt-2 text-xs text-destructive">
          <AlertCircle className="w-3 h-3 flex-shrink-0" />
          <span>{item.disabledReason}</span>
        </div>
      )}
      
      {/* Expanded details */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-border space-y-2">
          {/* Description */}
          {item.description && (
            <p className="text-sm text-muted-foreground">{item.description}</p>
          )}
          
          {/* Detail rows */}
          {item.details && item.details.map((detail, i) => (
            <div key={i} className="text-sm">
              <span className="font-medium text-foreground">{detail.label}: </span>
              <span className="text-muted-foreground">
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
              <span className="font-medium text-foreground">Requirements: </span>
              <span className="text-muted-foreground">
                {item.requirements.map((req, i) => (
                  <span 
                    key={i}
                    className={req.met ? 'text-green-400' : 'text-red-400'}
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
