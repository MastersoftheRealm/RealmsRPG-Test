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
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

/** Pixels past which a tablist edge counts as overflowing (TASK-840 / TASK-890). */
export function tabListOverflowState(
  scrollLeft: number,
  clientWidth: number,
  scrollWidth: number,
  threshold = 2,
): { start: boolean; end: boolean } {
  const maxScroll = Math.max(0, scrollWidth - clientWidth);
  return {
    start: scrollLeft > threshold,
    end: maxScroll - scrollLeft > threshold,
  };
}

/** List-local delta so a hidden tab never scrolls ancestor C1 carousels. */
export function scrollDeltaToRevealChild(
  list: { left: number; right: number },
  child: { left: number; right: number },
  paddingPx: number,
): number {
  if (child.left < list.left + paddingPx) {
    return child.left - list.left - paddingPx;
  }
  if (child.right > list.right - paddingPx) {
    return child.right - (list.right - paddingPx);
  }
  return 0;
}

interface Tab {
  id: string;
  label: string;
  /** Viewport label below `md` (layout, not hit area). Falls back to `label`. */
  labelMobile?: string | undefined;
  icon?: React.ReactNode | undefined;
  count?: number | undefined;
  disabled?: boolean | undefined;
  /** Rendered to the right of the label (sibling of the tab button, not nested inside it) */
  suffix?: React.ReactNode | undefined;
  /** Muted tab label (e.g. hidden outside edit mode) */
  dimmed?: boolean | undefined;
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
  className?: string | undefined;
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
  className?: string | undefined;
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
  variant?: 'underline' | 'pill' | undefined;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg' | undefined;
  /** Additional class name */
  className?: string | undefined;
  /** Full width tabs */
  fullWidth?: boolean | undefined;
  /** Stable id namespace — pass from `useTabGroup()` so panels can wire aria-labelledby */
  tabGroupId?: string | undefined;
  /** When set, every tab's `aria-controls` points here (shared panel mode) */
  sharedTabPanelId?: string | undefined;
  /** When false, omit `aria-controls` (demo tabs without panels). Default true. */
  associatePanels?: boolean | undefined;
  /**
   * Control beside the underline tab strip (Codex Advanced). Lives outside `role="tablist"`.
   * Stacks under the strip below `md`; sits in the bar from `md` without overlapping tabs.
   * Unused on pill tabs.
   */
  trailing?: React.ReactNode | undefined;
}

type OverflowListTag = 'nav' | 'ol';

export interface TabNavOverflowScrollerProps {
  /** Scrollport tag. Wizard rails may use `ol`; underline tabs and Legacy steps use `nav`. */
  as?: OverflowListTag | undefined;
  children: React.ReactNode;
  className?: string | undefined;
  listClassName?: string | undefined;
  /** Re-bind observers when the item set or layout chrome changes. */
  overflowSignature: string;
  /** Active child to reveal by scrolling this list only (list-local; no ancestor carousel jump). */
  getActiveElement?: ((list: HTMLElement) => Element | null) | undefined;
  previousAriaLabel?: string | undefined;
  nextAriaLabel?: string | undefined;
  listRole?: string | undefined;
  listAriaLabel?: string | undefined;
}

/** C1 fade + chevrons for `.tab-nav-list` (underline tabs, creator step rails). */
export function TabNavOverflowScroller({
  as = 'nav',
  children,
  className,
  listClassName,
  overflowSignature,
  getActiveElement,
  previousAriaLabel = 'Show previous tabs',
  nextAriaLabel = 'Show more tabs',
  listRole,
  listAriaLabel,
}: TabNavOverflowScrollerProps) {
  const listRef = React.useRef<HTMLElement>(null);
  const [overflow, setOverflow] = React.useState({ start: false, end: false });

  const updateOverflow = React.useCallback(() => {
    const list = listRef.current;
    if (!list) return;
    setOverflow(tabListOverflowState(list.scrollLeft, list.clientWidth, list.scrollWidth));
  }, []);

  React.useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    updateOverflow();
    list.addEventListener('scroll', updateOverflow, { passive: true });
    const ro = new ResizeObserver(updateOverflow);
    ro.observe(list);
    for (const child of list.children) {
      ro.observe(child);
    }
    return () => {
      list.removeEventListener('scroll', updateOverflow);
      ro.disconnect();
    };
  }, [updateOverflow, overflowSignature]);

  React.useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const activeEl = getActiveElement
      ? getActiveElement(list)
      : list.querySelector('[aria-current="step"]');
    if (!activeEl || !list.contains(activeEl)) return;
    const pad = Number.parseFloat(getComputedStyle(list).scrollPaddingInlineStart) || 0;
    const delta = scrollDeltaToRevealChild(
      list.getBoundingClientRect(),
      activeEl.getBoundingClientRect(),
      pad,
    );
    if (delta !== 0) {
      list.scrollLeft += delta;
    }
    updateOverflow();
  }, [getActiveElement, overflowSignature, updateOverflow]);

  const scrollList = (direction: -1 | 1) => {
    const list = listRef.current;
    if (!list) return;
    const maxScroll = Math.max(0, list.scrollWidth - list.clientWidth);
    list.scrollTo({ left: direction === -1 ? 0 : maxScroll, behavior: 'smooth' });
  };

  const setListNode = React.useCallback((node: HTMLElement | null) => {
    listRef.current = node;
  }, []);

  const listClass = cn('tab-nav-list', listClassName);
  const overflowStart = overflow.start ? 'true' : 'false';
  const overflowEnd = overflow.end ? 'true' : 'false';
  const listEl =
    as === 'ol' ? (
      <ol
        ref={setListNode}
        className={listClass}
        aria-label={listAriaLabel}
        data-overflow-start={overflowStart}
        data-overflow-end={overflowEnd}
      >
        {children}
      </ol>
    ) : (
      <nav
        ref={setListNode}
        className={listClass}
        role={listRole}
        aria-label={listAriaLabel}
        data-overflow-start={overflowStart}
        data-overflow-end={overflowEnd}
      >
        {children}
      </nav>
    );

  return (
    <div className={cn('tab-nav-scroll', className)}>
      {overflow.start ? (
        <button
          type="button"
          className="tab-nav-scroll-btn tab-nav-scroll-start"
          aria-label={previousAriaLabel}
          onClick={() => scrollList(-1)}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
        </button>
      ) : null}
      {listEl}
      {overflow.end ? (
        <button
          type="button"
          className="tab-nav-scroll-btn tab-nav-scroll-end"
          aria-label={nextAriaLabel}
          onClick={() => scrollList(1)}
        >
          <ChevronRight className="h-4 w-4" aria-hidden />
        </button>
      ) : null}
    </div>
  );
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
  trailing,
}: TabNavigationProps) {
  const generatedGroupId = React.useId();
  const tabGroupId = tabGroupIdProp ?? generatedGroupId;
  const tabSignature = tabs.map((t) => t.id).join('|');
  const hasTrailing = Boolean(trailing);
  const hasSuffix = tabs.some((t) => t.suffix);
  const overflowSignature = `${tabSignature}|${size ?? 'md'}|${hasTrailing ? 't' : ''}|${activeTab}|${hasSuffix ? 's' : ''}`;

  const getActiveTabElement = React.useCallback(
    (list: HTMLElement) => {
      const el = document.getElementById(tabButtonId(tabGroupId, activeTab));
      return el && list.contains(el) ? el : null;
    },
    [activeTab, tabGroupId],
  );

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

  const renderLabelText = (tab: Tab) =>
    tab.labelMobile ? (
      <>
        <span className="md:hidden">{tab.labelMobile}</span>
        <span className="hidden md:inline">{tab.label}</span>
      </>
    ) : (
      tab.label
    );

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
              tab.disabled && 'cursor-not-allowed opacity-50',
              tab.dimmed && 'opacity-50',
            )}
          >
            <span className="flex items-center gap-2">
              {tab.icon}
              {renderLabelText(tab)}
              {typeof tab.count === 'number' && (
                <span className="ml-1 rounded-full bg-surface-alt px-1.5 py-0.5 text-xs text-text-muted">
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
      {renderLabelText(tab)}
      {typeof tab.count === 'number' && (
        <span
          className={cn(
            'ml-1 rounded-full px-1.5 py-0.5 text-xs',
            activeTab === tab.id
              ? 'bg-primary-subtle-bg-hover text-primary-subtle-fg'
              : 'bg-surface-alt text-text-muted',
          )}
        >
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
      tab.dimmed && 'opacity-50',
    );

  // Underline variant (default)
  return (
    <div className={cn('tab-nav', trailing && 'tab-nav-with-trailing', className)}>
      <TabNavOverflowScroller
        overflowSignature={overflowSignature}
        getActiveElement={getActiveTabElement}
        listRole="tablist"
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          if (tab.suffix) {
            return (
              <div
                key={tab.id}
                className={cn(
                  'flex shrink-0 items-center border-b-2',
                  isActive ? 'border-primary-outline-border' : 'border-transparent',
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
            <button key={tab.id} {...tabButtonProps(tab, isActive)} className={triggerClass(tab)}>
              <span className="flex items-center gap-2">{renderTabLabel(tab)}</span>
            </button>
          );
        })}
      </TabNavOverflowScroller>
      {trailing ? <div className="tab-nav-trailing">{trailing}</div> : null}
    </div>
  );
}

TabNavigation.displayName = 'TabNavigation';

export { type Tab };
