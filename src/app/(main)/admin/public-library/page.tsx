/**
 * Admin Public Library Editor
 * ============================
 * Browse and manage published public library items. Edit opens the corresponding
 * creator with the item loaded; save with the same name overwrites the public item.
 * Admin only.
 */

'use client';

import { useState } from 'react';
import { PageContainer, PageHeader, TabNavigation } from '@/components/ui';
import { Wand2, Swords, Shield, Users } from 'lucide-react';
import { AdminPublicPowersTab } from './AdminPublicPowersTab';
import { AdminPublicTechniquesTab } from './AdminPublicTechniquesTab';
import { AdminPublicItemsTab } from './AdminPublicItemsTab';
import { AdminPublicCreaturesTab } from './AdminPublicCreaturesTab';

type TabId = 'powers' | 'techniques' | 'items' | 'creatures';

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'powers', label: 'Powers', icon: <Wand2 className="w-4 h-4" /> },
  { id: 'techniques', label: 'Techniques', icon: <Swords className="w-4 h-4" /> },
  { id: 'items', label: 'Armaments', icon: <Shield className="w-4 h-4" /> },
  { id: 'creatures', label: 'Creatures', icon: <Users className="w-4 h-4" /> },
];

export default function AdminPublicLibraryPage() {
  const [activeTab, setActiveTab] = useState<TabId>('powers');

  return (
    <PageContainer size="xl">
      <PageHeader
        title="Public Library Editor"
        description="Edit published items via the creators (Edit opens Power/Technique/Item/Creature Creator with the item loaded). Save with the same name to overwrite. Changes are visible to all users on the Library page."
      />

      <TabNavigation
        tabs={TABS.map(t => ({ id: t.id, label: t.label, icon: t.icon }))}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
        variant="underline"
        className="mb-6"
      />

      {activeTab === 'powers' && <AdminPublicPowersTab />}
      {activeTab === 'techniques' && <AdminPublicTechniquesTab />}
      {activeTab === 'items' && <AdminPublicItemsTab />}
      {activeTab === 'creatures' && <AdminPublicCreaturesTab />}
    </PageContainer>
  );
}
