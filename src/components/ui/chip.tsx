/**
 * Chip Component
 * ===============
 * Small tag/badge for displaying labels
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

const chipVariants = cva(
  'inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-medium border border-transparent',
  {
    variants: {
      variant: {
        default: 'bg-gray-100 text-gray-700',
        primary: 'bg-primary text-white',
        secondary: 'bg-gray-200 text-gray-700',
        outline: 'border border-gray-300 bg-transparent text-gray-700',
        
        // Category-based colors from vanilla site
        action: 'bg-[#e7f0ff] text-[#0b5ed7] border-[#bcd4ff]',
        activation: 'bg-[#e6fffa] text-[#0f766e] border-[#b3f0e7]',
        area: 'bg-[#eafbe7] text-[#166534] border-[#c7efc1]',
        duration: 'bg-[#f3e8ff] text-[#6b21a8] border-[#e3d0ff]',
        target: 'bg-[#fff4e5] text-[#9a3412] border-[#ffd8a8]',
        special: 'bg-[#fffbe6] text-[#854d0e] border-[#ffe58f]',
        restriction: 'bg-[#ffe5e5] text-[#b91c1c] border-[#ffb3b3]',
        
        // Equipment types
        weapon: 'bg-[#fef3c7] text-[#92400e] border-[#fcd34d]',
        armor: 'bg-[#e0e7ff] text-[#3730a3] border-[#a5b4fc]',
        shield: 'bg-[#d1fae5] text-[#065f46] border-[#6ee7b7]',
        
        // Other types
        feat: 'bg-[#fce7f3] text-[#9d174d] border-[#f9a8d4]',
        proficiency: 'bg-[#e3f2fd] text-[#1a73e8]',
        weakness: 'bg-[#ffe0e0] text-[#aa3333] border-[#cc4444]',
        
        // Status colors
        success: 'bg-success-light text-success',
        danger: 'bg-danger-light text-danger',
        warning: 'bg-warning-light text-warning',
        info: 'bg-info-light text-info',
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-3 py-1 text-sm',
        lg: 'px-4 py-1.5 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface ChipProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof chipVariants> {
  onRemove?: () => void;
}

const Chip = React.forwardRef<HTMLSpanElement, ChipProps>(
  ({ className, variant, size, onRemove, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(chipVariants({ variant, size, className }))}
        {...props}
      >
        {children}
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="ml-1 rounded-full p-0.5 hover:bg-black/10 focus:outline-none"
            aria-label="Remove"
          >
            <svg
              className="h-3 w-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </span>
    );
  }
);
Chip.displayName = 'Chip';

export { Chip, chipVariants };
