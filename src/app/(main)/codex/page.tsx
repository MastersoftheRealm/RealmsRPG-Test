/**
 * Codex Page - Full Implementation
 * =================================
 * Complete game reference matching vanilla site functionality.
 * Features all filters: level req, ability req, categories, tags with Any/All, feat types, state feats.
 */

'use client';

import { useState } from 'react';
import { PageContainer, PageHeader, TabNavigation } from '@/components/ui';
import { CodexFeatsTab } from './CodexFeatsTab';
import { CodexSkillsTab } from './CodexSkillsTab';
import { CodexSpeciesTab } from './CodexSpeciesTab';
import { CodexEquipmentTab } from './CodexEquipmentTab';
import { CodexPropertiesTab } from './CodexPropertiesTab';
import { CodexPartsTab } from './CodexPartsTab';

type TabId = 'feats' | 'skills' | 'species' | 'equipment' | 'properties' | 'parts';

const TABS: { id: TabId; label: string; labelMobile?: string }[] = [
  { id: 'feats', label: 'Feats' },
  { id: 'skills', label: 'Skills' },
  { id: 'species', label: 'Species' },
  { id: 'parts', label: 'Power & Technique Parts', labelMobile: 'Parts' },
  { id: 'properties', label: 'Armament Properties', labelMobile: 'Properties' },
  { id: 'equipment', label: 'Equipment' },
];

export default function CodexPage() {
  const [activeTab, setActiveTab] = useState<TabId>('feats');

  const tabs = TABS.map(tab => ({
    id: tab.id,
    label: tab.label,
    labelMobile: tab.labelMobile,
  }));

  return (
    <PageContainer size="xl">
      <PageHeader
        title="Codex"
        description="Complete reference for the Realms RPG system."
      />

      <TabNavigation
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId as TabId)}
        variant="underline"
        className="mb-6"
      />

      {activeTab === 'feats' && <CodexFeatsTab />}
      {activeTab === 'skills' && <CodexSkillsTab />}
      {activeTab === 'species' && <CodexSpeciesTab />}
      {activeTab === 'equipment' && <CodexEquipmentTab />}
      {activeTab === 'properties' && <CodexPropertiesTab />}
      {activeTab === 'parts' && <CodexPartsTab />}
    </PageContainer>
  );
}
