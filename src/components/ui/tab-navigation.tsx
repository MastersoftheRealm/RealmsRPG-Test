/**
 * TabNavigation Component
 * ========================
 * Unified tab navigation for Codex, Library, and other tabbed pages.
 * Supports both underline-style and pill-style tabs.
 *
 * Pair with `useTabGroup()` + `TabContentPanel` (shared panel, conditional content)
 * or `TabPanel` (one panel per tab, all stay in DOM with `hidden`).
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

/** Stable tab button id for `aria-labelledby` / focus management */
export function tabButtonId(tabGroupId: string, tabId: string): string {
  return `${tabGroupId}-tab-${tabId}`;
}

/** Per-tab panel id when each tab has its own panel element */
export function tabPanelIdForTab(tabGroupId: string, tabId: string): string {
  return `${tabGroupId}-panel-${tabId}`;
}

/** Id namespace for TabNavigation + associated panels (TASK-355) */
export function useTabGroup(externalId?: string) {
  const generatedId = React.useId();
  const tabGroupId = externalId ?? generatedId;
  const sharedPanelId = `${tabGroupId}-panel`;
  return {
    tabGroupId,
    sharedPanelId,
    tabButtonId: (tabId: string) => tabButtonId(tabGroupId, tabId),
    tabPanelId: (tabId: string) => tabPanelIdForTab(tabGroupId, tabId),
  };
}

export interface TabContentPanelProps {
  tabGroupId: string;
  activeTab: string;
  /** Panel element id — use `useTabGroup().sharedPanelId` with `sharedTabPanelId` on TabNavigation */
  id: string;
  children: React.ReactNode;
  className?: string;
}

/** Single shared tabpanel for pages that swap conditional content (Library, Codex, etc.) */
export function TabContentPanel({
  tabGroupId,
  activeTab,
  id,
  children,
  className,
}: TabContentPanelProps) {
  return (
    <div
      id={id}
      role="tabpanel"
      aria-labelledby={tabButtonId(tabGroupId, activeTab)}
      className={className}
    >
      {children}
    </div>
  );
}

export interface TabPanelProps {
  tabGroupId: string;
  tabId: string;
  activeTab: string;
  children: React.ReactNode;
  className?: string;
}

/** One panel per tab; inactive panels stay mounted with `hidden` (WAI-ARIA tabs pattern) */
export function TabPanel({ tabGroupId, tabId, activeTab, children, className }: TabPanelProps) {
  const isSelected = activeTab === tabId;
  return (
    <div
      id={tabPanelIdForTab(tabGroupId, tabId)}
      role="tabpanel"
      aria-labelledby={tabButtonId(tabGroupId, tabId)}
      hidden={!isSelected}
      className={className}
    >
      {children}
    </div>
  );
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
  /** Stable id namespace — pass from `useTabGroup()` so panels can wire aria-labelledby */
  tabGroupId?: string;
  /** When set, every tab's `aria-controls` points here (shared panel mode) */
  sharedTabPanelId?: string;
  /** When false, omit `aria-controls` (demo tabs without panels). Default true. */
  associatePanels?: boolean;
}

export function TabNavigation({
  tabs,
  activeTab,
  onTabChange,
  variant = 'underline',
  size = 'md',
  className,
  fullWidth = false,
  tabGroupId: tabGroupIdProp,
  sharedTabPanelId,
  associatePanels = true,
}: TabNavigationProps) {
  const generatedGroupId = React.useId();
  const tabGroupId = tabGroupIdProp ?? generatedGroupId;

  const panelControlsId = (tabId: string) =>
    sharedTabPanelId ?? tabPanelIdForTab(tabGroupId, tabId);

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
      document.getElementById(tabButtonId(tabGroupId, next.id))?.focus();
    });
  };

  const tabButtonProps = (tab: Tab, isActive: boolean) => ({
    id: tabButtonId(tabGroupId, tab.id),
    type: 'button' as const,
    role: 'tab' as const,
    'aria-selected': isActive,
    ...(associatePanels ? { 'aria-controls': panelControlsId(tab.id) } : {}),
    disabled: tab.disabled,
    tabIndex: isActive ? 0 : -1,
    onClick: () => !tab.disabled && onTabChange(tab.id),
    onKeyDown: (e: React.KeyboardEvent) => handleTabKeyDown(e, tab.id),
  });

  if (variant === 'pill') {
    return (
      <div className={cn('tab-pill-list', fullWidth && 'w-full', className)} role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            {...tabButtonProps(tab, activeTab === tab.id)}
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
            ? 'bg-primary-subtle-bg-hover text-primary-subtle-fg'
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
                  isActive ? 'border-primary-outline-border' : 'border-transparent'
                )}
              >
                <button
                  {...tabButtonProps(tab, isActive)}
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
              {...tabButtonProps(tab, isActive)}
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
