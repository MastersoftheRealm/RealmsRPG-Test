/**
 * RollButton Component
 * ====================
 * Unified roll button for dice rolls across the entire site.
 * Used in character sheet, creature stat blocks, encounter tracker, etc.
 * 
 * Visual Design:
 * - Solid colors (clean, no gradients) matching btn-solid/btn-outline-clean
 * - White text with +/- number format
 * - Rounded corners, clear white font
 * - Hover: darker shade, active: press effect
 * 
 * @example
 * // Ability roll in character sheet
 * <RollButton value={3} onClick={() => rollAbility('strength')} size="lg" />
 * 
 * // Skill roll
 * <RollButton value={5} onClick={() => rollSkill('athletics')} size="md" />
 * 
 * // Unproficient skill
 * <RollButton value={-1} variant="unproficient" onClick={handleRoll} />
 */

'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';
import { formatBonus } from '@/lib/utils';

const rollButtonVariants = cva(
  // Base styles - consistent across all variants
  'inline-flex items-center justify-center font-bold rounded-lg transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
  {
    variants: {
      variant: {
        // Standard roll button - solid primary
        primary: [
          'text-white',
          'bg-primary-600 hover:bg-primary-700 focus-visible:ring-primary-accent',
          'hover:scale-105 active:scale-95',
        ].join(' '),
        
        // Unproficient/disadvantage - solid gray
        unproficient: [
          'text-white',
          'bg-neutral-500 hover:bg-neutral-600 focus-visible:ring-neutral-400',
          'hover:scale-105 active:scale-95',
        ].join(' '),
        
        // Defense roll - solid utility blue
        defense: [
          'text-white',
          'bg-utility-500 hover:bg-utility-600 focus-visible:ring-utility-400',
          'hover:scale-105 active:scale-95',
        ].join(' '),
        
        // Success/green variant (for healing, etc.)
        success: [
          'text-white',
          'bg-success-600 hover:bg-success-700 focus-visible:ring-success',
          'hover:scale-105 active:scale-95',
        ].join(' '),
        
        // Danger/red variant (for damage, etc.)
        danger: [
          'text-white',
          'bg-danger-600 hover:bg-danger-700 focus-visible:ring-danger',
          'hover:scale-105 active:scale-95',
        ].join(' '),
        
        // Outline variant - matches btn-outline-clean
        outline: [
          'text-primary-700 border-2 border-primary-600 bg-transparent',
          'hover:bg-primary-50 hover:scale-105',
          'active:scale-95 active:bg-primary-100',
        ].join(' '),
      },
      
      size: {
        sm: 'px-3 py-1.5 text-sm min-w-[48px]',
        md: 'px-4 py-2 text-base min-w-[56px]',
        lg: 'px-5 py-2.5 text-xl min-w-[64px]',
        xl: 'px-6 py-3 text-2xl min-w-[72px]',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface RollButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'value'>,
    VariantProps<typeof rollButtonVariants> {
  /** The numeric bonus value (will be formatted as +X or -X) */
  value: number;
  /** Optional pre-formatted string to display instead of value */
  displayValue?: string;
}

/**
 * Unified roll button component for dice rolls.
 * Displays a bonus value and triggers a roll on click.
 */
const RollButton = React.forwardRef<HTMLButtonElement, RollButtonProps>(
  ({ className, variant, size, value, displayValue, title, ...props }, ref) => {
    const display = displayValue ?? formatBonus(value);
    
    return (
      <button
        ref={ref}
        className={cn(rollButtonVariants({ variant, size, className }))}
        title={title ?? `Roll ${display}`}
        {...props}
      >
        {display}
      </button>
    );
  }
);
RollButton.displayName = 'RollButton';

export { RollButton, rollButtonVariants };
