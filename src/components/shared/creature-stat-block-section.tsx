'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { SectionHeader } from './section-header';
import { ChevronDown } from 'lucide-react';

interface StatBlockSectionProps {
  title: string;
  defaultExpanded?: boolean;
  children: React.ReactNode;
}

export function StatBlockSection({ title, defaultExpanded = true, children }: StatBlockSectionProps) {
  const [open, setOpen] = useState(defaultExpanded);
  return (
    <div>
      <SectionHeader
        title={title}
        size="sm"
        rightContent={
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="flex items-center justify-center w-7 h-7 rounded-full border border-border-light text-text-muted hover:bg-surface-alt hover:text-text-primary transition-colors"
            aria-label={open ? `Collapse ${title}` : `Expand ${title}`}
          >
            <ChevronDown
              className={cn(
                'w-4 h-4 transition-transform',
                open ? 'rotate-180' : 'rotate-0'
              )}
            />
          </button>
        }
      />
      {open && <div className="mt-1">{children}</div>}
    </div>
  );
}
