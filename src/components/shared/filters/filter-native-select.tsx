/**
 * Shared native-select + text/number chrome for filter panels (TASK-725).
 * Matches height/radius/border; selects add appearance-none + muted ChevronDown inset.
 */

'use client';

import { forwardRef, type InputHTMLAttributes, type SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FILTER_CONTROL_CLASS } from './filter-utils';

const FILTER_NATIVE_SELECT_CLASS = cn(FILTER_CONTROL_CLASS, 'appearance-none pr-10');

type FilterNativeSelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
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

/** Filter text/number field — same h-11 rounded-md chrome as FilterNativeSelect. */
export const FilterInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function FilterInput({ className, ...props }, ref) {
    return <input ref={ref} className={cn(FILTER_CONTROL_CLASS, className)} {...props} />;
  }
);
