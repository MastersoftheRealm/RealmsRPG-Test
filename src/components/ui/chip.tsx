/**
 * Chip Component
 * ===============
 * Small tag/badge for displaying labels
 * Uses design system colors from globals.css
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';
import { X } from 'lucide-react';

const chipVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium border transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-neutral-100 text-text-secondary border-border-light',
        primary: 'bg-primary-700 text-primary-foreground border-primary-600',
        secondary: 'bg-neutral-200 text-text-secondary border-neutral-300',
        outline: 'border-border-light bg-transparent text-text-secondary hover:bg-surface-alt',
        accent: 'bg-accent-chip text-primary-700 border-accent-200',
        
        // Category-based colors using design system tokens
        action: 'bg-category-action text-category-action-text border-category-action-border',
        activation: 'bg-category-activation text-category-activation-text border-category-activation-border',
        area: 'bg-category-area text-category-area-text border-category-area-border',
        duration: 'bg-category-duration text-category-duration-text border-category-duration-border',
        target: 'bg-category-target text-category-target-text border-category-target-border',
        special: 'bg-category-special text-category-special-text border-category-special-border',
        restriction: 'bg-category-restriction text-category-restriction-text border-category-restriction-border',
        
        // Equipment types
        weapon: 'bg-warning-100 text-warning-800 border-warning-300',
        armor: 'bg-info-100 text-info-800 border-info-300',
        shield: 'bg-success-100 text-success-700 border-success-300',
        
        // Character content types
        feat: 'bg-pink-100 text-pink-800 border-pink-300',
        proficiency: 'bg-info-50 text-primary-600 border-info-200',
        weakness: 'bg-danger-100 text-danger-700 border-danger-300',
        power: 'bg-purple-100 text-purple-800 border-purple-300',
        technique: 'bg-orange-100 text-orange-800 border-orange-300',
        
        // Status colors
        success: 'bg-success-light text-success-700 border-success-300',
        danger: 'bg-danger-light text-danger-700 border-danger-300',
        warning: 'bg-warning-light text-warning-700 border-warning-300',
        info: 'bg-info-light text-info-700 border-info-300',
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-3 py-1 text-sm',
        lg: 'px-4 py-1.5 text-base',
      },
      interactive: {
        true: 'cursor-pointer hover:opacity-80',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      interactive: false,
    },
  }
);

export interface ChipProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof chipVariants> {
  onRemove?: () => void;
}

const Chip = React.forwardRef<HTMLSpanElement, ChipProps>(
  ({ className, variant, size, interactive, onRemove, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(chipVariants({ variant, size, interactive, className }))}
        {...props}
      >
        {children}
        {onRemove && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="ml-0.5 -mr-1 rounded-full p-0.5 hover:bg-black/10 focus:outline-none transition-colors"
            aria-label="Remove"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </span>
    );
  }
);
Chip.displayName = 'Chip';

export { Chip, chipVariants };
