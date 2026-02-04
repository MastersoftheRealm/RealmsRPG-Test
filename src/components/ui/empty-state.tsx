/**
 * EmptyState Component
 * =====================
 * Unified empty state display for when lists/searches have no results.
 * Provides consistent messaging and optional action buttons.
 */

import * as React from 'react';
import { cn } from '@/lib/utils/cn';
import { Button } from './button';

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Main heading */
  title: string;
  /** Description text (alias: message) */
  description?: string;
  /** Alias for description for backward compatibility */
  message?: string;
  /** Icon to display (optional) */
  icon?: React.ReactNode;
  /** Primary action button */
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  } | React.ReactNode;
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
  message,
  icon,
  action,
  secondaryAction,
  size = 'md',
  className,
  ...props
}: EmptyStateProps) {
  const sizes = sizeClasses[size];
  // Support both 'description' and 'message' props for backward compatibility
  const displayMessage = description || message;
  
  // Check if action is a React node or an action object
  const isActionObject = action && typeof action === 'object' && 'label' in action && 'onClick' in action;

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
            'flex items-center justify-center rounded-full bg-surface-alt text-text-muted mb-4',
            sizes.iconWrapper
          )}
        >
          {icon}
        </div>
      )}
      <h3 className={cn('font-semibold text-text-primary', sizes.title)}>
        {title}
      </h3>
      {displayMessage && (
        <p className={cn('mt-2 text-text-muted max-w-md', sizes.description)}>
          {displayMessage}
        </p>
      )}
      {/* Support both action object and React node */}
      {action && !isActionObject && (
        <div className="mt-6">{action}</div>
      )}
      {(isActionObject || secondaryAction) && (
        <div className="mt-6 flex items-center gap-3">
          {isActionObject && (
            <Button
              variant={(action as { variant?: 'primary' | 'secondary' }).variant === 'secondary' ? 'secondary' : 'primary'}
              onClick={(action as { onClick: () => void }).onClick}
            >
              {(action as { label: string }).label}
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
