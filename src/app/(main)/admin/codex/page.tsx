/**
 * Admin Codex Editor
 * ==================
 * Edit game reference data (feats, skills, species, etc.)
 * Supports List view (modals) and Spreadsheet view (raw grid, find/replace, save all).
 */

'use client';

import { useState } from 'react';
import { PageContainer, PageHeader, TabNavigation, TabContentPanel, useTabGroup } from '@/components/ui';
import { SegmentedControl } from '@/components/shared';
import { AdminFeatsTab } from './AdminFeatsTab';
import { AdminTraitsTab } from './AdminTraitsTab';
import { AdminSpeciesTab } from './AdminSpeciesTab';
import { AdminSkillsTab } from './AdminSkillsTab';
import { AdminPartsTab } from './AdminPartsTab';
import { AdminPropertiesTab } from './AdminPropertiesTab';
import { AdminEquipmentTab } from './AdminEquipmentTab';
import { AdminArchetypesTab } from './AdminArchetypesTab';
import { AdminCreatureFeatsTab } from './AdminCreatureFeatsTab';
import { CodexSpreadsheetView } from './CodexSpreadsheetView';
import { List, LayoutGrid } from 'lucide-react';

type TabId =
  | 'feats'
  | 'skills'
  | 'species'
  | 'traits'
  | 'parts'
  | 'properties'
  | 'equipment'
  | 'archetypes'
  | 'creature_feats';

type ViewMode = 'list' | 'spreadsheet';

const TABS: { id: TabId; label: string; labelMobile?: string }[] = [
  { id: 'feats', label: 'Feats' },
  { id: 'skills', label: 'Skills' },
  { id: 'species', label: 'Species' },
  { id: 'traits', label: 'Traits' },
  { id: 'parts', label: 'Power & Technique Parts', labelMobile: 'Parts' },
  { id: 'properties', label: 'Armament Properties', labelMobile: 'Properties' },
  { id: 'equipment', label: 'Equipment' },
  { id: 'archetypes', label: 'Archetypes' },
  { id: 'creature_feats', label: 'Creature Feats' },
];

export default function AdminCodexPage() {
  const { tabGroupId, sharedPanelId } = useTabGroup();
  const [activeTab, setActiveTab] = useState<TabId>('feats');
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  const tabs = TABS.map((tab) => ({
    id: tab.id,
    label: tab.label,
    labelMobile: tab.labelMobile,
  }));

  return (
    <PageContainer size="xl">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <PageHeader
          title="Codex Editor"
          description="Edit feats, skills, species, and other game reference data."
        />
        <SegmentedControl
          aria-label="Codex editor view mode"
          value={viewMode}
          onChange={setViewMode}
          options={[
            { value: 'list', label: 'List', icon: <List className="w-4 h-4" /> },
            { value: 'spreadsheet', label: 'Spreadsheet', icon: <LayoutGrid className="w-4 h-4" /> },
          ]}
        />
      </div>

      <TabNavigation
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId as TabId)}
        variant="underline"
        className="mb-6"
        tabGroupId={tabGroupId}
        sharedTabPanelId={sharedPanelId}
      />

      <TabContentPanel tabGroupId={tabGroupId} id={sharedPanelId} activeTab={activeTab}>
      {viewMode === 'spreadsheet' ? (
        <CodexSpreadsheetView activeTab={activeTab} />
      ) : (
        <>
          {activeTab === 'feats' && <AdminFeatsTab />}
          {activeTab === 'skills' && <AdminSkillsTab />}
          {activeTab === 'species' && <AdminSpeciesTab />}
          {activeTab === 'traits' && <AdminTraitsTab />}
          {activeTab === 'parts' && <AdminPartsTab />}
          {activeTab === 'properties' && <AdminPropertiesTab />}
          {activeTab === 'equipment' && <AdminEquipmentTab />}
          {activeTab === 'archetypes' && <AdminArchetypesTab />}
          {activeTab === 'creature_feats' && <AdminCreatureFeatsTab />}
        </>
      )}
      </TabContentPanel>
    </PageContainer>
  );
}
