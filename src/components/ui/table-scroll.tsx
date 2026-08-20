/**
 * TableScroll — horizontal scroll wrapper for data tables on narrow viewports.
 * `relative` is the C6 containing block so `sr-only` headers cannot expand the ICB.
 * See MOBILE_UX.md § Lists and tables / C6.
 */

import * as React from 'react';
import { cn } from '@/lib/utils/cn';

interface TableScrollProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function TableScroll({ children, className, ...props }: TableScrollProps) {
  return (
    <div className={cn('relative max-w-full min-w-0 overflow-x-auto', className)} {...props}>
      {children}
    </div>
  );
}
