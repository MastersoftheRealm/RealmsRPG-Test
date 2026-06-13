'use client';

import { ReactNode } from 'react';
import { ErrorBoundary } from '@/components/shared/error-boundary';

export function MainContentBoundary({ children }: { children: ReactNode }) {
  return <ErrorBoundary section="Page">{children}</ErrorBoundary>;
}
