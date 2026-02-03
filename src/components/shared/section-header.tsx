'use client';

/**
 * SectionHeader - Unified Section Header Component
 * =================================================
 * Standardized header pattern for ALL section lists across the site.
 * Includes optional add button, count display, and consistent styling.
 * 
 * Part of Phase 1 UI Unification: "Learn it once, learn it forever"
 * 
 * Usage:
 * - Character sheet sections (Powers, Techniques, Weapons, Armor, Equipment, Feats)
 * - Library page sections
 * - Creator page sections
 * - Any collapsible/expandable section with add functionality
 */

import { ReactNode } from 'react';
import { Plus } from 'lucide-react';
import { IconButton } from '@/components/ui';
import { cn } from '@/lib/utils';

export interface SectionHeaderProps {
  /** Section title (displayed in uppercase) */
  title: string;
  /** Item count to display next to title */
  count?: number;
  /** Callback for add button - if provided, shows + button */
  onAdd?: () => void;
  /** Accessibility label for add button (defaults to "Add {title}") */
  addLabel?: string;
  /** Additional content to render on the right side (before add button) */
  rightContent?: ReactNode;
  /** Custom className for container */
  className?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Whether to show a border below */
  bordered?: boolean;
}

const sizeStyles = {
  sm: 'text-xs mb-1',
  md: 'text-sm mb-2',
  lg: 'text-base mb-3',
};

export function SectionHeader({
  title,
  count,
  onAdd,
  addLabel,
  rightContent,
  className,
  size = 'sm',
  bordered = false,
}: SectionHeaderProps) {
  return (
    <div 
      className={cn(
        'flex items-center justify-between',
        sizeStyles[size],
        bordered && 'pb-2 border-b border-border-light',
        className
      )}
    >
      {/* Left: Title and count */}
      <h4 className="font-semibold text-text-muted uppercase tracking-wide flex items-center gap-2">
        {title}
        {count !== undefined && (
          <span className="text-xs text-text-muted font-normal">
            ({count})
          </span>
        )}
      </h4>
      
      {/* Right: Custom content and/or add button */}
      <div className="flex items-center gap-2">
        {rightContent}
        {onAdd && (
          <IconButton
            variant="ghost"
            size="sm"
            onClick={onAdd}
            label={addLabel || `Add ${title.toLowerCase()}`}
          >
            <Plus className="w-4 h-4" />
          </IconButton>
        )}
      </div>
    </div>
  );
}

export default SectionHeader;
