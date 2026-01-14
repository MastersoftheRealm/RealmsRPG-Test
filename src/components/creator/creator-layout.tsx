/**
 * CreatorLayout Component
 * =======================
 * Standard two-column layout for creator tools.
 * Left: Editor area (2/3 width on desktop)
 * Right: Summary sidebar (1/3 width on desktop, sticky)
 */

'use client';

import { ReactNode } from 'react';
import { FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

// =============================================================================
// CreatorHeader Component
// =============================================================================

interface CreatorHeaderProps {
  title: string;
  description: string;
  icon: LucideIcon;
  iconColor?: string;
  onLoadClick?: () => void;
  loadLabel?: string;
  actions?: ReactNode;
}

export function CreatorHeader({
  title,
  description,
  icon: Icon,
  iconColor = 'text-amber-600',
  onLoadClick,
  loadLabel = 'Load from Library',
  actions,
}: CreatorHeaderProps) {
  return (
    <div className="mb-6 flex items-start justify-between">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
          <Icon className={cn('w-8 h-8', iconColor)} />
          {title}
        </h1>
        <p className="text-gray-600">{description}</p>
      </div>
      <div className="flex items-center gap-2">
        {actions}
        {onLoadClick && (
          <button
            type="button"
            onClick={onLoadClick}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
          >
            <FolderOpen className="w-5 h-5" />
            {loadLabel}
          </button>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// CreatorLayout Component
// =============================================================================

interface CreatorLayoutProps {
  title: string;
  description: string;
  icon: LucideIcon;
  iconColor?: string;
  children: ReactNode;
  sidebar: ReactNode;
  onLoadClick?: () => void;
  loadLabel?: string;
  headerActions?: ReactNode;
  className?: string;
}

export function CreatorLayout({
  title,
  description,
  icon,
  iconColor = 'text-amber-600',
  children,
  sidebar,
  onLoadClick,
  loadLabel = 'Load from Library',
  headerActions,
  className,
}: CreatorLayoutProps) {
  return (
    <div className={cn('max-w-6xl mx-auto', className)}>
      {/* Header */}
      <CreatorHeader
        title={title}
        description={description}
        icon={icon}
        iconColor={iconColor}
        onLoadClick={onLoadClick}
        loadLabel={loadLabel}
        actions={headerActions}
      />

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
