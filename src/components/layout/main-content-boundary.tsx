'use client';

import { ReactNode } from 'react';
import { ErrorBoundary } from '@/components/patterns/chrome/error-boundary';

export function MainContentBoundary({ children }: { children: ReactNode }) {
  return <ErrorBoundary section="Page">{children}</ErrorBoundary>;
}
