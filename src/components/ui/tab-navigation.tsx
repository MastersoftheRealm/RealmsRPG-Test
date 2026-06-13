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
  /** Rendered to the right of the label (sibling of the tab button, not nested inside it) */
  suffix?: React.ReactNode;
  /** Muted tab label (e.g. hidden outside edit mode) */
  dimmed?: boolean;
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
  const baseId = React.useId();
  const tabButtonId = (tabId: string) => `${baseId}-tab-${tabId}`;

  // Roving-tabindex keyboard support (WAI-ARIA tabs): arrow keys move between
  // tabs, Home/End jump to the ends (TASK-332).
  const handleTabKeyDown = (e: React.KeyboardEvent, currentId: string) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
    const focusable = tabs.filter((t) => !t.disabled);
    if (focusable.length === 0) return;
    e.preventDefault();
    const idx = focusable.findIndex((t) => t.id === currentId);
    if (idx === -1) return;
    let nextIdx = idx;
    if (e.key === 'ArrowRight') nextIdx = (idx + 1) % focusable.length;
    else if (e.key === 'ArrowLeft') nextIdx = (idx - 1 + focusable.length) % focusable.length;
    else if (e.key === 'Home') nextIdx = 0;
    else if (e.key === 'End') nextIdx = focusable.length - 1;
    const next = focusable[nextIdx];
    if (!next) return;
    onTabChange(next.id);
    requestAnimationFrame(() => {
      document.getElementById(tabButtonId(next.id))?.focus();
    });
  };

  if (variant === 'pill') {
    return (
      <div className={cn('tab-pill-list', fullWidth && 'w-full', className)} role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            id={tabButtonId(tab.id)}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-disabled={tab.disabled}
            tabIndex={activeTab === tab.id ? 0 : -1}
            onClick={() => !tab.disabled && onTabChange(tab.id)}
            onKeyDown={(e) => handleTabKeyDown(e, tab.id)}
            className={cn(
              'tab-pill-trigger',
              fullWidth && 'flex-1',
              size === 'sm' && 'px-3 py-1.5 text-xs',
              size === 'lg' && 'px-5 py-2.5 text-base',
              activeTab === tab.id && 'tab-pill-trigger-active',
              tab.disabled && 'opacity-50 cursor-not-allowed',
              tab.dimmed && 'opacity-50'
            )}
          >
            <span className="flex items-center gap-2">
              {tab.icon}
              {tab.label}
              {typeof tab.count === 'number' && (
                <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-surface-alt text-text-muted">
                  {tab.count}
                </span>
              )}
              {tab.suffix}
            </span>
          </button>
        ))}
      </div>
    );
  }

  const renderTabLabel = (tab: Tab) => (
    <>
      {tab.icon}
      {tab.label}
      {typeof tab.count === 'number' && (
        <span className={cn(
          'ml-1 px-1.5 py-0.5 text-xs rounded-full',
          activeTab === tab.id
            ? 'bg-primary-200 text-primary-700'
            : 'bg-surface-alt text-text-muted'
        )}>
          {tab.count}
        </span>
      )}
    </>
  );

  const triggerClass = (tab: Tab) =>
    cn(
      'tab-nav-trigger',
      size === 'sm' && 'px-3 py-2 text-xs',
      size === 'lg' && 'px-5 py-4 text-base',
      activeTab === tab.id && 'tab-nav-trigger-active',
      tab.disabled && 'opacity-50 cursor-not-allowed',
      tab.dimmed && 'opacity-50'
    );

  // Underline variant (default)
  return (
    <div className={cn('tab-nav', className)}>
      <nav className="tab-nav-list" role="tablist">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          if (tab.suffix) {
            return (
              <div
                key={tab.id}
                className={cn(
                  'flex items-center shrink-0 border-b-2',
                  isActive ? 'border-primary-600' : 'border-transparent'
                )}
              >
                <button
                  id={tabButtonId(tab.id)}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-disabled={tab.disabled}
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => !tab.disabled && onTabChange(tab.id)}
                  onKeyDown={(e) => handleTabKeyDown(e, tab.id)}
                  className={cn(triggerClass(tab), 'border-b-0')}
                >
                  <span className="flex items-center gap-2">{renderTabLabel(tab)}</span>
                </button>
                {tab.suffix}
              </div>
            );
          }
          return (
            <button
              key={tab.id}
              id={tabButtonId(tab.id)}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-disabled={tab.disabled}
              tabIndex={isActive ? 0 : -1}
              onClick={() => !tab.disabled && onTabChange(tab.id)}
              onKeyDown={(e) => handleTabKeyDown(e, tab.id)}
              className={triggerClass(tab)}
            >
              <span className="flex items-center gap-2">{renderTabLabel(tab)}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

TabNavigation.displayName = 'TabNavigation';

export { type Tab };
