/**
 * FilterSection Component
 * =======================
 * Collapsible filter container with consistent styling.
 * Used across all Codex tabs for filter visibility toggle.
 */

'use client';

import { useState, ReactNode } from 'react';
import { ChevronDown, ChevronUp, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilterSectionProps {
  children: ReactNode;
  defaultExpanded?: boolean;
  className?: string;
}

export function FilterSection({
  children,
  defaultExpanded = true,
  className,
}: FilterSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className={cn('mb-6', className)}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 mb-4 transition-colors"
      >
        <Filter className="w-4 h-4" />
        {isExpanded ? (
          <>
            <span>Hide Filters</span>
            <ChevronUp className="w-4 h-4" />
          </>
        ) : (
          <>
            <span>Show Filters</span>
            <ChevronDown className="w-4 h-4" />
          </>
        )}
      </button>

      {isExpanded && (
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          {children}
        </div>
      )}
    </div>
  );
}

export default FilterSection;
