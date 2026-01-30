/**
 * Alert Component
 * ===============
 * Contextual feedback messages for typical user actions.
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';
import { AlertTriangle, CheckCircle, Info, XCircle, X } from 'lucide-react';
import { IconButton } from './icon-button';

const alertVariants = cva(
  'relative flex items-start gap-3 rounded-lg border p-4',
  {
    variants: {
      variant: {
        info: 'bg-info-light border-info-300 text-info-700',
        success: 'bg-success-light border-success-300 text-success-700',
        warning: 'bg-warning-light border-warning-300 text-warning-700',
        danger: 'bg-danger-light border-danger-300 text-danger-700',
      },
    },
    defaultVariants: {
      variant: 'info',
    },
  }
);

const alertIcons = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  danger: XCircle,
};

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  title?: string;
  onDismiss?: () => void;
}

export function Alert({
  variant = 'info',
  title,
  onDismiss,
  children,
  className,
  ...props
}: AlertProps) {
  const Icon = alertIcons[variant ?? 'info'];

  return (
    <div
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    >
      <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        {title && <h4 className="font-semibold mb-1">{title}</h4>}
        <div className="text-sm">{children}</div>
      </div>
      {onDismiss && (
        <IconButton
          variant="ghost"
          size="sm"
          onClick={onDismiss}
          label="Dismiss alert"
        >
          <X className="h-4 w-4" />
        </IconButton>
      )}
    </div>
  );
}
