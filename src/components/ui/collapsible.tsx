/**
 * Collapsible Component
 * =====================
 * Expandable/collapsible section with smooth animation.
 * Matches vanilla site's expandable-card pattern.
 */

'use client';

import * as React from 'react';
import { cn } from '@/lib/utils/cn';
import { ChevronDown } from 'lucide-react';

export interface CollapsibleProps {
  title: React.ReactNode;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  disabled?: boolean;
}

export function Collapsible({
  title,
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange,
  children,
  className,
  headerClassName,
  contentClassName,
  icon,
  badge,
  disabled = false,
}: CollapsibleProps) {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
  const isOpen = controlledOpen ?? internalOpen;
  const contentRef = React.useRef<HTMLDivElement>(null);
  const [height, setHeight] = React.useState<number | undefined>(
    defaultOpen ? undefined : 0
  );

  const toggle = () => {
    if (disabled) return;
    const newOpen = !isOpen;
    if (onOpenChange) {
      onOpenChange(newOpen);
    } else {
      setInternalOpen(newOpen);
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      const content = contentRef.current;
      if (content) {
        setHeight(content.scrollHeight);
        // After animation, set to auto for dynamic content
        const timer = setTimeout(() => setHeight(undefined), 300);
        return () => clearTimeout(timer);
      }
    } else {
      setHeight(0);
    }
  }, [isOpen]);

  return (
    <div
      className={cn(
        'bg-surface rounded-lg shadow-sm border border-border-light overflow-hidden',
        className
      )}
    >
      {/* Header */}
      <button
        type="button"
        onClick={toggle}
        disabled={disabled}
        className={cn(
          'flex items-center justify-between w-full px-4 py-3',
          'text-left font-medium transition-colors',
          'hover:bg-surface-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary',
          disabled && 'cursor-not-allowed opacity-50',
          headerClassName
        )}
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2">
          {icon}
          <span>{title}</span>
          {badge}
        </div>
        <ChevronDown
          className={cn(
            'w-5 h-5 text-text-muted transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {/* Content */}
      <div
        ref={contentRef}
        style={{ height: height !== undefined ? `${height}px` : 'auto' }}
        className={cn(
          'overflow-hidden transition-[height] duration-300 ease-in-out',
          !isOpen && 'invisible'
        )}
      >
        <div className={cn('px-4 pb-4', contentClassName)}>{children}</div>
      </div>
    </div>
  );
}

/**
 * CollapsibleGroup - Accordion-like group where only one can be open
 */
export interface CollapsibleGroupProps {
  children: React.ReactElement<CollapsibleProps>[];
  allowMultiple?: boolean;
  defaultOpenIndex?: number;
}

export function CollapsibleGroup({
  children,
  allowMultiple = false,
  defaultOpenIndex,
}: CollapsibleGroupProps) {
  const [openIndices, setOpenIndices] = React.useState<Set<number>>(
    defaultOpenIndex !== undefined ? new Set([defaultOpenIndex]) : new Set()
  );

  const handleOpenChange = (index: number, open: boolean) => {
    setOpenIndices((prev) => {
      const next = new Set(allowMultiple ? prev : []);
      if (open) {
        next.add(index);
      } else {
        next.delete(index);
      }
      return next;
    });
  };

  return (
    <div className="space-y-2">
      {React.Children.map(children, (child, index) =>
        React.cloneElement(child, {
          open: openIndices.has(index),
          onOpenChange: (open: boolean) => handleOpenChange(index, open),
        })
      )}
    </div>
  );
}
