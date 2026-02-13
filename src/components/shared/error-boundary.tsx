'use client';

/**
 * ErrorBoundary — Graceful Error Handling
 * ========================================
 * Catches rendering errors in child components and displays a fallback UI.
 * Prevents a single component crash from taking down entire page sections.
 *
 * Usage:
 *   <ErrorBoundary fallback={<p>Something went wrong</p>}>
 *     <MyComponent />
 *   </ErrorBoundary>
 */

import { Component, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui';

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Custom fallback UI. If not provided, uses a default card. */
  fallback?: ReactNode;
  /** Section name for the error message (e.g., "Character Sheet") */
  section?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`[ErrorBoundary${this.props.section ? ` – ${this.props.section}` : ''}]`, error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center gap-3 p-8 rounded-lg bg-surface border border-border-light text-center">
          <AlertCircle className="w-8 h-8 text-danger-600" />
          <h3 className="text-lg font-semibold text-text-primary">
            Something went wrong
          </h3>
          <p className="text-sm text-text-muted max-w-md">
            {this.props.section
              ? `An error occurred in the ${this.props.section} section.`
              : 'An unexpected error occurred.'}
            {' '}Try refreshing, or contact support if the problem persists.
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={this.handleRetry}
          >
            <RefreshCw className="w-4 h-4 mr-1.5" />
            Try Again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
