/**
 * Shared native-select chrome for filter dropdowns.
 * Matches ui/Select chevron inset (appearance-none + muted ChevronDown).
 */

'use client';

import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const FILTER_NATIVE_SELECT_CLASS =
  'h-11 w-full appearance-none rounded-md border border-border-light bg-surface px-3 pr-10 text-sm text-text-primary focus:border-primary-outline-border focus:outline-none focus:ring-2 focus:ring-primary-outline-border disabled:cursor-not-allowed disabled:bg-surface-alt';

type FilterNativeSelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  wrapperClassName?: string;
};

export function FilterNativeSelect({
  className,
  wrapperClassName,
  ...props
}: FilterNativeSelectProps) {
  return (
    <div className={cn('relative', wrapperClassName)}>
      <select className={cn(FILTER_NATIVE_SELECT_CLASS, className)} {...props} />
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted dark:text-text-secondary"
        aria-hidden
      />
    </div>
  );
}
