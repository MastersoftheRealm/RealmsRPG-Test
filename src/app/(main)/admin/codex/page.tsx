/**
 * Admin Codex Editor
 * ==================
 * Edit game reference data (feats, skills, species, etc.)
 */

'use client';

import { useState } from 'react';
import { PageContainer, PageHeader, TabNavigation } from '@/components/ui';
import { AdminFeatsTab } from './AdminFeatsTab';
import { AdminTraitsTab } from './AdminTraitsTab';
import { AdminSpeciesTab } from './AdminSpeciesTab';
import { AdminSkillsTab } from './AdminSkillsTab';
import { AdminPartsTab } from './AdminPartsTab';
import { AdminPropertiesTab } from './AdminPropertiesTab';
import { AdminEquipmentTab } from './AdminEquipmentTab';
import { AdminArchetypesTab } from './AdminArchetypesTab';
import { AdminCreatureFeatsTab } from './AdminCreatureFeatsTab';

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
  const [activeTab, setActiveTab] = useState<TabId>('feats');

  const tabs = TABS.map((tab) => ({
    id: tab.id,
    label: tab.label,
    labelMobile: tab.labelMobile,
  }));

  return (
    <PageContainer size="xl">
      <PageHeader
        title="Codex Editor"
        description="Edit feats, skills, species, and other game reference data."
      />

      <TabNavigation
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId as TabId)}
        variant="underline"
        className="mb-6"
      />

      {activeTab === 'feats' && <AdminFeatsTab />}
      {activeTab === 'skills' && <AdminSkillsTab />}
      {activeTab === 'species' && <AdminSpeciesTab />}
      {activeTab === 'traits' && <AdminTraitsTab />}
      {activeTab === 'parts' && <AdminPartsTab />}
      {activeTab === 'properties' && <AdminPropertiesTab />}
      {activeTab === 'equipment' && <AdminEquipmentTab />}
      {activeTab === 'archetypes' && <AdminArchetypesTab />}
      {activeTab === 'creature_feats' && <AdminCreatureFeatsTab />}
    </PageContainer>
  );
}
