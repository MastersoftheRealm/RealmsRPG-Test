/**
 * RollButton Component
 * ====================
 * Unified roll button for dice rolls across the entire site.
 * Used in character sheet, creature stat blocks, encounter tracker, etc.
 * 
 * Visual Design:
 * - Gradient blue background (primary colors)
 * - White text with +/- number format
 * - Rounded corners, subtle shadow
 * - Hover: lift effect, brighter gradient
 * - Active: press effect
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

const rollButtonVariants = cva(
  // Base styles - consistent across all variants
  'inline-flex items-center justify-center font-bold rounded-lg transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
  {
    variants: {
      variant: {
        // Standard roll button - blue gradient
        primary: [
          'text-white shadow-md',
          'bg-gradient-to-br from-primary-500 to-primary-700',
          'hover:from-primary-400 hover:to-primary-600 hover:shadow-lg hover:scale-105',
          'active:scale-95 active:from-primary-600 active:to-primary-800',
        ].join(' '),
        
        // Unproficient/disadvantage - gray gradient
        unproficient: [
          'text-white shadow-sm',
          'bg-gradient-to-br from-neutral-400 to-neutral-600',
          'hover:from-neutral-300 hover:to-neutral-500 hover:shadow-md hover:scale-105',
          'active:scale-95 active:from-neutral-500 active:to-neutral-700',
        ].join(' '),
        
        // Defense roll - slightly different blue
        defense: [
          'text-white shadow-md',
          'bg-gradient-to-br from-utility-300 to-utility-500',
          'hover:from-utility-200 hover:to-utility-400 hover:shadow-lg hover:scale-105',
          'active:scale-95 active:from-utility-400 active:to-utility-600',
        ].join(' '),
        
        // Success/green variant (for healing, etc.)
        success: [
          'text-white shadow-md',
          'bg-gradient-to-br from-success-500 to-success-700',
          'hover:from-success-400 hover:to-success-600 hover:shadow-lg hover:scale-105',
          'active:scale-95 active:from-success-600 active:to-success-800',
        ].join(' '),
        
        // Danger/red variant (for damage, etc.)
        danger: [
          'text-white shadow-md',
          'bg-gradient-to-br from-danger-500 to-danger-700',
          'hover:from-danger-400 hover:to-danger-600 hover:shadow-lg hover:scale-105',
          'active:scale-95 active:from-danger-600 active:to-danger-800',
        ].join(' '),
        
        // Outline variant - for secondary actions
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

/**
 * Format a number as a bonus string (+X or -X)
 */
function formatBonus(value: number): string {
  return value >= 0 ? `+${value}` : `${value}`;
}

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
