'use client';

/**
 * CreatorLayout — Shared layout for all creators
 * ===============================================
 * Enforces consistent structure: PageContainer, PageHeader, grid with main (2/3) + sidebar (1/3).
 * Use for power, technique, item, and creature creators to avoid layout drift.
 */

import { ReactNode } from 'react';
import { PageContainer, PageHeader, type ContainerSize } from '@/components/ui';

export interface CreatorLayoutProps {
  /** Page header icon */
  icon: ReactNode;
  /** Page title */
  title: string;
  /** Short description below title */
  description: string;
  /** Action buttons (e.g. CreatorSaveToolbar) */
  actions: ReactNode;
  /** Main editor content (left 2/3 on large screens) */
  children: ReactNode;
  /** Sidebar content (right 1/3, e.g. CreatorSummaryPanel) */
  sidebar: ReactNode;
  /** Modals and other fragments (Load modal, Login prompt, Publish confirm) */
  modals?: ReactNode;
  /** PageContainer size (default: xl) */
  size?: ContainerSize;
  /** Optional className for PageHeader */
  headerClassName?: string;
}

export function CreatorLayout({
  icon,
  title,
  description,
  actions,
  children,
  sidebar,
  modals,
  size = 'xl',
  headerClassName = 'mb-6',
}: CreatorLayoutProps) {
  return (
    <PageContainer size={size}>
      <PageHeader
        icon={icon}
        title={title}
        description={description}
        actions={actions}
        className={headerClassName}
      />
      {modals}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6 order-2 lg:order-1 min-w-0">{children}</div>
        <div className="order-1 lg:order-2 min-w-0">{sidebar}</div>
      </div>
    </PageContainer>
  );
}
