'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { SectionHeader } from '../chrome/section-header';
import { ChevronDown } from 'lucide-react';

interface StatBlockSectionProps {
  title: string;
  defaultExpanded?: boolean | undefined;
  children: React.ReactNode;
}

export function StatBlockSection({
  title,
  defaultExpanded = true,
  children,
}: StatBlockSectionProps) {
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
            className="flex h-7 w-7 items-center justify-center rounded-full border border-border-light text-text-muted transition-colors hover:bg-surface-alt hover:text-text-primary"
            aria-label={open ? `Collapse ${title}` : `Expand ${title}`}
          >
            <ChevronDown
              className={cn('h-4 w-4 transition-transform', open ? 'rotate-180' : 'rotate-0')}
            />
          </button>
        }
      />
      {open && <div className="mt-1">{children}</div>}
    </div>
  );
}
