/**
 * TableScroll — horizontal scroll wrapper for data tables on narrow viewports.
 * See MOBILE_UX.md § Lists and tables.
 */

import * as React from 'react';
import { cn } from '@/lib/utils/cn';

interface TableScrollProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function TableScroll({ children, className, ...props }: TableScrollProps) {
  return (
    <div className={cn('overflow-x-auto', className)} {...props}>
      {children}
    </div>
  );
}
