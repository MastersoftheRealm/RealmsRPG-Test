/**
 * EmptyState Component
 * =====================
 * Unified empty state display for when lists/searches have no results.
 * Provides consistent messaging and optional action buttons.
 */

import * as React from 'react';
import { cn } from '@/lib/utils/cn';
import { Button } from './button';

interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Main heading */
  title: string;
  /** Description text */
  description?: string;
  /** Icon to display (optional) */
  icon?: React.ReactNode;
  /** Primary action button */
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  };
  /** Secondary action button */
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: {
    container: 'py-8',
    iconWrapper: 'w-12 h-12',
    title: 'text-lg',
    description: 'text-sm',
  },
  md: {
    container: 'py-12',
    iconWrapper: 'w-16 h-16',
    title: 'text-xl',
    description: 'text-base',
  },
  lg: {
    container: 'py-16',
    iconWrapper: 'w-20 h-20',
    title: 'text-2xl',
    description: 'text-lg',
  },
};

export function EmptyState({
  title,
  description,
  icon,
  action,
  secondaryAction,
  size = 'md',
  className,
  ...props
}: EmptyStateProps) {
  const sizes = sizeClasses[size];

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        sizes.container,
        className
      )}
      {...props}
    >
      {icon && (
        <div
          className={cn(
            'flex items-center justify-center rounded-full bg-neutral-100 text-text-muted mb-4',
            sizes.iconWrapper
          )}
        >
          {icon}
        </div>
      )}
      <h3 className={cn('font-semibold text-text-primary', sizes.title)}>
        {title}
      </h3>
      {description && (
        <p className={cn('mt-2 text-text-muted max-w-md', sizes.description)}>
          {description}
        </p>
      )}
      {(action || secondaryAction) && (
        <div className="mt-6 flex items-center gap-3">
          {action && (
            <Button
              variant={action.variant === 'secondary' ? 'secondary' : 'primary'}
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button variant="ghost" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

EmptyState.displayName = 'EmptyState';
