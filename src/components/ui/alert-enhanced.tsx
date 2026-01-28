/**
 * Alert Component (Enhanced)
 * ===========================
 * Unified alert/message display with consistent styling.
 * Supports success, error, warning, and info variants.
 */

import * as React from 'react';
import { AlertCircle, CheckCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

type AlertVariant = 'success' | 'error' | 'warning' | 'info';

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Alert variant determines color and icon */
  variant: AlertVariant;
  /** Alert title (optional) */
  title?: string;
  /** Main message content */
  children: React.ReactNode;
  /** Whether alert can be dismissed */
  dismissible?: boolean;
  /** Callback when dismissed */
  onDismiss?: () => void;
  /** Custom icon to use */
  icon?: React.ReactNode;
}

const variantIcons: Record<AlertVariant, React.ReactNode> = {
  success: <CheckCircle className="alert-icon" />,
  error: <AlertCircle className="alert-icon" />,
  warning: <AlertTriangle className="alert-icon" />,
  info: <Info className="alert-icon" />,
};

const variantClasses: Record<AlertVariant, string> = {
  success: 'alert-success',
  error: 'alert-error',
  warning: 'alert-warning',
  info: 'alert-info',
};

export function Alert({
  variant,
  title,
  children,
  dismissible = false,
  onDismiss,
  icon,
  className,
  ...props
}: AlertProps) {
  return (
    <div
      role="alert"
      className={cn('alert', variantClasses[variant], className)}
      {...props}
    >
      {icon || variantIcons[variant]}
      <div className="alert-content">
        {title && <p className="font-semibold mb-1">{title}</p>}
        <div>{children}</div>
      </div>
      {dismissible && onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="flex-shrink-0 p-1 rounded hover:bg-black/10 transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

Alert.displayName = 'Alert';
