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
    console.error(
      `[ErrorBoundary${this.props.section ? ` – ${this.props.section}` : ''}]`,
      error,
      errorInfo,
    );
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-border-light bg-surface p-8 text-center">
          <AlertCircle className="h-8 w-8 text-danger-fg" />
          <h3 className="text-lg font-semibold text-text-primary">Something went wrong</h3>
          <p className="max-w-md text-sm text-text-muted">
            {this.props.section
              ? `An error occurred in the ${this.props.section} section.`
              : 'An unexpected error occurred.'}{' '}
            Try refreshing, or contact support if the problem persists.
          </p>
          <Button variant="secondary" size="sm" onClick={this.handleRetry}>
            <RefreshCw className="mr-1.5 h-4 w-4" />
            Try Again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
