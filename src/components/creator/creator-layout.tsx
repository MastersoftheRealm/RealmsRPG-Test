/**
 * CreatorLayout Component
 * =======================
 * Standard two-column layout for creator tools.
 * Left: Editor area (2/3 width on desktop)
 * Right: Summary sidebar (1/3 width on desktop, sticky)
 */

'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface CreatorLayoutProps {
  title: string;
  description: string;
  icon: LucideIcon;
  children: ReactNode;
  sidebar: ReactNode;
  className?: string;
}

export function CreatorLayout({
  title,
  description,
  icon: Icon,
  children,
  sidebar,
  className,
}: CreatorLayoutProps) {
  return (
    <div className={cn('max-w-6xl mx-auto', className)}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
          <Icon className="w-8 h-8 text-amber-600" />
          {title}
        </h1>
        <p className="text-gray-600">{description}</p>
      </div>

      {/* Two-column layout */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Editor */}
        <div className="lg:col-span-2 space-y-6">
          {children}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-md p-6 sticky top-24">
            {sidebar}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * CreatorSection Component
 * ========================
 * A card section within the creator for grouping related inputs.
 */
interface CreatorSectionProps {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  actions?: ReactNode;
}

export function CreatorSection({
  title,
  description,
  children,
  className,
  actions,
}: CreatorSectionProps) {
  return (
    <div className={cn('bg-white rounded-xl shadow-md p-6', className)}>
      {(title || actions) && (
        <div className="flex items-center justify-between mb-4">
          <div>
            {title && (
              <h3 className="text-lg font-bold text-gray-900">{title}</h3>
            )}
            {description && (
              <p className="text-sm text-gray-600 mt-1">{description}</p>
            )}
          </div>
          {actions}
        </div>
      )}
      {children}
    </div>
  );
}
