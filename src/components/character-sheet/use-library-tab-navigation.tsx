/**
 * Library tab list, visibility eye-toggles, and resolved active tab.
 */

'use client';

import { useState, useMemo, useCallback, type ReactNode } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { IconButton } from '@/components/ui';
import { DEFAULT_TAB_VISIBILITY, LIBRARY_TAB_DEFS, type TabType } from './library-tab-config';
import type { AddModalType } from './character-sheet-context';

type LibraryTabDef = { id: TabType; label: string; onAdd?: (() => void) | undefined };

type LibraryNavTab = {
  id: TabType;
  label: string;
  dimmed?: boolean | undefined;
  suffix?: ReactNode | undefined;
};

export function useLibraryTabNavigation(options: {
  isEditMode: boolean;
  activeTabProp?: TabType | undefined;
  onActiveTabChange?: ((tab: TabType) => void) | undefined;
  tabVisibility?: Partial<Record<TabType, boolean>> | undefined;
  onTabVisibilityChange?: ((next: Partial<Record<TabType, boolean>>) => void) | undefined;
  onAddPowerProp?: (() => void) | undefined;
  onAddTechniqueProp?: (() => void) | undefined;
  setAddModalType?: ((type: AddModalType) => void) | undefined;
}) {
  const {
    isEditMode,
    activeTabProp,
    onActiveTabChange,
    tabVisibility,
    onTabVisibilityChange,
    onAddPowerProp,
    onAddTechniqueProp,
    setAddModalType,
  } = options;

  const [internalActiveTab, setInternalActiveTab] = useState<TabType>('feats');
  const activeTab = activeTabProp ?? internalActiveTab;
  const setActiveTab = useCallback(
    (tab: TabType) => {
      onActiveTabChange?.(tab);
      if (activeTabProp === undefined) {
        setInternalActiveTab(tab);
      }
    },
    [activeTabProp, onActiveTabChange],
  );

  const tabs = useMemo((): LibraryTabDef[] => {
    const onAddFor = (id: TabType): (() => void) | undefined => {
      if (id === 'powers') {
        return onAddPowerProp ?? (setAddModalType ? () => setAddModalType('power') : undefined);
      }
      if (id === 'techniques') {
        return (
          onAddTechniqueProp ?? (setAddModalType ? () => setAddModalType('technique') : undefined)
        );
      }
      return undefined;
    };
    return LIBRARY_TAB_DEFS.map((def) => ({
      ...def,
      onAdd: onAddFor(def.id),
    }));
  }, [onAddPowerProp, onAddTechniqueProp, setAddModalType]);

  const resolvedTabVisibility = useMemo<Record<TabType, boolean>>(
    () => ({ ...DEFAULT_TAB_VISIBILITY, ...(tabVisibility ?? {}) }),
    [tabVisibility],
  );

  const visibleTabs = useMemo(
    () => (isEditMode ? tabs : tabs.filter((tab) => resolvedTabVisibility[tab.id] !== false)),
    [isEditMode, tabs, resolvedTabVisibility],
  );

  const resolvedActiveTab: TabType = visibleTabs.some((tab) => tab.id === activeTab)
    ? activeTab
    : (visibleTabs[0]?.id ?? 'feats');

  if (activeTabProp === undefined && internalActiveTab !== resolvedActiveTab) {
    setInternalActiveTab(resolvedActiveTab);
  }

  const handleToggleTabVisibility = useCallback(
    (tabId: TabType) => {
      if (!onTabVisibilityChange) return;
      const current = resolvedTabVisibility[tabId] !== false;
      if (current) {
        const currentlyVisibleCount = Object.values(resolvedTabVisibility).filter(
          (v) => v !== false,
        ).length;
        if (currentlyVisibleCount <= 1) return;
      }
      onTabVisibilityChange({
        ...resolvedTabVisibility,
        [tabId]: !current,
      });
    },
    [onTabVisibilityChange, resolvedTabVisibility],
  );

  const navigationTabs = useMemo((): LibraryNavTab[] => {
    const source = isEditMode ? tabs : visibleTabs;
    return source.map((tab) => {
      const visibleOutsideEdit = resolvedTabVisibility[tab.id] !== false;
      return {
        id: tab.id,
        label: tab.label,
        dimmed: isEditMode && !visibleOutsideEdit,
        suffix:
          isEditMode && onTabVisibilityChange ? (
            <IconButton
              variant="ghost"
              size="sm"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleToggleTabVisibility(tab.id);
              }}
              label={`${visibleOutsideEdit ? 'Hide' : 'Show'} ${tab.label} tab when not editing`}
              className="-mr-1 min-h-[44px] min-w-[44px] shrink-0"
            >
              {visibleOutsideEdit ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4 text-text-muted" />
              )}
            </IconButton>
          ) : undefined,
      };
    });
  }, [
    isEditMode,
    tabs,
    visibleTabs,
    resolvedTabVisibility,
    onTabVisibilityChange,
    handleToggleTabVisibility,
  ]);

  return {
    resolvedActiveTab,
    setActiveTab,
    navigationTabs,
  };
}
