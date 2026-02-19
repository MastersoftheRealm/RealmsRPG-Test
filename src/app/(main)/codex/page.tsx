/**
 * Codex Page - Full Implementation
 * =================================
 * Complete game reference matching vanilla site functionality.
 * Main tabs: Feats, Skills, Species, Equipment, Public Library.
 * Advanced tabs (hidden by default): Power & Technique Parts, Armament Properties, Creature Feats, Traits.
 */

'use client';

import { useState, useCallback } from 'react';
import { PageContainer, PageHeader, TabNavigation, Button } from '@/components/ui';
import { CodexFeatsTab } from './CodexFeatsTab';
import { CodexSkillsTab } from './CodexSkillsTab';
import { CodexSpeciesTab } from './CodexSpeciesTab';
import { CodexEquipmentTab } from './CodexEquipmentTab';
import { CodexPropertiesTab } from './CodexPropertiesTab';
import { CodexPartsTab } from './CodexPartsTab';
import { CodexPublicLibraryTab } from './CodexPublicLibraryTab';
import { CodexTraitsTab } from './CodexTraitsTab';
import { CodexCreatureFeatsTab } from './CodexCreatureFeatsTab';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

type TabId = 'feats' | 'skills' | 'species' | 'equipment' | 'properties' | 'parts' | 'public-library' | 'traits' | 'creature_feats';

const MAIN_TAB_IDS: TabId[] = ['feats', 'skills', 'species', 'equipment', 'public-library'];
const ADVANCED_TAB_IDS: TabId[] = ['parts', 'properties', 'creature_feats', 'traits'];

const TAB_META: { id: TabId; label: string; labelMobile?: string }[] = [
  { id: 'feats', label: 'Feats' },
  { id: 'skills', label: 'Skills' },
  { id: 'species', label: 'Species' },
  { id: 'equipment', label: 'Equipment' },
  { id: 'public-library', label: 'Public Library', labelMobile: 'Public' },
  { id: 'parts', label: 'Power & Technique Parts', labelMobile: 'Parts' },
  { id: 'properties', label: 'Armament Properties', labelMobile: 'Properties' },
  { id: 'creature_feats', label: 'Creature Feats', labelMobile: 'Creature' },
  { id: 'traits', label: 'Traits' },
];

export default function CodexPage() {
  const [activeTab, setActiveTab] = useState<TabId>('feats');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const visibleTabIds = showAdvanced ? [...MAIN_TAB_IDS, ...ADVANCED_TAB_IDS] : MAIN_TAB_IDS;
  const tabs = visibleTabIds
    .map((id) => TAB_META.find((t) => t.id === id))
    .filter(Boolean)
    .map((tab) => ({ id: tab!.id, label: tab!.label, labelMobile: tab!.labelMobile }));

  const onTabChange = useCallback(
    (tabId: string) => {
      setActiveTab(tabId as TabId);
    },
    []
  );

  const toggleAdvanced = useCallback(() => {
    setShowAdvanced((prev) => {
      const next = !prev;
      if (!next && ADVANCED_TAB_IDS.includes(activeTab)) {
        setActiveTab('feats');
      }
      return next;
    });
  }, [activeTab]);

  return (
    <PageContainer size="xl">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
        <PageHeader
          title="Codex"
          description="Complete reference for the Realms RPG system."
        />
        <Button
          variant="outline"
          size="sm"
          onClick={toggleAdvanced}
          className={cn(
            'gap-1.5',
            showAdvanced && 'bg-primary-50 dark:bg-primary-900/20 border-primary-300 dark:border-primary-700'
          )}
        >
          {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          Advanced
        </Button>
      </div>

      <TabNavigation
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={onTabChange}
        variant="underline"
        className="mb-6"
      />

      {activeTab === 'feats' && <CodexFeatsTab />}
      {activeTab === 'skills' && <CodexSkillsTab />}
      {activeTab === 'species' && <CodexSpeciesTab />}
      {activeTab === 'equipment' && <CodexEquipmentTab />}
      {activeTab === 'properties' && <CodexPropertiesTab />}
      {activeTab === 'parts' && <CodexPartsTab />}
      {activeTab === 'public-library' && <CodexPublicLibraryTab />}
      {activeTab === 'traits' && <CodexTraitsTab />}
      {activeTab === 'creature_feats' && <CodexCreatureFeatsTab />}
    </PageContainer>
  );
}
