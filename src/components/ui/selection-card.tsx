/**
 * SelectionCard — clickable card for pick-one / pick-many flows (character creator, modals).
 * Uses `cardVariants` selectable/selected tokens (replaces `.selection-card` CSS).
 */

import * as React from 'react';
import { cn } from '@/lib/utils/cn';
import { cardVariants } from './card';

export interface SelectionCardProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
}

export function SelectionCard({
  selected = false,
  className,
  type = 'button',
  ...props
}: SelectionCardProps) {
  return (
    <button
      type={type}
      className={cn(cardVariants({ variant: selected ? 'selected' : 'selectable' }), className)}
      {...props}
    />
  );
}

export interface SelectionCardSurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  selected?: boolean;
}

/** Div-based selection card for non-button interactive surfaces (role="button" + keyboard). */
export function SelectionCardSurface({
  selected = false,
  className,
  ...props
}: SelectionCardSurfaceProps) {
  return (
    <div
      className={cn(cardVariants({ variant: selected ? 'selected' : 'selectable' }), className)}
      {...props}
    />
  );
}
