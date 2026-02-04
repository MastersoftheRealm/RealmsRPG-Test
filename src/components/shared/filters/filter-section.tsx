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
import { Button } from '@/components/ui';

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
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsExpanded(!isExpanded)}
        className="mb-4"
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
      </Button>

      {isExpanded && (
        <div className="p-4 bg-surface-alt rounded-lg border border-border-light">
          {children}
        </div>
      )}
    </div>
  );
}

export default FilterSection;
