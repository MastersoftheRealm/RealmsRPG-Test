/**
 * SearchInput Component
 * =======================
 * Unified search input with icon and optional clear button.
 * Replaces duplicate search input patterns across the codebase.
 */

'use client';

import * as React from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'size'> {
  /** Current search value */
  value: string;
  /** Change handler */
  onChange: (value: string) => void;
  /** Whether to show clear button when value is present */
  showClear?: boolean;
  /** Custom icon to use instead of search icon */
  icon?: React.ReactNode;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: {
    wrapper: '',
    input: 'py-1.5 pl-8 pr-3 text-sm',
    icon: 'w-4 h-4 left-2.5',
    clear: 'right-2',
  },
  md: {
    wrapper: '',
    input: 'py-2.5 pl-10 pr-4',
    icon: 'w-5 h-5 left-3',
    clear: 'right-3',
  },
  lg: {
    wrapper: '',
    input: 'py-3 pl-12 pr-5 text-lg',
    icon: 'w-6 h-6 left-3.5',
    clear: 'right-3.5',
  },
};

export function SearchInput({
  value,
  onChange,
  showClear = true,
  icon,
  size = 'md',
  placeholder = 'Search...',
  className,
  ...props
}: SearchInputProps) {
  const sizes = sizeClasses[size];
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleClear = () => {
    onChange('');
    inputRef.current?.focus();
  };

  return (
    <div className={cn('search-input-wrapper', sizes.wrapper)}>
      <span className={cn('search-input-icon', sizes.icon)}>
        {icon || <Search className="w-full h-full" />}
      </span>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          'search-input',
          sizes.input,
          showClear && value && 'pr-10',
          className
        )}
        {...props}
      />
      {showClear && value && (
        <button
          type="button"
          onClick={handleClear}
          className={cn('search-input-clear', sizes.clear)}
          aria-label="Clear search"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

SearchInput.displayName = 'SearchInput';
