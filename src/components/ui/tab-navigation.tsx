/**
 * TabNavigation Component
 * ========================
 * Unified tab navigation for Codex, Library, and other tabbed pages.
 * Supports both underline-style and pill-style tabs.
 */

'use client';

import * as React from 'react';
import { cn } from '@/lib/utils/cn';

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  count?: number;
  disabled?: boolean;
}

interface TabNavigationProps {
  /** Array of tab definitions */
  tabs: Tab[];
  /** Currently active tab id */
  activeTab: string;
  /** Callback when tab changes */
  onTabChange: (tabId: string) => void;
  /** Visual style variant */
  variant?: 'underline' | 'pill';
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Additional class name */
  className?: string;
  /** Full width tabs */
  fullWidth?: boolean;
}

export function TabNavigation({
  tabs,
  activeTab,
  onTabChange,
  variant = 'underline',
  size = 'md',
  className,
  fullWidth = false,
}: TabNavigationProps) {
  if (variant === 'pill') {
    return (
      <div className={cn('tab-pill-list', fullWidth && 'w-full', className)} role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-disabled={tab.disabled}
            onClick={() => !tab.disabled && onTabChange(tab.id)}
            className={cn(
              'tab-pill-trigger',
              fullWidth && 'flex-1',
              size === 'sm' && 'px-3 py-1.5 text-xs',
              size === 'lg' && 'px-5 py-2.5 text-base',
              activeTab === tab.id && 'tab-pill-trigger-active',
              tab.disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            <span className="flex items-center gap-2">
              {tab.icon}
              {tab.label}
              {typeof tab.count === 'number' && (
                <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-neutral-200 text-text-muted">
                  {tab.count}
                </span>
              )}
            </span>
          </button>
        ))}
      </div>
    );
  }

  // Underline variant (default)
  return (
    <div className={cn('tab-nav', className)}>
      <nav className="tab-nav-list" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-disabled={tab.disabled}
            onClick={() => !tab.disabled && onTabChange(tab.id)}
            className={cn(
              'tab-nav-trigger',
              size === 'sm' && 'px-3 py-2 text-xs',
              size === 'lg' && 'px-5 py-4 text-base',
              activeTab === tab.id && 'tab-nav-trigger-active',
              tab.disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            <span className="flex items-center gap-2">
              {tab.icon}
              {tab.label}
              {typeof tab.count === 'number' && (
                <span className={cn(
                  'ml-1 px-1.5 py-0.5 text-xs rounded-full',
                  activeTab === tab.id 
                    ? 'bg-primary-200 text-primary-700'
                    : 'bg-neutral-200 text-text-muted'
                )}>
                  {tab.count}
                </span>
              )}
            </span>
          </button>
        ))}
      </nav>
    </div>
  );
}

TabNavigation.displayName = 'TabNavigation';

export { type Tab };
